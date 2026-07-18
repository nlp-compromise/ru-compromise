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

// --- case declension ---

// nouns with mobile vowels or suppletive stems
const irregularCases = {
  'день': { genitive: 'дня', dative: 'дню', accusative: 'день', instrumental: 'днём', prepositional: 'дне' },
  'путь': { genitive: 'пути', dative: 'пути', accusative: 'путь', instrumental: 'путём', prepositional: 'пути' },
  'мать': { genitive: 'матери', dative: 'матери', accusative: 'мать', instrumental: 'матерью', prepositional: 'матери' },
  'дочь': { genitive: 'дочери', dative: 'дочери', accusative: 'дочь', instrumental: 'дочерью', prepositional: 'дочери' },
  'любовь': { genitive: 'любви', dative: 'любви', accusative: 'любовь', instrumental: 'любовью', prepositional: 'любви' },
  'церковь': { genitive: 'церкви', dative: 'церкви', accusative: 'церковь', instrumental: 'церковью', prepositional: 'церкви' },
  'имя': { genitive: 'имени', dative: 'имени', accusative: 'имя', instrumental: 'именем', prepositional: 'имени' },
  'время': { genitive: 'времени', dative: 'времени', accusative: 'время', instrumental: 'временем', prepositional: 'времени' },
  'огонь': { genitive: 'огня', dative: 'огню', accusative: 'огонь', instrumental: 'огнём', prepositional: 'огне' },
  'отец': { genitive: 'отца', dative: 'отцу', accusative: 'отца', instrumental: 'отцом', prepositional: 'отце' },
  'сон': { genitive: 'сна', dative: 'сну', accusative: 'сон', instrumental: 'сном', prepositional: 'сне' },
}

// guess gender from the nominative ending - the ambiguous cases
// (soft-sign nouns, natural-gender words) live in the lexicon
const guessGender = function (str = '') {
  if (/[ая]$/.test(str)) {
    return 'feminine'
  }
  if (/[оеё]$/.test(str) || str.endsWith('мя')) {
    return 'neuter'
  }
  if (str.endsWith('ь')) {
    return 'feminine' // ~65% of -ь nouns are feminine
  }
  return 'masculine'
}

// singular case-endings. accusative of masc/neut is nominative-form
// (animate-accusative needs an animacy dictionary - not handled)
const decline = function (str = '', gender) {
  if (irregularCases[str]) {
    return Object.assign({ nominative: str }, irregularCases[str])
  }
  gender = gender || guessGender(str)
  let stem = str.slice(0, -1)
  let res = { nominative: str, accusative: str }
  const hush = (c) => /[жчшщц]/.test(c)

  if (gender === 'feminine') {
    if (str.endsWith('ия')) {
      // линия → линии, линию, линией
      return Object.assign(res, { genitive: stem + 'и', dative: stem + 'и', accusative: stem + 'ю', instrumental: stem + 'ей', prepositional: stem + 'и' })
    }
    if (str.endsWith('а')) {
      // книга → книги, книге, книгу, книгой
      let gen = isHushOrVelar(stem.slice(-1)) ? stem + 'и' : stem + 'ы'
      let instr = hush(stem.slice(-1)) ? stem + 'ей' : stem + 'ой'
      return Object.assign(res, { genitive: gen, dative: stem + 'е', accusative: stem + 'у', instrumental: instr, prepositional: stem + 'е' })
    }
    if (str.endsWith('я')) {
      // неделя → недели, неделе, неделю, неделей
      return Object.assign(res, { genitive: stem + 'и', dative: stem + 'е', accusative: stem + 'ю', instrumental: stem + 'ей', prepositional: stem + 'е' })
    }
    if (str.endsWith('ь')) {
      // ночь → ночи, ночью
      return Object.assign(res, { genitive: stem + 'и', dative: stem + 'и', instrumental: stem + 'ью', prepositional: stem + 'и' })
    }
    return res
  }
  if (gender === 'neuter') {
    if (str.endsWith('ие')) {
      // здание → здания, зданию, зданием, здании
      return Object.assign(res, { genitive: stem + 'я', dative: stem + 'ю', instrumental: stem + 'ем', prepositional: stem + 'и' })
    }
    if (str.endsWith('о')) {
      // окно → окна, окну, окном, окне
      return Object.assign(res, { genitive: stem + 'а', dative: stem + 'у', instrumental: stem + 'ом', prepositional: stem + 'е' })
    }
    if (str.endsWith('е') || str.endsWith('ё')) {
      // море → моря, морю, морем, море
      return Object.assign(res, { genitive: stem + 'я', dative: stem + 'ю', instrumental: stem + 'ем', prepositional: stem + 'е' })
    }
    // indeclinable (метро, такси)
    return Object.assign(res, { genitive: str, dative: str, instrumental: str, prepositional: str })
  }
  // masculine
  if (str.endsWith('ий')) {
    // сценарий → сценария, сценарии
    return Object.assign(res, { genitive: stem + 'я', dative: stem + 'ю', instrumental: stem + 'ем', prepositional: stem + 'и' })
  }
  if (str.endsWith('й')) {
    // музей → музея, музеем, музее
    return Object.assign(res, { genitive: stem + 'я', dative: stem + 'ю', instrumental: stem + 'ем', prepositional: stem + 'е' })
  }
  if (str.endsWith('ь')) {
    // учитель → учителя, учителем, учителе
    return Object.assign(res, { genitive: stem + 'я', dative: stem + 'ю', instrumental: stem + 'ем', prepositional: stem + 'е' })
  }
  if (/[аяоеёуию]$/.test(str)) {
    // indeclinable (кофе)
    return Object.assign(res, { genitive: str, dative: str, instrumental: str, prepositional: str })
  }
  // стол → стола, столу, столом, столе
  return Object.assign(res, { genitive: str + 'а', dative: str + 'у', instrumental: str + 'ом', prepositional: str + 'е' })
}

export {
  toPlural,
  toSingular,
  decline,
  guessGender,
}
