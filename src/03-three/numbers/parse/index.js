import classify from './classify.js'
import fromNumber from './fromNumber.js'

const longCase = {
  nom: 'nominative',
  gen: 'genitive',
  dat: 'dative',
  acc: 'accusative',
  ins: 'instrumental',
  prep: 'prepositional',
}
const longGender = { m: 'masculine', f: 'feminine', n: 'neuter', pl: 'plural' }

// which form does a numeric ordinal's ending suggest? - '5-го' is 'пятого'
const endings = [
  [/го$/, 'm', 'gen'],
  [/му$/, 'm', 'dat'],
  [/ми$/, 'pl', 'ins'],
  [/[ыи]м$/, 'm', 'ins'],
  [/м$/, 'm', 'prep'],
  [/х$/, 'pl', 'gen'],
  [/я$/, 'f', 'nom'],
  [/ю$/, 'f', 'acc'],
  [/(ые|ьи|и)$/, 'pl', 'nom'],
  [/е$/, 'n', 'nom'],
]
const fromEnding = function (str) {
  const found = endings.find(a => a[0].test(str))
  return found ? { gender: found[1], case: found[2] } : { gender: 'm', case: 'nom' }
}

// floating-point noise - 0.1 + 0.2
const tidy = num => Number(num.toPrecision(15))

// which case, and gender, was this number written in?
const getForm = function (items) {
  const words = items.filter(o => o.case)
  const last = words[words.length - 1]
  if (!last) {
    return { gender: 'm', case: 'nom' }
  }
  // 'двадцать пятого' - the ordinal does all of the agreeing
  if (last.ordinal) {
    return { gender: last.gender, case: last.case }
  }
  // 'двух тысяч' - the counted-word is in whatever case the count asks for
  const first = words.find(o => o.kind !== 'multiple') || words[0]
  let c = first.case
  // .. but on its own, 'тысячи' and 'миллионов' are just plurals
  if (first.kind === 'multiple' && (first.abbr || (first.plural && c === 'gen'))) {
    c = 'nom'
  }
  // only 'один' and 'два' have a gender - 'двадцать одна'
  const isGendered = (last.kind === 'unit' && last.num <= 2) || last.kind === 'half'
  return { gender: isGendered ? last.gender : 'm', case: c }
}

// everything we can tell about this number
const parseAll = function (m) {
  const terms = m.docs[0] || []
  const items = terms.map(classify)
  // how the digits were written
  let digits = { prefix: '', suffix: '', hasComma: false, decimal: ',', separator: ' ', ending: null }
  let sum = 0
  let carry = 0
  let found = false
  let hasSign = false
  let hasDigits = false
  for (let i = 0; i < terms.length; i += 1) {
    const item = items[i]
    if (item.kind === 'unknown') {
      continue
    }
    if (item.kind === 'sign') {
      hasSign = true
      continue
    }
    if (item.kind === 'numeric') {
      // thousands may be split-up with a space - '5 000'
      const pre = i === 0 ? terms[i].pre : ''
      let str = terms[i].text
      let space = null
      while (items[i + 1] && items[i + 1].kind === 'numeric') {
        space = space || (/\xa0/.test(terms[i].post) ? '\xa0' : ' ')
        i += 1
        str += ' ' + terms[i].text
      }
      const res = fromNumber(str, pre)
      if (res.num === null) {
        continue
      }
      // the first one is in charge of the formatting
      if (!hasDigits) {
        digits = res
        digits.separator = space || res.separator
      }
      hasDigits = true
      found = true
      carry += res.num
      continue
    }
    found = true
    // 'тысяч', or 'двухтысячный'
    if (item.kind === 'multiple') {
      sum += (item.count > 1 ? item.count : carry || 1) * item.num
      carry = 0
      continue
    }
    carry += item.num
  }
  let num = null
  if (found) {
    num = tidy(sum + carry)
    // 'минус пять'
    if (hasSign && num > 0) {
      num *= -1
    }
  }
  const hasText = items.some(o => o.kind !== 'numeric' && o.kind !== 'unknown' && o.kind !== 'sign')
  return {
    hasComma: digits.hasComma,
    prefix: digits.prefix,
    num,
    suffix: digits.suffix,
    isText: hasText && !hasDigits,
    isOrdinal: m.has('#Ordinal'),
    isFraction: m.has('#Fraction'),
    isMoney: m.has('#Money'),
    // internal details
    hasText,
    hasDigits,
    decimal: digits.decimal,
    separator: digits.separator,
    form: hasDigits && digits.ending ? fromEnding(digits.ending) : getForm(items),
  }
}

// the public result
const parseNumber = function (m) {
  const res = parseAll(m)
  return {
    hasComma: res.hasComma,
    prefix: res.prefix,
    num: res.num,
    suffix: res.suffix,
    isText: res.isText,
    isOrdinal: res.isOrdinal,
    isFraction: res.isFraction,
    isMoney: res.isMoney,
    case: longCase[res.form.case],
    gender: longGender[res.form.gender],
  }
}

export { parseAll, longCase, longGender }
export default parseNumber
