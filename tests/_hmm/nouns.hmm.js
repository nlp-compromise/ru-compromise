import test from 'tape'
import nlp from '../_lib.js'
const here = '[ru-nouns-hmm] '

test('decline:', function (t) {
  const arr = [
    // [word, case, want]
    ['цветок', 'genitive', 'цветка'], // fleeting vowel
    ['муж', 'instrumental', 'мужем'], // unstressed ending after a husher
    ['копьё', 'instrumental', 'копьём'],
  ]
  arr.forEach(a => {
    const [word, k, want] = a
    const obj = nlp(word).nouns().decline()[0] || {}
    t.equal(obj[k], want, here + `${word} ${k} → ${want}`)
  })
  t.end()
})

test('decline plural:', function (t) {
  const arr = [
    // [word, plural nominative, plural genitive]
    ['яблоко', 'яблоки', 'яблок'],
    ['поле', 'поля', 'полей'],
    ['ухо', 'уши', 'ушей'],
    ['плечо', 'плечи', 'плеч'],
    ['колено', 'колени', 'коленей'],
    ['сосед', 'соседи', 'соседей'],
    ['англичанин', 'англичане', 'англичан'],
    ['котёнок', 'котята', 'котят'],
    ['церковь', 'церкви', 'церквей'],
    ['платье', 'платья', 'платьев'],
    ['воскресенье', 'воскресенья', 'воскресений'],
    ['ружьё', 'ружья', 'ружей'],
  ]
  arr.forEach(a => {
    const [word, plNom, plGen] = a
    const obj = (nlp(word).nouns().decline()[0] || { plural: {} }).plural
    t.equal(obj.nominative, plNom, here + `${word} pl-nominative → ${plNom}`)
    t.equal(obj.genitive, plGen, here + `${word} pl-genitive → ${plGen}`)
  })
  t.end()
})

// nouns that only exist in the plural
test('pluralia tantum:', function (t) {
  const часы = nlp('часы').nouns().decline()[0] || {}
  t.equal(часы.genitive, 'часов', here + 'часы → часов')
  t.equal(часы.instrumental, 'часами', here + 'часы → часами')
  const деньги = nlp('деньги').nouns().decline()[0] || {}
  t.equal(деньги.genitive, 'денег', here + 'деньги → денег')
  t.end()
})

test('toPlural:', function (t) {
  const doc = nlp('яблоко')
  doc.nouns().toPlural()
  t.equal(doc.text(), 'яблоки', here + 'яблоко → яблоки')
  t.end()
})

test('toSingular:', function (t) {
  const arr = [
    ['машины', 'машина'],
    ['сёстры', 'сестра'],
    ['ночи', 'ночь'],
    ['врачи', 'врач'],
    ['музеи', 'музей'],
    ['яблоки', 'яблоко'],
    ['дети', 'ребёнок'],
  ]
  arr.forEach(a => {
    const [plural, single] = a
    const doc = nlp(plural)
    doc.nouns().toSingular()
    t.equal(doc.text(), single, here + plural + ' → ' + single)
  })
  t.end()
})
