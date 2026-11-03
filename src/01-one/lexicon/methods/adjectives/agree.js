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

// быстрый → самый быстрый, хороший → лучший
const toSuperlative = function (str = '') {
  const masc = toMasculine(str)
  if (irregularSuperlatives[masc]) {
    return irregularSuperlatives[masc]
  }
  return 'самый ' + masc
}

export {
  toMasculine,
  toFeminine,
  toNeuter,
  toPlural,
  toComparative,
  toSuperlative,
}
