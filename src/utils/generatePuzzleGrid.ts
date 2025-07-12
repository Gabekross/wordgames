type GridOptions = {
  allowDiagonal: boolean
  allowReverse: boolean
}

type Direction = [number, number]

const DIRECTIONS: Direction[] = [
  [0, 1], // right
  [1, 0], // down
  [0, -1], // left
  [-1, 0], // up
]

const DIAGONALS: Direction[] = [
  [1, 1],   // down-right
  [1, -1],  // down-left
  [-1, 1],  // up-right
  [-1, -1], // up-left
]

function getAllDirections(options: GridOptions): Direction[] {
  let dirs = [...DIRECTIONS]
  if (options.allowDiagonal) dirs.push(...DIAGONALS)
  return dirs
}

function getRandomLetter(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return alphabet[Math.floor(Math.random() * alphabet.length)]
}

function shuffle<T>(arr: T[]): T[] {
  return arr
    .map((a) => ({ sort: Math.random(), value: a }))
    .sort((a, b) => a.sort - b.sort)
    .map((a) => a.value)
}

function tryPlaceWord(
  grid: string[][],
  word: string,
  options: GridOptions
): boolean {
  const size = grid.length
  const directions = shuffle(getAllDirections(options))
  const reversed = options.allowReverse && Math.random() > 0.5
  const finalWord = reversed ? word.split('').reverse().join('') : word

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      for (let [dx, dy] of directions) {
        let r = row
        let c = col
        let fits = true

        for (let k = 0; k < finalWord.length; k++) {
          if (
            r < 0 || r >= size ||
            c < 0 || c >= size ||
            (grid[r][c] !== '' && grid[r][c] !== finalWord[k])
          ) {
            fits = false
            break
          }
          r += dx
          c += dy
        }

        if (fits) {
          // Place word
          r = row
          c = col
          for (let k = 0; k < finalWord.length; k++) {
            grid[r][c] = finalWord[k]
            r += dx
            c += dy
          }
          return true
        }
      }
    }
  }

  return false // Failed to place
}

export function generatePuzzleGrid(
  words: string[],
  gridSize: number,
  options: GridOptions
): { grid: string[][]; error?: string } {
  const grid: string[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => '')
  )

  const sortedWords = shuffle(words).sort((a, b) => b.length - a.length)

  for (let word of sortedWords) {
    const placed = tryPlaceWord(grid, word, options)
    if (!placed) {
      return {
        grid: [],
        error: `Could not place the word "${word}". Try increasing grid size or disabling diagonal/reverse.`,
      }
    }
  }

  // Fill remaining cells
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = getRandomLetter()
      }
    }
  }

  return { grid }
}
