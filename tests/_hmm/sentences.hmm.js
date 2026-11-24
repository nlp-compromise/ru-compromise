import test from 'tape'
import nlp from '../_lib.js'
const here = '[ru-sentences-hmm] '

// russian abbreviations should not end a sentence
test('abbreviations:', function (t) {
  const arr = [
    'Он жил в г. Москве много лет.',
    'Это стоит 100 руб. в месяц.',
    'Пушкин родился в 1799 г. в Москве.',
    'В XX в. было много войн.',
    'Яблоки, груши и т. п. лежат на столе.',
    'Это правда, т. е. факт.',
    'т.е. это правда',
    'Проф. Иванов пришёл.',
    'Ул. Ленина, д. 5, кв. 10.',
    'См. стр. 5 книги.',
  ]
  arr.forEach(str => {
    t.deepEqual(nlp(str).fullSentences().out('array'), [str], here + str)
  })
  t.end()
})

test('abbreviation at the end of a sentence:', function (t) {
  const str = 'Купи хлеб, молоко и т. д. Потом приходи.'
  t.deepEqual(nlp(str).fullSentences().out('array'), ['Купи хлеб, молоко и т. д.', 'Потом приходи.'], here + str)
  t.end()
})

// initials before a surname
test('initials:', function (t) {
  const arr = ['А. С. Пушкин написал это.', 'А.С. Пушкин написал это.', 'Это написал Л. Н. Толстой.']
  arr.forEach(str => {
    t.deepEqual(nlp(str).fullSentences().out('array'), [str], here + str)
  })
  t.end()
})

// the author's words after direct speech begin with a dash and a lowercase letter
test('direct speech:', function (t) {
  const arr = ['Кто там? — спросил он.', '— Иди сюда! — сказала она.']
  arr.forEach(str => {
    t.deepEqual(nlp(str).fullSentences().out('array'), [str], here + str)
  })
  t.end()
})

// a new capitalised sentence after an ellipsis, or a closed quotation
test('ellipsis and quotes:', function (t) {
  const arr = [
    ['Подожди… Я иду.', ['Подожди…', 'Я иду.']],
    ['Не знаю... Может быть, завтра.', ['Не знаю...', 'Может быть, завтра.']],
    ['Он сказал: "Не знаю." Потом ушёл.', ['Он сказал: "Не знаю."', 'Потом ушёл.']],
    ['(Не знаю.) Может быть, завтра.', ['(Не знаю.)', 'Может быть, завтра.']],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.deepEqual(nlp(str).fullSentences().out('array'), want, here + str)
  })
  t.end()
})
