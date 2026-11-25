import test from 'tape'
import nlp from '../_lib.js'
const here = '[ru-adjectives-hmm] '

// '-ой'/'-ей' are noun-endings too ('книгой', 'друзей') - an adjective that is not in the
// lexicon is only found when the words beside it are a clear sign
test('unknown oblique adjectives, without a clear context:', function (t) {
  // no context at all
  t.equal(nlp('пушистой').has('#Adjective'), true, here + 'пушистой')
  // genitive, with no preposition - the same shape as 'рукой мамы'
  t.equal(nlp('пушистой кошки').has('#Adjective'), true, here + 'пушистой кошки')
  // dative, with no preposition - the same shape as 'друзей'
  t.equal(nlp('похожей кошке').has('#Adjective'), true, here + 'похожей кошке')
  // two unknown adjectives in a row - only the last is found
  t.equal(nlp('с пушистой полосатой кошкой').match('#Adjective').length, 2, here + 'пушистой полосатой')
  t.end()
})
