import test from 'tape'
import nlp from '../../_lib.js'
const here = '[ru-adjectives-oblique] '
nlp.verbose(false)

const isAdj = (str, word) => nlp(str).match(word).has('#Adjective')

// the adjectives in our lexicon are known in every case, gender and number
test('known adjectives, in every form:', function (t) {
  const forms = [
    // hard
    'красивый', 'красивая', 'красивое', 'красивые', 'красивого', 'красивому', 'красивым',
    'красивом', 'красивой', 'красивую', 'красивых', 'красивыми',
    // soft
    'синий', 'синяя', 'синее', 'синие', 'синего', 'синему', 'синим', 'синем', 'синей',
    'синюю', 'синих', 'синими',
    // husher
    'хороший', 'хорошая', 'хорошее', 'хорошие', 'хорошего', 'хорошему', 'хорошим',
    'хорошем', 'хорошей', 'хорошую', 'хороших', 'хорошими',
    // velar
    'русский', 'русская', 'русское', 'русские', 'русского', 'русскому', 'русским',
    'русском', 'русской', 'русскую', 'русскими',
    'тихих', 'высоких',
    // stressed -ой
    'большой', 'большая', 'большое', 'большие', 'большого', 'большому', 'большим',
    'большом', 'большую', 'больших', 'большими',
    'молодого', 'молодому', 'молодым', 'молодом', 'молодую', 'молодых', 'молодыми',
    // ё, and its 'е' spelling
    'тёплой', 'теплой', 'зелёном', 'зеленом',
  ]
  forms.forEach(str => {
    t.equal(nlp(str).has('^#Adjective$'), true, here + str)
  })
  t.end()
})

test('feminine oblique adjectives, beside a noun:', function (t) {
  const arr = [
    ['красивой девушки', 'красивой'],
    ['у красивой девушки', 'красивой'],
    ['Красивой девушки нет', 'красивой'],
    ['с новой книгой', 'новой'],
    ['в синей комнате', 'синей'],
    ['к хорошей подруге', 'хорошей'],
    ['в большой комнате', 'большой'],
    ['большой комнатой', 'большой'],
    ['о русской истории', 'русской'],
    ['от старой привычки', 'старой'],
    ['по вечерней Москве', 'вечерней'],
    ['на главной улице', 'главной'],
    // the other ambiguous endings
    ['в красивом доме', 'красивом'],
    ['о синем море', 'синем'],
    ['к синему морю', 'синему'],
  ]
  arr.forEach(a => {
    const [str, word] = a
    t.equal(isAdj(str, word), true, here + str)
    t.deepEqual(nlp(str).adjectives().out('array').map(s => s.toLowerCase()), [word], here + str + ' .adjectives()')
  })
  t.end()
})

// unknown words are adjectives when the noun beside them agrees
test('unknown oblique adjectives:', function (t) {
  const arr = [
    // before an instrumental
    ['с пушистой кошкой', 'пушистой'],
    ['с уютной квартирой', 'уютной'],
    ['с ближайшей станцией', 'ближайшей'],
    // after a preposition that never takes the instrumental
    ['у пушистой кошки', 'пушистой'],
    ['для пушистой кошки', 'пушистой'],
    ['в уютной квартире', 'уютной'],
    ['к умелой работнице', 'умелой'],
    ['в рыжей шубе', 'рыжей'],
    // adjective-like stems
    ['звёздной системы', 'звёздной'],
    ['греческой культуры', 'греческой'],
    ['турецкой кухни', 'турецкой'],
    ['бывшей жены', 'бывшей'],
    ['работающей женщины', 'работающей'],
    // only the adjective
    ['с картой звёздной системы', 'звёздной'],
    // prepositional
    ['в пушистом свитере', 'пушистом'],
    ['о загадочном острове', 'загадочном'],
    ['в добром слове', 'добром'],
  ]
  arr.forEach(a => {
    const [str, word] = a
    t.deepEqual(nlp(str).match('#Adjective').out('array'), [word], here + str)
  })
  t.end()
})

test('oblique superlatives:', function (t) {
  const arr = [
    ['красивой девушки', 'самой красивой девушки'],
    ['у красивой девушки', 'у самой красивой девушки'],
    ['с новой книгой', 'с самой новой книгой'],
    ['в синей комнате', 'в самой синей комнате'],
    ['в большой комнате', 'в самой большой комнате'],
    ['большой комнатой', 'самой большой комнатой'],
    ['большой семьёй', 'самой большой семьёй'],
    ['с золотой ложкой', 'с самой золотой ложкой'],
    ['с пушистой кошкой', 'с самой пушистой кошкой'],
    ['к синему морю', 'к самому синему морю'],
    ['Красивой девушки нет', 'Самой красивой девушки нет'],
    // suppletive
    ['к хорошей подруге', 'к лучшей подруге'],
    ['о плохой погоде', 'о худшей погоде'],
    // stressed -ой is masculine, before a masculine noun
    ['большой герой', 'самый большой герой'],
    ['большой музей', 'самый большой музей'],
    ['золотой дом', 'самый золотой дом'],
  ]
  arr.forEach(a => {
    const [from, want] = a
    const doc = nlp(from)
    doc.adjectives().toSuperlative()
    t.equal(doc.text(), want, here + from + ' → ' + want)
  })
  t.end()
})

// a feminine accusative is a masculine (inanimate) accusative, in the nominative form
test('toMasculine from the accusative:', function (t) {
  const arr = [
    ['красивую', 'красивый'],
    ['синюю', 'синий'],
    ['хорошую', 'хороший'],
    ['тихую', 'тихий'],
    ['большую', 'большой'],
    ['золотую', 'золотой'],
  ]
  arr.forEach(a => {
    const [from, want] = a
    t.equal(nlp(from).adjectives().toMasculine().text(), want, here + from + ' → ' + want)
  })
  t.end()
})

// a new gender or number is never a new case
test('oblique forms keep their case:', function (t) {
  const arr = [
    'красивую книгу',
    'красивой девушки',
    'с новой книгой',
    'в синей комнате',
    'в большой комнате',
    'большой комнатой',
    'в красивом доме',
    'красивым домом',
    'нового дома',
    'с пушистой кошкой',
  ]
  arr.forEach(str => {
    let doc = nlp(str)
    doc.adjectives().toFeminine()
    t.equal(doc.text(), str, here + str + ' toFeminine')
    doc = nlp(str)
    doc.adjectives().toNeuter()
    t.equal(doc.text(), str, here + str + ' toNeuter')
    doc = nlp(str)
    doc.adjectives().toPlural()
    t.equal(doc.text(), str, here + str + ' toPlural')
  })
  // the other oblique endings are each several cases
  arr.slice(1).forEach(str => {
    const doc = nlp(str)
    doc.adjectives().toMasculine()
    t.equal(doc.text(), str, here + str + ' toMasculine')
  })
  // a stressed -ой nominative still changes
  const doc = nlp('большой дом')
  doc.adjectives().toPlural()
  t.equal(doc.text(), 'большие дом', here + 'большой → большие')
  t.end()
})

test('adjective.all():', function (t) {
  const { all } = nlp.methods().two.transform.adjective
  const arr = [
    ['новый', 'новый новая новое новые нового новому новым новом новой новую новых новыми'],
    ['синий', 'синий синяя синее синие синего синему синим синем синей синюю синих синими'],
    ['тихий', 'тихий тихая тихое тихие тихого тихому тихим тихом тихой тихую тихих тихими'],
    ['свежий', 'свежий свежая свежее свежие свежего свежему свежим свежем свежей свежую свежих свежими'],
    ['большой', 'большой большая большое большие большого большому большим большом большую больших большими'],
    ['золотой', 'золотой золотая золотое золотые золотого золотому золотым золотом золотую золотых золотыми'],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.deepEqual(all(str).sort(), want.split(' ').sort(), here + str)
  })
  t.deepEqual(all('дом'), ['дом'], here + 'not an adjective')
  t.end()
})
