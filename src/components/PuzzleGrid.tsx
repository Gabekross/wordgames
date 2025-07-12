'use client'

import { useState, useEffect, useRef } from 'react'
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
  const gridRef = useRef<HTMLDivElement>(null)

  const wordString = (path: [number, number][]) =>
    path.map(([r, c]) => grid[r][c]).join('')

  const isStraightLine = (path: [number, number][]) => {
    if (path.length < 2) return true
    const [r0, c0] = path[0]
    const [r1, c1] = path[1]
    const dr = r1 - r0
    const dc = c1 - c0

    for (let i = 1; i < path.length - 1; i++) {
      const [r2, c2] = path[i]
      const [r3, c3] = path[i + 1]
      if (r3 - r2 !== dr || c3 - c2 !== dc) {
        return false
      }
    }
    return true
  }

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

    if (!isStraightLine(selectedPath)) {
      setIsSelecting(false)
      setSelectedPath([])
      return
    }

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

  // Pointer move tracking for mobile
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isSelecting || disabled) return
      const target = document.elementFromPoint(e.clientX, e.clientY)
      if (
        target instanceof HTMLElement &&
        target.dataset.row &&
        target.dataset.col
      ) {
        const r = parseInt(target.dataset.row)
        const c = parseInt(target.dataset.col)
        handlePointerEnter(r, c)
      }
    }

    const gridEl = gridRef.current
    gridEl?.addEventListener('pointermove', handlePointerMove)

    return () => {
      gridEl?.removeEventListener('pointermove', handlePointerMove)
    }
  }, [isSelecting, disabled, selectedPath])

  return (
    <div className="puzzle-grid" ref={gridRef} onPointerUp={handlePointerUp}>
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
                data-row={rowIndex}
                data-col={colIndex}
                onPointerDown={(e) => {
                  e.preventDefault()
                  handlePointerDown(rowIndex, colIndex)
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
