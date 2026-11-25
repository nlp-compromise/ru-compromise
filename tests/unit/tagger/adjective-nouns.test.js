import test from 'tape'
import nlp from '../../_lib.js'
const here = '[adjective-nouns] '
nlp.verbose(false)

// nouns share their endings with the oblique adjectives - '-ой', '-ей', '-ом', '-ем'
test('nouns that end like an adjective:', function (t) {
  const arr = [
    // feminine instrumental
    'книгой', 'девушкой', 'землёй', 'землей', 'семьёй', 'семьей', 'рукой', 'страной',
    // genitive plural
    'друзей', 'людей', 'детей', 'ночей', 'дней', 'вещей', 'ключей',
    // masculine nominative
    'герой', 'музей', 'бой', 'чай', 'край', 'воробей', 'покой', 'ручей',
    // masculine instrumental
    'домом', 'столом', 'словарём', 'учителем',
    // nominative in -ом
    'паром', 'альбом', 'диплом',
    // more often a noun than an adjective
    'злом', 'добром', 'долгом', 'золотом',
  ]
  arr.forEach(str => {
    const doc = nlp(str)
    t.equal(doc.has('#Noun'), true, here + str + ' is a noun')
    t.equal(doc.has('#Adjective'), false, here + str + ' is no adjective')
  })
  t.end()
})

test('two nouns in a row:', function (t) {
  const arr = [
    'с книгой друга',
    'с книгой подруги',
    'с девушкой мечты',
    'рукой мамы',
    'главой семьи',
    'причиной аварии',
    'с женой брата',
    'с сестрой жены',
    'за стеной крепости',
    'доской почёта',
    'с башней крепости',
    'с подругой Мариной',
    'с землёй отцов',
    'с семьёй сестры',
    'у друзей семьи',
    'много людей науки',
    'для детей школы',
    'у ключей квартиры',
    'степеней свободы',
    'пять ночей и десять дней',
    'герой войны',
    'музей истории',
    'ходили в музей истории',
    'бой эпохи',
    'в бой армии',
    'край земли',
    'воробей на ветке',
    'был героем страны',
    'на паром компании',
    'в альбом сестре',
    'с домом и столом',
    'над столом стены',
    'со злом и добром',
    'он шёл с долгом',
  ]
  arr.forEach(str => {
    t.equal(nlp(str).has('#Adjective'), false, here + str)
  })
  t.end()
})

// punctuation stops a context-rule
test('not across punctuation:', function (t) {
  t.equal(nlp('у пушистой, кошки').has('#Adjective'), false, here + 'comma after')
  t.equal(nlp('в, пушистом свитере').has('#Adjective'), false, here + 'comma before')
  t.end()
})
