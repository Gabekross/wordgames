'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const [error, setError] = useState('')

  type GameSession = {
  player_name: string
  duration?: string
  solved_words?: string[]
  start_time?: string
  inserted_at?: string
}

type PuzzleWithSessions = {
  id: string
  name: string
  code: string
  category?: string
  words: string[]
  is_active: boolean
  show_solutions: boolean
  leaderboard: GameSession[]
  inProgress: GameSession[]
}

const [puzzles, setPuzzles] = useState<PuzzleWithSessions[]>([])


  useEffect(() => {
    fetchPuzzles()
  }, [])

  const fetchPuzzles = async () => {
    const { data, error } = await supabase
      .from('puzzles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      return
    }

    const puzzlesWithSessions = await Promise.all(
      (data || []).map(async (puzzle) => {
        const { data: completed } = await supabase
          .from('game_sessions')
          .select('player_name, duration')
          .eq('puzzle_id', puzzle.id)
          .eq('is_complete', true)
          .not('duration', 'is', null)

        const { data: inProgress } = await supabase
          .from('game_sessions')
          .select('player_name, solved_words, start_time, inserted_at')
          .eq('puzzle_id', puzzle.id)
          .eq('is_complete', false)

        const leaderboard = (completed || []).sort(
          (a, b) => parseFloat(a.duration) - parseFloat(b.duration)
        )

        return { ...puzzle, leaderboard, inProgress: inProgress || [] }
      })
    )

    setPuzzles(puzzlesWithSessions)
  }

  const updatePuzzleField = async (id: string, field: 'is_active' | 'show_solutions', value: boolean) => {
    const { error } = await supabase
      .from('puzzles')
      .update({ [field]: value })
      .eq('id', id)

    if (error) alert(`Failed to update puzzle: ${error.message}`)
    else fetchPuzzles()
  }

  const stopPuzzle = (id: string) => updatePuzzleField(id, 'is_active', false)
  const revealSolutions = (id: string) => updatePuzzleField(id, 'show_solutions', true)

  const isPlayerStuck = (startTime: string) => {
    const now = new Date().getTime()
    const started = new Date(startTime).getTime()
    const minutesElapsed = (now - started) / 1000 / 60
    return minutesElapsed > 5
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>
      <Link href="/admin/dashboard">Create Puzzle</Link> | 

      <h2>Your Puzzles</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {puzzles.length === 0 ? (
        <p>No puzzles created yet.</p>
      ) : (
        puzzles.map((puzzle) => (
          <div key={puzzle.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
            <h3>{puzzle.name} · Code: <strong>{puzzle.code}</strong></h3>
            <p>
              Category: {puzzle.category || '—'} · {puzzle.words.length}-word puzzle
            </p>
            <p>Status: {puzzle.is_active ? '🟢 Active' : '🔴 Stopped'} | Solutions: {puzzle.show_solutions ? '👁 Shown' : '❌ Hidden'}</p>

            <div style={{ marginTop: '0.5rem' }}>
              <button onClick={() => stopPuzzle(puzzle.id)} disabled={!puzzle.is_active} style={{ marginRight: '0.5rem' }}>
                Stop Puzzle
              </button>
              <button onClick={() => revealSolutions(puzzle.id)} disabled={puzzle.show_solutions}>
                Reveal Solutions
              </button>
            </div>

            {puzzle.leaderboard?.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong>🏁 Leaderboard:</strong>
                <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                  {puzzle.leaderboard.map((entry, i) => (
                    <li
                      key={i}
                      style={{
                        color: i === 0 ? 'goldenrod' : 'inherit',
                        fontWeight: i === 0 ? 'bold' : 'normal',
                      }}
                    >
                      {i === 0 && '🥇 '}
                      {entry.player_name} — {(() => {
  const duration: string = entry.duration ?? '';
  let parsed = 0;

  if (duration.includes(':')) {
    const [hh = '0', mm = '0', ss = '0'] = duration.split(':');
    parsed = parseInt(hh) * 3600 + parseInt(mm) * 60 + parseFloat(ss);
  } else {
    parsed = parseFloat(duration);
  }

  if (isNaN(parsed) || parsed <= 0) return '—';

  const minutes = Math.floor(parsed / 60);
  const seconds = Math.floor(parsed % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} min (${parsed.toFixed(1)}s)`;
})()}

                    </li>
                  ))}
                </ul>
              </div>
            )}

            {puzzle.inProgress.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong>⏳ In Progress:</strong>
                <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                  {puzzle.inProgress.map((entry, i: number) => {
                    const startTime = entry.start_time || entry.inserted_at || ''
                    const stuck = isPlayerStuck(startTime)

                    return (
                      <li
                        key={i}
                        style={{
                          color: stuck ? 'red' : 'inherit',
                          fontStyle: stuck ? 'italic' : 'normal',
                        }}
                      >
                        {entry.player_name} — {entry.solved_words?.length || 0} words found<br />
                        <small>Started: {new Date(startTime).toLocaleTimeString()}</small>
                        {stuck && <strong> ⚠ Stuck?</strong>}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {puzzle.show_solutions && (
              <div style={{ marginTop: '1rem' }}>
                <strong>✅ Solution Words:</strong>
                <p>{puzzle.words?.join(', ')}</p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
