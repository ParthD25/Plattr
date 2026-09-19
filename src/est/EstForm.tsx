// The one input of the app: the establishment number as printed on the pack. Used on Home and on the not-found screen.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function EstForm() {
  const [value, setValue] = useState('')
  const navigate = useNavigate()
  return (
    <>
      <form
        className="inline"
        onSubmit={e => {
          e.preventDefault()
          if (value.trim()) navigate(`/est/${encodeURIComponent(value.trim())}`)
        }}
      >
        <label htmlFor="est-input" style={{ flexBasis: '100%', margin: 0 }}>USDA establishment number on the pack</label>
        <input id="est-input" type="text" required autoComplete="off" placeholder="EST. 86R or M9714" value={value} onChange={e => setValue(e.target.value)} />
        <button type="submit">Look up the plant</button>
      </form>
      <p className="caveat">
        <strong>Where is the number?</strong> Inside or near the round USDA mark of inspection. It may also be printed elsewhere on the pack with an “EST.” prefix.
      </p>
    </>
  )
}
