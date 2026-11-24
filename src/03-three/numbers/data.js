// russian numerals decline for case - 'пять', 'пяти', 'пятью'
// and 'один' + 'два' agree in gender, too - 'одна', 'две'
const cases = ['nom', 'gen', 'dat', 'acc', 'ins', 'prep']
const genders = ['m', 'f', 'n', 'pl']

const list = str => str.split('|')

// 'ё' is often written as 'е' - all our lookups are ё-less
const noYo = str => str.replace(/ё/g, 'е')

// пять → пяти, пятью
const soft = function (nom, stem, ins) {
  stem = stem || nom.replace(/ь$/, '')
  ins = ins || stem + 'ью'
  return [nom, stem + 'и', stem + 'и', nom, ins, stem + 'и']
}
// пятьдесят → пятидесяти, пятьюдесятью
const tens = a => [a[0] + 'десят', a[1] + 'десяти', a[2] + 'десяти', a[0] + 'десят', a[4] + 'десятью', a[5] + 'десяти']
// пятьсот → пятисот, пятистам, пятьюстами, пятистах
const hundreds = function (a, nom) {
  nom = nom || a[0] + 'сот'
  return [nom, a[1] + 'сот', a[2] + 'стам', nom, a[4] + 'стами', a[5] + 'стах']
}

const two = list('два|двух|двум|два|двумя|двух')
const three = list('три|трёх|трём|три|тремя|трёх')
const four = list('четыре|четырёх|четырём|четыре|четырьмя|четырёх')
const five = soft('пять')
const six = soft('шесть')
const seven = soft('семь')
const eight = soft('восемь', 'восьм', 'восемью')
const nine = soft('девять')

// [value, kind, case-forms, ordinal, combining-form]
// the combining-form is used in 'двухтысячный' - it's the genitive, unless given
const numbers = [
  [1, 'unit', list('один|одного|одному|один|одним|одном'), 'первый', 'одно'],
  [2, 'unit', two, 'второй'],
  [3, 'unit', three, 'третий'],
  [4, 'unit', four, 'четвёртый'],
  [5, 'unit', five, 'пятый'],
  [6, 'unit', six, 'шестой'],
  [7, 'unit', seven, 'седьмой'],
  [8, 'unit', eight, 'восьмой'],
  [9, 'unit', nine, 'девятый'],
  [10, 'teen', soft('десять'), 'десятый'],
  [11, 'teen', soft('одиннадцать'), 'одиннадцатый'],
  [12, 'teen', soft('двенадцать'), 'двенадцатый'],
  [13, 'teen', soft('тринадцать'), 'тринадцатый'],
  [14, 'teen', soft('четырнадцать'), 'четырнадцатый'],
  [15, 'teen', soft('пятнадцать'), 'пятнадцатый'],
  [16, 'teen', soft('шестнадцать'), 'шестнадцатый'],
  [17, 'teen', soft('семнадцать'), 'семнадцатый'],
  [18, 'teen', soft('восемнадцать'), 'восемнадцатый'],
  [19, 'teen', soft('девятнадцать'), 'девятнадцатый'],
  [20, 'ten', soft('двадцать'), 'двадцатый'],
  [30, 'ten', soft('тридцать'), 'тридцатый'],
  [40, 'ten', list('сорок|сорока|сорока|сорок|сорока|сорока'), 'сороковой'],
  [50, 'ten', tens(five), 'пятидесятый'],
  [60, 'ten', tens(six), 'шестидесятый'],
  [70, 'ten', tens(seven), 'семидесятый'],
  [80, 'ten', tens(eight), 'восьмидесятый'],
  [90, 'ten', list('девяносто|девяноста|девяноста|девяносто|девяноста|девяноста'), 'девяностый', 'девяносто'],
  [100, 'hundred', list('сто|ста|ста|сто|ста|ста'), 'сотый', 'сто'],
  [200, 'hundred', hundreds(two, 'двести'), 'двухсотый'],
  [300, 'hundred', hundreds(three, 'триста'), 'трёхсотый'],
  [400, 'hundred', hundreds(four, 'четыреста'), 'четырёхсотый'],
  [500, 'hundred', hundreds(five), 'пятисотый'],
  [600, 'hundred', hundreds(six), 'шестисотый'],
  [700, 'hundred', hundreds(seven), 'семисотый'],
  [800, 'hundred', hundreds(eight), 'восьмисотый'],
  [900, 'hundred', hundreds(nine), 'девятисотый'],
]

// gendered forms of 'one' and 'two'
const gendered = {
  1: {
    f: list('одна|одной|одной|одну|одной|одной'),
    n: list('одно|одного|одному|одно|одним|одном'),
    pl: list('одни|одних|одним|одни|одними|одних'),
  },
  2: {
    f: list('две|двух|двум|две|двумя|двух'),
  },
}

const zero = {
  forms: list('ноль|ноля|нолю|ноль|нолём|ноле'),
  alt: list('нуль|нуля|нулю|нуль|нулём|нуле'),
  ord: 'нулевой',
}

// миллион → миллиона, миллионов
const masc = function (num, w, abbr) {
  return {
    num,
    gender: 'm',
    sg: [w, w + 'а', w + 'у', w, w + 'ом', w + 'е'],
    pl: [w + 'ы', w + 'ов', w + 'ам', w + 'ы', w + 'ами', w + 'ах'],
    ord: w + 'ный',
    abbr,
  }
}
// these are nouns, and get counted - 'одна тысяча', 'две тысячи', 'пять тысяч'
const multiples = [
  {
    num: 1e3,
    gender: 'f',
    sg: list('тысяча|тысячи|тысяче|тысячу|тысячей|тысяче'),
    pl: list('тысячи|тысяч|тысячам|тысячи|тысячами|тысячах'),
    ord: 'тысячный',
    abbr: 'тыс',
    alt: ['тысячью'],
  },
  masc(1e6, 'миллион', 'млн'),
  masc(1e9, 'миллиард', 'млрд'),
  masc(1e12, 'триллион', 'трлн'),
]

// words that we understand, but never write
const extras = [
  // alternate instrumental forms of 'eight'
  ['восьмью', 8, 'unit', 'ins'],
  ['восьмьюдесятью', 80, 'ten', 'ins'],
  ['восьмьюстами', 800, 'hundred', 'ins'],
]
// collective numerals - 'двое детей', 'обе руки'
const collectives = [
  [2, list('оба|обоих|обоим|оба|обоими|обоих'), 'm'],
  [2, list('обе|обеих|обеим|обе|обеими|обеих'), 'f'],
  [2, list('двое|двоих|двоим|двое|двоими|двоих')],
  [3, list('трое|троих|троим|трое|троими|троих')],
  [4, list('четверо|четверых|четверым|четверо|четверыми|четверых')],
  [5, list('пятеро|пятерых|пятерым|пятеро|пятерыми|пятерых')],
  [6, list('шестеро|шестерых|шестерым|шестеро|шестерыми|шестерых')],
  [7, list('семеро|семерых|семерым|семеро|семерыми|семерых')],
  [8, list('восьмеро|восьмерых|восьмерым|восьмеро|восьмерыми|восьмерых')],
  [9, list('девятеро|девятерых|девятерым|девятеро|девятерыми|девятерых')],
  [10, list('десятеро|десятерых|десятерым|десятеро|десятерыми|десятерых')],
]
// one-and-a-half - 'полтора часа', 'полторы минуты'
const half = {
  m: list('полтора|полутора|полутора|полтора|полутора|полутора'),
  f: list('полторы|полутора|полутора|полторы|полутора|полутора'),
}

// --- ordinals are adjectives - 'пятый', 'пятая', 'пятого' ---
const ordEndings = {
  m: list('|ого|ому||ым|ом'), // nominative keeps its -ый/-ой
  f: list('ая|ой|ой|ую|ой|ой'),
  n: list('ое|ого|ому|ое|ым|ом'),
  pl: list('ые|ых|ым|ые|ыми|ых'),
}
// 'третий' has soft endings
const third = {
  m: list('третий|третьего|третьему|третий|третьим|третьем'),
  f: list('третья|третьей|третьей|третью|третьей|третьей'),
  n: list('третье|третьего|третьему|третье|третьим|третьем'),
  pl: list('третьи|третьих|третьим|третьи|третьими|третьих'),
}

// put an ordinal into a gender + case - 'пятый' → 'пятую'
const declineOrdinal = function (lemma, gender, c) {
  const i = Math.max(cases.indexOf(c), 0)
  gender = ordEndings.hasOwnProperty(gender) ? gender : 'm'
  if (lemma === 'третий') {
    return third[gender][i]
  }
  const end = ordEndings[gender][i]
  return end ? lemma.slice(0, -2) + end : lemma
}

// --- lookup tables ---
const byNum = {} // 5 → { kind, forms, ord, comb }
const cardinals = {} // 'пяти' → { num, kind, gender, case }
const ordinals = {} // 'пятого' → { num, kind, gender, case }
const combining = {} // 'пяти' → 5
const lexicon = {} // all our words → tags

const addWord = function (lookup, w, obj, tags) {
  // first form wins - 'пяти' is genitive, before it is dative
  if (!lookup.hasOwnProperty(noYo(w))) {
    lookup[noYo(w)] = obj
  }
  if (tags && !lexicon.hasOwnProperty(w)) {
    lexicon[w] = tags
  }
}
const addForms = function (lookup, forms, obj, tags) {
  forms.forEach((w, i) => {
    addWord(lookup, w, Object.assign({ case: cases[i] }, obj), tags)
  })
}
const addOrdinal = function (lemma, obj) {
  genders.forEach(gender => {
    cases.forEach(c => {
      const w = declineOrdinal(lemma, gender, c)
      addWord(ordinals, w, Object.assign({ gender, case: c }, obj), ['Ordinal', 'TextValue'])
    })
  })
}

const isCardinal = ['Cardinal', 'TextValue']

numbers.forEach(a => {
  const [num, kind, forms, ord, comb] = a
  const all = Object.assign({ m: forms }, gendered[num])
  byNum[num] = { num, kind, forms: all, ord, comb: comb || forms[1] }
  combining[noYo(byNum[num].comb)] = num
  genders.forEach(gender => {
    if (all[gender]) {
      addForms(cardinals, all[gender], { num, kind, gender }, isCardinal)
    }
  })
  addOrdinal(ord, { num, kind })
})

addForms(cardinals, zero.forms, { num: 0, kind: 'zero', gender: 'm' }, isCardinal)
addForms(cardinals, zero.alt, { num: 0, kind: 'zero', gender: 'm' }, isCardinal)
addOrdinal(zero.ord, { num: 0, kind: 'zero' })

multiples.forEach(o => {
  const tags = ['Cardinal', 'TextValue', 'Multiple']
  // on its own, 'тысячи' is a plural - so those go first
  addForms(cardinals, o.pl, { num: o.num, kind: 'multiple', gender: o.gender, plural: true }, tags)
  addForms(cardinals, o.sg, { num: o.num, kind: 'multiple', gender: o.gender }, tags)
  ;(o.alt || []).forEach(w => {
    addWord(cardinals, w, { num: o.num, kind: 'multiple', gender: o.gender, case: 'ins' }, tags)
  })
  // 'тыс', 'млн'
  addWord(cardinals, o.abbr, { num: o.num, kind: 'multiple', gender: o.gender, case: 'nom', abbr: true }, tags)
  // 'тысячный', 'миллионный'
  addOrdinal(o.ord, { num: o.num, kind: 'multiple', count: 1 })
})

extras.forEach(a => {
  const [w, num, kind, c] = a
  addWord(cardinals, w, { num, kind, gender: 'm', case: c }, isCardinal)
})
collectives.forEach(a => {
  const [num, forms, gender] = a
  addForms(cardinals, forms, { num, kind: 'unit', gender: gender || 'm', collective: true }, isCardinal)
})
Object.keys(half).forEach(gender => {
  addForms(cardinals, half[gender], { num: 1.5, kind: 'half', gender }, isCardinal)
})

// 'семью' is usually 'the family' - the tagger decides this one from its neighbours
delete lexicon['семью']

// --- compound ordinals, like 'двухтысячный' or 'двадцатипятимиллионный' ---
const byLength = (a, b) => b.length - a.length
const ordSuffixes = {} // 'ого' → { gender, case }
genders.forEach(gender => {
  cases.forEach((c, i) => {
    const end = ordEndings[gender][i] || 'ый'
    ordSuffixes[end] = ordSuffixes[end] || { gender, case: c }
  })
})
const stems = {} // 'тысячн' → 1000
multiples.forEach(o => {
  stems[o.ord.slice(0, -2)] = o.num
})
const prefixes = Object.keys(combining).sort(byLength)
const compoundSrc =
  `^((?:${prefixes.join('|')})+)` +
  `(${Object.keys(stems).join('|')})` +
  `(${Object.keys(ordSuffixes).sort(byLength).join('|')})$`
// the tagger sees the 'ё's
const compoundReg = new RegExp(compoundSrc.replace(/е/g, '[её]'))
const compoundStrict = new RegExp(compoundSrc)
const order = { hundred: 3, ten: 2, teen: 2, unit: 1 }

// 'двадцатипятитысячного' → 25 x 1000
const parseCompound = function (str) {
  const m = noYo(str).match(compoundStrict)
  if (!m) {
    return null
  }
  let rest = m[1]
  let count = 0
  let last = 4
  while (rest) {
    const found = prefixes.find(p => rest.startsWith(p))
    const kind = byNum[combining[found]].kind
    // 'пятидвух..' is not a number
    if (order[kind] >= last || (kind === 'unit' && last === 2 && count % 100 < 20)) {
      return null
    }
    last = order[kind]
    count += combining[found]
    rest = rest.slice(found.length)
  }
  const form = ordSuffixes[m[3]]
  return { num: stems[m[2]], kind: 'multiple', count, ordinal: true, gender: form.gender, case: form.case }
}

// what do we know about this word?
const lookup = function (str) {
  str = noYo(str || '')
  if (cardinals.hasOwnProperty(str)) {
    return cardinals[str]
  }
  if (ordinals.hasOwnProperty(str)) {
    return Object.assign({ ordinal: true }, ordinals[str])
  }
  return parseCompound(str)
}

export { cases, genders, byNum, multiples, zero, lexicon, lookup, declineOrdinal, compoundReg, noYo }
