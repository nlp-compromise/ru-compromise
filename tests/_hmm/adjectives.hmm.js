import test from 'tape'
import nlp from '../_lib.js'
const here = '[ru-adjectives-hmm] '

// the superlative should keep the gender of the adjective
test('superlative agreement:', function (t) {
  const arr = [
    ['красивая девушка', 'самая красивая девушка'],
    ['красивая книга', 'самая красивая книга'],
    ['новое окно', 'самое новое окно'],
    ['старые дома', 'самые старые дома'],
  ]
  arr.forEach(a => {
    const [from, want] = a
    const doc = nlp(from)
    doc.adjectives().toSuperlative()
    t.equal(doc.text(), want, here + from + ' → ' + want)
  })
  t.end()
})

// relational adjectives have no comparative
test('no comparative:', function (t) {
  const doc = nlp('русский')
  doc.adjectives().toComparative()
  t.equal(doc.text(), 'русский', here + 'русский has no comparative')
  t.end()
})

// oblique-case adjectives go back to the masculine nominative
test('toMasculine from an oblique case:', function (t) {
  t.equal(nlp('красивую').adjectives().toMasculine().text(), 'красивый', here + 'красивую → красивый')
  t.end()
})

// a sentence-initial capital should survive a transformation
test('keeps titlecase:', function (t) {
  const doc = nlp('Новый дом стоит здесь.')
  doc.adjectives().toPlural()
  t.equal(doc.text(), 'Новые дом стоит здесь.', here + 'Новый → Новые')
  t.end()
})
