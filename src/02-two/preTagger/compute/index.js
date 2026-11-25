// 1st pass
import checkRegex from './1st-pass/regex.js'
import titleCase from './1st-pass/titlecase.js'
import checkYear from './1st-pass/year.js'
// 2nd pass
import acronym from './2nd-pass/acronym.js'
import adjectiveLookup from './2nd-pass/adjective-lookup.js'
import fallback from './2nd-pass/fallback.js'
import suffixCheck from './2nd-pass/suffix-lookup.js'
// 3rd pass
import adjectiveContext from './3rd-pass/adjective-context.js'
// import guessNounGender from './3rd-pass/noun-gender.js'
// import guessPlural from './3rd-pass/noun-plural.js'
// import adjPlural from './3rd-pass/adj-plural.js'
// import adjGender from './3rd-pass/adj-gender.js'
// import verbForm from './3rd-pass/verb-form.js'


// these methods don't care about word-neighbours
const firstPass = function (terms, world) {
  for (let i = 0; i < terms.length; i += 1) {
    //  is it titlecased?
    titleCase(terms, i, world) ||
      // try look-like rules
      checkRegex(terms, i, world)
    // turn '1993' into a year
    checkYear(terms, i, world)
  }
}
// returns the words that nothing was known about
const secondPass = function (terms, world) {
  const unknown = []
  for (let i = 0; i < terms.length; i += 1) {
    const found = acronym(terms, i, world) || adjectiveLookup(terms, i, world) || suffixCheck(terms, i, world)
    // neighbours(terms, i, world) ||
    if (!found && fallback(terms, i, world)) {
      unknown.push(i)
    }
  }
  return unknown
}

// these methods look at word-neighbours, for our unknown words.
// right-to-left, so that the word after is already decided - 'с картой звёздной системы'
const thirdPass = function (terms, unknown, world) {
  for (let n = unknown.length - 1; n >= 0; n -= 1) {
    adjectiveContext(terms, unknown[n], world)
  }
}

// const thirdPass = function (terms, world) {
//   for (let i = 0; i < terms.length; i += 1) {
//     guessNounGender(terms, i, world)
//     guessPlural(terms, i, world)
//     adjPlural(terms, i, world)
//     adjGender(terms, i, world)
//     verbForm(terms, i, world)
//   }
// }


const tagger = function (view) {
  const world = view.world
  view.docs.forEach(terms => {
    firstPass(terms, world)
    const unknown = secondPass(terms, world)
    thirdPass(terms, unknown, world)
  })
  return view
}
export default tagger