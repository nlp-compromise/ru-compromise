import test from 'tape'
import nlp from '../../_lib.js'
const here = '[ru-adjectives] '
nlp.verbose(false)

// [masculine, feminine, neuter, plural, comparative]
const arr = [
  // hard stems
  ['красивый', 'красивая', 'красивое', 'красивые', 'красивее'],
  ['старый', 'старая', 'старое', 'старые', 'старше'],
  ['добрый', 'добрая', 'доброе', 'добрые', 'добрее'],
  ['умный', 'умная', 'умное', 'умные', 'умнее'],
  ['сильный', 'сильная', 'сильное', 'сильные', 'сильнее'],
  ['быстрый', 'быстрая', 'быстрое', 'быстрые', 'быстрее'],
  ['белый', 'белая', 'белое', 'белые', 'белее'],
  // stressed endings
  ['молодой', 'молодая', 'молодое', 'молодые', 'моложе'],
  ['дорогой', 'дорогая', 'дорогое', 'дорогие', 'дороже'],
  ['плохой', 'плохая', 'плохое', 'плохие', 'хуже'],
  // velar + husher stems
  ['тихий', 'тихая', 'тихое', 'тихие', 'тише'],
  ['высокий', 'высокая', 'высокое', 'высокие', 'выше'],
  ['лёгкий', 'лёгкая', 'лёгкое', 'лёгкие', 'легче'],
  ['свежий', 'свежая', 'свежее', 'свежие', 'свежее'],
]

test('adjective gender + number:', function (t) {
  arr.forEach(a => {
    const [masc, fem, neut, plural] = a
    t.equal(nlp(masc).adjectives().toFeminine().text(), fem, here + masc + ' → ' + fem)
    t.equal(nlp(masc).adjectives().toNeuter().text(), neut, here + masc + ' → ' + neut)
    t.equal(nlp(masc).adjectives().toPlural().text(), plural, here + masc + ' → ' + plural)
    // and back again
    t.equal(nlp(fem).adjectives().toMasculine().text(), masc, here + fem + ' → ' + masc)
    t.equal(nlp(neut).adjectives().toMasculine().text(), masc, here + neut + ' → ' + masc)
    t.equal(nlp(plural).adjectives().toMasculine().text(), masc, here + plural + ' → ' + masc)
    // already there
    t.equal(nlp(masc).adjectives().toMasculine().text(), masc, here + masc + ' stays')
    t.equal(nlp(fem).adjectives().toFeminine().text(), fem, here + fem + ' stays')
  })
  t.end()
})

test('adjective comparative:', function (t) {
  arr.forEach(a => {
    const [masc, , , , comp] = a
    t.equal(nlp(masc).adjectives().toComparative().text(), comp, here + masc + ' → ' + comp)
  })
  t.end()
})

test('adjective superlative:', function (t) {
  const list = [
    ['красивый', 'самый красивый'],
    ['новый', 'самый новый'],
    ['большой', 'самый большой'],
    ['молодой', 'самый молодой'],
    ['лёгкий', 'самый лёгкий'],
    ['хороший', 'лучший'],
    ['плохой', 'худший'],
  ]
  list.forEach(a => {
    const [from, want] = a
    const doc = nlp(from)
    doc.adjectives().toSuperlative()
    t.equal(doc.text(), want, here + from + ' → ' + want)
  })
  t.end()
})

test('adjectives in a sentence:', function (t) {
  // only the adjectives change
  let doc = nlp('красивый старый дом')
  t.deepEqual(doc.adjectives().out('array'), ['красивый', 'старый'], here + 'finds both')
  doc.adjectives().toPlural()
  t.equal(doc.text(), 'красивые старые дом', here + 'both to plural')

  doc = nlp('красивый старый дом')
  doc.adjectives(0).toNeuter()
  t.equal(doc.text(), 'красивое старый дом', here + 'adjectives(n)')

  doc = nlp('дом большой')
  doc.adjectives().toComparative()
  t.equal(doc.text(), 'дом больше', here + 'predicate comparative')

  doc = nlp('это красивый дом')
  doc.adjectives().toSuperlative()
  t.equal(doc.text(), 'это самый красивый дом', here + 'superlative in a sentence')

  // punctuation is kept
  doc = nlp('новый дом, старый сад.')
  doc.adjectives().toPlural()
  t.equal(doc.text(), 'новые дом, старые сад.', here + 'keeps punctuation')

  // nothing found
  doc = nlp('дом стоит')
  t.equal(doc.adjectives().found, false, here + 'no adjectives')
  doc.adjectives().toFeminine()
  doc.adjectives().toComparative()
  t.equal(doc.text(), 'дом стоит', here + 'no change without adjectives')
  t.end()
})
