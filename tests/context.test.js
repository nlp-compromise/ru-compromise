import test from 'tape'
import nlp from './_lib.js'
let here = '[context] '
nlp.verbose(false)

test('context-rules:', function (t) {
  // бы + past-tense → conditional mood
  t.equal(nlp('я бы хотел кофе').match('#Conditional').text(), 'хотел', here + 'бы-conditional')
  // honorific + titlecased name → person
  t.equal(nlp('господин Иванов пришёл').match('#Person+').text(), 'господин Иванов', here + 'господин Иванов')
  t.equal(nlp('мистер Смит пришёл').match('#Person+').text(), 'мистер Смит', here + 'мистер Смит')
  // first-name + surname
  t.equal(nlp('Иван Петров работает').match('#Person+').text(), 'Иван Петров', here + 'Иван Петров')
  t.end()
})

test('entities:', function (t) {
  let doc = nlp('Россия и Германия')
  t.equal(doc.match('#Place').length, 2, here + 'Россия + Германия are places')
  t.equal(nlp('мы поедем в США').match('#Place').text(), 'США', here + 'США is a place')
  t.equal(nlp('мы жили в Москве и Париже').match('#ProperNoun').length, 2, here + 'cities are proper-nouns')
  t.end()
})

test('oblique-pronouns:', function (t) {
  let arr = [
    ['у него есть дом', '#Preposition #Pronoun #Copula #Noun'],
    ['она говорила с ней обо мне', '#Pronoun #PastTense #Preposition #Pronoun #Preposition #Pronoun'],
    ['мы видели их вчера', '#Pronoun #PastTense #Pronoun #Adverb'],
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str)
    t.equal(doc.match(match).text(), doc.text(), here + str)
  })
  t.end()
})

test('word-classes:', function (t) {
  t.deepEqual(nlp('мой дом и твоя книга').match('#Possessive').out('array'), ['мой', 'твоя'], here + 'possessives')
  t.deepEqual(nlp('этот дом и каждый человек').match('#Determiner').out('array'), ['этот', 'каждый'], here + 'determiners')
  t.equal(nlp('спасибо и пока').match('#Expression').text(), 'спасибо', here + 'спасибо')
  t.equal(nlp('пять тысяч рублей').match('#Currency').text(), 'рублей', here + 'currency')
  t.equal(nlp('около двух часов').match('#Cardinal').text(), 'двух', here + 'oblique cardinal')
  t.equal(nlp('мы встретимся в январе').match('#Month').text(), 'январе', here + 'prepositional month')
  t.end()
})

test('participles-gerunds:', function (t) {
  // participles decline like adjectives
  t.equal(nlp('читающий человек').match('#Adjective').text(), 'читающий', here + 'present participle')
  t.equal(nlp('прочитанная книга').match('#Adjective').text(), 'прочитанная', here + 'passive participle')
  // perfective gerund
  t.equal(nlp('сделав работу он ушёл').match('#Gerund').text(), 'сделав', here + 'сделав')
  t.end()
})

test('е-spelling:', function (t) {
  // 'вернется' = 'вернётся' - tags + root survive the е-spelling
  let doc = nlp('он вернется завтра')
  t.equal(doc.has('#Pronoun #FutureTense #Adverb'), true, here + 'вернется is future')
  t.equal(doc.compute('root').json()[0].terms[1].root, 'вернуться', here + 'вернется → вернуться')
  t.end()
})
