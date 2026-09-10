import test from 'tape'
import nlp from './_lib.js'
let here = '[tagger] '
nlp.verbose(false)

test('tagger:', function (t) {
  let arr = [
    // particles
    ['Он же знал', '#Pronoun #Particle #PastTense'],
    ['Ты ли это', '#Pronoun #Particle #Pronoun'],

    // modal predicatives
    ['Надо работать', '#Modal #Infinitive'],
    ['Нельзя курить', '#Modal #Infinitive'],
    ['Мне нужно уйти', '#Pronoun #Modal #Infinitive'],

    // imperatives, incl. reflexive
    ['Учись хорошо', '#Imperative #Adverb'],
    ['Не бойся', '#Negative #Imperative'],
    ['Давайте пойдём', '#Imperative #FutureTense'],

    // reflexive present-tense
    ['он учится в школе', '#Pronoun #PresentTense #Preposition #Noun'],
    ['мы занимаемся спортом', '#Pronoun #PresentTense #Noun'],

    // numeric ordinals
    ['5-й этаж', '#Ordinal #Noun'],
    ['встреча в 1990-х', '#Noun #Preposition #Ordinal'],

    // hyphenated adverbs + pronouns
    ['по-моему это хорошо', '#Adverb #Pronoun #Adverb'],
    ['что-то случилось', '#Pronoun #PastTense'],

    // dates
    ['В пятницу мы отдыхаем', '#Preposition #WeekDay #Pronoun #PresentTense'],
    ['5 января будет праздник', '#Cardinal #Month #Copula #Noun'],

    // stress-marks are normalized
    ['она сказа́ла', '#Pronoun #PastTense'],

    // web-tags in cyrillic
    ['#привет и @вася', '#HashTag #Conjunction #AtMention'],
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str)
    let tags = doc.json()[0].terms.map(term => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    let m = doc.match(match)
    t.equal(m.text(), doc.text(), here + msg)
  })
  t.end()
})
