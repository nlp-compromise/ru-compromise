import test from 'tape'
import nlp from '../../_lib.js'
const here = '[ru-paradigm] '
nlp.verbose(false)

const cases = ['nominative', 'genitive', 'dative', 'accusative', 'instrumental', 'prepositional']

// [singular: nom, gen, dat, acc, instr, prep], [plural: nom, gen, dat, instr, prep]
const arr = [
  // masculine, hard
  [['дом', 'дома', 'дому', 'дом', 'домом', 'доме'], ['дома', 'домов', 'домам', 'домами', 'домах']],
  [['город', 'города', 'городу', 'город', 'городом', 'городе'], ['города', 'городов', 'городам', 'городами', 'городах']],
  [['лес', 'леса', 'лесу', 'лес', 'лесом', 'лесе'], ['леса', 'лесов', 'лесам', 'лесами', 'лесах']],
  // masculine, animate
  [['студент', 'студента', 'студенту', 'студента', 'студентом', 'студенте'], ['студенты', 'студентов', 'студентам', 'студентами', 'студентах']],
  [['врач', 'врача', 'врачу', 'врача', 'врачом', 'враче'], ['врачи', 'врачей', 'врачам', 'врачами', 'врачах']],
  [['брат', 'брата', 'брату', 'брата', 'братом', 'брате'], ['братья', 'братьев', 'братьям', 'братьями', 'братьях']],
  // suppletive plurals
  [['ребёнок', 'ребёнка', 'ребёнку', 'ребёнка', 'ребёнком', 'ребёнке'], ['дети', 'детей', 'детям', 'детьми', 'детях']],
  // masculine in -ь
  [['путь', 'пути', 'пути', 'путь', 'путём', 'пути'], ['пути', 'путей', 'путям', 'путями', 'путях']],
  // feminine
  [['машина', 'машины', 'машине', 'машину', 'машиной', 'машине'], ['машины', 'машин', 'машинам', 'машинами', 'машинах']],
  [['кошка', 'кошки', 'кошке', 'кошку', 'кошкой', 'кошке'], ['кошки', 'кошек', 'кошкам', 'кошками', 'кошках']],
  [['собака', 'собаки', 'собаке', 'собаку', 'собакой', 'собаке'], ['собаки', 'собак', 'собакам', 'собаками', 'собаках']],
  // feminine in -ь
  [['дверь', 'двери', 'двери', 'дверь', 'дверью', 'двери'], ['двери', 'дверей', 'дверям', 'дверями', 'дверях']],
  [['лошадь', 'лошади', 'лошади', 'лошадь', 'лошадью', 'лошади'], ['лошади', 'лошадей', 'лошадям', 'лошадьми', 'лошадях']],
  [['дочь', 'дочери', 'дочери', 'дочь', 'дочерью', 'дочери'], ['дочери', 'дочерей', 'дочерям', 'дочерями', 'дочерях']],
  // neuter
  [['море', 'моря', 'морю', 'море', 'морем', 'море'], ['моря', 'морей', 'морям', 'морями', 'морях']],
  [['имя', 'имени', 'имени', 'имя', 'именем', 'имени'], ['имена', 'имён', 'именам', 'именами', 'именах']],
]

test('full paradigm:', function (t) {
  arr.forEach(a => {
    const [sing, plur] = a
    const obj = nlp(sing[0]).nouns().decline()[0]
    cases.forEach((k, i) => {
      t.equal(obj[k], sing[i], here + `${sing[0]} ${k} → ${sing[i]}`)
    })
    const [plNom, plGen, plDat, plInstr, plPrep] = plur
    t.equal(obj.plural.nominative, plNom, here + `${sing[0]} pl-nominative → ${plNom}`)
    t.equal(obj.plural.genitive, plGen, here + `${sing[0]} pl-genitive → ${plGen}`)
    t.equal(obj.plural.dative, plDat, here + `${sing[0]} pl-dative → ${plDat}`)
    t.equal(obj.plural.instrumental, plInstr, here + `${sing[0]} pl-instrumental → ${plInstr}`)
    t.equal(obj.plural.prepositional, plPrep, here + `${sing[0]} pl-prepositional → ${plPrep}`)
  })
  t.end()
})

test('decline shape:', function (t) {
  const res = nlp('кошка и стол').nouns().decline()
  t.equal(res.length, 2, here + 'one result per noun')
  t.deepEqual(Object.keys(res[0]).sort(), [...cases, 'plural'].sort(), here + 'six cases + plural')
  t.deepEqual(Object.keys(res[0].plural).sort(), [...cases].sort(), here + 'six plural cases')
  t.equal(nlp('кошка и стол').nouns().decline(1)[0].nominative, 'стол', here + 'decline(n)')
  t.deepEqual(nlp('очень быстро').nouns().decline(), [], here + 'empty decline')
  // does not change the document
  const doc = nlp('кошка спит')
  doc.nouns().decline()
  t.equal(doc.text(), 'кошка спит', here + 'decline does not mutate')
  t.end()
})

test('irregular plurals:', function (t) {
  const list = [
    ['дерево', 'деревья'],
    ['стул', 'стулья'],
    ['сын', 'сыновья'],
    ['брат', 'братья'],
    ['ребёнок', 'дети'],
    ['мать', 'матери'],
    ['дочь', 'дочери'],
    ['имя', 'имена'],
    ['учитель', 'учителя'],
    ['день', 'дни'],
    ['ухо', 'уши'],
    ['глаз', 'глаза'],
    ['яйцо', 'яйца'],
    ['лицо', 'лица'],
    ['письмо', 'письма'],
  ]
  list.forEach(a => {
    const [single, plural] = a
    const doc = nlp(single)
    doc.nouns().toPlural()
    t.equal(doc.text(), plural, here + single + ' → ' + plural)
  })
  t.end()
})

test('irregular singulars:', function (t) {
  const list = [
    ['братья', 'брат'],
    ['друзья', 'друг'],
    ['деревья', 'дерево'],
    ['стулья', 'стул'],
    ['моря', 'море'],
    ['учителя', 'учитель'],
    ['кошки', 'кошка'],
    ['собаки', 'собака'],
    ['недели', 'неделя'],
    ['письма', 'письмо'],
    ['здания', 'здание'],
  ]
  list.forEach(a => {
    const [plural, single] = a
    const doc = nlp(plural)
    doc.nouns().toSingular()
    t.equal(doc.text(), single, here + plural + ' → ' + single)
  })
  t.end()
})

test('noun filters:', function (t) {
  const doc = nlp('кошка и стол и окно и врач')
  t.deepEqual(doc.nouns().out('array'), ['кошка', 'стол', 'окно', 'врач'], here + 'nouns()')
  t.deepEqual(doc.nouns().gender(), ['feminine', 'masculine', 'neuter', 'masculine'], here + 'gender()')
  t.deepEqual(doc.nouns().isFeminine().out('array'), ['кошка'], here + 'isFeminine()')
  t.deepEqual(doc.nouns().isMasculine().out('array'), ['стол', 'врач'], here + 'isMasculine()')
  t.deepEqual(doc.nouns().isNeuter().out('array'), ['окно'], here + 'isNeuter()')
  t.deepEqual(doc.nouns().isAnimate().out('array'), ['кошка', 'врач'], here + 'isAnimate()')
  t.equal(doc.nouns(2).text(), 'окно', here + 'nouns(n)')
  t.equal(nlp('море и имя').nouns().isNeuter().length, 2, here + 'море, имя neuter')
  t.equal(nlp('стол и дверь').nouns().isNeuter().found, false, here + 'no neuters')
  t.end()
})
