import contractions from './contractions.js'

const killUnicode = function (str) {
  // А́ Е́ И́ О́ У́ Ы́ Э́ Ю́ Я́
  // á é и́ ó у́ ы́ э́ я́ ю́
  str = str.replace(/á/gi, 'а')
  str = str.replace(/é/gi, 'е')
  str = str.replace(/и́/gi, 'и')
  str = str.replace(/ó/gi, 'о')
  str = str.replace(/у́/gi, 'у')
  str = str.replace(/ы́/gi, 'ы')
  str = str.replace(/э́/gi, 'э')
  str = str.replace(/ю́/gi, 'ю')
  str = str.replace(/я́/gi, 'я')
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