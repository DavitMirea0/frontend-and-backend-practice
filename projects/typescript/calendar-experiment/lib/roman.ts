const ROMAN_VALUES: [string, number][] = [
  ['M', 1000],
  ['CM', 900],
  ['D', 500],
  ['CD', 400],
  ['C', 100],
  ['XC', 90],
  ['L', 50],
  ['XL', 40],
  ['X', 10],
  ['IX', 9],
  ['V', 5],
  ['IV', 4],
  ['I', 1],
]

export function toRoman(num: number): string {
  if (num <= 0) return 'NULLA'
  let n = num
  let result = ''
  for (const [symbol, value] of ROMAN_VALUES) {
    while (n >= value) {
      result += symbol
      n -= value
    }
  }
  return result
}

/**
 * Разбирает римские цифры, введённые пользователем. Разрешает произвольный
 * регистр и пробелы, но не разрешает бессмысленные последовательности.
 */
export function fromRoman(input: string): number | null {
  const cleaned = input.trim().toUpperCase().replace(/\s+/g, '')
  if (!cleaned) return null
  if (!/^[IVXLCDM]+$/.test(cleaned)) return null

  let index = 0
  let total = 0
  for (const [symbol, value] of ROMAN_VALUES) {
    while (cleaned.startsWith(symbol, index)) {
      total += value
      index += symbol.length
    }
  }
  if (index !== cleaned.length) return null
  return total
}
