import test from 'tape'
import nlp from './_lib.js'
let here = '[verbs] '
nlp.verbose(false)

test('conjugation-classes:', function (t) {
  let arr = [
    // [infinitive, present-first, past-masc, imperative-second]
    ['рисовать', 'рисую', 'рисовал', 'рисуй'], // -овать
    ['танцевать', 'танцую', 'танцевал', 'танцуй'], // -евать
    ['давать', 'даю', 'давал', 'давай'], // -авать
    ['спать', 'сплю', 'спал', 'спи'], // л-mutation
    ['брать', 'беру', 'брал', 'бери'], // vowel-insertion
    ['пить', 'пью', 'пил', 'пей'], // -ить monosyllabic
    ['взять', 'возьму', 'взял', 'возьми'],
    ['начать', 'начну', 'начал', 'начни'],
    ['умереть', 'умру', 'умер', 'умри'],
    ['исчезнуть', 'исчезну', 'исчез', 'исчезни'], // ну-drop past
    ['купить', 'куплю', 'купил', 'купи'],
  ]
  arr.forEach(function (a) {
    let [inf, first, masc, imp] = a
    let obj = nlp(inf).verbs().conjugate()[0]
    t.equal(obj.presentTense.first, first, here + inf + ' → ' + first)
    t.equal(obj.pastTense.masc, masc, here + inf + ' → ' + masc)
    t.equal(obj.imperative.second, imp, here + inf + ' → ' + imp)
  })
  t.end()
})

test('aspect:', function (t) {
  t.equal(nlp('купить').verbs().conjugate()[0].aspect, 'perfective', here + 'купить is perfective')
  t.equal(nlp('вернуться').verbs().conjugate()[0].aspect, 'perfective', here + 'вернуться is perfective')
  t.equal(nlp('делать').verbs().conjugate()[0].aspect, 'imperfective', here + 'делать is imperfective')
  t.equal(nlp('делать').verbs().conjugate()[0].aspectPair, 'сделать', here + 'делать ↔ сделать')
  t.equal(nlp('покупать').verbs().conjugate()[0].aspectPair, 'купить', here + 'покупать ↔ купить')
  t.equal(nlp('находить').verbs().conjugate()[0].aspectPair, 'найти', here + 'находить ↔ найти')
  t.end()
})

test('gerunds:', function (t) {
  t.equal(nlp('делать').verbs().conjugate()[0].gerund, 'делая', here + 'делая')
  t.equal(nlp('сделать').verbs().conjugate()[0].gerund, 'сделав', here + 'сделав')
  t.equal(nlp('быть').verbs().conjugate()[0].gerund, 'будучи', here + 'будучи')
  // no gerund-data for this verb - better null than a made-up word
  t.equal(nlp('начать').verbs().conjugate()[0].gerund, null, here + 'начать has no fabricated gerund')
  t.end()
})

test('verb-roots:', function (t) {
  let arr = [
    ['куплю', 'купить'],
    ['вернёмся', 'вернуться'],
    ['шли', 'идти'], // suppletive past
    ['ела', 'есть'],
    ['дам', 'дать'],
  ]
  arr.forEach(function (a) {
    let [form, want] = a
    let root = nlp(form).compute('root').json()[0].terms[0].root
    t.equal(root, want, here + form + ' → ' + want)
  })
  t.end()
})

test('to-infinitive:', function (t) {
  let arr = [
    ['я читаю книгу', 'я читать книгу'],
    ['она прочитала книгу', 'она прочитать книгу'],
    ['мы будем работать', 'мы работать'], // compound-future collapses
  ]
  arr.forEach(function (a) {
    let [from, want] = a
    let doc = nlp(from)
    doc.verbs().toInfinitive()
    t.equal(doc.text(), want, here + from + ' → ' + want)
  })
  t.end()
})

test('copula-transforms:', function (t) {
  let d1 = nlp('завтра будет дождь')
  d1.verbs().toPastTense()
  t.equal(d1.text(), 'завтра был дождь', here + 'будет → был')
  let d2 = nlp('он был дома')
  d2.verbs().toFutureTense()
  t.equal(d2.text(), 'он будет дома', here + 'был → будет')
  let d3 = nlp('она была здесь')
  d3.verbs().toFutureTense()
  t.equal(d3.text(), 'она будет здесь', here + 'была → будет')
  t.end()
})

test('е-spelling-roots:', function (t) {
  let arr = [
    ['вернется', 'вернуться'],
    ['шел', 'идти'], // suppletive, е-spelled
    ['поймет', 'понять'],
    ['узнаем', 'узнать'],
    ['будем', 'быть'], // copula
  ]
  arr.forEach(function (a) {
    let [form, want] = a
    let root = nlp(form).compute('root').json()[0].terms[0].root
    t.equal(root, want, here + form + ' → ' + want)
  })
  t.end()
})

test('tense-transform-extras:', function (t) {
  let arr = [
    // [transform, from, to]
    ['future', 'ты читал книгу', 'ты будешь читать книгу'],
    ['future', 'они говорили', 'они будут говорить'],
    ['future', 'он не пришёл', 'он не придёт'], // perfective, negated
    ['future', 'она вернулась', 'она вернётся'], // perfective reflexive
    ['present', 'мы купили хлеб', 'мы покупаем хлеб'], // via aspect-pair
    ['past', 'вы работаете', 'вы работали'],
  ]
  const fns = {
    future: (d) => d.verbs().toFutureTense(),
    present: (d) => d.verbs().toPresentTense(),
    past: (d) => d.verbs().toPastTense(),
  }
  arr.forEach(function (a) {
    let [which, from, want] = a
    let doc = nlp(from)
    fns[which](doc)
    t.equal(doc.text(), want, here + from + ' → ' + want)
  })
  t.end()
})
