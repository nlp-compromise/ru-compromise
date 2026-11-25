// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Noun: {
    aliases: [null, 'Существительное'],
  },
  Singular: {
    aliases: [null, 'ЕдинственноеЧисло'],
    not: ['Plural'],
  },
  ProperNoun: {
    aliases: [null, 'ИмяСобственное'],
  },
  Person: {
    aliases: [null, 'Персона'],
  },
  FirstName: {
    aliases: [null, 'Имя'],
  },
  MaleName: {
    aliases: [null, 'МужскоеИмя'],
  },
  FemaleName: {
    aliases: [null, 'ЖенскоеИмя'],
  },
  LastName: {
    aliases: [null, 'Фамилия'],
  },
  Honorific: {
    aliases: [null, 'Титул'],
    is: 'Noun',
  },
  Place: {
    aliases: [null, 'Место'],
  },
  Country: {
    aliases: [null, 'Страна'],
  },
  City: {
    aliases: [null, 'Город'],
  },
  Region: {
    aliases: [null, 'Регион'],
  },
  Address: {
    aliases: [null, 'Адрес'],
  },
  Organization: {
    aliases: [null, 'Организация'],
  },
  SportsTeam: {
    aliases: [null, 'Команда'],
  },
  School: {
    aliases: [null, 'Школа'],
  },
  Company: {
    aliases: [null, 'Компания'],
  },
  Plural: {
    aliases: [null, 'МножественноеЧисло'],
    not: ['Singular'],
  },
  Uncountable: {
    aliases: [null, 'Неисчисляемое'],
  },
  Pronoun: {
    aliases: [null, 'Местоимение'],
  },
  Actor: {
    not: ['Person', 'Place', 'Organization'],
  },
  Activity: {
    aliases: [null, 'Деятельность'],
  },
  Unit: {
    aliases: [null, 'Единица'],
  },
  Demonym: {
  },
  Possessive: {
    aliases: [null, 'Притяжательное'],
  },
  FemaleNoun: {
    aliases: [null, 'ЖенскийРод'],
    is: 'Noun',
    not: ['MaleNoun', 'NeuterNoun'],
  },
  MaleNoun: {
    aliases: [null, 'МужскойРод'],
    is: 'Noun',
    not: ['FemaleNoun', 'NeuterNoun'],
  },
  NeuterNoun: {
    aliases: [null, 'СреднийРод'],
    is: 'Noun',
    not: ['MaleNoun', 'FemaleNoun'],
  },
  AnimateNoun: {
    aliases: [null, 'Одушевлённое', 'Одушевленное'],
    is: 'Noun',
  },
}
