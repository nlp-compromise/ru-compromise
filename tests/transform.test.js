import test from 'tape'
import nlp from './_lib.js'
let here = '[transform] '
nlp.verbose(false)

test('verb-to-past:', function (t) {
  let arr = [
    ['я читаю книгу', 'я читал книгу'],
    ['она читает книгу', 'она читала книгу'],
    ['они читают книги', 'они читали книги'],
    ['мы говорим', 'мы говорили'],
    ['я буду читать', 'я читал'],
  ]
  arr.forEach(function (a) {
    let [from, want] = a
    let doc = nlp(from)
    doc.verbs().toPastTense()
    t.equal(doc.text(), want, here + from + ' → ' + want)
  })
  t.end()
})

test('verb-to-present:', function (t) {
  let arr = [
    ['он сказал правду', 'он говорит правду'],
    ['она говорила', 'она говорит'],
    ['я буду читать', 'я читаю'],
  ]
  arr.forEach(function (a) {
    let [from, want] = a
    let doc = nlp(from)
    doc.verbs().toPresentTense()
    t.equal(doc.text(), want, here + from + ' → ' + want)
  })
  t.end()
})

test('verb-to-future:', function (t) {
  let arr = [
    // imperfective takes буду + infinitive
    ['я читал книгу', 'я буду читать книгу'],
    ['она читает книгу', 'она будет читать книгу'],
    // perfective conjugates straight to future
    ['он прочитал книгу', 'он прочитает книгу'],
    ['она сказала правду', 'она скажет правду'],
  ]
  arr.forEach(function (a) {
    let [from, want] = a
    let doc = nlp(from)
    doc.verbs().toFutureTense()
    t.equal(doc.text(), want, here + from + ' → ' + want)
  })
  t.end()
})

test('noun-decline:', function (t) {
  let arr = [
    // [nominative, genitive, dative, accusative, instrumental, prepositional]
    ['книга', 'книги', 'книге', 'книгу', 'книгой', 'книге'],
    ['стол', 'стола', 'столу', 'стол', 'столом', 'столе'],
    ['ночь', 'ночи', 'ночи', 'ночь', 'ночью', 'ночи'],
    // учитель is animate - accusative takes the genitive form
    ['учитель', 'учителя', 'учителю', 'учителя', 'учителем', 'учителе'],
    ['окно', 'окна', 'окну', 'окно', 'окном', 'окне'],
    ['здание', 'здания', 'зданию', 'здание', 'зданием', 'здании'],
    ['неделя', 'недели', 'неделе', 'неделю', 'неделей', 'неделе'],
    ['линия', 'линии', 'линии', 'линию', 'линией', 'линии'],
    ['день', 'дня', 'дню', 'день', 'днём', 'дне'],
    ['мать', 'матери', 'матери', 'мать', 'матерью', 'матери'],
  ]
  arr.forEach(function (a) {
    let [nom, gen, dat, acc, instr, prep] = a
    let obj = nlp(nom).nouns().decline()[0]
    t.equal(obj.genitive, gen, here + nom + ' gen ' + gen)
    t.equal(obj.dative, dat, here + nom + ' dat ' + dat)
    t.equal(obj.accusative, acc, here + nom + ' acc ' + acc)
    t.equal(obj.instrumental, instr, here + nom + ' instr ' + instr)
    t.equal(obj.prepositional, prep, here + nom + ' prep ' + prep)
  })
  t.end()
})

test('noun-animacy:', function (t) {
  // animate masculine accusative = genitive
  t.equal(nlp('брат').nouns().decline()[0].accusative, 'брата', here + 'вижу брата')
  t.equal(nlp('стол').nouns().decline()[0].accusative, 'стол', here + 'вижу стол')
  t.equal(nlp('котёнок').nouns().decline()[0].accusative, 'котёнка', here + 'вижу котёнка')
  t.equal(nlp('кот и стол').nouns().isAnimate().text(), 'кот', here + 'кот is animate')
  t.end()
})

test('noun-decline-plural:', function (t) {
  let arr = [
    // [nominative, plural: nom, gen, dat, instr, prep]
    ['книга', 'книги', 'книг', 'книгам', 'книгами', 'книгах'],
    ['стол', 'столы', 'столов', 'столам', 'столами', 'столах'],
    ['девушка', 'девушки', 'девушек', 'девушкам', 'девушками', 'девушках'],
    ['здание', 'здания', 'зданий', 'зданиям', 'зданиями', 'зданиях'],
    ['ночь', 'ночи', 'ночей', 'ночам', 'ночами', 'ночах'],
    ['неделя', 'недели', 'недель', 'неделям', 'неделями', 'неделях'],
    ['учитель', 'учителя', 'учителей', 'учителям', 'учителями', 'учителях'],
    ['музей', 'музеи', 'музеев', 'музеям', 'музеями', 'музеях'],
    ['человек', 'люди', 'людей', 'людям', 'людьми', 'людях'],
    ['год', 'годы', 'лет', 'годам', 'годами', 'годах'],
  ]
  arr.forEach(function (a) {
    let [nom, plNom, plGen, plDat, plInstr, plPrep] = a
    let obj = nlp(nom).nouns().decline()[0].plural
    t.equal(obj.nominative, plNom, here + nom + ' pl-nom ' + plNom)
    t.equal(obj.genitive, plGen, here + nom + ' pl-gen ' + plGen)
    t.equal(obj.dative, plDat, here + nom + ' pl-dat ' + plDat)
    t.equal(obj.instrumental, plInstr, here + nom + ' pl-instr ' + plInstr)
    t.equal(obj.prepositional, plPrep, here + nom + ' pl-prep ' + plPrep)
  })
  t.end()
})

test('noun-agreement:', function (t) {
  let arr = [
    // pluralizing a noun re-agrees its modifiers and verb
    [(d) => d.nouns().toPlural(), 'новая книга лежала на столе', 'новые книги лежали на столе'],
    [(d) => d.nouns().toPlural(), 'этот старый дом стоит здесь', 'эти старые дома стоят здесь'],
    [(d) => d.nouns().toPlural(), 'моя собака спит', 'мои собаки спят'],
    [(d) => d.nouns(0).toSingular(), 'новые книги лежали на столе', 'новая книга лежала на столе'],
  ]
  arr.forEach(function (a) {
    let [fn, from, want] = a
    let doc = nlp(from)
    fn(doc)
    t.equal(doc.text(), want, here + from + ' → ' + want)
  })
  t.end()
})

test('noun-gender:', function (t) {
  t.deepEqual(nlp('книга и стол').nouns().gender(), ['feminine', 'masculine'], here + 'книга fem, стол masc')
  t.equal(nlp('стол и кровать').nouns().isFeminine().text(), 'кровать', here + 'кровать is feminine')
  t.equal(nlp('ночь и день').nouns().isMasculine().text(), 'день', here + 'день is masculine')
  t.equal(nlp('кофе').nouns().gender()[0], 'masculine', here + 'кофе is masculine')
  t.equal(nlp('метро').nouns().gender()[0], 'neuter', here + 'метро is neuter')
  t.end()
})

test('adjective-comparative:', function (t) {
  let arr = [
    ['быстрый', 'быстрее'],
    ['красивый', 'красивее'],
    ['хороший', 'лучше'],
    ['плохой', 'хуже'],
    ['громкий', 'громче'],
    ['тихий', 'тише'],
    ['строгий', 'строже'],
    ['большой', 'больше'],
  ]
  arr.forEach(function (a) {
    let [adj, want] = a
    let doc = nlp(adj)
    doc.adjectives().toComparative()
    t.equal(doc.text(), want, here + adj + ' → ' + want)
  })
  t.end()
})

test('adjective-superlative:', function (t) {
  let arr = [
    ['старый дом', 'самый старый дом'],
    ['хороший день', 'лучший день'],
    ['красивая девушка', 'самый красивый девушка'],
  ]
  arr.forEach(function (a) {
    let [from, want] = a
    let doc = nlp(from)
    doc.adjectives().toSuperlative()
    t.equal(doc.text(), want, here + from + ' → ' + want)
  })
  t.end()
})
