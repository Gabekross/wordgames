'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { generatePuzzleGrid } from '@/utils/generatePuzzleGrid'
import { useRouter } from 'next/navigation'

import Link from 'next/link'

export default function PuzzleDashboardPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [wordList, setWordList] = useState('')
  const [gridSize, setGridSize] = useState(8)
  const [allowDiagonal, setAllowDiagonal] = useState(false)
  const [allowReverse, setAllowReverse] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreatePuzzle = async () => {
    setLoading(true)
    setError('')

    const words = wordList
      .split(',')
      .map(w => w.trim().toUpperCase())
      .filter(w => w.length > 0)

    if (words.length === 0 || !name) {
      setError('Please provide a puzzle name and at least one word.')
      setLoading(false)
      return
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString() // 4-digit code
    const { grid, error: gridError } = generatePuzzleGrid(words, gridSize, {
      allowDiagonal,
      allowReverse,
    })

    if (gridError) {
      setError(gridError)
      setLoading(false)
      return
    }

    const { error: dbError } = await supabase.from('puzzles').insert({
      name,
      code,
      category,
      words,
      grid_size: gridSize,
      grid,
      allow_diagonal: allowDiagonal,
      allow_reverse: allowReverse,
    })

    setLoading(false)
    if (dbError) {
      setError(dbError.message)
    } else {
      alert(`Puzzle created! Code: ${code}`)
      router.push(`/admin/dashboard`)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px' }}>
      <h2>Create New Puzzle</h2>
      <Link href="/admin/puzzles">Manage Puzzles</Link>

      <input
        placeholder="Puzzle Name"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem' }}
      />
      <input
        placeholder="Category (e.g. Baby Items)"
        value={category}
        onChange={e => setCategory(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem' }}
      />
      <textarea
        placeholder="Word list (comma-separated)"
        value={wordList}
        onChange={e => setWordList(e.target.value)}
        rows={4}
        style={{ width: '100%', marginBottom: '1rem' }}
      />
      <label>Grid Size: </label>
      <input
        type="number"
        value={gridSize}
        onChange={e => setGridSize(Number(e.target.value))}
        min={6}
        max={20}
        style={{ marginBottom: '1rem' }}
      />
      <div style={{ marginBottom: '1rem' }}>
        <label>
          <input
            type="checkbox"
            checked={allowDiagonal}
            onChange={e => setAllowDiagonal(e.target.checked)}
          />
          Allow Diagonal
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={allowReverse}
            onChange={e => setAllowReverse(e.target.checked)}
          />
          Allow Reverse Words
        </label>
      </div>
      <button onClick={handleCreatePuzzle} disabled={loading}>
        {loading ? 'Creating...' : 'Create Puzzle'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
