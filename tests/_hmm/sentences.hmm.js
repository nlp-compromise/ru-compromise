import test from 'tape'
import nlp from '../_lib.js'
const here = '[ru-sentences-hmm] '

// the author's words after direct speech begin with a dash and a lowercase letter
test('direct speech:', function (t) {
  const arr = ['Кто там? — спросил он.', '— Иди сюда! — сказала она.']
  arr.forEach(str => {
    t.deepEqual(nlp(str).fullSentences().out('array'), [str], here + str)
  })
  t.end()
})
