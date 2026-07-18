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
  let masc = toMasculine(str)
  if (/(ый|ий|ой)$/.test(masc)) {
    return { stem: masc.slice(0, -2), soft: masc.endsWith('ий') }
  }
  return null
}

const toFeminine = function (str = '') {
  let res = stemOf(str)
  if (res === null) {
    return str
  }
  let { stem, soft } = res
  // синий → синяя, but маленький → маленькая, хороший → хорошая
  if (soft && !isVelar(stem.slice(-1)) && !isHusher(stem.slice(-1))) {
    return stem + 'яя'
  }
  return stem + 'ая'
}

const toNeuter = function (str = '') {
  let res = stemOf(str)
  if (res === null) {
    return str
  }
  let { stem, soft } = res
  // синий → синее, хороший → хорошее, but маленький → маленькое
  if (soft && !isVelar(stem.slice(-1))) {
    return stem + 'ее'
  }
  return stem + 'ое'
}

const toPlural = function (str = '') {
  let res = stemOf(str)
  if (res === null) {
    return str
  }
  let { stem, soft } = res
  // новый → новые, but синий/маленький/большой → -ие
  if (soft || isVelar(stem.slice(-1)) || isHusher(stem.slice(-1))) {
    return stem + 'ие'
  }
  return stem + 'ые'
}

export {
  toMasculine,
  toFeminine,
  toNeuter,
  toPlural,
}
