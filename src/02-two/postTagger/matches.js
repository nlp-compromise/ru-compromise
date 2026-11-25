const num = ['Cardinal', 'TextValue']

export default [
  // 'семью' is usually 'the family' - but it is 'seven', beside a number, or a plural instrumental
  { match: '#Value [семью]', group: 0, tag: num, reason: 'двадцатью-семью' },
  { match: '[семью] #Value', group: 0, tag: num, reason: 'семью-тысячами' },
  { match: '[семью] /[а-яё](ами|ями|ьми)$/', group: 0, tag: num, reason: 'семью-книгами' },

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

  // prepositional adjectives have no safe suffix-rule ('домом', 'столом') - 'в красивом доме'
  {
    match: '(в|во|на|о|об|обо|при) [/^[а-яё]{3,}(ом|ем)$/] /[а-яё](е|ии)$/',
    group: 0,
    notIf: '(#Pronoun|#Determiner|#Verb|#Value|#Adverb)',
    tag: 'Adjective',
    reason: 'в-красивом-доме',
  },
]
