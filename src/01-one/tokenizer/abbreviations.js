// abbreviations, and the other language-specific parts of the sentence-parser
// (these replace the english abbreviations, which collide with real words here)
const toObj = str => Object.fromEntries(str.trim().split(/\s+/).map(w => [w, true]))

export default {
  // these go before a name, a number or a letter ('Dr. X', 'fig. A'), and never end a sentence
  titles: toObj(`
    г гг в вв ул д кв корп с см ср проф акад доц тов гр дж
    напр пр просп пл пос ст оз о зам зав гос сев юж зап вост
    т е п н э
    стр рис табл гл изд
  `),
  // these end a sentence, when a capital comes next
  abbreviations: toObj(`
    руб коп тыс млн млрд трлн ч мин сек чел обл
    испр доп тел др проч
    янв февр фев апр авг сент окт нояб дек
  `),
  // 'им' is a real word - 'я сказал им.'
  // .. and so is 'ок' - 'Ок. Пойдём.'
  titleIf: /(?:(?:\p{Lu}{2,}|ул\.|(?:театр|парк|завод|университет|институт|школ|музе|библиотек|улиц|площад|преми|канал|стадион)\p{L}*) им|\sок)\. *$/u,
  // longer ones, that end a sentence when a capital comes next
  enders: ['т\\.\\s?[дп]', 'н\\.\\s?э'],
  // '5 кг.'
  units: ['кг', 'км', 'см', 'мм', 'мл', 'шт'],
  // words that begin a new sentence, and are never a name - 'Habla con el Dr. Él sabe.'
  starters: `Он Она Оно Они Ты Мы Вы Потом Затем Тогда Но Нет Да Это Было Был Была Есть
    Его Её Их Мой Моя Мне Никто Ничего Всё Все Сегодня Вчера Завтра Сейчас Теперь
    Здесь Там Тут Тоже Когда Если Как Что Кто Где Для На По За Из`.split(/\s+/),
  quotes: [['«', '»'], ['„', '“'], ['"', '"'], ['(', ')']],
  ellipsis: true,
}
