import test from 'tape'
import nlp from './_lib.js'
let here = '[decline] '
nlp.verbose(false)

test('decline-classes:', function (t) {
  let arr = [
    // [word, genitive, prepositional]
    ['сценарий', 'сценария', 'сценарии'], // -ий takes prepositional -ии
    ['дача', 'дачи', 'даче'],
    ['сон', 'сна', 'сне'], // fleeting vowel
    ['время', 'времени', 'времени'], // -мя irregular
  ]
  arr.forEach(function (a) {
    let [word, gen, prep] = a
    let obj = nlp(word).nouns().decline()[0]
    t.equal(obj.genitive, gen, here + word + ' gen ' + gen)
    t.equal(obj.prepositional, prep, here + word + ' prep ' + prep)
  })
  // husher instrumental - дача → дачей
  t.equal(nlp('дача').nouns().decline()[0].instrumental, 'дачей', here + 'дачей')
  // fleeting-vowel animate - отец → отца (both genitive + accusative)
  let отец = nlp('отец').nouns().decline()[0]
  t.equal(отец.genitive, 'отца', here + 'отца')
  t.equal(отец.accusative, 'отца', here + 'вижу отца')
  t.end()
})

test('decline-indeclinable:', function (t) {
  let кофе = nlp('кофе').nouns().decline()[0]
  t.equal(кофе.genitive, 'кофе', here + 'кофе never declines')
  t.equal(кофе.plural.nominative, 'кофе', here + 'кофе has no plural')
  let метро = nlp('метро').nouns().decline()[0]
  t.equal(метро.genitive, 'метро', here + 'метро never declines')
  t.end()
})

test('decline-plural-extras:', function (t) {
  let arr = [
    // [word, plural-nominative, plural-genitive]
    ['статья', 'статьи', 'статей'],
    ['отец', 'отцы', 'отцов'],
    ['сестра', 'сестры', 'сестёр'],
    ['письмо', 'письма', 'писем'],
    ['друг', 'друзья', 'друзей'],
    ['время', 'времена', 'времён'],
    ['дача', 'дачи', 'дач'],
  ]
  arr.forEach(function (a) {
    let [word, plNom, plGen] = a
    let obj = nlp(word).nouns().decline()[0].plural
    t.equal(obj.nominative, plNom, here + word + ' → ' + plNom)
    t.equal(obj.genitive, plGen, here + word + ' → ' + plGen)
  })
  // animate plural accusative = genitive, for all genders
  t.equal(nlp('собака').nouns().decline()[0].plural.accusative, 'собак', here + 'вижу собак')
  t.equal(nlp('друг').nouns().decline()[0].plural.accusative, 'друзей', here + 'вижу друзей')
  // soft-stem plural instrumental
  t.equal(nlp('друг').nouns().decline()[0].plural.instrumental, 'друзьями', here + 'друзьями')
  t.end()
})

test('comparative-extras:', function (t) {
  let arr = [
    ['молодой', 'моложе'],
    ['близкий', 'ближе'],
    ['дешёвый', 'дешевле'],
    ['умный', 'умнее'],
    ['слабый', 'слабее'],
  ]
  arr.forEach(function (a) {
    let [adj, want] = a
    let doc = nlp(adj)
    doc.adjectives().toComparative()
    t.equal(doc.text(), want, here + adj + ' → ' + want)
  })
  let doc = nlp('плохой фильм')
  doc.adjectives().toSuperlative()
  t.equal(doc.text(), 'худший фильм', here + 'плохой → худший')
  t.end()
})

test('agreement-extras:', function (t) {
  // determiner + adjective chains re-agree together
  let doc = nlp('эта новая книга лежит на столе')
  doc.nouns().toPlural()
  t.equal(doc.text(), 'эти новые книги лежат на столе', here + 'determiner chain')
  // negation between noun and verb
  let doc2 = nlp('книга не лежала')
  doc2.nouns().toPlural()
  t.equal(doc2.text(), 'книги не лежали', here + 'negated verb agrees')
  t.end()
})
