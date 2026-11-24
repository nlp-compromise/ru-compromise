const signs = /[-−]/
const count = (str, char) => str.split(char).length - 1

// which marks the decimal, and which groups the thousands?
// russian uses '3,5' and '1 234', but '3.5' and '1,234,567.5' show up, too
const readDigits = function (digits) {
  let decimal = null
  let group = /\s/.test(digits) ? ' ' : null
  digits = digits.replace(/\s/g, '')
  const commas = count(digits, ',')
  const dots = count(digits, '.')
  if (commas && dots) {
    // the last one is the decimal - '1.234,5'
    decimal = digits.lastIndexOf(',') > digits.lastIndexOf('.') ? ',' : '.'
    group = decimal === ',' ? '.' : ','
  } else if (commas > 1 || dots > 1) {
    group = commas ? ',' : '.' // '1.234.567'
  } else if (commas || dots) {
    decimal = commas ? ',' : '.' // '3,5'
  }
  let [int, fraction] = decimal ? digits.split(decimal) : [digits]
  int = int.replace(/[.,]/g, '')
  const num = Number(fraction ? int + '.' + fraction : int)
  return { num, decimal, group }
}

// pull-apart a number written in digits - '-5', '1 234,5', '50%', '5-го'
const fromNumber = function (str, pre = '') {
  const res = { num: null, prefix: '', suffix: '', hasComma: false, decimal: ',', separator: ' ', ending: null }
  // split-up the '$', the digits, and the '%'
  const begin = str.search(/[0-9]/)
  if (begin === -1) {
    return res
  }
  let prefix = str.slice(0, begin)
  let digits = str.slice(begin).match(/^[0-9][0-9.,\s]*/)[0].replace(/[.,\s]+$/, '')
  let suffix = str.slice(begin + digits.length)
  // '.5' is a half
  if (/^[.,]$/.test(prefix.slice(-1)) && !/[.,\s]/.test(digits)) {
    digits = '0' + prefix.slice(-1) + digits
    prefix = prefix.slice(0, -1)
  }
  let { num, decimal, group } = readDigits(digits)
  if (isNaN(num)) {
    return res
  }
  // a fraction - '1/2'
  const fraction = suffix.match(/^\/([0-9]+)$/)
  if (fraction && Number(fraction[1]) !== 0) {
    num /= Number(fraction[1])
    suffix = ''
  }
  // the sign may sit in the punctuation before the term - '(-5)'
  const isNegative = signs.test(prefix) || /[-−]$/.test(pre)
  res.num = isNegative ? num * -1 : num
  res.prefix = prefix.replace(/[-−]/g, '')
  res.decimal = decimal || ','
  res.hasComma = group !== null
  res.separator = group || ' '
  // a numeric ordinal - '5-й', '2-го', '1990-х'
  const ord = suffix.match(/^-([а-яё]{1,3})$/)
  if (ord) {
    res.ending = ord[1]
    suffix = ''
  }
  res.suffix = suffix
  return res
}
export default fromNumber
