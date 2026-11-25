// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Date: {
    aliases: [null, 'Дата'],
  },
  Month: {
    aliases: [null, 'Месяц'],
    is: 'Singular',
    also: ['Date'],
    not: ['Year', 'WeekDay', 'Time'],
  },
  WeekDay: {
    aliases: [null, 'ДеньНедели'],
    is: 'Noun',
    also: ['Date'],
    not: undefined,
  },
  Year: {
    aliases: [null, 'Год'],
    not: ['RomanNumeral'],
  },
  FinancialQuarter: {
    aliases: [null, 'Квартал'],
    not: 'Fraction',
  },
  Holiday: {
    aliases: [null, 'Праздник'],
  },
  Season: {
    aliases: [null, 'ВремяГода'],
    not: undefined,
  },
  Timezone: {
    aliases: [null, 'ЧасовойПояс'],
    is: 'Noun',
    also: ['Date'],
  },
  Time: {
    aliases: [null, 'Время'],
    not: ['AtMention'],
  },
  Duration: {
    aliases: [null, 'Длительность'],
    is: 'Noun',
    also: ['Date'],
  },
}
