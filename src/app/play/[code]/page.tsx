'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import PuzzleGrid from '@/components/PuzzleGrid'

type Puzzle = {
  id: string
  name: string
  code: string
  category: string
  words: string[]
  grid: string[][]
  is_active: boolean
}

type LeaderboardEntry = {
  player_name: string
  duration: string
}

export default function PlayPuzzlePage() {
  const params = useParams()
  const code = Array.isArray(params?.code) ? params.code[0] : params?.code

  const [name, setName] = useState('')
  const [submittedName, setSubmittedName] = useState(false)

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [solvedWords, setSolvedWords] = useState<string[]>([])
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    if (typeof code === 'string') {
      fetchPuzzle(code)
    }
  }, [code])

  const fetchLeaderboard = async (puzzleId: string) => {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('player_name, duration')
      .eq('puzzle_id', puzzleId)
      .eq('is_complete', true)
      .not('duration', 'is', null)

    if (!error && data) {
      const sorted = [...data].sort((a, b) =>
        parseFloat(a.duration) - parseFloat(b.duration)
      ) as LeaderboardEntry[]
      setLeaderboard(sorted)
    }
  }

  const fetchPuzzle = async (code: string) => {
    const { data, error } = await supabase
      .from('puzzles')
      .select('*')
      .eq('code', code)
      .single()

    if (!error && data) {
      setPuzzle(data as Puzzle)
      fetchLeaderboard(data.id)
    } else {
      setError('Puzzle not found.')
    }

    setLoading(false)
  }

  const startSession = async () => {
    if (!name.trim()) return alert('Enter your name')

    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        player_name: name.trim(),
        puzzle_id: puzzle!.id,
      })
      .select()
      .single()

    if (error) {
      alert('Error starting session')
    } else {
      setSubmittedName(true)
      setSessionId(data.id)
    }

    setStartTime(new Date())
  }

  const handleWordFound = async (word: string) => {
    if (!puzzle || !sessionId || solvedWords.includes(word)) return

    const updatedWords = [...solvedWords, word]
    setSolvedWords(updatedWords)

    await supabase
      .from('game_sessions')
      .update({ solved_words: updatedWords })
      .eq('id', sessionId)

    if (updatedWords.length === puzzle.words.length) {
      const end = new Date()
      setEndTime(end)
      setGameOver(true)

      const duration = startTime
        ? (end.getTime() - startTime.getTime()) / 1000
        : null

      await supabase
        .from('game_sessions')
        .update({
          solved_words: updatedWords,
          is_complete: true,
          end_time: end.toISOString(),
          duration: duration?.toString(),
        })
        .eq('id', sessionId)

      await fetchLeaderboard(puzzle.id)
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div style={{ padding: '2rem' }}>
      {!submittedName ? (
        <>
          <h2>{puzzle!.name}</h2>
          <p>
            Category: <strong>{puzzle!.category}</strong> ·{' '}
            {puzzle!.words.length}-word puzzle
          </p>

          <input
            placeholder="Enter your name to start"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginRight: '1rem', padding: '0.5rem' }}
          />
          <button onClick={startSession}>Start</button>
        </>
      ) : (
        <>
          <h3>Welcome, {name}!</h3>
          <p>Find all the words in the grid below:</p>
          <PuzzleGrid
            grid={puzzle!.grid}
            words={puzzle!.words}
            solvedWords={solvedWords}
            disabled={!puzzle!.is_active || gameOver}
            onWordFound={handleWordFound}
          />
          {gameOver && (
            <div style={{ marginTop: '1rem', color: 'green' }}>
              <h2>🎉 You solved the puzzle!</h2>
              <p>
                Total time:{' '}
                {Math.round(
                  (endTime!.getTime() - startTime!.getTime()) / 1000
                )}{' '}
                seconds
              </p>
            </div>
          )}

          {leaderboard.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3>🏁 Leaderboard</h3>
              <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
                {leaderboard.map((entry, index) => (
                  <li
                    key={index}
                    style={{
                      padding: '0.5rem 0',
                      fontWeight: entry.player_name === name ? 'bold' : 'normal',
                      color: index === 0 ? 'goldenrod' : 'inherit',
                    }}
                  >
                    {index === 0 && '🥇 '}
                    {entry.player_name} – {parseFloat(entry.duration).toFixed(2)}s
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
