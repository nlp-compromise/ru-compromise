export default {
  Value: {
    aliases: [null, 'Число'],
    not: ['Verb', 'Adjective', 'Adverb'],
  },
  Ordinal: {
    aliases: [null, 'Порядковое'],
    is: 'Value',
    not: ['Cardinal'],
  },
  Cardinal: {
    aliases: [null, 'Количественное'],
    is: 'Value',
    not: ['Ordinal'],
  },
  Fraction: {
    aliases: [null, 'Дробь'],
    is: 'Value',
    not: ['Noun'],
  },
  Multiple: {
    aliases: [null, 'Кратное'],
    is: 'Value',
  },
  RomanNumeral: {
    aliases: [null, 'РимскоеЧисло'],
    is: 'Cardinal',
    not: ['TextValue'],
  },
  TextValue: {
    aliases: [null, 'Числительное'],
    is: 'Value',
    not: ['NumericValue'],
  },
  NumericValue: {
    aliases: [null, 'Числовое'],
    is: 'Value',
    not: ['TextValue'],
  },
  Money: {
    aliases: [null, 'Деньги'],
    is: 'Cardinal',
  },
  Percent: {
    aliases: [null, 'Процент'],
    is: 'Value',
  },
}
