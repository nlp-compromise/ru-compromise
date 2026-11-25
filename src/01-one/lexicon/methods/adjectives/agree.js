// russian adjective agreement - derive gender/number forms from any form.
// endings are regular; the only lexical wrinkle is stressed -ой adjectives.

// stems of common adjectives with stressed -ой (большой, молодой..)
const ojStems = new Set([
  'больш', 'молод', 'дорог', 'прост', 'плох', 'жив', 'зл', 'чуж', 'родн',
  'голуб', 'сед', 'сух', 'глух', 'прям', 'крут', 'густ', 'пуст', 'слеп',
  'смешн', 'больн', 'основн', 'миров', 'втор', 'восьм', 'друг', 'как', 'так',
])

const isVelar = (c) => /[кгх]/.test(c)
const isHusher = (c) => /[жчшщ]/.test(c)

// normalize any nominative form to masculine
const toMasculine = function (str = '') {
  if (/(ый|ий|ой)$/.test(str)) {
    return str
  }
  let stem = null
  if (/(ая|яя|ое|ее|ые|ие)$/.test(str)) {
    stem = str.slice(0, -2)
  }
  if (stem === null) {
    return str
  }
  if (ojStems.has(stem)) {
    return stem + 'ой'
  }
  // синяя → синий, хорошее → хороший, маленькие → маленький
  if (/(яя|ее|ие)$/.test(str) || isVelar(stem.slice(-1)) || isHusher(stem.slice(-1))) {
    return stem + 'ий'
  }
  return stem + 'ый'
}

const stemOf = function (str) {
  const masc = toMasculine(str)
  if (/(ый|ий|ой)$/.test(masc)) {
    return { stem: masc.slice(0, -2), soft: masc.endsWith('ий') }
  }
  return null
}

const toFeminine = function (str = '') {
  const res = stemOf(str)
  if (res === null) {
    return str
  }
  const { stem, soft } = res
  // синий → синяя, but маленький → маленькая, хороший → хорошая
  if (soft && !isVelar(stem.slice(-1)) && !isHusher(stem.slice(-1))) {
    return stem + 'яя'
  }
  return stem + 'ая'
}

const toNeuter = function (str = '') {
  const res = stemOf(str)
  if (res === null) {
    return str
  }
  const { stem, soft } = res
  // синий → синее, хороший → хорошее, but маленький → маленькое
  if (soft && !isVelar(stem.slice(-1))) {
    return stem + 'ее'
  }
  return stem + 'ое'
}

const toPlural = function (str = '') {
  const res = stemOf(str)
  if (res === null) {
    return str
  }
  const { stem, soft } = res
  // новый → новые, but синий/маленький/большой → -ие
  if (soft || isVelar(stem.slice(-1)) || isHusher(stem.slice(-1))) {
    return stem + 'ие'
  }
  return stem + 'ые'
}

// --- comparatives + superlatives ---

const irregularComparatives = {
  'хороший': 'лучше',
  'плохой': 'хуже',
  'большой': 'больше',
  'маленький': 'меньше',
  'старый': 'старше',
  'молодой': 'моложе',
  'высокий': 'выше',
  'низкий': 'ниже',
  'широкий': 'шире',
  'узкий': 'уже',
  'далёкий': 'дальше',
  'далекий': 'дальше',
  'долгий': 'дольше',
  'короткий': 'короче',
  'лёгкий': 'легче',
  'легкий': 'легче',
  'мягкий': 'мягче',
  'строгий': 'строже',
  'дорогой': 'дороже',
  'дешёвый': 'дешевле',
  'дешевый': 'дешевле',
  'громкий': 'громче',
  'тихий': 'тише',
  'сладкий': 'слаще',
  'редкий': 'реже',
  'жаркий': 'жарче',
  'крепкий': 'крепче',
  'чистый': 'чище',
  'толстый': 'толще',
  'богатый': 'богаче',
  'поздний': 'позже',
  'ранний': 'раньше',
  'глубокий': 'глубже',
  'близкий': 'ближе',
  'простой': 'проще',
  'частый': 'чаще',
  'густой': 'гуще',
  'твёрдый': 'твёрже',
  'твердый': 'твёрже',
}

const irregularSuperlatives = {
  'хороший': 'лучший',
  'плохой': 'худший',
  'высокий': 'высший',
  'низкий': 'низший',
}

// быстрый → быстрее, громкий → громче
const toComparative = function (str = '') {
  const masc = toMasculine(str)
  if (irregularComparatives[masc]) {
    return irregularComparatives[masc]
  }
  // relational adjectives have no synthetic comparative - 'более русский'
  if (/(ский|цкий)$/.test(masc)) {
    return 'более ' + str
  }
  const res = stemOf(masc)
  if (res === null) {
    return 'более ' + str
  }
  const { stem } = res
  const last = stem.slice(-1)
  // velar-stems mutate: к→ч, г→ж, х→ш
  if (last === 'к') {
    return stem.slice(0, -1) + 'че'
  }
  if (last === 'г') {
    return stem.slice(0, -1) + 'же'
  }
  if (last === 'х') {
    return stem.slice(0, -1) + 'ше'
  }
  return stem + 'ее'
}

// every adjective ending, as the matching (hard-stem) ending of 'самый'.
// 'ым' and 'ой' are each several case-forms, but 'самый' is ambiguous in the same way
const hardEndings = {
  'ыми': 'ыми', 'ими': 'ыми',
  'ого': 'ого', 'его': 'ого',
  'ому': 'ому', 'ему': 'ому',
  'ый': 'ый', 'ий': 'ый',
  'ая': 'ая', 'яя': 'ая',
  'ое': 'ое', 'ее': 'ое',
  'ые': 'ые', 'ие': 'ые',
  'ую': 'ую', 'юю': 'ую',
  'ым': 'ым', 'им': 'ым',
  'ом': 'ом', 'ем': 'ом',
  'ой': 'ой', 'ей': 'ой',
  'ых': 'ых', 'их': 'ых',
}
const endingReg = /(ыми|ими|ого|его|ому|ему|ый|ий|ая|яя|ое|ее|ые|ие|ую|юю|ым|им|ом|ем|ой|ей|ых|их)$/

// which form is this adjective in? - returns its stem, and the ending 'самый' takes beside it.
// stressed -ой is masculine ('большой дом') unless we're told it is feminine ('в большой комнате')
const parseForm = function (str, isFeminine) {
  const m = str.match(endingReg)
  if (m === null || str.length - m[0].length < 2) {
    return null
  }
  const stem = str.slice(0, -m[0].length)
  let ending = hardEndings[m[0]]
  if (m[0] === 'ой' && ojStems.has(stem) && isFeminine !== true) {
    ending = 'ый'
  }
  return { stem, ending }
}

// suppletive superlatives, by stem - these all have husher-stems (лучший, лучшая, лучшее, лучшего..)
const superlativeStems = {}
Object.keys(irregularSuperlatives).forEach(k => {
  superlativeStems[k.slice(0, -2)] = irregularSuperlatives[k].slice(0, -2)
})
// spelling rules after a husher: ы → и, and unstressed о → е
const afterHusher = (ending) => ending.replace(/^ы/, 'и').replace(/^о/, 'е')

// быстрый → самый быстрый, хороший → лучший
// the adjective keeps its form, and 'самый' takes the same gender, number and case -
// красивая → самая красивая, красивую → самую красивую, хорошая → лучшая
const toSuperlative = function (str = '', isFeminine) {
  const res = parseForm(str, isFeminine)
  if (res === null) {
    return 'самый ' + str
  }
  if (superlativeStems.hasOwnProperty(res.stem)) {
    return superlativeStems[res.stem] + afterHusher(res.ending)
  }
  return 'сам' + res.ending + ' ' + str
}

export {
  toMasculine,
  toFeminine,
  toNeuter,
  toPlural,
  toComparative,
  toSuperlative,
}
