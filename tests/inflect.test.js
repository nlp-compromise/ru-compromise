import test from 'tape'
import nlp from './_lib.js'
let here = '[inflect] '
nlp.verbose(false)

test('noun-plural:', function (t) {
  let arr = [
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
    let [single, plural] = a
    let doc = nlp(single)
    doc.nouns().toPlural()
    t.equal(doc.text(), plural, here + single + ' → ' + plural)
  })
  t.end()
})

test('noun-singular:', function (t) {
  let arr = [
    ['книги', 'книга'],
    ['столы', 'стол'],
    ['окна', 'окно'],
    ['люди', 'человек'],
    ['города', 'город'],
  ]
  arr.forEach(function (a) {
    let [plural, single] = a
    let doc = nlp(plural)
    doc.nouns().toSingular()
    t.equal(doc.text(), single, here + plural + ' → ' + single)
  })
  t.end()
})

test('adjective-agreement:', function (t) {
  let arr = [
    // [masc, fem, neut, plural]
    ['новый', 'новая', 'новое', 'новые'],
    ['синий', 'синяя', 'синее', 'синие'],
    ['хороший', 'хорошая', 'хорошее', 'хорошие'],
    ['маленький', 'маленькая', 'маленькое', 'маленькие'],
    ['большой', 'большая', 'большое', 'большие'],
    ['простой', 'простая', 'простое', 'простые'],
  ]
  arr.forEach(function (a) {
    let [masc, fem, neut, plural] = a
    let doc = nlp(masc)
    t.equal(doc.clone().adjectives().toFeminine().text(), fem, here + masc + ' → ' + fem)
    t.equal(doc.clone().adjectives().toNeuter().text(), neut, here + masc + ' → ' + neut)
    t.equal(doc.clone().adjectives().toPlural().text(), plural, here + masc + ' → ' + plural)
    // and back to masculine
    t.equal(nlp(fem).adjectives().toMasculine().text(), masc, here + fem + ' → ' + masc)
  })
  t.end()
})

test('verb-aspect:', function (t) {
  let говорить = nlp('говорить').verbs().conjugate()[0]
  t.equal(говорить.aspect, 'imperfective', here + 'говорить is imperfective')
  t.equal(говорить.aspectPair, 'сказать', here + 'говорить ↔ сказать')
  t.equal(говорить.futureTense.first, 'буду говорить', here + 'compound future')
  t.equal(говорить.gerund, 'говоря', here + 'gerund говоря')

  let сказать = nlp('сказать').verbs().conjugate()[0]
  t.equal(сказать.aspect, 'perfective', here + 'сказать is perfective')
  t.equal(сказать.aspectPair, 'говорить', here + 'сказать ↔ говорить')
  t.equal(сказать.futureTense.first, 'скажу', here + 'perfective future = non-past')
  t.equal(сказать.gerund, 'сказав', here + 'gerund сказав')
  t.end()
})

test('gerund-tagging:', function (t) {
  let doc = nlp('читая книгу, он улыбался')
  t.equal(doc.match('#Gerund').text(), 'читая', here + 'читая is a gerund')
  t.end()
})
