// rule-based russian noun pluralization, with common irregulars.
// case-declension needs a gender-dictionary, so we stick to nominative number.

const irregularPlurals = {
  'человек': 'люди',
  'ребёнок': 'дети',
  'ребенок': 'дети',
  'друг': 'друзья',
  'сын': 'сыновья',
  'брат': 'братья',
  'стул': 'стулья',
  'лист': 'листья',
  'дерево': 'деревья',
  'крыло': 'крылья',
  'перо': 'перья',
  'муж': 'мужья',
  'имя': 'имена',
  'время': 'времена',
  'мать': 'матери',
  'дочь': 'дочери',
  'ухо': 'уши',
  'небо': 'небеса',
  'чудо': 'чудеса',
  'сосед': 'соседи',
  'цветок': 'цветы',
  'котёнок': 'котята',
  'щенок': 'щенки',
  // masc nouns with stressed -а plurals
  'город': 'города',
  'дом': 'дома',
  'глаз': 'глаза',
  'лес': 'леса',
  'вечер': 'вечера',
  'голос': 'голоса',
  'поезд': 'поезда',
  'номер': 'номера',
  'паспорт': 'паспорта',
  'доктор': 'доктора',
  'профессор': 'профессора',
  'директор': 'директора',
  'учитель': 'учителя',
  'край': 'края',
  'адрес': 'адреса',
  'берег': 'берега',
  'век': 'века',
  'остров': 'острова',
  'цвет': 'цвета',
  // fleeting-vowel nouns
  'день': 'дни',
  'отец': 'отцы',
  'сон': 'сны',
  'огонь': 'огни',
  'ветер': 'ветры',
  'кусок': 'куски',
  'подарок': 'подарки',
  'рынок': 'рынки',
  'звонок': 'звонки',
  'платок': 'платки',
  'значок': 'значки',
}
let irregularSingulars = null
const getIrregularSingulars = function () {
  if (irregularSingulars === null) {
    irregularSingulars = {}
    Object.keys(irregularPlurals).forEach(k => {
      irregularSingulars[irregularPlurals[k]] = k
    })
  }
  return irregularSingulars
}

const isHushOrVelar = (c) => /[кгхжчшщ]/.test(c)

const toPlural = function (str = '') {
  if (irregularPlurals[str]) {
    return irregularPlurals[str]
  }
  let stem = str.slice(0, -1)
  // линия → линии
  if (str.endsWith('ия')) {
    return stem + 'и'
  }
  // статья → статьи
  if (str.endsWith('ья')) {
    return stem + 'и'
  }
  // книга → книги, машина → машины
  if (str.endsWith('а')) {
    return stem + (isHushOrVelar(stem.slice(-1)) ? 'и' : 'ы')
  }
  // неделя → недели
  if (str.endsWith('я')) {
    return stem + 'и'
  }
  // окно → окна
  if (str.endsWith('о')) {
    return stem + 'а'
  }
  // море → моря, ружьё → ружья
  if (str.endsWith('е') || str.endsWith('ё')) {
    return stem + 'я'
  }
  // ночь → ночи, музей → музеи
  if (str.endsWith('ь') || str.endsWith('й')) {
    return stem + 'и'
  }
  // парк → парки
  if (isHushOrVelar(str.slice(-1))) {
    return str + 'и'
  }
  // стол → столы
  if (/[бвдзлмнпрстфц]$/.test(str)) {
    return str + 'ы'
  }
  return str
}

// best-effort - plural endings are ambiguous without a gender-dictionary
const toSingular = function (str = '') {
  let irregular = getIrregularSingulars()
  if (irregular[str]) {
    return irregular[str]
  }
  let stem = str.slice(0, -1)
  // линии → линия
  if (str.endsWith('ии')) {
    return stem + 'я'
  }
  // статьи → статья
  if (str.endsWith('ьи')) {
    return stem + 'я'
  }
  if (str.endsWith('и')) {
    // книги → книга, дачи → дача
    if (isHushOrVelar(stem.slice(-1))) {
      return stem + 'а'
    }
    // недели → неделя
    return stem + 'я'
  }
  // столы → стол
  if (str.endsWith('ы')) {
    return stem
  }
  // окна → окно
  if (str.endsWith('а')) {
    return stem + 'о'
  }
  // моря → море
  if (str.endsWith('я')) {
    return stem + 'е'
  }
  return str
}

export {
  toPlural,
  toSingular,
}
