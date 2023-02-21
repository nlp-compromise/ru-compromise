import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'
let { presentTense } = model

// =-=-
const revAll = function (m) {
  return Object.keys(m).reduce((h, k) => {
    h[k] = reverse(m[k])
    return h
  }, {})
}

let presentRev = revAll(presentTense)


const fromPresent = (str, form) => convert(str, presentRev[form]) || str

export {
  fromPresent,
}

// console.log(fromPresent('сидишь', 'second') === 'сидеть')