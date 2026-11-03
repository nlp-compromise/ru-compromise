export default {
  Date: {
    aliases: [null, 'Дата'],
    not: ['Verb', 'Adverb', 'Adjective'],
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
  },
  Year: {
    aliases: [null, 'Год'],
    is: 'Date',
    not: ['RomanNumeral'],
  },
  FinancialQuarter: {
    aliases: [null, 'Квартал'],
    is: 'Date',
    not: 'Fraction',
  },
  // 'easter'
  Holiday: {
    aliases: [null, 'Праздник'],
    is: 'Date',
    also: ['Noun'],
  },
  // 'summer'
  Season: {
    aliases: [null, 'ВремяГода'],
    is: 'Date',
  },
  Timezone: {
    aliases: [null, 'ЧасовойПояс'],
    is: 'Noun',
    also: ['Date'],
    not: ['ProperNoun'],
  },
  Time: {
    aliases: [null, 'Время'],
    is: 'Date',
    not: ['AtMention'],
  },
  // 'months'
  Duration: {
    aliases: [null, 'Длительность'],
    is: 'Noun',
    also: ['Date'],
  },
}
