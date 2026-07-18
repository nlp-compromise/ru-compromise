export default {
  Verb: {
    not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
  },
  PresentTense: {
    is: 'Verb',
    not: ['PastTense', 'FutureTense'],
  },
  // russian infinitives (читать) are their own form - not a present-tense
  Infinitive: {
    is: 'Verb',
    not: ['Gerund'],
  },
  // деепричастие (читая, прочитав)
  Gerund: {
    is: 'Verb',
    not: ['Copula'],
  },
  PastTense: {
    is: 'Verb',
    not: ['PresentTense', 'Gerund', 'FutureTense'],
  },
  FutureTense: {
    is: 'Verb',
    not: ['PresentTense', 'Gerund', 'PastTense'],
  },
  Copula: {
    is: 'Verb',
  },
  Modal: {
    is: 'Verb',
    not: ['Infinitive'],
  },
  PerfectTense: {
    is: 'Verb',
    not: ['Gerund'],
  },
  // причастие (читающий, прочитанный) - declines like an adjective
  Participle: {
    is: 'Adjective',
  },
  Auxiliary: {
    is: 'Verb',
    not: ['PastTense', 'PresentTense', 'Gerund', 'Conjunction'],
  },
  // 'я бы хотел'
  Conditional: {
    is: 'Verb',
    not: ['Infinitive', 'Imperative'],
  },
  // verbs ending in -ся/-сь
  Reflexive: {
    is: 'Verb',
  },
  // moods
  Imperative: {
    is: 'Verb',
    not: ['PresentTense', 'PastTense', 'FutureTense'],
  },

  //
  FirstPerson: {
    is: 'Verb',
    not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  SecondPerson: {
    is: 'Verb',
    not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  ThirdPerson: {
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  FirstPersonPlural: {
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  SecondPersonPlural: {
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural']
  },
  ThirdPersonPlural: {
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural']
  },
}
