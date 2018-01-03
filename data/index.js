//this is our default data in the same form as a plugin
// it is compressed, like a plugin, and written into ./src/world
module.exports = {
  words: {
    'и': 'Conjunction', //and
    'он': 'Pronoun', //he
    'она': 'Pronoun', //she
    'сказать': 'Verb', //speak
    'мочь': 'Verb', //can
    'знать': 'Verb', //know
    'дело': 'Noun', //business
    'голова': 'Noun' //brain
  },
  // conjugations: require('./conjugations'),
  // plurals: require('./plurals'),
  // patterns: require('./patterns'),
  regex: {
    ".тель$": 'MasculineNoun',
    ".тельница$": 'FeminineNoun',
  },
  tags: {
    Noun: {},
    Verb: {},
    Pronoun: {},
    MasculineNoun: {
      isA: 'Noun'
    },
    FeminineNoun: {
      isA: 'Noun'
    },
  }
};
