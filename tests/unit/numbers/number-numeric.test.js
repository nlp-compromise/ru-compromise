import test from 'tape'
import nlp from '../../_lib.js'
const here = '[number-numeric] '
nlp.verbose(false)

test('numeric-parse:', function (t) {
  const arr = [
    ['5', 5],
    ['0', 0],
    ['007', 7],
    ['1234', 1234],
    ['-5', -5],
    ['+5', 5],
    ['−5', -5],
    ['(-5)', -5],
    // a comma is the decimal
    ['3,5', 3.5],
    ['0,25', 0.25],
    ['-0,5', -0.5],
    ['3.5', 3.5],
    ['1,234', 1.234],
    // a space groups the thousands
    ['5 000', 5000],
    ['1 234 567', 1234567],
    ['1 234,5', 1234.5],
    ['12 500', 12500],
    ['5 000', 5000],
    // other styles
    ['1.234.567', 1234567],
    ['1,234,567', 1234567],
    ['1.234,5', 1234.5],
    ['1,234.5', 1234.5],
    // affixes
    ['50%', 50],
    ['2,5%', 2.5],
    ['$5', 5],
    ['9km', 9],
    ['№5', 5],
    // multiples
    ['5 тысяч', 5000],
    ['10 тыс', 10000],
    ['10 тыс.', 10000],
    ['3 млн', 3000000],
    ['2,5 млн', 2500000],
    ['1,5 млрд', 1500000000],
    ['3 миллиона', 3000000],
    ['3 млн 200 тыс', 3200000],
    ['-5 тысяч', -5000],
  ]
  arr.forEach(a => {
    const [str, num] = a
    const nums = nlp(str).numbers()
    t.equal(nums.length, 1, here + 'one number: ' + str)
    t.equal(nums.get()[0], num, here + 'parse: ' + str)
  })
  t.end()
})

test('numeric-parse-details:', function (t) {
  let obj = nlp('50%').numbers().parse()[0]
  t.equal(obj.suffix, '%', here + 'suffix')
  t.equal(obj.prefix, '', here + 'no prefix')
  t.equal(obj.isText, false, here + 'not text')

  obj = nlp('$5').numbers().parse()[0]
  t.equal(obj.prefix, '$', here + 'prefix')
  t.equal(obj.isMoney, true, here + 'isMoney')

  obj = nlp('5 000').numbers().parse()[0]
  t.equal(obj.hasComma, true, here + 'grouped')
  t.equal(nlp('5000').numbers().parse()[0].hasComma, false, here + 'not grouped')
  t.equal(nlp('3,5').numbers().parse()[0].hasComma, false, here + 'decimal is not grouped')
  t.equal(nlp('1.234.567').numbers().parse()[0].hasComma, true, here + 'dot-grouped')

  obj = nlp('5-й').numbers().parse()[0]
  t.equal(obj.num, 5, here + 'ordinal num')
  t.equal(obj.isOrdinal, true, here + 'ordinal')
  t.equal(obj.suffix, '', here + 'ordinal has no suffix')

  obj = nlp('пять').numbers().parse()[0]
  t.equal(obj.isText, true, here + 'isText')
  t.equal(obj.isOrdinal, false, here + 'not ordinal')
  t.end()
})

test('numeric-not-one-number:', function (t) {
  // only a 3-digit group continues a number
  t.deepEqual(nlp('5 12').numbers().get(), [5, 12], here + '5 12')
  t.deepEqual(nlp('5 0000').numbers().get(), [5, 0], here + '5 0000')
  t.deepEqual(nlp('2020 100').numbers().get(), [2020, 100], here + '2020 100')
  t.deepEqual(nlp('5, 000').numbers().get(), [5, 0], here + '5, 000')
  t.deepEqual(nlp('5 пять').numbers().get(), [5, 5], here + '5 пять')
  t.deepEqual(nlp('пять 5').numbers().get(), [5, 5], here + 'пять 5')
  t.deepEqual(nlp('5-й 6-й').numbers().get(), [5, 6], here + '5-й 6-й')
  t.end()
})

test('numeric-format-kept:', function (t) {
  const arr = [
    ['5', 1, '6'],
    ['-1', 1, '0'],
    ['-5', -1, '-6'],
    ['5', -10, '-5'],
    ['(-5)', 1, '(-4)'],
    ['(-5)', 10, '(5)'],
    ['(5)', -10, '(-5)'],
    ['3,5', 1, '4,5'],
    ['3.5', 1, '4.5'],
    ['0,1', 0.2, '0,3'],
    ['5 000', 1, '5 001'],
    ['999 999', 1, '1 000 000'],
    ['1 000', -1, '999'],
    ['1 234,5', 1, '1 235,5'],
    ['1.234.567', 1, '1.234.568'],
    ['1,234,567', 1, '1,234,568'],
    ['99%', 1, '100%'],
    ['$5', 1, '$6'],
    ['9km', 1, '10km'],
    ['№5', 1, '№6'],
    ['5-й', 1, '6-й'],
    ['5-го', 1, '6-го'],
    ['2-я', 1, '3-я'],
    ['1990-х', 10, '2000-х'],
    ['999', 1, '1000'],
  ]
  arr.forEach(a => {
    const [str, n, want] = a
    const doc = nlp(str)
    doc.numbers().add(n)
    t.equal(doc.text(), want, here + str + ' + ' + n)
    t.equal(doc.numbers().length, 1, here + 'still one number: ' + want)
  })
  // a non-breaking space stays one
  const doc = nlp('5 000 рублей')
  doc.numbers().add(1)
  t.equal(doc.text(), '5 001 рублей', here + 'nbsp')
  t.end()
})

test('numeric-to-text:', function (t) {
  const arr = [
    ['у меня 25 рублей', 'у меня двадцать пять рублей'],
    ['5 000 рублей', 'пять тысяч рублей'],
    ['1 234 567', 'миллион двести тридцать четыре тысячи пятьсот шестьдесят семь'],
    ['было -5 градусов', 'было минус пять градусов'],
    ['было (-5) градусов', 'было (минус пять) градусов'],
    ['5 тысяч рублей', 'пять тысяч рублей'],
    ['5 тыс. рублей', 'пять тысяч рублей'],
    ['3 млн человек', 'три миллиона человек'],
    ['21 млн', 'двадцать один миллион'],
    ['5 книг, 7 ручек и 100 столов', 'пять книг, семь ручек и сто столов'],
    ['5 книг. 6 ручек.', 'пять книг. шесть ручек.'],
    // percentages are counted
    ['1%', 'один процент'],
    ['2%', 'два процента'],
    ['5%', 'пять процентов'],
    ['11%', 'одиннадцать процентов'],
    ['21%', 'двадцать один процент'],
    ['100%', 'сто процентов'],
    // there are no words for these
    ['3,5 метра', '3,5 метра'],
    ['$5', '$5'],
    ['9km', '9km'],
  ]
  arr.forEach(a => {
    const doc = nlp(a[0])
    doc.numbers().toText()
    t.equal(doc.text(), a[1], here + 'toText: ' + a[0])
  })
  t.end()
})

test('numeric-to-number:', function (t) {
  const arr = [
    ['у меня двадцать пять рублей', 'у меня 25 рублей'],
    ['пять тысяч рублей', '5000 рублей'],
    ['5 тысяч рублей', '5000 рублей'],
    ['2,5 млн человек', '2500000 человек'],
    ['три миллиона двести тысяч', '3200000'],
    ['полтора часа', '1,5 часа'],
    ['полторы тысячи', '1500'],
    ['Пять книг, семь ручек и сто столов', '5 книг, 7 ручек и 100 столов'],
    ['ноль', '0'],
    ['двое детей', '2 детей'],
    // already digits
    ['у меня 25 рублей', 'у меня 25 рублей'],
  ]
  arr.forEach(a => {
    const doc = nlp(a[0])
    doc.numbers().toNumber()
    t.equal(doc.text(), a[1], here + 'toNumber: ' + a[0])
  })
  // only returns the numbers that changed
  const doc = nlp('пять книг и 7 ручек')
  const res = doc.numbers().toNumber()
  t.equal(res.length, 1, here + 'returns changed numbers')
  t.equal(res.text(), '5', here + 'returns the new number')
  t.equal(res.viewType, 'Numbers', here + 'returns Numbers')
  t.end()
})

test('numeric-gender-agreement:', function (t) {
  // digits don't have a gender, but their noun does
  const arr = [
    ['1 книга', 'одна книга'],
    ['1 стол', 'один стол'],
    ['1 окно', 'одно окно'],
    ['1 дверь', 'одна дверь'],
    ['21 книга', 'двадцать одна книга'],
    ['1001 ночь', 'тысяча одна ночь'],
    ['вижу 1 книгу', 'вижу одну книгу'],
    ['2 книги', 'две книги'],
    ['2 стола', 'два стола'],
    ['2 окна', 'два окна'],
    ['2 дня', 'два дня'],
    ['22 недели', 'двадцать две недели'],
    ['11 книг', 'одиннадцать книг'],
    ['12 книг', 'двенадцать книг'],
    ['5 книг', 'пять книг'],
    // punctuation in the way
    ['2, книги', 'два, книги'],
  ]
  arr.forEach(a => {
    const doc = nlp(a[0])
    doc.numbers().toText()
    t.equal(doc.text(), a[1], here + a[0])
  })
  t.end()
})
