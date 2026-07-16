import assert from 'node:assert/strict'
import {
  isValidSessionName,
  isWordSuffix,
  resolveSessionName
} from '../src/lib/dialog.js'

const prefix = 'xpay-2026-07-juli'

const run = () => {
  assert.equal(isWordSuffix(''), true)
  assert.equal(isWordSuffix('abc'), true)
  assert.equal(isWordSuffix('az-_'), true)
  assert.equal(isWordSuffix('123'), true)
  assert.equal(isWordSuffix('a1-b2_c3'), true)
  assert.equal(isWordSuffix('pay-roll_1'), true)
  assert.equal(isWordSuffix('pay roll'), false)
  assert.equal(isWordSuffix('pay!'), false)

  assert.equal(resolveSessionName(`${prefix}-`, prefix), prefix)
  assert.equal(resolveSessionName(prefix, prefix), prefix)
  assert.equal(resolveSessionName(`${prefix}-backup`, prefix), `${prefix}-backup`)
  assert.equal(resolveSessionName(`${prefix}-a-z_1`, prefix), `${prefix}-a-z_1`)
  assert.equal(resolveSessionName('backup', prefix), `${prefix}-backup`)
  assert.equal(resolveSessionName('a-z_', prefix), `${prefix}-a-z_`)
  assert.equal(resolveSessionName('v2', prefix), `${prefix}-v2`)
  assert.equal(resolveSessionName(`${prefix}-2026`, prefix), `${prefix}-2026`)
  assert.equal(resolveSessionName('bad name', prefix), null)
  assert.equal(resolveSessionName('', prefix), null)

  assert.equal(isValidSessionName('az-_', prefix), true)
  assert.equal(isValidSessionName(`${prefix}-az-_`, prefix), true)

  console.log('dialog.test.js: all passed')
}

run()
