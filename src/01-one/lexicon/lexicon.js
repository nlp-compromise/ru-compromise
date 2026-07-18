import lexData from './_data.js'
import { unpack } from 'efrt'
import methods from './methods/index.js'
import model from './methods/models.js'
import misc from './misc.js'

const { toPresent, toPast, toImperative, toGerund } = methods.verb
const perfective = model.perfective || {}
let lexicon = {}

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
    let w = obj[k]
    if (w && !lex[w]) {
      let tags = [tag]
      if (extraMap && extraMap[k]) {
        tags.push(extraMap[k])
      }
      lex[w] = tags
    }
  })
}

Object.keys(lexData).forEach(tag => {
  let wordsObj = unpack(lexData[tag])
  Object.keys(wordsObj).forEach(w => {
    lexicon[w] = tag
    // add conjugations for our verbs
    if (tag === 'Infinitive') {
      // perfective verbs' non-past conjugation is semantically future - 'скажу' = 'i will say'
      let tense = perfective[w] === true ? 'FutureTense' : 'PresentTense'
      addWords(toPresent(w), tense, lexicon, personMap)
      addWords(toPast(w), 'PastTense', lexicon)
      addWords(toImperative(w), 'Imperative', lexicon)
      // читая, прочитав - else the 'ая' adjective-rule would catch them
      addWords({ gerund: toGerund(w) }, 'Gerund', lexicon)
    }
  })
})

// hand-curated entries win over generated ones
Object.keys(misc).forEach(w => {
  lexicon[w] = misc[w]
})

// russian text often spells 'ё' as 'е' - add spelling-variants (идёшь → идешь)
Object.keys(lexicon).forEach(w => {
  if (w.includes('ё')) {
    let plain = w.replace(/ё/g, 'е')
    if (!lexicon[plain]) {
      lexicon[plain] = lexicon[w]
    }
  }
})

// console.log(lexicon['бежать'])
export default lexicon
