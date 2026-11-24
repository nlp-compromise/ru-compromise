import test from 'tape'
import nlp from '../../_lib.js'
const here = '[ru-tokenize] '
nlp.verbose(false)

test('sentence-splitting:', function (t) {
  const arr = [
    ['Я поехал в Москву. Потом вернулся.', 2],
    ['Как дела? Очень хорошо! Спасибо.', 3],
    ['Привет.', 1],
    ['Я люблю кофе', 1],
    ['', 0],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.equal(nlp(str).fullSentences().length, want, here + `'${str}' → ${want} sentences`)
  })
  t.end()
})

test('term-splitting:', function (t) {
  const arr = [
    ['Я люблю кофе', ['Я', 'люблю', 'кофе']],
    ['ёлка и ёж', ['ёлка', 'и', 'ёж']],
    ['ПРИВЕТ МИР', ['ПРИВЕТ', 'МИР']],
    ['25 апреля 1945 года', ['25', 'апреля', '1945', 'года']],
    ['напиши на maria@primer.ru сегодня', ['напиши', 'на', 'maria@primer.ru', 'сегодня']],
    ['открой www.primer.ru сегодня', ['открой', 'www.primer.ru', 'сегодня']],
    ['Привет\tмир', ['Привет', 'мир']],
    ['Привет   мир', ['Привет', 'мир']],
    // mixed scripts
    ['я люблю jazz и рок', ['я', 'люблю', 'jazz', 'и', 'рок']],
    // hyphenated words stay in one piece
    ['кто-то пришёл', ['кто-то', 'пришёл']],
    ['Кто-нибудь знает ответ', ['Кто-нибудь', 'знает', 'ответ']],
    ['что-либо', ['что-либо']],
    ['Он говорит по-русски', ['Он', 'говорит', 'по-русски']],
    ['из-за дождя', ['из-за', 'дождя']],
    ['Северо-восток', ['Северо-восток']],
    ['Он живёт в Санкт-Петербурге', ['Он', 'живёт', 'в', 'Санкт-Петербурге']],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.deepEqual(nlp(str).terms().out('array'), want, here + str)
  })
  t.end()
})

test('word-count:', function (t) {
  const arr = [
    ['привет', 1],
    ['Я люблю кофе', 3],
    ['Как дела? Очень хорошо! Спасибо.', 5],
    ['из-за дождя', 2],
    ['по-русски', 1],
    // a dash is not a word
    ['Москва — столица России.', 3],
    ['Москва - столица России.', 3],
    ['— Привет, — сказал он. — Как дела?', 5],
    ['', 0],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.equal(nlp(str).wordCount(), want, here + `'${str}' has ${want} words`)
  })
  t.end()
})

test('punctuation in pre/post:', function (t) {
  const arr = [
    // [text, [pre, text, post] for each term]
    ['чашку кофе, пожалуйста!', [['', 'чашку', ' '], ['', 'кофе', ', '], ['', 'пожалуйста', '!']]],
    ['(может быть) завтра', [['(', 'может', ' '], ['', 'быть', ') '], ['', 'завтра', '']]],
    ['Идёт дождь... сильный', [['', 'Идёт', ' '], ['', 'дождь', '... '], ['', 'сильный', '']]],
    ['Как красиво!!!', [['', 'Как', ' '], ['', 'красиво', '!!!']]],
    // guillemets + low-high quotes
    ['«Иди сюда!»', [['«', 'Иди', ' '], ['', 'сюда', '!»']]],
    ['Он сказал: «Не знаю».', [['', 'Он', ' '], ['', 'сказал', ': '], ['«', 'Не', ' '], ['', 'знаю', '».']]],
    ['„Привет“, — сказал он.', [['„', 'Привет', '“, — '], ['', 'сказал', ' '], ['', 'он', '.']]],
    // dashes between words are whitespace, not terms
    ['Москва — столица России.', [['', 'Москва', ' — '], ['', 'столица', ' '], ['', 'России', '.']]],
    ['Москва – столица России.', [['', 'Москва', ' – '], ['', 'столица', ' '], ['', 'России', '.']]],
    ['Москва - столица России.', [['', 'Москва', ' - '], ['', 'столица', ' '], ['', 'России', '.']]],
    ['— Привет, — сказал он.', [['— ', 'Привет', ', — '], ['', 'сказал', ' '], ['', 'он', '.']]],
    // a hyphen inside a word is part of the word
    ['кто-то пришёл', [['', 'кто-то', ' '], ['', 'пришёл', '']]],
    ['  Привет мир  ', [['  ', 'Привет', ' '], ['', 'мир', '  ']]],
  ]
  arr.forEach(a => {
    const [str, want] = a
    const have = nlp(str).docs[0].map(term => [term.pre, term.text, term.post])
    t.deepEqual(have, want, here + str)
  })
  t.end()
})

test('numbers are one term:', function (t) {
  const arr = [
    ['стоит 3,5 рубля', ['стоит', '3,5', 'рубля']],
    ['число 3.14 большое', ['число', '3.14', 'большое']],
    ['в 8:30 утра', ['в', '8:30', 'утра']],
    ['Это 50% скидка', ['Это', '50%', 'скидка']],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.deepEqual(nlp(str).terms().out('array'), want, here + str)
  })
  t.end()
})

test('normalized text:', function (t) {
  const arr = [
    ['ПРИВЕТ, Мир!', 'привет мир!'],
    ['Я Люблю КОФЕ.', 'я люблю кофе.'],
    // ё is kept
    ['Всё хорошо', 'всё хорошо'],
    ['Ёлка', 'ёлка'],
    // stress marks are removed
    ['за́мок и замо́к', 'замок и замок'],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.equal(nlp(str).text('normal'), want, here + str)
  })
  t.equal(nlp('Привет').docs[0][0].normal, 'привет', here + 'lowercase in normal')
  t.equal(nlp('ёлка').docs[0][0].normal, 'ёлка', here + 'ё kept in normal')
  t.equal(nlp('по-русски').docs[0][0].normal, 'по-русски', here + 'hyphen kept in normal')
  t.end()
})

test('match ignores case, punctuation and stress-marks:', function (t) {
  t.equal(nlp('Он сказал «привет» и ушёл').match('привет').text(), 'привет', here + 'inside guillemets')
  t.equal(nlp('ПРИВЕТ, мир!').has('привет мир'), true, here + 'case and comma')
  t.equal(nlp('Привет, МИР!').has('мир'), true, here + 'uppercase cyrillic')
  t.equal(nlp('Москва — столица России.').has('москва столица'), true, here + 'across a dash')
  t.equal(nlp('за́мок закрыт').has('замок'), true, here + 'stress mark')
  t.equal(nlp('Он говорит по-русски.').match('по-русски').text(), 'по-русски', here + 'hyphenated word')
  t.equal(nlp('кто-то пришёл').has('кто-то'), true, here + 'кто-то')
  t.equal(nlp('кто-то пришёл').has('кто'), false, here + 'not half of a hyphenated word')
  t.end()
})

test('text-roundtrip:', function (t) {
  const arr = [
    'Как дела?',
    'Какой сюрприз!',
    'Я поехал в Москву. Потом вернулся.',
    '  Привет мир  ',
    'Привет   мир.  Как  дела?',
    'Привет,\nмир.\nКак дела?',
    'Привет!\n\nКак дела?',
    'Привет\tмир',
    '«Иди сюда!» — сказала Мария. Потом ушла.',
    'Он сказал: «Не знаю». Потом ушёл.',
    'Он сказал: "Не знаю." Потом ушёл.',
    '„Привет“, — сказал он.',
    'Идёт дождь... сильный',
    'Подожди… Я иду.',
    'Москва — столица России.',
    '— Привет, — сказал он. — Как дела?',
    '(может быть) завтра',
    'Стоит 1 000 рублей в месяц.',
    'Купи хлеб, молоко и т. д. Потом приходи.',
    'А. С. Пушкин родился в 1799 г. в Москве.',
    'Кто-нибудь говорит по-русски?',
    'за́мок и замо́к',
    'Всё хорошо. Ещё не всё.',
    'ПРИВЕТ МИР',
  ]
  arr.forEach(str => {
    t.equal(nlp(str).text(), str, here + `roundtrip '${str}'`)
  })
  t.end()
})

test('nlp.tokenize:', function (t) {
  const str = 'Кот ест рыбу. Собака громко лает!'
  const doc = nlp.tokenize(str)
  t.equal(doc.length, 2, here + 'two sentences')
  t.equal(doc.wordCount(), 6, here + 'six words')
  t.equal(doc.text(), str, here + 'tokenize roundtrip')
  t.deepEqual(doc.terms().out('array'), nlp(str).terms().out('array'), here + 'same terms as nlp()')
  t.equal(doc.has('#Noun'), false, here + 'no tagger was run')
  t.equal(doc.has('кот'), true, here + 'words still match')
  t.end()
})
