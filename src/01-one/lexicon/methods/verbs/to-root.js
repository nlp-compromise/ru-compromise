import { convert, reverse } from 'suffix-thumb'
import { unpack } from 'efrt'
import model from '../models.js'
import lexData from '../../_data.js'
let { presentTense, pastTense, imperative } = model

// known dictionary-infinitives, for ranking reverse-guesses
const knownInf = lexData.Infinitive ? unpack(lexData.Infinitive) : {}

// =-=-
const revAll = function (m) {
  return Object.keys(m).reduce((h, k) => {
    h[k] = reverse(m[k])
    return h
  }, {})
}

let presentRev = revAll(presentTense)
let pastRev = revAll(pastTense)
let imperativeRev = revAll(imperative)

// russian text often writes 'е' for 'ё' (вернется ~ вернётся).
// the models are trained on 'ё' spellings - try restoring it, too
const eVariants = function (str) {
  let out = [str]
  for (let i = 0; i < str.length; i += 1) {
    if (str[i] === 'е') {
      out.push(str.slice(0, i) + 'ё' + str.slice(i + 1))
    }
  }
  return out
}

// try each spelling-variant + form, verify by conjugating the result back.
// a verified guess that is a known dictionary-infinitive wins
// (шел: fabricated 'шеть' round-trips, but 'шёл' → 'идти' is in the dictionary)
const tryAll = function (str, revModel, fwdModel, forms) {
  let keys = forms || Object.keys(revModel)
  let verified = null
  let guess = null
  let variants = eVariants(str)
  for (let v = 0; v < variants.length; v += 1) {
    for (let i = 0; i < keys.length; i += 1) {
      let k = keys[i]
      let inf = convert(variants[v], revModel[k])
      if (inf && inf !== variants[v]) {
        // does it round-trip?
        if (convert(inf, fwdModel[k]) === variants[v]) {
          if (knownInf[inf] !== undefined) {
            return inf
          }
          verified = verified || inf
        } else {
          guess = guess || inf
        }
      }
    }
  }
  return verified || guess || str
}

const fromPresent = function (str, form) {
  if (form && presentRev[form]) {
    return tryAll(str, presentRev, presentTense, [form])
  }
  return tryAll(str, presentRev, presentTense)
}
const fromPast = (str) => tryAll(str, pastRev, pastTense)
const fromImperative = (str) => tryAll(str, imperativeRev, imperative)

export {
  fromPresent,
  fromPast,
  fromImperative,
}

// console.log(fromPresent('сидишь', 'second') === 'сидеть')
// console.log(fromPast('сидела') === 'сидеть')
