import { convert } from 'suffix-thumb'
import model from '../models.js'
let { presentTense, pastTense, imperative, gerund } = model
const perfective = model.perfective || {}
const aspectPairs = model.aspectPairs || {}

// perfective → imperfective, built lazily
let pairsRev = null
const getPairsRev = function () {
  if (pairsRev === null) {
    pairsRev = {}
    Object.keys(aspectPairs).forEach(k => {
      pairsRev[aspectPairs[k]] = k
    })
  }
  return pairsRev
}

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

const isPerfective = (str) => perfective[str] === true

const toGerund = function (str) {
  let out = convert(str, gerund.gerund)
  if (!out) {
    return null
  }
  // the model guesses for verbs it never saw - reject implausible shapes.
  // perfective gerunds end in -в/-вшись (сделав), imperfective in -я/-ясь/-учи (читая)
  if (isPerfective(str)) {
    return /(в|вшись)$/.test(out) ? out : null
  }
  return /(я|ясь|учи)$/.test(out) ? out : null
}

// perfective verbs conjugate straight to future; imperfectives use буду + infinitive
const toFuture = function (str) {
  if (isPerfective(str)) {
    return toPresent(str)
  }
  return {
    first: 'буду ' + str,
    second: 'будешь ' + str,
    third: 'будет ' + str,
    firstPlural: 'будем ' + str,
    secondPlural: 'будете ' + str,
    thirdPlural: 'будут ' + str,
  }
}

// the other side of the aspect-pair, if we know it
const getAspectPair = function (str) {
  if (isPerfective(str)) {
    return getPairsRev()[str] || null
  }
  return aspectPairs[str] || null
}

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
  toFuture,
  toImperative,
  toGerund,
  isPerfective,
  getAspectPair,
}

// console.log(toPresent('сидеть'))
// console.log(toPast('сидеть'))
