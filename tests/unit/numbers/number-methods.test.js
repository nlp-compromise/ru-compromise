import test from 'tape'
import nlp from '../../_lib.js'
const here = '[number-methods] '
nlp.verbose(false)

test('numbers-get:', function (t) {
  let nums = nlp('три собаки, пять кошек и девять уток').numbers().get()
  t.deepEqual(nums, [3, 5, 9], here + 'get multiple text-numbers')

  nums = nlp('страница 99').numbers().get()
  t.deepEqual(nums, [99], here + 'get numeric')

  nums = nlp('три собаки, 5 кошек и девятая утка').numbers().get()
  t.deepEqual(nums, [3, 5, 9], here + 'get mixed')

  t.deepEqual(nlp('три собаки и пять кошек').numbers().get(1), [5], here + 'get(n)')
  t.deepEqual(nlp('три собаки и пять кошек').numbers(1).get(), [5], here + 'numbers(n)')
  t.deepEqual(nlp('три собаки и пять кошек').values().get(), [3, 5], here + 'values alias')
  t.equal(nlp('три собаки').numbers().viewType, 'Numbers', here + 'viewType')
  t.end()
})

test('numbers-parse:', function (t) {
  const obj = nlp('двадцать два').numbers().parse()[0]
  t.equal(obj.num, 22, here + 'parse num')
  t.equal(obj.isText, true, here + 'parse isText')
  t.equal(obj.isOrdinal, false, here + 'parse isOrdinal')
  t.equal(obj.prefix, '', here + 'parse prefix')
  t.equal(obj.suffix, '', here + 'parse suffix')
  t.equal(obj.hasComma, false, here + 'parse hasComma')
  t.equal(obj.case, 'nominative', here + 'parse case')
  t.equal(obj.gender, 'masculine', here + 'parse gender')

  const json = nlp('двадцать два').numbers().json()[0]
  t.equal(json.number.num, 22, here + 'json num')
  t.equal(json.text, 'двадцать два', here + 'json text')
  t.equal(json.terms.length, 2, here + 'json terms')
  t.end()
})

test('numbers-set:', function (t) {
  let doc = nlp('у меня пять кошек')
  doc.numbers().set(3)
  t.equal(doc.text(), 'у меня три кошек', here + 'set text-number')

  doc = nlp('страница 99')
  doc.numbers().set(12)
  t.equal(doc.text(), 'страница 12', here + 'set numeric')

  doc = nlp('пятый этаж')
  doc.numbers().set(21)
  t.equal(doc.text(), 'двадцать первый этаж', here + 'set ordinal')

  doc = nlp('5-й этаж')
  doc.numbers().set(21)
  t.equal(doc.text(), '21-й этаж', here + 'set numeric ordinal')

  doc = nlp('сто')
  doc.numbers().set(1234567)
  t.equal(doc.text(), 'миллион двести тридцать четыре тысячи пятьсот шестьдесят семь', here + 'set big')

  doc = nlp('сто двадцать пять рублей')
  doc.numbers().set(0)
  t.equal(doc.text(), 'ноль рублей', here + 'set zero')

  doc = nlp('пять')
  doc.numbers().set(-5)
  t.equal(doc.text(), 'минус пять', here + 'set negative')

  doc = nlp('три собаки и пять кошек')
  doc.numbers().set(7)
  t.equal(doc.text(), 'семь собаки и семь кошек', here + 'set all')

  doc = nlp('три собаки и пять кошек')
  doc.numbers(1).set(7)
  t.equal(doc.text(), 'три собаки и семь кошек', here + 'set nth')

  // no words for a decimal
  doc = nlp('пять метров')
  doc.numbers().set(2.5)
  t.equal(doc.text(), '2,5 метров', here + 'set decimal on text')

  doc = nlp('пять')
  const res = doc.numbers().set()
  t.equal(doc.text(), 'пять', here + 'set nothing')
  t.equal(res.viewType, 'Numbers', here + 'set nothing returns numbers')
  t.end()
})

test('numbers-set-string:', function (t) {
  let doc = nlp('у меня 4 рубля')
  doc.numbers().set('двенадцать')
  t.equal(doc.text(), 'у меня 12 рубля', here + 'set text-string')

  doc = nlp('у меня четыре рубля')
  doc.numbers().set('12')
  t.equal(doc.text(), 'у меня двенадцать рубля', here + 'set digit-string')

  doc = nlp('у меня четыре рубля')
  doc.numbers().set('две тысячи двадцать шесть')
  t.equal(doc.text(), 'у меня две тысячи двадцать шесть рубля', here + 'set long text-string')

  doc = nlp('4')
  doc.numbers().set('1 234,5')
  t.equal(doc.text(), '1234,5', here + 'set formatted digit-string')

  doc = nlp('4')
  doc.numbers().set('минус пять')
  t.equal(doc.text(), '-5', here + 'set negative text-string')

  doc = nlp('у меня 4 рубля')
  let res = doc.numbers().set('кот')
  t.equal(doc.text(), 'у меня 4 рубля', here + 'set non-number is a no-op')
  t.equal(res.viewType, 'Numbers', here + 'set non-number returns numbers')

  res = doc.numbers().set('пять котов')
  t.equal(doc.text(), 'у меня 4 рубля', here + 'set number-and-word is a no-op')
  res = doc.numbers().set('пять шесть')
  t.equal(doc.text(), 'у меня 4 рубля', here + 'set two numbers is a no-op')
  doc.numbers().set(NaN)
  t.equal(doc.text(), 'у меня 4 рубля', here + 'set NaN is a no-op')
  doc.numbers().set(null)
  t.equal(doc.text(), 'у меня 4 рубля', here + 'set null is a no-op')
  doc.numbers().set('')
  t.equal(doc.text(), 'у меня 4 рубля', here + 'set empty is a no-op')
  t.end()
})

test('numbers-arithmetic:', function (t) {
  let doc = nlp('я купил два яблока')
  doc.numbers().add(2)
  t.equal(doc.text(), 'я купил четыре яблока', here + 'add text-number')

  doc = nlp('десять рублей')
  doc.numbers().subtract(3)
  t.equal(doc.text(), 'семь рублей', here + 'subtract text-number')

  doc = nlp('страница 99')
  doc.numbers().increment()
  t.equal(doc.text(), 'страница 100', here + 'increment numeric')

  doc = nlp('третье место')
  doc.numbers().increment()
  t.equal(doc.text(), 'четвёртое место', here + 'increment ordinal')

  doc = nlp('пять')
  doc.numbers().decrement()
  t.equal(doc.text(), 'четыре', here + 'decrement text-number')

  doc = nlp('у меня 4 рубля')
  doc.numbers().add('два')
  t.equal(doc.text(), 'у меня 6 рубля', here + 'add text-string')

  doc = nlp('у меня 4 рубля')
  doc.numbers().plus('2')
  t.equal(doc.text(), 'у меня 6 рубля', here + 'plus digit-string')

  doc = nlp('у меня 4 рубля')
  doc.numbers().subtract('два')
  t.equal(doc.text(), 'у меня 2 рубля', here + 'subtract text-string')

  doc = nlp('у меня четыре рубля')
  doc.numbers().minus(1)
  t.equal(doc.text(), 'у меня три рубля', here + 'minus number')

  doc = nlp('у меня 4 рубля')
  doc.numbers().add('кот')
  t.equal(doc.text(), 'у меня 4 рубля', here + 'add non-number is a no-op')
  doc.numbers().add(0)
  t.equal(doc.text(), 'у меня 4 рубля', here + 'add zero is a no-op')
  doc.numbers().add()
  t.equal(doc.text(), 'у меня 4 рубля', here + 'add nothing is a no-op')

  doc = nlp('у меня 4 рубля')
  doc.numbers().increment().increment().decrement()
  t.equal(doc.text(), 'у меня 5 рубля', here + 'increment/decrement')

  // carrying
  const arr = [
    ['девять', 1, 'десять'],
    ['девятнадцать', 1, 'двадцать'],
    ['двадцать девять', 1, 'тридцать'],
    ['девяносто девять', 1, 'сто'],
    ['сто', -1, 'девяносто девять'],
    ['девятьсот девяносто девять', 1, 'тысяча'],
    ['тысяча', -1, 'девятьсот девяносто девять'],
    ['девятьсот девяносто девять тысяч девятьсот девяносто девять', 1, 'миллион'],
    ['один', -1, 'ноль'],
    ['ноль', -1, 'минус один'],
    ['минус один', 1, 'ноль'],
    ['минус пять', 10, 'пять'],
    ['пять', -10, 'минус пять'],
    ['пять', 0.5, '5,5'],
    ['полтора', 1, '2,5'],
    ['полтора', 0.5, 'два'],
    ['пять тысяч', 1, 'пять тысяч один'],
    ['5 тысяч', 1, '5001'],
    ['Пять книг', 1, 'Шесть книг'],
  ]
  arr.forEach(a => {
    const [str, n, want] = a
    doc = nlp(str)
    doc.numbers().add(n)
    t.equal(doc.text(), want, here + str + ' + ' + n)
  })
  t.end()
})

test('numbers-many:', function (t) {
  // each change makes the sentence longer, or shorter
  let doc = nlp('5 книг, 1234567 ручек, 3 стола и 25 стульев')
  doc.numbers().toText()
  t.equal(doc.text(), 'пять книг, миллион двести тридцать четыре тысячи пятьсот шестьдесят семь ручек, три стола и двадцать пять стульев', here + 'toText many')
  t.deepEqual(doc.numbers().get(), [5, 1234567, 3, 25], here + 'get after toText')
  doc.numbers().toNumber()
  t.equal(doc.text(), '5 книг, 1234567 ручек, 3 стола и 25 стульев', here + 'toNumber many')

  doc = nlp('девяносто девять и девятьсот девяносто девять')
  doc.numbers().add(1)
  t.equal(doc.text(), 'сто и тысяча', here + 'add many')

  // the same view keeps working
  doc = nlp('три собаки, пять кошек и девять уток')
  const nums = doc.numbers()
  nums.toNumber()
  t.deepEqual(nums.get(), [3, 5, 9], here + 'view after toNumber')
  nums.add(20)
  t.equal(doc.text(), '23 собаки, 25 кошек и 29 уток', here + 'view after add')
  nums.toText()
  t.equal(doc.text(), 'двадцать три собаки, двадцать пять кошек и двадцать девять уток', here + 'view after toText')
  t.deepEqual(nums.get(), [23, 25, 29], here + 'view get after toText')
  t.equal(nums.length, 3, here + 'view length')

  // across sentences
  doc = nlp('У меня 5 книг. А у него 21 книга! Сколько? 40.')
  doc.numbers().toText()
  t.equal(doc.text(), 'У меня пять книг. А у него двадцать одна книга! Сколько? сорок.', here + 'sentences')
  t.end()
})

test('numbers-compare:', function (t) {
  const doc = nlp('три собаки, пять кошек и девять уток')
  t.equal(doc.numbers().greaterThan(4).length, 2, here + 'greaterThan')
  t.equal(doc.numbers().lessThan(4).text(), 'три', here + 'lessThan')
  t.equal(doc.numbers().between(1, 6).length, 2, here + 'between')
  t.equal(doc.numbers().isBetween(4, 6).text(), 'пять', here + 'isBetween')
  t.equal(doc.numbers().isEqual(5).text(), 'пять', here + 'isEqual')
  t.equal(doc.numbers().equals(9).text(), 'девять', here + 'equals')
  t.equal(doc.numbers().isEqual(4).found, false, here + 'isEqual not found')
  t.equal(doc.numbers().greaterThan(4).viewType, 'Numbers', here + 'compare returns numbers')
  t.deepEqual(doc.numbers().greaterThan(4).get(), [5, 9], here + 'chain after compare')

  const mixed = nlp('минус пять, 3,5 и две тысячи')
  t.deepEqual(mixed.numbers().lessThan(0).get(), [-5], here + 'lessThan negative')
  t.deepEqual(mixed.numbers().between(3, 4).get(), [3.5], here + 'between decimal')
  t.deepEqual(mixed.numbers().greaterThan(1999).get(), [2000], here + 'greaterThan big')
  t.end()
})

test('numbers-filter-ordinal:', function (t) {
  let doc = nlp('третья попытка')
  t.equal(doc.numbers().isOrdinal().text(), 'третья', here + 'isOrdinal')
  t.equal(doc.numbers().isCardinal().found, false, here + 'ordinal is not cardinal')

  doc = nlp('три попытки')
  t.equal(doc.numbers().isCardinal().text(), 'три', here + 'isCardinal')
  t.equal(doc.numbers().isOrdinal().found, false, here + 'cardinal is not ordinal')

  // the cardinal words of a long ordinal don't count
  doc = nlp('двадцать пятый день и двадцать пять дней')
  t.equal(doc.numbers().isOrdinal().text(), 'двадцать пятый', here + 'long ordinal')
  t.equal(doc.numbers().isCardinal().text(), 'двадцать пять', here + 'long cardinal')

  doc = nlp('5-й день и 5 дней')
  t.equal(doc.numbers().isOrdinal().text(), '5-й', here + 'numeric ordinal')
  t.equal(doc.numbers().isCardinal().text(), '5', here + 'numeric cardinal')
  t.end()
})

test('numbers-json-nth:', function (t) {
  const str = 'три собаки и пять кошек'
  let json = nlp(str).numbers().json(0)
  t.equal(json.length, 1, here + 'json(0) length')
  t.equal(json[0].number.num, 3, here + 'json(0) num')

  json = nlp(str).numbers().json(1)
  t.equal(json.length, 1, here + 'json(1) length')
  t.equal(json[0].number.num, 5, here + 'json(1) num')

  json = nlp(str).numbers().json(9)
  t.deepEqual(json, [], here + 'json out-of-range')

  json = nlp(str).numbers().json({ terms: false })
  t.equal(json.length, 2, here + 'json options length')
  t.equal(json[0].terms, undefined, here + 'json options respected')
  t.equal(json[1].number.num, 5, here + 'json options num')

  json = nlp('у него 5 000 рублей').numbers().json()
  t.deepEqual(json[0].number, { prefix: '', num: 5000, suffix: '', hasComma: true }, here + 'json number')
  t.end()
})

test('numbers-empty:', function (t) {
  const nums = nlp('кот ест рыбу').numbers()
  t.equal(nums.found, false, here + 'no numbers')
  t.deepEqual(nums.get(), [], here + 'get with no numbers')
  t.deepEqual(nums.parse(), [], here + 'parse with no numbers')
  t.deepEqual(nums.json(), [], here + 'json with no numbers')
  t.deepEqual(nums.decline(), [], here + 'decline with no numbers')
  t.deepEqual(nlp('три собаки').numbers().get(5), [], here + 'get out-of-range')
  t.equal(nums.toText().found, false, here + 'toText with no numbers')
  t.equal(nums.toNumber().found, false, here + 'toNumber with no numbers')
  t.equal(nums.add(2).found, false, here + 'add with no numbers')
  t.equal(nums.set(2).found, false, here + 'set with no numbers')
  t.equal(nlp('').numbers().found, false, here + 'empty document')
  t.end()
})

test('numbers-no-ops:', function (t) {
  // each of these changes nothing
  let doc = nlp('пять книг')
  doc.numbers().toText()
  t.equal(doc.text(), 'пять книг', here + 'toText on text')
  doc.numbers().toCardinal()
  t.equal(doc.text(), 'пять книг', here + 'toCardinal on cardinal')

  doc = nlp('5 книг')
  doc.numbers().toNumber()
  t.equal(doc.text(), '5 книг', here + 'toNumber on digits')

  doc = nlp('пятый день')
  doc.numbers().toOrdinal()
  t.equal(doc.text(), 'пятый день', here + 'toOrdinal on ordinal')

  // there is no 'minus fifth'
  doc = nlp('минус пять')
  doc.numbers().toOrdinal()
  t.equal(doc.text(), 'минус пять', here + 'toOrdinal on negative')

  // too big to say
  doc = nlp('1000000000000000000')
  doc.numbers().toText()
  t.equal(doc.text(), '1000000000000000000', here + 'toText on a huge number')
  t.end()
})

test('numbers-tags-after:', function (t) {
  let doc = nlp('у меня 25 рублей')
  doc.numbers().toText()
  t.equal(doc.match('#TextValue+').text(), 'двадцать пять', here + 'TextValue after toText')
  t.equal(doc.has('#NumericValue'), false, here + 'no NumericValue after toText')

  doc.numbers().toNumber()
  t.equal(doc.match('#NumericValue').text(), '25', here + 'NumericValue after toNumber')
  t.equal(doc.has('#TextValue'), false, here + 'no TextValue after toNumber')

  doc.numbers().toOrdinal()
  t.equal(doc.match('#Ordinal').text(), '25-й', here + 'Ordinal after toOrdinal')
  doc.numbers().toCardinal()
  t.equal(doc.has('#Ordinal'), false, here + 'no Ordinal after toCardinal')
  t.equal(doc.match('#Cardinal').text(), '25', here + 'Cardinal after toCardinal')

  doc = nlp('двадцать пять')
  doc.numbers().toOrdinal()
  t.equal(doc.match('#Ordinal').text(), 'пятый', here + 'only the last word is ordinal')
  t.equal(doc.match('#Cardinal').text(), 'двадцать', here + 'the first word is cardinal')

  doc = nlp('было -5 градусов')
  doc.numbers().toText()
  t.equal(doc.match('минус').has('#Value'), false, here + 'the sign is not a value')
  t.deepEqual(doc.numbers().get(), [-5], here + 'still one negative number')

  doc = nlp('5%')
  doc.numbers().toText()
  t.equal(doc.match('процентов').has('#Value'), false, here + 'процентов is not a value')
  t.deepEqual(doc.numbers().get(), [5], here + 'percent is one number')
  t.end()
})
