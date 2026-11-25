import contractions from './contractions.js'
import build from './sentences.js'
import sentenceRules from './abbreviations.js'

const { isSentence, wrap, abbreviations } = build(sentenceRules)

const killUnicode = function (str) {
  // а́ е́ и́ о́ у́ ы́ э́ ю́ я́ - strip stress-marks (combining acute/grave accents)
  str = str.replace(/[\u0300\u0301]/g, '')
  // map look-alike latin vowels (from bad encodings) to cyrillic
  str = str.replace(/á/gi, 'а')
  str = str.replace(/é/gi, 'е')
  str = str.replace(/ó/gi, 'о')
  return str
}

export default {
  mutate: (world) => {
    world.model.one.unicode = {}
    world.methods.one.killUnicode = killUnicode

    world.model.one.contractions = contractions

    // our own abbreviations, and sentence-boundary rules
    world.model.one.abbreviations = { ...abbreviations }
    world.methods.one.tokenize.isSentence = isSentence
    world.methods.one.tokenize.splitSentences = wrap(world.methods.one.tokenize.splitSentences)

    // 'que' -> 'quebec'
    delete world.model.one.lexicon.que
  }
}