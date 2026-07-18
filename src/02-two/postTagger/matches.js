export default [
  // мистер Кузнецов
  { match: '(мистер|миссис|господин|госпожа|товарищ|доктор|профессор) #ProperNoun', tag: 'Person', reason: 'honorific-name' },

  // имя + фамилия
  { match: '#FirstName #ProperNoun', tag: 'Person', reason: 'first-last' },

  // compound-future: 'буду читать'
  { match: '(буду|будешь|будет|будем|будете|будут) [#Infinitive]', group: 0, tag: 'FutureTense', reason: 'буду-inf' },

  // conditional mood: 'я бы хотел', 'хотел бы'
  { match: '[#PastTense] бы', group: 0, tag: 'Conditional', reason: 'past-бы' },
  { match: 'бы [#PastTense]', group: 0, tag: 'Conditional', reason: 'бы-past' },

  // 'самый + adjective' superlative stays adjective
  { match: '(самый|самая|самое|самые) [#Noun]', group: 0, tag: 'Adjective', reason: 'самый-adj' },
]
