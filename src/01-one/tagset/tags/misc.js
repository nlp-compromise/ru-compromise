// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Adjective: {
    aliases: [null, 'Прилагательное'],
  },
  FemaleAdjective: {
    aliases: [null, 'ПрилагательноеЖенскогоРода'],
    is: 'Adjective',
    not: ['MaleAdjective'],
  },
  MaleAdjective: {
    aliases: [null, 'ПрилагательноеМужскогоРода'],
    is: 'Adjective',
    not: ['FemaleAdjective'],
  },
  PluralAdjective: {
    aliases: [null, 'ПрилагательноеМножественногоЧисла'],
    is: 'Adjective',
    not: ['SingularAdjective'],
  },
  SingularAdjective: {
    aliases: [null, 'ПрилагательноеЕдинственногоЧисла'],
    is: 'Adjective',
    not: ['PluralAdjective'],
  },
  Comparable: {
  },
  Comparative: {
    aliases: [null, 'СравнительнаяСтепень'],
  },
  Superlative: {
    aliases: [null, 'ПревосходнаяСтепень'],
  },
  NumberRange: {
    aliases: [null, 'ЧисловойДиапазон'],
  },
  Adverb: {
    aliases: [null, 'Наречие'],
  },
  Determiner: {
    aliases: [null, 'Определитель'],
  },
  Particle: {
    aliases: [null, 'Частица'],
    is: undefined,
    not: ['Noun', 'Verb', 'Adjective', 'Adverb'],
  },
  Negative: {
    aliases: [null, 'Отрицание'],
    not: ['Noun', 'Adjective', 'Value'],
  },
  Conjunction: {
    aliases: [null, 'Союз'],
    is: undefined,
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'],
  },
  Preposition: {
    aliases: [null, 'Предлог'],
    is: undefined,
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
  },
  QuestionWord: {
    aliases: [null, 'ВопросительноеСлово'],
  },
  Currency: {
    aliases: [null, 'Валюта'],
  },
  Expression: {
    aliases: [null, 'Междометие'],
  },
  Abbreviation: {
    aliases: [null, 'Сокращение'],
  },
  Url: {
    aliases: [null, 'Ссылка'],
    not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
  },
  PhoneNumber: {
    aliases: [null, 'Телефон'],
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
  },
  HashTag: {
    aliases: [null, 'Хэштег'],
  },
  AtMention: {
    aliases: [null, 'Упоминание'],
    not: ['HashTag', 'Email'],
  },
  Emoji: {
    aliases: [null, 'Эмодзи'],
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Emoticon: {
    aliases: [null, 'Смайлик'],
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Email: {
    aliases: [null, 'Почта'],
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Acronym: {
    aliases: [null, 'Акроним'],
    not: ['Plural', 'RomanNumeral'],
  },
  Condition: {
    aliases: [null, 'Условие'],
    is: undefined,
  },
}
