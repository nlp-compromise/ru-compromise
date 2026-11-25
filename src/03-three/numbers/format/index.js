import { europeanNumbers } from 'compromise/shared'
import { toText, toTextOrdinal } from './toText.js'
import locale from '../locale.js'

const { write } = europeanNumbers.methods.two.europeanNumbers

const vowels = /[аеёиоуыэюя]/

// 'процент' is counted like anything else - 'один процент', 'два процента', 'пять процентов'
const percent = function (num) {
  const n = Math.abs(num)
  if (n % 10 === 1 && n % 100 !== 11) {
    return 'процент'
  }
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) {
    return 'процента'
  }
  return 'процентов'
}

// the letters that follow a numeric ordinal - 'пятый' → '5-й', 'пятого' → '5-го'
// one letter after a vowel, and two after a consonant
const toEnding = function (word) {
  const before = word.slice(-2, -1)
  return vowels.test(before) || before === 'ь' ? word.slice(-1) : word.slice(-2)
}

// write the digits the way we found them - '3,5' or '1 234'
const toDigits = function (parsed) {
  const how = { hasComma: parsed.hasComma, decimal: parsed.decimal, group: parsed.separator, prefix: parsed.prefix }
  return write(parsed.num, how, locale)
}

// write this number in one of our four formats
// returns '' when the number can't be written that way
const formatNumber = function (parsed, fmt) {
  const { num, form } = parsed
  if (typeof num !== 'number' || !isFinite(num)) {
    return ''
  }
  const suffix = parsed.suffix || ''
  if (fmt === 'TextOrdinal') {
    const words = parsed.prefix || suffix ? null : toTextOrdinal(num, form)
    return words ? words.join(' ') : ''
  }
  if (fmt === 'TextCardinal') {
    const words = toText(num, form)
    if (!words || parsed.prefix) {
      return ''
    }
    // '5%' → 'пять процентов'
    if (suffix === '%') {
      words.push(percent(num))
    } else if (suffix) {
      return '' // '9km'
    }
    return words.join(' ')
  }
  // '5-й'
  if (fmt === 'Ordinal') {
    const words = toTextOrdinal(Math.abs(num), form)
    if (!words) {
      return ''
    }
    return toDigits(parsed) + '-' + toEnding(words[words.length - 1]) + suffix
  }
  return toDigits(parsed) + suffix
}
export default formatNumber
