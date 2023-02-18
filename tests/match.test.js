import test from 'tape'
import nlp from './_lib.js'
let here = '[es-match] '
nlp.verbose(false)

test('match:', function (t) {
  let arr = [
    ['spencer', '#Person'],
    ['Я читаю', '#Pronoun #PresentTense'],// i read
    ['Мы читаем', '#Pronoun #PresentTense'],//we read
    ['Ты читаешь', '#Pronoun #PresentTense'],//you are reading
    ['Вы читаете', '#Pronoun #PresentTense'],//you are reading
    ['Он читает', '#Pronoun #PresentTense'],//he are reading
    ['она читает', '#Pronoun #PresentTense'],//she are reading
    ['оно читает', '#Pronoun #PresentTense'],//it are reading
    ['Они читают', '#Pronoun #PresentTense'],//they are reading

    ['Я говорю́', '#Pronoun #PresentTense'],// i speak
    ['Мы говори́м', '#Pronoun #PresentTense'],// we speak
    ['Ты говори́шь', '#Pronoun #PresentTense'],// 
    ['Вы говори́те', '#Pronoun #PresentTense'],// 
    ['Он говори́т', '#Pronoun #PresentTense'],// 
    ['Они говоря́т', '#Pronoun #PresentTense'],// 

    ['Я ви́жу', '#Pronoun #PresentTense'],// i see
    ['Мы ви́дим', '#Pronoun #PresentTense'],// we see

    ['Я тебя люблю', '#Pronoun #Noun #PresentTense'],//I like you -
    ['Вы мне говорите', '#Pronoun #Noun #PresentTense'],//You talk to me
    ['Вы говорите обо мне', '#Pronoun #PresentTense #Preposition #Noun'],//You talk about me
    ['Вы говорите со мной', '#Pronoun #PresentTense #Preposition #Noun'],//You talk with me

    ['Мой стул', '#Pronoun #Noun'], //'My chair
    ['Моя собака', '#Pronoun #Noun'], //'My dog
    ['Моё платье', '#Pronoun #Noun'], //'My dress
    ['Мои книги', '#Pronoun #Noun'], //'My books
    ['Его стул', '#Pronoun #Noun'], //'His chair
    ['Его книги', '#Pronoun #Noun'], //'His books
    ['мы говорим о его книгах', '#Pronoun #PresentTense #Preposition #Pronoun #Noun'],//we talk about his books

    ['суп и картошку', '#Noun #Conjunction #Noun'], //soup and potatoes
    ['Она красивая, но глупая', '#Pronoun #Adjective #Conjunction #Adjective '], //she is beautiful but stupid
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str)//.compute('tagRank')
    let tags = doc.json()[0].terms.map(term => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    let m = doc.match(match)
    t.equal(m.text(), doc.text(), here + msg)
  })
  t.end()
})
