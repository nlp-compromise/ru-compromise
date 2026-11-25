import test from 'tape'
import nlp from '../../_lib.js'
const here = '[ru-european-numbers] '

// digits are read by the europeanNumbers plugin, from compromise/shared
test('decimal-comma numbers', function (t) {
  const arr = [
    ['3,50', 3.5],
    ['1.000', 1000],
    ['1 234,56', 1234.56],
    ['1 000', 1000],
    ['1.234.567', 1234567],
    ['1.234,5', 1234.5],
    ['1,234', 1.234],
    ['3.5', 3.5],
    ['-5', -5],
    ['−5', -5],
    ['3,5%', 3.5],
    ['5,30€', 5.3],
    ['5-й', 5],
    ['1990-х', 1990],
    ['1/2', 0.5],
  ]
  arr.forEach(a => {
    t.deepEqual(nlp(a[0]).numbers().get(), [a[1]], here + a[0])
  })
  t.deepEqual(nlp('Стоит 1.000.').numbers().get(), [1000], here + 'sentence-final period')
  t.deepEqual(nlp('Цена: 3,50, потом 4,20.').numbers().get(), [3.5, 4.2], here + 'trailing commas')
  // a version-number is not a number
  t.deepEqual(nlp('1.2.3').numbers().get(), [], here + '1.2.3')
  t.end()
})

test('decimal-comma output', function (t) {
  const arr = [
    // [text, add, result]
    ['3,50', 1, '4,5'],
    ['1 234,5', 1, '1 235,5'],
    ['1.234.567', 1, '1.234.568'],
    ['1,234,567', 1, '1,234,568'],
    ['1.000', 1, '1.001'],
    ['5,30€', 1, '6,3€'],
    ['−5', 1, '-4'],
    ['5-й', 1, '6-й'],
  ]
  arr.forEach(a => {
    const doc = nlp(a[0])
    doc.numbers().add(a[1])
    t.equal(doc.text(), a[2], here + `${a[0]} + ${a[1]}`)
  })
  t.ok(nlp('1.234.567').has('#Cardinal'), here + 'period-grouped is a number')
  t.ok(nlp('5-й').has('#Ordinal'), here + 'ordinals are left alone')
  t.end()
})
