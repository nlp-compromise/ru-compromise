export default {
  Verb: {
    aliases: [null, 'Глагол'],
    not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
  },
  PresentTense: {
    aliases: [null, 'НастоящееВремя'],
    is: 'Verb',
    not: ['PastTense', 'FutureTense'],
  },
  // russian infinitives (читать) are their own form - not a present-tense
  Infinitive: {
    aliases: [null, 'Инфинитив'],
    is: 'Verb',
    not: ['Gerund'],
  },
  // деепричастие (читая, прочитав)
  Gerund: {
    aliases: [null, 'Деепричастие'],
    is: 'Verb',
    not: ['Copula'],
  },
  PastTense: {
    aliases: [null, 'ПрошедшееВремя'],
    is: 'Verb',
    not: ['PresentTense', 'Gerund', 'FutureTense'],
  },
  FutureTense: {
    aliases: [null, 'БудущееВремя'],
    is: 'Verb',
    not: ['PresentTense', 'Gerund', 'PastTense'],
  },
  Copula: {
    aliases: [null, 'Связка'],
    is: 'Verb',
  },
  Modal: {
    aliases: [null, 'Модальный'],
    is: 'Verb',
    not: ['Infinitive'],
  },
  PerfectTense: {
    is: 'Verb',
    not: ['Gerund'],
  },
  // причастие (читающий, прочитанный) - declines like an adjective
  Participle: {
    aliases: [null, 'Причастие'],
    is: 'Adjective',
  },
  Auxiliary: {
    aliases: [null, 'Вспомогательный'],
    is: 'Verb',
    not: ['PastTense', 'PresentTense', 'Gerund', 'Conjunction'],
  },
  // 'я бы хотел'
  Conditional: {
    aliases: [null, 'СослагательноеНаклонение'],
    is: 'Verb',
    not: ['Infinitive', 'Imperative'],
  },
  // verbs ending in -ся/-сь
  Reflexive: {
    aliases: [null, 'Возвратный'],
    is: 'Verb',
  },
  // moods
  Imperative: {
    aliases: [null, 'ПовелительноеНаклонение'],
    is: 'Verb',
    not: ['PresentTense', 'PastTense', 'FutureTense'],
  },

  //
  FirstPerson: {
    aliases: [null, 'ПервоеЛицо'],
    is: 'Verb',
    not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  SecondPerson: {
    aliases: [null, 'ВтороеЛицо'],
    is: 'Verb',
    not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  ThirdPerson: {
    aliases: [null, 'ТретьеЛицо'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  FirstPersonPlural: {
    aliases: [null, 'ПервоеЛицоМножественное'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  SecondPersonPlural: {
    aliases: [null, 'ВтороеЛицоМножественное'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural']
  },
  ThirdPersonPlural: {
    aliases: [null, 'ТретьеЛицоМножественное'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural']
  },
}
