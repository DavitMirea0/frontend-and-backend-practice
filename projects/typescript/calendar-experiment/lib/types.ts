export interface Meeting {
  id: string
  title: string
  participants: string[]
  year: number
  month: number // 0-11
  day: number
  hour: number
  minute: number
  createdAt: number
}

export interface DraftMeeting {
  title: string
  participants: string[]
  year: number
  month: number
  day: number | null
  hour: number
  minute: number
}

export const PARTICIPANT_POOL = [
  'Аня К.',
  'Борис Т.',
  'Вера Л.',
  'Гриша П.',
  'Дина С.',
  'Егор В.',
  'Жанна Р.',
  'Илья Ф.',
] as const
