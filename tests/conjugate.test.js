import test from 'tape'
import nlp from './_lib.js'
let here = '[conjugate] '
nlp.verbose(false)

test('conjugate:', function (t) {
  let arr = [
    // [infinitive, present-first, past-fem, imperative-second]
    ['говорить', 'говорю', 'говорила', 'говори'],
    ['читать', 'читаю', 'читала', 'читай'],
    ['писать', 'пишу', 'писала', 'пиши'],
    ['написать', 'напишу', 'написала', 'напиши'],
    ['жить', 'живу', 'жила', 'живи'],
    ['вернуться', 'вернусь', 'вернулась', 'вернись'],
  ]
  arr.forEach(function (a) {
    let [inf, first, fem, imp] = a
    let obj = nlp(inf).verbs().conjugate()[0]
    t.equal(obj.presentTense.first, first, here + inf + ' → ' + first)
    t.equal(obj.pastTense.fem, fem, here + inf + ' → ' + fem)
    t.equal(obj.imperative.second, imp, here + inf + ' → ' + imp)
  })
  t.end()
})

test('conjugate-past-irregulars:', function (t) {
  let arr = [
    ['идти', 'шёл', 'шла'],
    ['пойти', 'пошёл', 'пошла'],
    ['выйти', 'вышел', 'вышла'],
    ['мочь', 'мог', 'могла'],
    ['помочь', 'помог', 'помогла'],
  ]
  arr.forEach(function (a) {
    let [inf, masc, fem] = a
    let obj = nlp(inf).verbs().conjugate()[0]
    t.equal(obj.pastTense.masc, masc, here + inf + ' → ' + masc)
    t.equal(obj.pastTense.fem, fem, here + inf + ' → ' + fem)
  })
  t.end()
})
