import contractions from './contractions.js'


export default {
  mutate: (world) => {
    world.model.one.unicode = {}//allow all characters

    world.model.one.contractions = contractions

    // 'que' -> 'quebec'
    delete world.model.one.lexicon.que
  }
}