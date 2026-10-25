export const SEPTEMBER_CAPTCHA_STORAGE_KEY = 'calendar-captcha-passed'

export const SEPTEMBER_TOKENS = [
  'ТРЕТЬЕ СЕНТЯБРЯ',
  'КАЛЕНДАРЬ',
  'РЯБИНЫ',
  'МОСКВА',
  'ФОТО',
] as const

export const REQUIRED_SEPTEMBER_TOKENS = ['ТРЕТЬЕ СЕНТЯБРЯ', 'КАЛЕНДАРЬ'] as const

export type CaptchaState = 'idle' | 'selecting' | 'checking' | 'success' | 'failed'

export interface SeptemberCaptchaAttempt {
  selectedDate: number | null
  selectedTokens: string[]
  flipCount: number
  understoodInstruction: boolean
}

export type SeptemberCaptchaResult =
  | { passed: true }
  | { passed: false; reason: 'date' | 'tokens' | 'flip' | 'instruction' }

export interface SecretSignals {
  selectedSeptemberDay: number
  usedRomanTime: boolean
  secretClicks: number
  captchaPassed: boolean
}

export function hasRequiredTokens(selectedTokens: string[]) {
  return REQUIRED_SEPTEMBER_TOKENS.every((token) => selectedTokens.includes(token))
}

export function evaluateSeptemberCaptcha(attempt: SeptemberCaptchaAttempt): SeptemberCaptchaResult {
  if (attempt.selectedDate !== 3) return { passed: false, reason: 'date' }
  if (!hasRequiredTokens(attempt.selectedTokens)) return { passed: false, reason: 'tokens' }
  if (attempt.flipCount < 2) return { passed: false, reason: 'flip' }
  if (!attempt.understoodInstruction) return { passed: false, reason: 'instruction' }
  return { passed: true }
}

export function getDateFeedback(day: number, hasVisitedTwo: boolean) {
  if (day === 3) return hasVisitedTwo ? 'Теперь понятно.' : 'Совпадение обнаружено.\n03.09'
  if (day === 1) return 'Сентябрь — да.\nНо не тот.'
  if (day === 2) return 'Почти.\nОчень почти.'
  if (day === 4) return 'Вы прошли мимо главного события.'
  if (day === 31) return 'Такой даты не существует.\nНо нам нравится ваша уверенность.'
  return 'Это была не та дата.\n\nКалендарь разочарован.'
}

export function shouldShowSecretBonus(signals: SecretSignals) {
  return (
    signals.selectedSeptemberDay === 3 &&
    signals.usedRomanTime &&
    signals.secretClicks >= 3 &&
    signals.captchaPassed
  )
}
