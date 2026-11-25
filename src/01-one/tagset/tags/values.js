// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Value: {
    aliases: [null, 'Число'],
  },
  Ordinal: {
    aliases: [null, 'Порядковое'],
  },
  Cardinal: {
    aliases: [null, 'Количественное'],
  },
  Fraction: {
    aliases: [null, 'Дробь'],
  },
  Multiple: {
    aliases: [null, 'Кратное'],
    is: 'Value',
  },
  RomanNumeral: {
    aliases: [null, 'РимскоеЧисло'],
    not: ['TextValue'],
  },
  TextValue: {
    aliases: [null, 'Числительное'],
    not: ['NumericValue'],
  },
  NumericValue: {
    aliases: [null, 'Числовое'],
    not: ['TextValue'],
  },
  Money: {
    aliases: [null, 'Деньги'],
  },
  Percent: {
    aliases: [null, 'Процент'],
  },
}
