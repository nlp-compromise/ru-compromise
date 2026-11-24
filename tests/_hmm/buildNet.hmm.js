import test from 'tape'
import nlp from '../_lib.js'
const here = '[ru-buildNet-hmm] '

// a {root/Noun} or {root/Adjective} match should find the inflected forms too
test('buildNet noun + adjective roots:', function (t) {
  const net = nlp.buildNet([{ match: '{салат/Noun}' }, { match: '{красивый/Adjective}' }])
  t.ok(net.hooks.салаты, here + 'салаты')
  t.ok(net.hooks.салата, here + 'салата')
  t.ok(net.hooks.красивая, here + 'красивая')
  t.ok(net.hooks.красивые, here + 'красивые')
  t.equal(nlp('два салата пожалуйста').sweep(net).view.text(), 'салата', here + 'sweep салата')
  t.equal(nlp('красивая книга').sweep(net).view.text(), 'красивая', here + 'sweep красивая')
  t.end()
})

test('root match:', function (t) {
  t.equal(nlp('два салата').match('{салат}').text(), 'салата', here + '{салат}')
  t.equal(nlp('красивая книга').match('{красивый}').text(), 'красивая', here + '{красивый}')
  t.end()
})
