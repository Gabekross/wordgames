'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PlayEntryPage() {
  const [mode, setMode] = useState<'choose' | 'player'>('choose')
  const [code, setCode] = useState('')
  const router = useRouter()

  const handleCodeSubmit = () => {
    if (!/^\d{4}$/.test(code)) {
      alert('Please enter a valid 4-digit code')
      return
    }
    router.push(`/play/${code}`)
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      {mode === 'choose' ? (
        <>
          <h2>Welcome! Who are you?</h2>
          <button style={{ marginRight: '1rem' }} onClick={() => setMode('player')}>I’m a Player</button>
          <button onClick={() => router.push('/admin/login')}>I’m an Admin</button>
        </>
      ) : (
        <>
          <h2>Enter Your Puzzle Code</h2>
          <input
            type="text"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="4-digit code"
            style={{ padding: '0.5rem', marginRight: '1rem' }}
          />
          <button onClick={handleCodeSubmit}>Play</button>
          <p style={{ marginTop: '1rem' }}>
            <button onClick={() => setMode('choose')}>⬅ Back</button>
          </p>
        </>
      )}
    </div>
  )
}
