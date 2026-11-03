// Client unit tests for pure helpers: `npm test` in client/ (Node test runner
// with TypeScript type-stripping; no browser needed).
import test from 'node:test'
import assert from 'node:assert/strict'

import { extractAttendanceCode } from '../src/components/attendance/qr.ts'
import { describeDevice, timeAgo } from '../src/components/security/device.ts'
import { bucketLabel, formatValue } from '../src/components/reports/format.ts'
import { currentFinancialYear, previousFinancialYear, inr } from '../src/components/tax/types.ts'

test('attendance codes are read from typed text and scanned links', () => {
  assert.equal(extractAttendanceCode('abcd2345'), 'ABCD2345')
  assert.equal(extractAttendanceCode(' AB-CD 2345 '), 'ABCD2345')
  assert.equal(extractAttendanceCode('https://paisa.test/dashboard/attendance?code=PYM8YQJQ'), 'PYM8YQJQ')
  // 0/O and 1/I are not in the code alphabet; wrong lengths are rejected.
  assert.equal(extractAttendanceCode('ABCD0OI1'), null)
  assert.equal(extractAttendanceCode('ABC'), null)
  assert.equal(extractAttendanceCode('https://paisa.test/dashboard/attendance'), null)
  assert.equal(extractAttendanceCode(null), null)
})

test('devices are named from the user agent', () => {
  const chrome = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
  const edge = `${chrome} Edg/130.0`
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'
  assert.equal(describeDevice(chrome), 'Chrome on Windows')
  assert.equal(describeDevice(edge), 'Edge on Windows')
  assert.equal(describeDevice(iphone), 'Safari on iOS')
  assert.equal(describeDevice('node'), 'API client')
  assert.equal(describeDevice(null), 'Unknown device')
  assert.equal(timeAgo(new Date().toISOString()), 'just now')
})

test('report values and buckets are formatted for India', () => {
  assert.equal(formatValue(1234567, 'currency'), '₹12,34,567')
  assert.equal(formatValue(85, 'percent'), '85%')
  assert.equal(formatValue(1.5, 'hours'), '1.5 h')
  assert.equal(bucketLabel('2026-10-04'), '4 Oct')
  assert.equal(bucketLabel('2026-10'), 'Oct 2026')
})

test('financial years run April to March', () => {
  assert.equal(currentFinancialYear(new Date(2026, 3, 1)), '2026-27')
  assert.equal(currentFinancialYear(new Date(2026, 2, 31)), '2025-26')
  assert.equal(previousFinancialYear('2026-27'), '2025-26')
  assert.equal(inr(1275000), '₹12,75,000')
})
