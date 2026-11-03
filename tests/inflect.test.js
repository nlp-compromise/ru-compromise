import test from 'tape'
import nlp from './_lib.js'
const here = '[inflect] '
nlp.verbose(false)

test('noun-plural:', function (t) {
  const arr = [
    ['книга', 'книги'],
    ['стол', 'столы'],
    ['парк', 'парки'],
    ['ночь', 'ночи'],
    ['окно', 'окна'],
    ['море', 'моря'],
    ['неделя', 'недели'],
    ['музей', 'музеи'],
    ['человек', 'люди'],
    ['друг', 'друзья'],
    ['город', 'города'],
  ]
  arr.forEach(function (a) {
    const [single, plural] = a
    const doc = nlp(single)
    doc.nouns().toPlural()
    t.equal(doc.text(), plural, here + single + ' → ' + plural)
  })
  t.end()
})

test('noun-singular:', function (t) {
  const arr = [
    ['книги', 'книга'],
    ['столы', 'стол'],
    ['окна', 'окно'],
    ['люди', 'человек'],
    ['города', 'город'],
  ]
  arr.forEach(function (a) {
    const [plural, single] = a
    const doc = nlp(plural)
    doc.nouns().toSingular()
    t.equal(doc.text(), single, here + plural + ' → ' + single)
  })
  t.end()
})

test('adjective-agreement:', function (t) {
  const arr = [
    // [masc, fem, neut, plural]
    ['новый', 'новая', 'новое', 'новые'],
    ['синий', 'синяя', 'синее', 'синие'],
    ['хороший', 'хорошая', 'хорошее', 'хорошие'],
    ['маленький', 'маленькая', 'маленькое', 'маленькие'],
    ['большой', 'большая', 'большое', 'большие'],
    ['простой', 'простая', 'простое', 'простые'],
  ]
  arr.forEach(function (a) {
    const [masc, fem, neut, plural] = a
    const doc = nlp(masc)
    t.equal(doc.clone().adjectives().toFeminine().text(), fem, here + masc + ' → ' + fem)
    t.equal(doc.clone().adjectives().toNeuter().text(), neut, here + masc + ' → ' + neut)
    t.equal(doc.clone().adjectives().toPlural().text(), plural, here + masc + ' → ' + plural)
    // and back to masculine
    t.equal(nlp(fem).adjectives().toMasculine().text(), masc, here + fem + ' → ' + masc)
  })
  t.end()
})

test('verb-aspect:', function (t) {
  const говорить = nlp('говорить').verbs().conjugate()[0]
  t.equal(говорить.aspect, 'imperfective', here + 'говорить is imperfective')
  t.equal(говорить.aspectPair, 'сказать', here + 'говорить ↔ сказать')
  t.equal(говорить.futureTense.first, 'буду говорить', here + 'compound future')
  t.equal(говорить.gerund, 'говоря', here + 'gerund говоря')

  const сказать = nlp('сказать').verbs().conjugate()[0]
  t.equal(сказать.aspect, 'perfective', here + 'сказать is perfective')
  t.equal(сказать.aspectPair, 'говорить', here + 'сказать ↔ говорить')
  t.equal(сказать.futureTense.first, 'скажу', here + 'perfective future = non-past')
  t.equal(сказать.gerund, 'сказав', here + 'gerund сказав')
  t.end()
})

test('gerund-tagging:', function (t) {
  const doc = nlp('читая книгу, он улыбался')
  t.equal(doc.match('#Gerund').text(), 'читая', here + 'читая is a gerund')
  t.end()
})
