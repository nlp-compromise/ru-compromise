import test from 'tape'
import nlp from '../_lib.js'
const here = '[ru-adjectives-hmm] '

// oblique-case adjectives go back to the masculine nominative
test('toMasculine from an oblique case:', function (t) {
  t.equal(nlp('красивую').adjectives().toMasculine().text(), 'красивый', here + 'красивую → красивый')
  t.end()
})
