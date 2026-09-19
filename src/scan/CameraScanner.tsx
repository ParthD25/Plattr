// Label scanner. Uses the browser's BarcodeDetector where it reads retail barcodes (Chrome, Android);
// everywhere else (Safari, Firefox, iOS) it falls back to @zxing/browser, loaded only when someone actually scans.
import { useEffect, useRef, useState } from 'react'

// BarcodeDetector is not in TypeScript's lib.dom yet - declared locally (no global augmentation, to avoid clashes).
interface DetectedBarcode { rawValue: string }
interface BarcodeDetectorLike { detect(source: ImageBitmapSource): Promise<DetectedBarcode[]> }
type BarcodeDetectorCtor = (new (options?: { formats: string[] }) => BarcodeDetectorLike) & { getSupportedFormats?: () => Promise<string[]> }

const FORMATS = ['qr_code', 'ean_13', 'upc_a', 'upc_e', 'ean_8']
const POLL_MS = 300
const SLOW_MS = 12000

async function nativeDetector(): Promise<BarcodeDetectorLike | undefined> {
  const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector
  if (!Ctor) return undefined
  try {
    const have = (await Ctor.getSupportedFormats?.()) ?? FORMATS
    const formats = FORMATS.filter(f => have.includes(f))
    return formats.includes('ean_13') ? new Ctor({ formats }) : undefined   // some desktop builds expose the API but read nothing useful
  } catch { return undefined }
}

async function zxingReader() {
  const [{ BrowserMultiFormatReader }, { DecodeHintType }] = await Promise.all([import('@zxing/browser'), import('@zxing/library')])
  return new BrowserMultiFormatReader(new Map([[DecodeHintType.TRY_HARDER, true]]))
}

function cameraError(e: unknown): string {
  const name = (e as { name?: string } | null)?.name
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Camera permission is blocked. Allow camera access for this site in your browser settings and press “Scan with camera” again - or upload a photo of the barcode, or type the numbers.'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No camera was found on this device. Upload a photo of the barcode or type the numbers instead.'
  if (name === 'NotReadableError') return 'The camera is being used by another app. Close it and try again, or upload a photo of the barcode.'
  return 'Could not start the camera. Upload a photo of the barcode or type the numbers instead.'
}

/** Reads the first barcode or QR code in a photo. Rejects with a shopper-readable message when nothing is found. */
export async function decodeImageFile(file: File): Promise<string> {
  const detector = await nativeDetector()
  if (detector) {
    try {
      const bitmap = await createImageBitmap(file)
      const value = (await detector.detect(bitmap))[0]?.rawValue
      bitmap.close()
      if (value) return value
    } catch { /* fall through to zxing */ }
  }
  const url = URL.createObjectURL(file)
  try {
    // ponytail: decodes the photo at full size; downscale through a canvas first if large phone photos prove slow or flaky
    return (await (await zxingReader()).decodeFromImageUrl(url)).getText()
  } catch {
    throw new Error('No barcode was detected in that photo. Try again with the whole barcode in frame, sharp and without glare - or type the numbers printed under it.')
  } finally { URL.revokeObjectURL(url) }
}

/** Opens the rear camera and calls onScan once with the first code it reads. Decoder and camera tracks stop on success and on unmount. */
export default function CameraScanner({ onScan }: { onScan: (value: string) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const callback = useRef(onScan)
  callback.current = onScan
  const [error, setError] = useState('')
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser cannot open the camera on this page (the camera needs a secure https connection). Upload a photo of the barcode or type the numbers instead.')
      return
    }
    let live = true
    let stream: MediaStream | undefined
    let controls: { stop(): void } | undefined
    let timer: number | undefined
    const slowTimer = window.setTimeout(() => live && setSlow(true), SLOW_MS)
    const stop = () => {
      live = false
      window.clearInterval(timer)
      window.clearTimeout(slowTimer)
      controls?.stop()
      stream?.getTracks().forEach(t => t.stop())
    }
    const found = (value?: string) => { if (live && value) { stop(); callback.current(value) } }

    void (async () => {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      const v = video.current
      if (!live || !v) return stop()   // unmounted while the permission prompt was open: release the camera
      const detector = await nativeDetector()
      if (detector) {
        v.srcObject = stream
        await v.play()
        let busy = false
        timer = window.setInterval(async () => {
          if (busy || v.readyState < 2) return
          busy = true
          try { found((await detector.detect(v))[0]?.rawValue) } catch { /* an unreadable frame is not an error - try the next one */ }
          busy = false
        }, POLL_MS)
      } else {
        const reader = await zxingReader()
        if (!live) return
        controls = await reader.decodeFromStream(stream, v, result => found(result?.getText()))
      }
      if (!live) stop()
    })().catch(e => { if (live) { stop(); setError(cameraError(e)) } })

    return stop
  }, [])

  if (error) return <p className="warn" role="alert">{error}</p>
  return (
    <div>
      <video ref={video} muted playsInline aria-label="Camera preview"
        style={{ display: 'block', width: '100%', maxWidth: 440, aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 18, background: '#14161a', marginTop: 12 }} />
      <p className="muted" role="status" style={{ margin: '8px 0 0' }}>
        {slow
          ? 'Nothing detected yet. Move closer, hold steady and avoid glare - or upload a photo of the barcode, or type the numbers.'
          : 'Hold the barcode or QR code steady in front of the camera. Looking for a code…'}
      </p>
    </div>
  )
}
