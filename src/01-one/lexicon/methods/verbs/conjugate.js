import { convert } from 'suffix-thumb'
import model from '../models.js'
let { presentTense, pastTense, imperative } = model

const doEach = function (str, m, keys) {
  let res = {}
  keys.forEach(k => {
    res[k] = convert(str, m[k])
  })
  return res
}

const toPresent = (str) => doEach(str, presentTense, ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural'])
const toPast = (str) => doEach(str, pastTense, ['masc', 'fem', 'neut', 'plural'])
const toImperative = (str) => doEach(str, imperative, ['second', 'secondPlural'])

// an array of every inflection, for '{inf}' syntax
const all = function (str) {
  let res = [str].concat(
    Object.values(toPresent(str)),
    Object.values(toPast(str)),
    Object.values(toImperative(str)),
  ).filter(s => s)
  res = new Set(res)
  return Array.from(res)
}

export {
  all,
  toPresent,
  toPast,
  toImperative,
}

// console.log(toPresent('сидеть'))
// console.log(toPast('сидеть'))
