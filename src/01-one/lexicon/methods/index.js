import { toPresent, toPast, toImperative, all as allVerb } from './verbs/conjugate.js'
import { fromPresent, fromPast, fromImperative } from './verbs/to-root.js'

export default {
  verb: {
    toPresent,
    toPast,
    toImperative,
    fromPresent,
    fromPast,
    fromImperative,
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
