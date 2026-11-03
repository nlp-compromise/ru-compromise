const entity = ['Person', 'Place', 'Organization']

export default {
  Noun: {
    aliases: [null, 'Существительное'],
    not: ['Verb', 'Adjective', 'Adverb', 'Value', 'Determiner'],
  },
  Singular: {
    aliases: [null, 'ЕдинственноеЧисло'],
    is: 'Noun',
    not: ['Plural'],
  },
  ProperNoun: {
    aliases: [null, 'ИмяСобственное'],
    is: 'Noun',
  },
  Person: {
    aliases: [null, 'Персона'],
    is: 'Singular',
    also: ['ProperNoun'],
    not: ['Place', 'Organization', 'Date'],
  },
  FirstName: {
    aliases: [null, 'Имя'],
    is: 'Person',
  },
  MaleName: {
    aliases: [null, 'МужскоеИмя'],
    is: 'FirstName',
    not: ['FemaleName', 'LastName'],
  },
  FemaleName: {
    aliases: [null, 'ЖенскоеИмя'],
    is: 'FirstName',
    not: ['MaleName', 'LastName'],
  },
  LastName: {
    aliases: [null, 'Фамилия'],
    is: 'Person',
    not: ['FirstName'],
  },
  Honorific: {
    aliases: [null, 'Титул'],
    is: 'Noun',
    not: ['FirstName', 'LastName', 'Value'],
  },
  Place: {
    aliases: [null, 'Место'],
    is: 'Singular',
    not: ['Person', 'Organization'],
  },
  Country: {
    aliases: [null, 'Страна'],
    is: 'Place',
    also: ['ProperNoun'],
    not: ['City'],
  },
  City: {
    aliases: [null, 'Город'],
    is: 'Place',
    also: ['ProperNoun'],
    not: ['Country'],
  },
  Region: {
    aliases: [null, 'Регион'],
    is: 'Place',
    also: ['ProperNoun'],
  },
  Address: {
    aliases: [null, 'Адрес'],
    // is: 'Place',
  },
  Organization: {
    aliases: [null, 'Организация'],
    is: 'ProperNoun',
    not: ['Person', 'Place'],
  },
  SportsTeam: {
    aliases: [null, 'Команда'],
    is: 'Organization',
  },
  School: {
    aliases: [null, 'Школа'],
    is: 'Organization',
  },
  Company: {
    aliases: [null, 'Компания'],
    is: 'Organization',
  },
  Plural: {
    aliases: [null, 'МножественноеЧисло'],
    is: 'Noun',
    not: ['Singular'],
  },
  Uncountable: {
    aliases: [null, 'Неисчисляемое'],
    is: 'Noun',
  },
  Pronoun: {
    aliases: [null, 'Местоимение'],
    is: 'Noun',
    not: entity,
  },
  Actor: {
    is: 'Noun',
    not: entity,
  },
  Activity: {
    aliases: [null, 'Деятельность'],
    is: 'Noun',
    not: ['Person', 'Place'],
  },
  Unit: {
    aliases: [null, 'Единица'],
    is: 'Noun',
    not: entity,
  },
  Demonym: {
    is: 'Noun',
    also: ['ProperNoun'],
    not: entity,
  },
  Possessive: {
    aliases: [null, 'Притяжательное'],
    is: 'Noun',
  },

  FemaleNoun: {
    aliases: [null, 'ЖенскийРод'],
    is: 'Noun',
    not: ['MaleNoun', 'NeuterNoun']
  },
  MaleNoun: {
    aliases: [null, 'МужскойРод'],
    is: 'Noun',
    not: ['FemaleNoun', 'NeuterNoun']
  },
  NeuterNoun: {
    aliases: [null, 'СреднийРод'],
    is: 'Noun',
    not: ['MaleNoun', 'FemaleNoun']
  },
  // grammatically-animate (people + animals) - accusative takes genitive form
  AnimateNoun: {
    aliases: [null, 'Одушевлённое', 'Одушевленное'],
    is: 'Noun',
  },

}
