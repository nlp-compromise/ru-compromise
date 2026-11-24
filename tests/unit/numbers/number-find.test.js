import test from 'tape'
import nlp from '../../_lib.js'
const here = '[number-find] '
nlp.verbose(false)

test('number-tags:', function (t) {
  const arr = [
    ['пять', '#Cardinal'],
    ['пять', '#TextValue'],
    ['пяти', '#Cardinal'],
    ['пятью', '#TextValue'],
    ['двумястами', '#Cardinal'],
    ['ноль', '#Cardinal'],
    ['нуля', '#Cardinal'],
    ['тысяча', '#Multiple'],
    ['миллионов', '#Multiple'],
    ['млн', '#Multiple'],
    ['пятый', '#Ordinal'],
    ['пятый', '#TextValue'],
    ['пятую', '#Ordinal'],
    ['третьего', '#Ordinal'],
    ['сороковых', '#Ordinal'],
    ['двухтысячный', '#Ordinal'],
    ['двадцатипятитысячного', '#Ordinal'],
    ['трёхмиллионный', '#Ordinal'],
    ['двое', '#Cardinal'],
    ['полтора', '#Cardinal'],
    ['5', '#NumericValue'],
    ['5', '#Cardinal'],
    ['5-й', '#Ordinal'],
    ['5-й', '#NumericValue'],
    ['5-го', '#Ordinal'],
    ['1990-х', '#Ordinal'],
    ['2-ая', '#Ordinal'],
    ['3-и', '#Ordinal'],
    ['50%', '#Percent'],
    // localized tag names
    ['пять', '#Число'],
    ['пять', '#Количественное'],
    ['пять', '#Числительное'],
    ['пятый', '#Порядковое'],
    ['5', '#Числовое'],
  ]
  arr.forEach(a => {
    const [str, match] = a
    t.equal(nlp(str).has(match), true, here + str + ' is ' + match)
  })
  t.equal(nlp('пять').has('#NumericValue'), false, here + 'text is not numeric')
  t.equal(nlp('5').has('#TextValue'), false, here + 'digits are not text')
  t.equal(nlp('пять').has('#Ordinal'), false, here + 'cardinal is not ordinal')
  t.equal(nlp('пятый').has('#Cardinal'), false, here + 'ordinal is not cardinal')
  t.end()
})

test('number-split:', function (t) {
  const arr = [
    // one number
    ['двадцать пять', [25]],
    ['сто двадцать пять', [125]],
    ['две тысячи двадцать шесть', [2026]],
    ['три миллиона двести тысяч пять', [3200005]],
    ['тысяча девятьсот девяносто первый', [1991]],
    // lists of numbers
    ['пять шесть семь', [5, 6, 7]],
    ['один два три', [1, 2, 3]],
    ['двадцать тридцать', [20, 30]],
    ['пять двадцать', [5, 20]],
    ['двадцать пять тридцать пять', [25, 35]],
    ['одиннадцать пять', [11, 5]],
    ['двадцать одиннадцать', [20, 11]],
    ['сто двести', [100, 200]],
    ['пять сто', [5, 100]],
    ['тысяча миллион', [1000, 1000000]],
    ['пять тысяч шесть тысяч', [5000, 6000]],
    ['ноль пять', [0, 5]],
    ['пять ноль', [5, 0]],
    ['пятый шестой', [5, 6]],
    ['пятый двадцать', [5, 20]],
    // punctuation always splits
    ['пять, шесть и семь', [5, 6, 7]],
    ['двадцать, пять', [20, 5]],
    ['двадцать. Пять', [20, 5]],
    ['двадцать (пять)', [20, 5]],
    ['двадцать - пять', [20, 5]],
    ['сто; двадцать', [100, 20]],
    // other words do, too
    ['двадцать и пять', [20, 5]],
    ['пять или шесть', [5, 6]],
    ['от пяти до десяти', [5, 10]],
    ['с двух до трёх', [2, 3]],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.deepEqual(nlp(str).numbers().get(), want, here + str)
  })
  t.end()
})

test('number-in-sentence:', function (t) {
  const arr = [
    ['у меня двадцать пять рублей', ['двадцать пять'], [25]],
    ['ему тридцать два года', ['тридцать два'], [32]],
    ['мы ждали сорок минут', ['сорок'], [40]],
    ['в классе двадцать один ученик', ['двадцать один'], [21]],
    ['она купила три яблока и две груши', ['три', 'две'], [3, 2]],
    ['это стоит тысячу рублей', ['тысячу'], [1000]],
    ['в городе живёт два миллиона человек', ['два миллиона'], [2000000]],
    ['он пришёл с двумя друзьями', ['двумя'], [2]],
    ['у неё нет пяти рублей', ['пяти'], [5]],
    ['мы говорили о трёх книгах', ['трёх'], [3]],
    ['в 1990 году', ['1990'], [1990]],
    ['рост 3,5 метра', ['3,5'], [3.5]],
    ['цена 5 000 рублей', ['5 000'], [5000]],
    ['население 146 млн человек', ['146 млн'], [146000000]],
    ['скидка 10% на всё', ['10%'], [10]],
    ['он занял первое место', ['первое'], [1]],
    ['это случилось в двадцатом веке', ['двадцатом'], [20]],
    ['двое детей и трое взрослых', ['двое', 'трое'], [2, 3]],
    ['обе руки', ['обе'], [2]],
    ['полтора часа', ['полтора'], [1.5]],
    ['кот ест рыбу', [], []],
  ]
  arr.forEach(a => {
    const [str, text, want] = a
    const nums = nlp(str).numbers()
    t.deepEqual(nums.out('array'), text, here + 'text: ' + str)
    t.deepEqual(nums.get(), want, here + 'get: ' + str)
  })
  t.end()
})

test('number-seven-or-family:', function (t) {
  // 'семью' is 'the family', too
  t.equal(nlp('он любит свою семью').numbers().found, false, here + 'family')
  t.equal(nlp('я вижу семью').numbers().found, false, here + 'family 2')
  t.deepEqual(nlp('с семью детьми').numbers().get(), [7], here + 'seven children')
  t.deepEqual(nlp('с семью книгами').numbers().get(), [7], here + 'seven books')
  t.deepEqual(nlp('с двадцатью семью').numbers().get(), [27], here + 'twenty-seven')
  t.deepEqual(nlp('семью тысячами').numbers().get(), [7000], here + 'seven thousand')
  t.end()
})

test('number-not-numbers:', function (t) {
  const arr = ['12.05.2020', '3-4', 'привет', 'многотысячный', 'минус', 'том', 'стол']
  arr.forEach(str => {
    t.deepEqual(nlp(str).numbers().get(), [], here + str)
  })
  t.end()
})

test('number-sub-view:', function (t) {
  // .numbers() only looks inside its own view
  const doc = nlp('пять книг и минус двадцать шесть ручек')
  t.deepEqual(doc.match('минус двадцать шесть').numbers().get(), [-26], here + 'whole match')
  t.deepEqual(doc.match('двадцать шесть').numbers().get(), [26], here + 'sign is outside the view')
  t.deepEqual(doc.match('шесть ручек').numbers().get(), [6], here + 'part of a number')
  t.deepEqual(doc.match('книг').numbers().get(), [], here + 'no number')
  t.end()
})
