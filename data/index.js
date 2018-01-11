//this is our russian-language data in the same form as a compromise-plugin
// to apply changes, run `npm run pack` and then `npm run watch`
module.exports = {

  //the russian tagset
  tags: {
    Существительные: {}, //Noun
    Прилагательные: {}, //Adjective
    Наречие: {}, //Adverb
    Местоимения: {}, //Pronoun
    Числительные: {}, //Number
    Глаголы: {}, //Verb
    конъюнкция: {}, //Conjunction
    Предлоги: {}, //Preposition
    мужской: { //masculine
      isA: 'Существительные'
    },
    женский: { //Feminine
      isA: 'Существительные'
    },
    человек: { //Person
      isA: 'Существительные'
    }
  },

  //our given lexicon of known russian words
  words: {
    'и': 'конъюнкция', //'Conjunction', //and
    'он': 'Местоимения', //'Pronoun', //he
    'она': 'Местоимения', //'Pronoun', //she
    'сказать': 'Глаголы', //'Verb', //speak
    'мочь': 'Глаголы', //'Verb', //can
    'знать': 'Глаголы', //'Verb', //know
    'дело': 'Существительные', //'Noun', //business
    'голова': 'Существительные', //'Noun' //brain
  },

  //regular-expressions on particular terms
  regex: {
    ".тель$": 'мужской', //male-word
    ".тельница$": 'женский', //female-word
  },

  //run arbitrary code during tagging..
  preProcess: function(ts) {
    // console.log('running preProcess')
    ts.terms.forEach((t, i) => {
      //if it's titlecase, make it a noun
      if (i > 0 && /[А-ЯЁ][а-яё]/.test(t.text) && Object.keys(t.tags).length === 0) {
        t.tag('Существительные', 'title-case')
      }
    })
    return ts
  },
  //and afterwards...
  postProcess: function(ts) {
    // console.log('running postProcess')
    return ts
  },

  //word-sequence matches to tag...
  patterns: {
    'dr #Существительные': 'человек', //Person
    'sir #Существительные': 'человек', //Person
  }

// other plugin stuff (not implimented yet)
// conjugations: {},
// plurals: {},
};
