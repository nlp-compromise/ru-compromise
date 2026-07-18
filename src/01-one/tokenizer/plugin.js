import contractions from './contractions.js'

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

    // 'que' -> 'quebec'
    delete world.model.one.lexicon.que
  }
}