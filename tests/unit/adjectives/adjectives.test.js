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

// 'самый' takes the gender, number and case of its adjective
test('superlative agreement:', function (t) {
  const list = [
    ['красивая девушка', 'самая красивая девушка'],
    ['красивая книга', 'самая красивая книга'],
    ['красивое окно', 'самое красивое окно'],
    ['новое окно', 'самое новое окно'],
    ['красивые дома', 'самые красивые дома'],
    ['старые дома', 'самые старые дома'],
    ['синяя птица', 'самая синяя птица'],
    // oblique cases
    ['красивую книгу', 'самую красивую книгу'],
    ['в красивом доме', 'в самом красивом доме'],
    ['о новом здании', 'о самом новом здании'],
    ['нового дома', 'самого нового дома'],
    ['старому дому', 'самому старому дому'],
    ['красивых домов', 'самых красивых домов'],
    ['новыми домами', 'самыми новыми домами'],
    // stressed -ой is masculine, or an oblique feminine
    ['большой дом', 'самый большой дом'],
    ['в большой комнате', 'в самой большой комнате'],
    // suppletive forms agree, too
    ['хорошая книга', 'лучшая книга'],
    ['хорошие дни', 'лучшие дни'],
    ['плохое кино', 'худшее кино'],
    ['плохую книгу', 'худшую книгу'],
    ['в хорошем доме', 'в лучшем доме'],
    // already superlative
    ['самая красивая книга', 'самая красивая книга'],
  ]
  list.forEach(a => {
    const [from, want] = a
    const doc = nlp(from)
    doc.adjectives().toSuperlative()
    t.equal(doc.text(), want, here + from + ' → ' + want)
  })
  t.end()
})

// relational adjectives have no synthetic comparative
test('analytic comparative:', function (t) {
  const list = [
    ['русский', 'более русский'],
    ['русская', 'более русская'],
    ['немецкий', 'более немецкий'],
  ]
  list.forEach(a => {
    const [from, want] = a
    const doc = nlp(from)
    doc.adjectives().toComparative()
    t.equal(doc.text(), want, here + from + ' → ' + want)
  })
  t.end()
})

// a sentence-initial capital survives a transformation
test('keeps titlecase:', function (t) {
  let doc = nlp('Новый дом стоит здесь.')
  doc.adjectives().toPlural()
  t.equal(doc.text(), 'Новые дом стоит здесь.', here + 'Новый → Новые')
  doc = nlp('Красивая девушка пришла.')
  doc.adjectives().toSuperlative()
  t.equal(doc.text(), 'Самая красивая девушка пришла.', here + 'Красивая → Самая красивая')
  doc = nlp('Тихий')
  doc.adjectives().toComparative()
  t.equal(doc.text(), 'Тише', here + 'Тихий → Тише')
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
