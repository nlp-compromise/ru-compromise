const anything = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord']

export default {
  Adjective: {
    aliases: [null, 'Прилагательное'],
    not: ['Noun', 'Verb', 'Adverb', 'Value'],
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
    is: 'Adjective',
  },
  Comparative: {
    aliases: [null, 'СравнительнаяСтепень'],
    is: 'Adjective',
  },
  Superlative: {
    aliases: [null, 'ПревосходнаяСтепень'],
    is: 'Adjective',
    not: ['Comparative'],
  },
  NumberRange: {
    aliases: [null, 'ЧисловойДиапазон'],
  },
  Adverb: {
    aliases: [null, 'Наречие'],
    not: ['Noun', 'Verb', 'Adjective', 'Value'],
  },

  Determiner: {
    aliases: [null, 'Определитель'],
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Conjunction'], //allow 'a' to be a Determiner/Value
  },
  // же, ли, бы, ведь..
  Particle: {
    aliases: [null, 'Частица'],
    not: ['Noun', 'Verb', 'Adjective', 'Adverb'],
  },
  // не, ни, нет
  Negative: {
    aliases: [null, 'Отрицание'],
    not: ['Noun', 'Adjective', 'Value'],
  },
  Conjunction: {
    aliases: [null, 'Союз'],
    not: anything,
  },
  Preposition: {
    aliases: [null, 'Предлог'],
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
  },
  QuestionWord: {
    aliases: [null, 'ВопросительноеСлово'],
    not: ['Determiner'],
  },
  Currency: {
    aliases: [null, 'Валюта'],
    is: 'Noun',
  },
  Expression: {
    aliases: [null, 'Междометие'],
    not: ['Noun', 'Adjective', 'Verb', 'Adverb'],
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
    is: 'Noun',
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
    not: ['Verb', 'Adjective', 'Noun', 'Value'],
  },
}
