import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

function loadCaptchaLogic() {
  const source = readFileSync(new URL('../lib/september-captcha.ts', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText
  const module = { exports: {} }
  const fn = new Function('module', 'exports', compiled)
  fn(module, module.exports)
  return module.exports
}

test('recognizes the deterministic September CAPTCHA path', () => {
  const { evaluateSeptemberCaptcha } = loadCaptchaLogic()

  assert.equal(
    evaluateSeptemberCaptcha({
      selectedDate: 3,
      selectedTokens: ['ТРЕТЬЕ СЕНТЯБРЯ', 'КАЛЕНДАРЬ'],
      flipCount: 2,
      understoodInstruction: true,
    }).passed,
    true,
  )
})

test('keeps September CAPTCHA retryable when the date is wrong', () => {
  const { evaluateSeptemberCaptcha, getDateFeedback } = loadCaptchaLogic()

  assert.deepEqual(
    evaluateSeptemberCaptcha({
      selectedDate: 2,
      selectedTokens: ['ТРЕТЬЕ СЕНТЯБРЯ', 'КАЛЕНДАРЬ'],
      flipCount: 2,
      understoodInstruction: true,
    }),
    { passed: false, reason: 'date' },
  )
  assert.equal(getDateFeedback(2, false), 'Почти.\nОчень почти.')
})

test('unlocks the full secret only after all optional signals are present', () => {
  const { shouldShowSecretBonus } = loadCaptchaLogic()

  assert.equal(
    shouldShowSecretBonus({
      selectedSeptemberDay: 3,
      usedRomanTime: true,
      secretClicks: 3,
      captchaPassed: true,
    }),
    true,
  )
  assert.equal(
    shouldShowSecretBonus({
      selectedSeptemberDay: 3,
      usedRomanTime: false,
      secretClicks: 3,
      captchaPassed: true,
    }),
    false,
  )
})
