// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Verb: {
    aliases: [null, 'Глагол'],
  },
  PresentTense: {
    aliases: [null, 'НастоящееВремя'],
  },
  Infinitive: {
    aliases: [null, 'Инфинитив'],
    is: 'Verb',
  },
  Gerund: {
    aliases: [null, 'Деепричастие'],
    is: 'Verb',
  },
  PastTense: {
    aliases: [null, 'ПрошедшееВремя'],
  },
  FutureTense: {
    aliases: [null, 'БудущееВремя'],
    not: ['PresentTense', 'Gerund', 'PastTense'],
  },
  Copula: {
    aliases: [null, 'Связка'],
  },
  Modal: {
    aliases: [null, 'Модальный'],
  },
  PerfectTense: {
    is: 'Verb',
    not: ['Gerund'],
  },
  Participle: {
    aliases: [null, 'Причастие'],
    is: 'Adjective',
  },
  Auxiliary: {
    aliases: [null, 'Вспомогательный'],
  },
  Conditional: {
    aliases: [null, 'СослагательноеНаклонение'],
    is: 'Verb',
    not: ['Infinitive', 'Imperative'],
  },
  Reflexive: {
    aliases: [null, 'Возвратный'],
    is: 'Verb',
  },
  Imperative: {
    aliases: [null, 'ПовелительноеНаклонение'],
    not: ['PresentTense', 'PastTense', 'FutureTense'],
  },
  FirstPerson: {
    aliases: [null, 'ПервоеЛицо'],
    is: 'Verb',
    not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
  },
  SecondPerson: {
    aliases: [null, 'ВтороеЛицо'],
    is: 'Verb',
    not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
  },
  ThirdPerson: {
    aliases: [null, 'ТретьеЛицо'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
  },
  FirstPersonPlural: {
    aliases: [null, 'ПервоеЛицоМножественное'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural'],
  },
  SecondPersonPlural: {
    aliases: [null, 'ВтороеЛицоМножественное'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural'],
  },
  ThirdPersonPlural: {
    aliases: [null, 'ТретьеЛицоМножественное'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural'],
  },
}
