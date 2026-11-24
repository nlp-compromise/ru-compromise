import { cases, byNum, multiples, zero, declineOrdinal } from '../data.js'

// largest first - триллион, миллиард, миллион, тысяча
const bigToSmall = multiples.slice().reverse()
const max = 1e15

// 125 → [100, 20, 5]
const toPieces = function (num) {
  const pieces = []
  const rest = num % 100
  if (num >= 100) {
    pieces.push(num - rest)
  }
  if (rest >= 20) {
    pieces.push(rest - (rest % 10))
    if (rest % 10) {
      pieces.push(rest % 10)
    }
  } else if (rest > 0) {
    pieces.push(rest)
  }
  return pieces
}

// only 'один' and 'два' have genders - 'одна', 'две'
const toWord = function (num, gender, c) {
  const forms = byNum[num].forms
  return (forms[gender] || forms.m)[cases.indexOf(c)]
}

// any number under 1,000
const smallNumber = function (num, gender, c) {
  return toPieces(num).map(n => toWord(n, gender, c))
}

// russian counts things in three ways - 'одна тысяча', 'две тысячи', 'пять тысяч'
const countWord = function (mult, count, c) {
  const i = cases.indexOf(c)
  const one = count % 10 === 1 && count % 100 !== 11
  const few = count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)
  if (one) {
    return mult.sg[i]
  }
  if (c === 'nom' || c === 'acc') {
    return few ? mult.sg[1] : mult.pl[1]
  }
  return mult.pl[i]
}

// split 1,234,567 into [{count:1, mult:million}, {count:234, mult:thousand}], and 567
const toGroups = function (num) {
  const groups = []
  bigToSmall.forEach(mult => {
    const count = Math.floor(num / mult.num)
    if (count > 0) {
      groups.push({ count, mult })
      num -= count * mult.num
    }
  })
  return { groups, rest: num }
}

// 'три тысячи', 'миллион'
const groupWords = function (groups, c) {
  let words = []
  groups.forEach((o, i) => {
    // a leading 'one' goes unsaid - 'тысяча двести'
    if (o.count !== 1 || i !== 0) {
      words = words.concat(smallNumber(o.count, o.mult.gender, c))
    }
    words.push(countWord(o.mult, o.count, c))
  })
  return words
}

const isOkay = num => typeof num === 'number' && Number.isInteger(num) && Math.abs(num) < max

// 125 → ['сто', 'двадцать', 'пять']
const toText = function (num, form = {}) {
  if (!isOkay(num)) {
    return null
  }
  const c = cases.includes(form.case) ? form.case : 'nom'
  if (num === 0) {
    return [zero.forms[cases.indexOf(c)]]
  }
  let words = []
  if (num < 0) {
    words.push('минус')
    num = Math.abs(num)
  }
  // 'одни' only works by itself
  const gender = form.gender === 'pl' && num !== 1 ? 'm' : form.gender
  const { groups, rest } = toGroups(num)
  words = words.concat(groupWords(groups, c))
  return words.concat(smallNumber(rest, gender, c))
}

// 125 → ['сто', 'двадцать', 'пятый']
// only the last word is an ordinal - the rest stay as they are
const toTextOrdinal = function (num, form = {}) {
  if (!isOkay(num) || num < 0) {
    return null
  }
  const { gender, case: c } = form
  if (num === 0) {
    return [declineOrdinal(zero.ord, gender, c)]
  }
  const { groups, rest } = toGroups(num)
  if (rest > 0) {
    const pieces = toPieces(rest)
    const last = pieces.pop()
    const words = groupWords(groups, 'nom').concat(pieces.map(n => toWord(n, 'm', 'nom')))
    words.push(declineOrdinal(byNum[last].ord, gender, c))
    return words
  }
  // a round number squishes its count into one word - 'двадцатипятитысячный'
  const last = groups.pop()
  const words = groupWords(groups, 'nom')
  let prefix = ''
  if (last.count !== 1) {
    prefix = toPieces(last.count).map(n => byNum[n].comb).join('')
  }
  words.push(declineOrdinal(prefix + last.mult.ord, gender, c))
  return words
}

export { toText, toTextOrdinal }
