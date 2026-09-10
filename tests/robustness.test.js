import test from 'tape'
import nlp from './_lib.js'
let here = '[robustness] '
nlp.verbose(false)

test('odd-inputs-dont-crash:', function (t) {
  let inputs = [
    '',
    '...',
    '123',
    'hello world', // latin text
    'а', // single letter
    'ё',
    'по-', // dangling hyphen-prefix
    '-то',
    'а б в г д',
    'Привет!!! Как дела??',
    'тест\nтест',
    '😀 привет',
  ]
  inputs.forEach(str => {
    let doc = nlp(str)
    doc.verbs().conjugate()
    doc.verbs().toPastTense()
    doc.verbs().toFutureTense()
    doc.nouns().decline()
    doc.nouns().gender()
    doc.nouns().toPlural()
    doc.adjectives().toComparative()
    doc.compute('root')
    t.ok(doc.json(), here + JSON.stringify(str))
  })
  t.end()
})

test('case-insensitive:', function (t) {
  t.equal(nlp('НЕ ЗАБУДЬ').match('#Imperative').text(), 'ЗАБУДЬ', here + 'uppercase imperative')
  t.equal(nlp('ОНА ЧИТАЛА').has('#Pronoun #PastTense'), true, here + 'uppercase past')
  t.end()
})

test('multi-sentence:', function (t) {
  let doc = nlp('Я читаю книгу. Она спит. Мы гуляем в парке.')
  t.equal(doc.match('#PresentTense').length, 3, here + 'three present-tense verbs')
  doc.verbs().toPastTense()
  t.equal(doc.text(), 'Я читал книгу. Она спала. Мы гуляли в парке.', here + 'all three sentences to past')
  t.end()
})
