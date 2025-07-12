'use client'

import { useState } from 'react'
import '@/styles/PuzzleGrid.scss'

type PuzzleGridProps = {
  grid: string[][]
  words: string[]
  solvedWords: string[]
  disabled?: boolean
  onWordFound?: (word: string) => void
}

export default function PuzzleGrid({
  grid,
  words,
  solvedWords,
  disabled = false,
  onWordFound,
}: PuzzleGridProps) {
  const [selectedPath, setSelectedPath] = useState<[number, number][]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [solvedPaths, setSolvedPaths] = useState<[number, number][][]>([])

  const wordString = (path: [number, number][]) =>
    path.map(([r, c]) => grid[r][c]).join('')

  const handlePointerDown = (r: number, c: number) => {
    if (disabled) return
    setSelectedPath([[r, c]])
    setIsSelecting(true)
  }

  const handlePointerEnter = (r: number, c: number) => {
    if (!isSelecting || disabled) return
    const last = selectedPath[selectedPath.length - 1]
    if (last && (last[0] !== r || last[1] !== c)) {
      setSelectedPath((prev) => [...prev, [r, c]])
    }
  }

  const handlePointerUp = () => {
    if (!isSelecting) return
    const selectedWord = wordString(selectedPath)
    const reversed = selectedWord.split('').reverse().join('')

    const match = [selectedWord, reversed].find(
      (w) => words.includes(w) && !solvedWords.includes(w)
    )

    if (match && onWordFound) {
      onWordFound(match)
      setSolvedPaths((prev) => [...prev, [...selectedPath]])
    }

    setIsSelecting(false)
    setSelectedPath([])
  }

  const isCellSelected = (r: number, c: number) =>
    selectedPath.some(([row, col]) => row === r && col === c)

  const isCellSolved = (r: number, c: number) =>
    solvedPaths.some((path) =>
      path.some(([row, col]) => row === r && col === c)
    )

  return (
    <div className="puzzle-grid" onMouseLeave={handlePointerUp}>
      {grid.map((row, rowIndex) => (
        <div className="puzzle-row" key={rowIndex}>
          {row.map((letter, colIndex) => {
            const isSolved = isCellSolved(rowIndex, colIndex)
            const isSelected = isCellSelected(rowIndex, colIndex)

            return (
              <div
                key={colIndex}
                className={`puzzle-cell ${
                  disabled ? 'disabled' : ''
                } ${isSelected ? 'selected' : ''} ${
                  isSolved ? 'solved' : ''
                }`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handlePointerDown(rowIndex, colIndex);
                }}
                onPointerEnter={(e) => {
                  e.preventDefault();
                  handlePointerEnter(rowIndex, colIndex);
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  handlePointerUp();
                }}
              >
                {letter}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
