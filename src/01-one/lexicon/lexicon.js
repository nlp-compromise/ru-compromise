import lexData from './_data.js'
import { unpack } from 'efrt'
import methods from './methods/index.js'
import model from './methods/models.js'
import misc from './misc.js'
import { lexicon as numbers } from '../../03-three/numbers/data.js'

const { toPresent, toPast, toImperative, toGerund } = methods.verb
// case-forms of our adjectives that are more often a noun - 'со злом', 'с долгом', 'золотом'
const nounLike = new Set(['добром', 'злом', 'долгом', 'золотом', 'правом', 'теплом'])
const perfective = model.perfective || {}
const lexicon = {}
// our adjectives are kept apart, for the tagger - see below
let adjectives = []

const personMap = {
  first: 'FirstPerson',
  second: 'SecondPerson',
  third: 'ThirdPerson',
  firstPlural: 'FirstPersonPlural',
  secondPlural: 'SecondPersonPlural',
  thirdPlural: 'ThirdPersonPlural',
}
const addWords = function (obj, tag, lex, extraMap) {
  Object.keys(obj).forEach(k => {
    const w = obj[k]
    if (w && !lex[w]) {
      const tags = [tag]
      if (extraMap && extraMap[k]) {
        tags.push(extraMap[k])
      }
      lex[w] = tags
    }
  })
}

Object.keys(lexData).forEach(tag => {
  const wordsObj = unpack(lexData[tag])
  if (tag === 'Adjective') {
    adjectives = Object.keys(wordsObj)
    return
  }
  Object.keys(wordsObj).forEach(w => {
    // animacy stacks with a gender-tag (гусь is MaleNoun + AnimateNoun),
    // in either processing-order
    if (lexicon[w] && (tag === 'AnimateNoun' || [].concat(lexicon[w]).includes('AnimateNoun'))) {
      lexicon[w] = Array.from(new Set([].concat(lexicon[w], tag)))
    } else {
      lexicon[w] = tag
    }
    // add conjugations for our verbs
    if (tag === 'Infinitive') {
      // perfective verbs' non-past conjugation is semantically future - 'скажу' = 'i will say'
      const tense = perfective[w] === true ? 'FutureTense' : 'PresentTense'
      addWords(toPresent(w), tense, lexicon, personMap)
      addWords(toPast(w), 'PastTense', lexicon)
      addWords(toImperative(w), 'Imperative', lexicon)
      // читая, прочитав - else the 'ая' adjective-rule would catch them
      addWords({ gerund: toGerund(w) }, 'Gerund', lexicon)
    }
  })
})

// every form of our number-words - 'пять', 'пяти', 'пятью', 'пятый', 'пятого'..
Object.keys(lexicon).forEach(w => {
  if (lexicon[w] === 'Cardinal' || lexicon[w] === 'Ordinal') {
    lexicon[w] = [lexicon[w], 'TextValue']
  }
})
Object.keys(numbers).forEach(w => {
  lexicon[w] = numbers[w]
})

// hand-curated entries win over generated ones
Object.keys(misc).forEach(w => {
  lexicon[w] = misc[w]
})

// russian text often spells 'ё' as 'е' - add spelling-variants (идёшь → идешь)
Object.keys(lexicon).forEach(w => {
  if (w.includes('ё')) {
    const plain = w.replace(/ё/g, 'е')
    if (!lexicon[plain]) {
      lexicon[plain] = lexicon[w]
    }
  }
})

// every case, gender and number of our adjectives - 'красивой', 'синей', 'новом', 'хорошему'.
// these endings are shared with nouns ('книгой', 'друзей', 'домом'), so there is no suffix-rule for them.
// they are looked-up after the lexicon and the titlecase-rule, so that a name stays a name - 'Максим Горький'
const adjectiveForms = {}
adjectives = adjectives.concat(Object.keys(misc).filter(w => misc[w] === 'Adjective'))
adjectives.forEach(w => {
  methods.adjective.all(w).forEach(form => {
    const plain = form.replace(/ё/g, 'е')
    if (!lexicon[form] && !nounLike.has(plain)) {
      adjectiveForms[form] = true
      if (!lexicon[plain]) {
        adjectiveForms[plain] = true
      }
    }
  })
})

// console.log(lexicon['бежать'])
export { adjectiveForms }
export default lexicon
