import { europeanNumbers } from 'compromise/shared'
import locale from '../locale.js'

const { read } = europeanNumbers.methods.two.europeanNumbers

// pull-apart a number written in digits - '-5', '1 234,5', '50%', '5-го'
// the shared plugin does the reading - '3,5' and '1 234', but '3.5' and '1,234,567.5' show up, too
const fromNumber = function (str, pre = '') {
  const res = read(str, pre, locale)
  return {
    num: res.num,
    prefix: res.prefix,
    suffix: res.suffix,
    hasComma: res.hasComma,
    // the marks to write it back with - '1,234,567' would have a decimal-point
    decimal: res.decimal || (res.group === ',' ? '.' : ','),
    separator: res.group || ' ',
    // a numeric ordinal - '5-й' has 'й'
    ending: res.ordinal ? res.ordinal.replace(/^-/, '') : null,
  }
}
export default fromNumber
