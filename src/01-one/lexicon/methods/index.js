import { toPresent, toPast, toFuture, toImperative, toGerund, isPerfective, getAspectPair, all as allVerb } from './verbs/conjugate.js'
import { fromPresent, fromPast, fromImperative } from './verbs/to-root.js'
import { toPlural, toSingular, decline, declinePlural, guessGender, guessAnimate } from './nouns/inflect.js'
import { toMasculine, toFeminine, toNeuter, toPlural as toPluralAdj, toComparative, toSuperlative } from './adjectives/agree.js'

export default {
  verb: {
    toPresent,
    toPast,
    toFuture,
    toImperative,
    toGerund,
    isPerfective,
    getAspectPair,
    fromPresent,
    fromPast,
    fromImperative,
    all: allVerb,
  },
  noun: {
    toPlural,
    toSingular,
    decline,
    declinePlural,
    guessGender,
    guessAnimate,
  },
  adjective: {
    toMasculine,
    toFeminine,
    toNeuter,
    toPlural: toPluralAdj,
    toComparative,
    toSuperlative,
  },
}
