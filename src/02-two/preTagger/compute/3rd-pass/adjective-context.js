// some adjective-endings are shared with nouns, so they have no suffix-rule -
//   '-ой'/'-ей' - 'красивой', but 'книгой', 'друзей', 'герой', 'музей'
//   '-ом'/'-ем' - 'красивом', but 'домом', 'столом', 'паром'
// the adjectives that we know are in the lexicon, in every form.
// an unknown word is an adjective only when the words beside it say so.

// prepositions that take the prepositional case
const prepositional = ['в', 'во', 'на', 'о', 'об', 'обо', 'при']
// ..or the dative - but never the genitive ('друзей')
const noGenitive = prepositional.concat(['к', 'ко', 'по'])
// ..and all that never take the instrumental - an '-ой' word after one is no 'книгой'
const noInstr = noGenitive.concat([
  'у', 'от', 'ото', 'до', 'из', 'изо', 'из-за', 'из-под', 'без', 'безо', 'для', 'около',
  'после', 'возле', 'вокруг', 'кроме', 'против', 'среди', 'вместо',
])

// endings of a feminine noun, in the cases where its adjective takes '-ой'/'-ей'
// (the genitive-plural is '-ей' too - 'друзей', 'ночей', 'дней' - so only the safe ones)
const femInstr = /(ой|ёй|ью|ою|[иьцеаоу]ей)$/
const femOblique = /[ыие]$/
const prepCase = /(е|ии)$/

// stems that are (almost) always an adjective - 'советской', 'греческой', 'деревянной', 'звёздной'
const adjStem = /([^аеёиоуыэюя]ской|ческой|цкой|нной|[бвгджзклмпрстфхцчшщь]ной)$/
const nounStem = /^(сосн|волн|десн|казн|блесн|копн|бездн|княжн)ой$/
// soft participles and superlatives - 'работающей', 'бывшей', 'ближайшей', 'искренней', 'вчерашней'
const softAdj = /([а-яё]{3}[аяую]щей|[а-яё]{2}[вд]шей|[ае]йшей|нней|[яр]ашней|ешней)$/

const hasPunct = /[,;:.!?()«»"—–]/

const isNoun = function (term) {
  return term.tags.has('Noun') && !term.tags.has('Pronoun')
}

// is this unknown word an adjective, for the noun after it?
const isAdjective = function (str, before, noun) {
  const next = noun.normal
  const proper = noun.tags.has('ProperNoun')
  if (str.endsWith('ой')) {
    // 'с деревянной ложкой' - but not 'с подругой Мариной'
    if (femInstr.test(next) && !proper) {
      return true
    }
    if (femOblique.test(next)) {
      // 'у деревянной двери', 'в деревянной лодке'
      // 'советской власти' - but not 'с книгой подруги'
      return noInstr.includes(before) || (adjStem.test(str) && !nounStem.test(str))
    }
    return false
  }
  if (str.endsWith('ей')) {
    // 'бывшей жены', 'с ближайшей станцией'
    if (softAdj.test(str)) {
      return femOblique.test(next) || (femInstr.test(next) && !proper)
    }
    // 'в рыжей шубе' - but not 'у друзей семьи'
    return noGenitive.includes(before) && prepCase.test(next)
  }
  // 'в деревянном доме' - but 'с домом', 'над столом'
  if (/^[а-яё]{3,}(ом|ем)$/.test(str)) {
    return prepositional.includes(before) && prepCase.test(next)
  }
  return false
}

// look at the neighbours of a word that had no tag, and fell-back to a noun
const adjectiveContext = function (terms, i, world) {
  const term = terms[i]
  const noun = terms[i + 1]
  if (!noun || !isNoun(noun) || noun.normal.length < 3 || hasPunct.test(term.post)) {
    return null
  }
  let before = ''
  if (terms[i - 1] && terms[i - 1].tags.has('Preposition') && !hasPunct.test(terms[i - 1].post)) {
    before = terms[i - 1].normal
  }
  if (isAdjective(term.normal, before, noun)) {
    world.methods.one.setTag([term], 'Adjective', world, false, '3-adjective-context')
    term.confidence = 0.6
    return true
  }
  return null
}
export default adjectiveContext
