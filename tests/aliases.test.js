import test from 'tape'
import nlp from './_lib.js'
const here = '[ru-aliases] '

// every alias, and the tag it stands for
const aliases = {
  // nouns
  Существительное: 'Noun',
  ЕдинственноеЧисло: 'Singular',
  МножественноеЧисло: 'Plural',
  ИмяСобственное: 'ProperNoun',
  Персона: 'Person',
  Имя: 'FirstName',
  МужскоеИмя: 'MaleName',
  ЖенскоеИмя: 'FemaleName',
  Фамилия: 'LastName',
  Титул: 'Honorific',
  Место: 'Place',
  Страна: 'Country',
  Город: 'City',
  Регион: 'Region',
  Адрес: 'Address',
  Организация: 'Organization',
  Команда: 'SportsTeam',
  Школа: 'School',
  Компания: 'Company',
  Неисчисляемое: 'Uncountable',
  Местоимение: 'Pronoun',
  Деятельность: 'Activity',
  Единица: 'Unit',
  Притяжательное: 'Possessive',
  Одушевлённое: 'AnimateNoun',
  Одушевленное: 'AnimateNoun',
  МужскойРод: 'MaleNoun',
  ЖенскийРод: 'FemaleNoun',
  СреднийРод: 'NeuterNoun',
  // verbs
  Глагол: 'Verb',
  НастоящееВремя: 'PresentTense',
  Инфинитив: 'Infinitive',
  Деепричастие: 'Gerund',
  ПрошедшееВремя: 'PastTense',
  БудущееВремя: 'FutureTense',
  Связка: 'Copula',
  Модальный: 'Modal',
  Причастие: 'Participle',
  Вспомогательный: 'Auxiliary',
  СослагательноеНаклонение: 'Conditional',
  Возвратный: 'Reflexive',
  ПовелительноеНаклонение: 'Imperative',
  ПервоеЛицо: 'FirstPerson',
  ВтороеЛицо: 'SecondPerson',
  ТретьеЛицо: 'ThirdPerson',
  ПервоеЛицоМножественное: 'FirstPersonPlural',
  ВтороеЛицоМножественное: 'SecondPersonPlural',
  ТретьеЛицоМножественное: 'ThirdPersonPlural',
  // values
  Число: 'Value',
  Порядковое: 'Ordinal',
  Количественное: 'Cardinal',
  Дробь: 'Fraction',
  Кратное: 'Multiple',
  РимскоеЧисло: 'RomanNumeral',
  Числительное: 'TextValue',
  Числовое: 'NumericValue',
  Деньги: 'Money',
  Процент: 'Percent',
  // dates
  Дата: 'Date',
  Месяц: 'Month',
  ДеньНедели: 'WeekDay',
  Год: 'Year',
  Квартал: 'FinancialQuarter',
  Праздник: 'Holiday',
  ВремяГода: 'Season',
  ЧасовойПояс: 'Timezone',
  Время: 'Time',
  Длительность: 'Duration',
  // misc
  Прилагательное: 'Adjective',
  ПрилагательноеЖенскогоРода: 'FemaleAdjective',
  ПрилагательноеМужскогоРода: 'MaleAdjective',
  ПрилагательноеМножественногоЧисла: 'PluralAdjective',
  ПрилагательноеЕдинственногоЧисла: 'SingularAdjective',
  СравнительнаяСтепень: 'Comparative',
  ПревосходнаяСтепень: 'Superlative',
  ЧисловойДиапазон: 'NumberRange',
  Наречие: 'Adverb',
  Определитель: 'Determiner',
  Союз: 'Conjunction',
  Предлог: 'Preposition',
  ВопросительноеСлово: 'QuestionWord',
  Валюта: 'Currency',
  Частица: 'Particle',
  Отрицание: 'Negative',
  Междометие: 'Expression',
  Сокращение: 'Abbreviation',
  Ссылка: 'Url',
  Телефон: 'PhoneNumber',
  Хэштег: 'HashTag',
  Упоминание: 'AtMention',
  Эмодзи: 'Emoji',
  Смайлик: 'Emoticon',
  Почта: 'Email',
  Акроним: 'Acronym',
  Условие: 'Condition',
}

test('aliases point to the right tag:', function (t) {
  const { tagAliases } = nlp.world().model.one
  Object.keys(aliases).forEach(alias => {
    t.equal(tagAliases[alias], aliases[alias], here + `#${alias} is #${aliases[alias]}`)
  })
  t.end()
})

test('aliases match a tagged term:', function (t) {
  Object.keys(aliases).forEach(alias => {
    const doc = nlp('этот дом').tag(aliases[alias])
    t.ok(doc.has(`#${alias}`), here + `#${alias} finds a #${aliases[alias]}`)
  })
  t.end()
})

test('every alias in the tagset is tested, and titlecase:', function (t) {
  const { tagSet } = nlp.world().model.one
  Object.keys(tagSet).forEach(tag => {
    const names = (tagSet[tag].aliases || []).filter(name => name !== null)
    names.forEach(name => {
      t.equal(aliases[name], tag, here + `#${name} is listed for #${tag}`)
      t.ok(/^\p{Lu}/u.test(name), here + `#${name} is titlecase`)
    })
  })
  t.end()
})

test('aliases match real sentences:', function (t) {
  const arr = [
    ['Я читаю', '#Местоимение #НастоящееВремя'],
    ['Мы читаем', '#Местоимение #ПервоеЛицоМножественное'],
    ['в доме', '#Предлог #Существительное'],
    ['наш', '#Притяжательное'],
    ['лошадь', '#Одушевлённое'],
    ['лошадь', '#Одушевленное'],
    ['spencer', '#Персона'],
    ['москва', '#Город'],
    ['москва', '#Место'],
    ['иван', '#МужскоеИмя'],
    ['австрия', '#Страна'],
    ['читать', '#Инфинитив'],
    ['шёл', '#ПрошедшееВремя'],
    ['напишу', '#БудущееВремя'],
    ['идя', '#Деепричастие'],
    ['надо', '#Модальный'],
    ['есть', '#Связка'],
    ['идёте', '#ВтороеЛицоМножественное'],
    ['идут', '#ТретьеЛицоМножественное'],
    ['бы', '#Частица'],
    ['не', '#Отрицание'],
    ['спасибо', '#Междометие'],
    ['234', '#Число'],
    ['234', '#Числовое'],
    ['июнь', '#Месяц'],
    ['понедельник', '#ДеньНедели'],
  ]
  arr.forEach(function (a) {
    const [str, match] = a
    const doc = nlp(str)
    const tags = doc.json()[0].terms.map(term => term.tags[0])
    const msg = `'${(str + "' ").padEnd(20, ' ')}  - '${match}' - '${tags.join(', ')}'`
    t.equal(doc.match(match).text(), doc.text(), here + msg)
  })
  t.end()
})

test('aliases work in match syntax:', function (t) {
  const doc = nlp('этот дом')
  const [det, noun] = doc.json()[0].terms.map(term => term.text)
  // lowercase is title-cased, as with any tag
  t.ok(doc.has('#существительное'), here + 'lowercase')
  t.ok(nlp('в доме').has('#предлог'), here + 'lowercase preposition')
  t.equal(doc.match('!#Существительное').text(), det, here + 'negative')
  t.equal(doc.match('(#Вспомогательный|#Определитель) #Существительное').text(), doc.text(), here + 'or-block')
  t.equal(doc.match('#Определитель [#Существительное]', 0).text(), noun, here + 'capture')
  t.equal(doc.match('#Определитель #Прилагательное? #Существительное').text(), doc.text(), here + 'optional')
  t.equal(doc.not('#Определитель').text(), noun, here + 'not()')
  t.equal(doc.if('#Существительное').length, 1, here + 'if()')
  t.end()
})

test('aliases do not over-match:', function (t) {
  const doc = nlp('этот дом')
  t.notOk(doc.has('#Вспомогательный'), here + 'no #Вспомогательный')
  t.notOk(doc.has('#Предлог'), here + 'no #Предлог')
  t.notOk(doc.has('#Ерунда'), here + 'an unknown tag finds nothing')
  t.end()
})

test('aliases can also set tags:', function (t) {
  const doc = nlp('этот дом').tag('Вспомогательный')
  t.ok(doc.has('#Auxiliary'), here + 'tag() with an alias')
  doc.unTag('Вспомогательный')
  t.notOk(doc.has('#Auxiliary'), here + 'unTag() with an alias')
  t.end()
})

test('english tag names are unchanged:', function (t) {
  const doc = nlp('этот дом')
  t.ok(doc.has('#Determiner #Noun'), here + 'canonical names still match')
  t.ok(doc.out('spec').includes('{Determiner,Noun}'), here + 'spec output is canonical')
  const tags = doc.json()[0].terms[1].tags
  t.ok(tags.includes('Noun'), here + 'json has #Noun')
  t.notOk(tags.includes('Существительное'), here + 'json has no #Существительное')
  t.end()
})
