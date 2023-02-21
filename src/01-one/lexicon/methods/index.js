import { toPresent, all as allVerb } from './verbs/conjugate.js'
import { fromPresent } from './verbs/to-root.js'

export default {
  verb: {
    toPresent,
    fromPresent,
    all: allVerb,
  },
  // noun: {
  //   toPlural,
  //   toSingular,
  //   toMasculine,
  //   all: allNoun
  // },
  // adjective,
}
