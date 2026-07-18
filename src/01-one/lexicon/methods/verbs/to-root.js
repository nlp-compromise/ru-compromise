import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'
let { presentTense, pastTense, imperative } = model

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

// try each form's reverse-model, verify by conjugating the result back
const tryAll = function (str, revModel, fwdModel) {
  let keys = Object.keys(revModel)
  let guess = null
  for (let i = 0; i < keys.length; i += 1) {
    let k = keys[i]
    let inf = convert(str, revModel[k])
    if (inf && inf !== str) {
      // does it round-trip?
      if (convert(inf, fwdModel[k]) === str) {
        return inf
      }
      guess = guess || inf
    }
  }
  return guess || str
}

const fromPresent = function (str, form) {
  if (form && presentRev[form]) {
    return convert(str, presentRev[form]) || str
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
