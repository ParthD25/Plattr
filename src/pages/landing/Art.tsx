// Hand-drawn decorative art for the landing page. Everything here is decoration: aria-hidden, no meaning.
import type { ReactNode } from 'react'

type P = { className?: string }
const svg = (viewBox: string, className: string | undefined, children: ReactNode, extra?: { stretch?: boolean }) => (
  <svg className={className} viewBox={viewBox} aria-hidden="true" focusable="false" preserveAspectRatio={extra?.stretch ? 'none' : undefined}>{children}</svg>
)

// Smooth closed curves through uneven radial points, so they never read as rectangles or circles.
const BLOBS = {
  a: 'M580 300C581 341 539 383 517 425C494 467 481 533 445 551C409 569 347 538 300 535C253 532 207 549 165 534C123 519 66 484 49 445C31 406 59 348 60 300C61 252 34 194 53 158C72 121 131 94 172 79C214 65 256 73 300 70C344 67 402 44 438 62C473 80 488 138 512 177C536 217 579 259 580 300z',
  b: 'M570 300C569 345 512 387 482 432C452 477 431 555 388 571C345 587 269 553 226 528C183 504 164 461 130 423C97 385 30 345 25 300C20 255 64 189 98 153C132 117 182 106 230 86C279 66 343 21 387 34C430 46 460 117 490 162C521 206 571 255 570 300z',
  c: 'M550 300C551 361 553 445 518 483C483 521 399 518 340 527C281 535 217 555 165 534C113 513 40 451 27 399C15 347 65 278 89 223C112 168 125 97 167 71C210 44 284 55 342 64C400 72 480 81 514 120C549 159 549 239 550 300z',
}
export function Blob({ className, shape = 'a' }: P & { shape?: keyof typeof BLOBS }) {
  return svg('20 20 570 570', className, <path d={BLOBS[shape]} fill="var(--blob)" />, { stretch: true })
}

/** Two-tone leaf with a centre vein. Base of the stem is bottom-centre. */
export function Leaf({ className, light = false }: P & { light?: boolean }) {
  const [dark, pale, vein] = light ? ['#4caf50', '#7cc96a', '#2e7d32'] : ['#2f8f3a', '#4db24a', '#1f6f2c']
  return svg('0 0 100 160', className, <>
    <path d="M50 157C13 126 3 65 48 3c50 58 40 122 2 154z" fill={dark} />
    <path d="M50 157C88 125 98 61 48 3c7 50 8 101 2 154z" fill={pale} />
    <path d="M50 152C55 101 54 52 48 12M52 118l19-17M52 92l22-20M51 66l17-16M51 124 31 108M51 98 27 80M50 70 33 56" fill="none" stroke={vein} strokeWidth="2" strokeLinecap="round" opacity=".55" />
  </>)
}

const SPRIG_LEAF = 'M0 0C-11 -8 -13 -25 0 -36 13 -25 11 -8 0 0z'
export function Sprig({ className }: P) {
  const leaves: [number, number, number][] = [[40, 104, -58], [41, 88, 56], [40, 70, -54], [41, 54, 52], [40, 38, -48], [40, 24, 0]]
  return svg('0 0 80 124', className, <>
    <path d="M40 122C37 86 43 50 40 20" fill="none" stroke="#2e7d32" strokeWidth="3" strokeLinecap="round" />
    {leaves.map(([x, y, r], i) => <path key={i} d={SPRIG_LEAF} transform={`translate(${x} ${y}) rotate(${r}) scale(${i === 5 ? 0.8 : 0.95})`} fill={i % 2 ? '#4db24a' : '#2f8f3a'} />)}
  </>)
}

export function Squiggle({ className }: P) {
  return svg('0 0 64 12', className, <path d="M3 8c7-6 11 3 18-1s11-5 18-1 12 2 22-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />)
}

export function Strawberry({ className }: P) {
  const seeds: [number, number][] = [[44, 58], [60, 52], [77, 58], [36, 74], [52, 72], [69, 72], [85, 74], [45, 89], [61, 88], [77, 89], [53, 104], [69, 104], [61, 117]]
  return svg('0 0 122 140', className, <>
    <path d="M61 136C30 113 9 84 11 58c2-21 19-31 35-26 6 2 11 5 15 9 4-4 9-7 15-9 16-5 33 5 35 26 2 26-19 55-50 78z" fill="#e0322f" />
    <path d="M61 136c31-23 52-52 50-78-1-9-4-16-9-20 6 30-10 66-41 98z" fill="#c02422" opacity=".45" />
    {seeds.map(([x, y]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2.6" ry="3.8" fill="#fff4e6" />)}
    <path d="M61 40c-5-10-15-16-28-16 5 5 8 9 9 14-8-2-16 0-22 6 10 1 18 1 25-1 4 5 9 9 16 12 7-3 12-7 16-12 7 2 15 2 25 1-6-6-14-8-22-6 1-5 4-9 9-14-13 0-23 6-28 16z" fill="#2f8f3a" />
    <path d="M61 40c-2-9 0-20 6-30 5 9 4 21-6 30z" fill="#4db24a" />
  </>)
}

/* ---- small medallion icons (24 box) ---- */
export const SproutIcon = ({ className }: P) => svg('0 0 24 24', className, <>
  <path d="M12 21.5v-9" fill="none" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" />
  <path d="M12 13.5C12 8 8.5 5 3 5c0 5.5 3.5 9 9 8.5z" fill="#2f8f3a" />
  <path d="M12 12c0-5 3.2-8 9-8 0 5.5-3.5 8.6-9 8z" fill="#5cc157" />
</>)
export const SoilIcon = ({ className }: P) => svg('0 0 24 24', className, <>
  <path d="M2.5 18.5c.8-5.2 4.6-9.5 9.5-9.5s8.700 4.300 9.500 9.500c.1.800-.4 1.500-1.200 1.500H3.700c-.8 0-1.300-.7-1.200-1.500z" fill="#7a4a2b" />
  <path d="M8 15.500h.01M12 13h.01M15.500 16h.01M11 17.500h.01" stroke="#c99a6b" strokeWidth="1.8" strokeLinecap="round" />
</>)
export const DropIcon = ({ className }: P) => svg('0 0 24 24', className, <>
  <path d="M12 2.500c4.200 5 6.800 8.700 6.800 12.300a6.800 6.800 0 0 1-13.600 0c0-3.600 2.600-7.300 6.800-12.300z" fill="#2f86d6" />
  <path d="M8.300 14.500c0 2.200 1.300 3.900 3.200 4.400" fill="none" stroke="#bfe0fb" strokeWidth="1.600" strokeLinecap="round" />
</>)
export const ShieldIcon = ({ className }: P) => svg('0 0 24 24', className, <>
  <path d="M12 2.300 20 5.200v6.300c0 5-3.300 8.700-8 10.200-4.700-1.500-8-5.200-8-10.200V5.200z" fill="#2e9e44" />
  <path d="m8.300 12 2.700 2.700 4.800-5.400" fill="none" stroke="#fff" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" />
</>)
export const LeafIcon = ({ className }: P) => svg('0 0 16 16', className, <>
  <path d="M2.500 13.500C2 7 6 2.500 13.500 2.500 14 9.500 9.500 14 2.500 13.500z" fill="#2e9e44" />
  <path d="M3.200 12.800 9.500 6.500" fill="none" stroke="#fff" strokeWidth="1.200" strokeLinecap="round" />
</>)

/* ---- big feature medallion illustrations (64 box) ---- */
export const SoilArt = ({ className }: P) => svg('0 0 64 64', className, <>
  <path d="M32 40V26" fill="none" stroke="#2e7d32" strokeWidth="3" strokeLinecap="round" />
  <path d="M32 28c0-9-6-14-15-14 0 9 6 15 15 14z" fill="#2f8f3a" />
  <path d="M32 26c0-8 5-13 15-13 0 9-6 14-15 13z" fill="#5cc157" />
  <path d="M9 50c2-9 11-15 23-15s21 6 23 15c.300 1.600-.8 3-2.400 3H11.400C9.800 53 8.700 51.600 9 50z" fill="#7a4a2b" />
  <path d="M21 46h.01M30 42h.01M40 46h.01M33 49h.01M46 49h.01" stroke="#c99a6b" strokeWidth="2.600" strokeLinecap="round" />
</>)
export const WaterArt = ({ className }: P) => svg('0 0 64 64', className, <>
  <path d="M32 8c10 12 16 21 16 29.500a16 16 0 0 1-32 0C16 29 22 20 32 8z" fill="#2f86d6" />
  <path d="M23 37c0 5.500 3 9.500 7.500 11" fill="none" stroke="#bfe0fb" strokeWidth="3" strokeLinecap="round" />
</>)
export const CowArt = ({ className }: P) => svg('0 0 64 64', className, <>
  <path d="M19 16c-4-1-7-4-7-9 4 0 8 2 10 6zM45 16c4-1 7-4 7-9-4 0-8 2-10 6z" fill="#f3e2c7" />
  <ellipse cx="11" cy="24" rx="8" ry="5" transform="rotate(-18 11 24)" fill="#b8652a" />
  <ellipse cx="53" cy="24" rx="8" ry="5" transform="rotate(18 53 24)" fill="#b8652a" />
  <ellipse cx="11.500" cy="24.500" rx="4.500" ry="2.600" transform="rotate(-18 11.500 24.500)" fill="#f4b6a6" />
  <ellipse cx="52.500" cy="24.500" rx="4.500" ry="2.600" transform="rotate(18 52.500 24.500)" fill="#f4b6a6" />
  <path d="M32 11c11 0 17 7 17 17 0 6-1 11-3 16-2 6-7 10-14 10s-12-4-14-10c-2-5-3-10-3-16 0-10 6-17 17-17z" fill="#c8732f" />
  <path d="M32 11c4 0 6 2 6 6 0 6 3 10 3 17 0 12-4 20-9 20s-9-8-9-20c0-7 3-11 3-17 0-4 2-6 6-6z" fill="#fff8ee" />
  <ellipse cx="32" cy="46" rx="11.500" ry="8.500" fill="#f4b6a6" />
  <circle cx="22.500" cy="31" r="2.400" fill="#2a1a12" /><circle cx="41.500" cy="31" r="2.400" fill="#2a1a12" />
  <ellipse cx="28" cy="46" rx="1.700" ry="2.400" fill="#b5655a" /><ellipse cx="36" cy="46" rx="1.700" ry="2.400" fill="#b5655a" />
</>)
