/* eslint-disable no-console */
// generates:
//   data/models/verbs/past-tense.js  - [masc, fem, neut, plural] for each infinitive
//   data/models/verbs/imperative.js  - [second, secondPlural] from verbs.csv
//   data/models/verbs/aspect.js      - list of perfective infinitives, from verbs.csv
// run:  node ./learn/conjugation/generate.js
import fs from 'fs'
import presentTense from '../../data/models/verbs/present-tense.js'

// ---------- past tense ----------

// hand-checked irregular past forms
const irregulars = {
  'идти': ['шёл', 'шла', 'шло', 'шли'],
  'прочесть': ['прочёл', 'прочла', 'прочло', 'прочли'],
  'счесть': ['счёл', 'сочла', 'сочло', 'сочли'],
  'жечь': ['жёг', 'жгла', 'жгло', 'жгли'],
  'сжечь': ['сжёг', 'сожгла', 'сожгло', 'сожгли'],
  'зажечь': ['зажёг', 'зажгла', 'зажгло', 'зажгли'],
  'поджечь': ['поджёг', 'подожгла', 'подожгло', 'подожгли'],
  'грести': ['грёб', 'гребла', 'гребло', 'гребли'],
  'скрести': ['скрёб', 'скребла', 'скребло', 'скребли'],
  'ошибиться': ['ошибся', 'ошиблась', 'ошиблось', 'ошиблись'],
  'ушибиться': ['ушибся', 'ушиблась', 'ушиблось', 'ушиблись'],
  'стеречь': ['стерёг', 'стерегла', 'стерегло', 'стерегли'],
  'толочь': ['толок', 'толкла', 'толкло', 'толкли'],
}

// verb-final stems with mobile/irregular past forms
// matched as suffix of the infinitive; вы- prefix de-stresses ё → е
const stemMap = [
  ['йти', ['шёл', 'шла', 'шло', 'шли']],
  ['нести', ['нёс', 'несла', 'несло', 'несли']],
  ['везти', ['вёз', 'везла', 'везло', 'везли']],
  ['вести', ['вёл', 'вела', 'вело', 'вели']],
  ['расти', ['рос', 'росла', 'росло', 'росли']],
  ['цвести', ['цвёл', 'цвела', 'цвело', 'цвели']],
  ['мочь', ['мог', 'могла', 'могло', 'могли']],
  ['лечь', ['лёг', 'легла', 'легло', 'легли']],
  ['печь', ['пёк', 'пекла', 'пекло', 'пекли']],
  ['течь', ['тёк', 'текла', 'текло', 'текли']],
  ['беречь', ['берёг', 'берегла', 'берегло', 'берегли']],
  ['стричь', ['стриг', 'стригла', 'стригло', 'стригли']],
  ['влечь', ['влёк', 'влекла', 'влекло', 'влекли']],
  ['стичь', ['стиг', 'стигла', 'стигло', 'стигли']],
  ['тереть', ['тёр', 'тёрла', 'тёрло', 'тёрли']],
  ['сечь', ['сёк', 'секла', 'секло', 'секли']],
  ['прячь', ['пряг', 'прягла', 'прягло', 'прягли']],
  ['бречь', ['брёг', 'брегла', 'брегло', 'брегли']],
  ['брести', ['брёл', 'брела', 'брело', 'брели']],
  ['мести', ['мёл', 'мела', 'мело', 'мели']],
  ['плести', ['плёл', 'плела', 'плело', 'плели']],
  ['блюсти', ['блюл', 'блюла', 'блюло', 'блюли']],
]

// -нуть verbs that drop 'ну' in the past  (исчезнуть → исчез)
const nuDrop = new Set([
  'исчезнуть', 'привыкнуть', 'отвыкнуть', 'погибнуть', 'гибнуть', 'возникнуть',
  'замёрзнуть', 'мёрзнуть', 'засохнуть', 'сохнуть', 'достигнуть', 'проникнуть',
  'промокнуть', 'мокнуть', 'ослепнуть', 'оглохнуть', 'глохнуть', 'погаснуть',
  'гаснуть', 'умолкнуть', 'смолкнуть', 'воскреснуть', 'окрепнуть', 'крепнуть',
  'утихнуть', 'стихнуть', 'затихнуть', 'привыкнуть', 'вымокнуть', 'озябнуть',
])

const deStress = (str) => str.replace(/ё/g, 'е')

const toPast = function (inf) {
  if (irregulars[inf]) {
    return irregulars[inf]
  }
  // reflexive - conjugate the base, re-attach ся/сь
  if (/(ться|тись|чься)$/.test(inf)) {
    let base = inf.replace(/(ся|сь)$/, '')
    let forms = toPast(base)
    if (!forms) {
      return null
    }
    return forms.map(f => (/[аеёиоуыэюя]$/.test(f) ? f + 'сь' : f + 'ся'))
  }
  // consonant-stem endings with known past forms
  for (let [suff, forms] of stemMap) {
    if (inf.endsWith(suff)) {
      let prefix = inf.slice(0, inf.length - suff.length)
      let out = forms.map(f => prefix + f)
      if (prefix.startsWith('вы')) {
        out = out.map(deStress)
      }
      return out
    }
  }
  // сесть → сел, класть → клал, упасть → упал
  if (inf.endsWith('сть')) {
    let base = inf.slice(0, -3)
    return [base + 'л', base + 'ла', base + 'ло', base + 'ли']
  }
  // лезть → лез, грызть → грыз
  if (inf.endsWith('зть')) {
    let base = inf.slice(0, -3)
    return [base + 'з', base + 'зла', base + 'зло', base + 'зли']
  }
  // спасти → спас, трясти → тряс
  if (inf.endsWith('сти')) {
    let base = inf.slice(0, -3)
    return [base + 'с', base + 'сла', base + 'сло', base + 'сли']
  }
  // ползти → полз
  if (inf.endsWith('зти')) {
    let base = inf.slice(0, -3)
    return [base + 'з', base + 'зла', base + 'зло', base + 'зли']
  }
  // умереть → умер, запереть → запер
  if (inf.endsWith('ереть')) {
    let base = inf.slice(0, -3)
    return [base, base + 'ла', base + 'ло', base + 'ли']
  }
  // исчезнуть → исчез
  if (inf.endsWith('нуть') && nuDrop.has(inf)) {
    let base = inf.slice(0, -4)
    return [base, base + 'ла', base + 'ло', base + 'ли']
  }
  // regular:  читать → читал, читала, читало, читали
  if (inf.endsWith('ть')) {
    let base = inf.slice(0, -2)
    return [base + 'л', base + 'ла', base + 'ло', base + 'ли']
  }
  // unknown consonant-stem (-ти, -чь) - safer to skip than to guess wrong
  return null
}

let past = {}
let skipped = []
Object.keys(presentTense).forEach(inf => {
  let forms = toPast(inf)
  if (forms) {
    past[inf] = forms
  } else {
    skipped.push(inf)
  }
})

// ---------- imperative + aspect, from verbs.csv ----------

// minimal csv parser (semicolon-delimited, double-quoted fields)
const parseCsv = function (str) {
  let rows = []
  let row = []
  let cell = ''
  let inQuote = false
  for (let i = 0; i < str.length; i += 1) {
    let c = str[i]
    if (inQuote) {
      if (c === '"') {
        inQuote = false
      } else {
        cell += c
      }
    } else if (c === '"') {
      inQuote = true
    } else if (c === ';') {
      row.push(cell)
      cell = ''
    } else if (c === '\n') {
      row.push(cell.replace(/\r$/, ''))
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += c
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

let csv = fs.readFileSync(new URL('./verbs.csv', import.meta.url)).toString()
let rows = parseCsv(csv)
let header = rows[0]
const col = (name) => header.findIndex(h => h.trim() === name)
const iInf = col('Инфинитив')
const iImp1 = col('Повелительное накл. 1')
const iImp2 = col('Повелительное накл. 2')
const iAspect = col('Совершенный вид')
const iPair = col('Пара аспектов')
const iGerPres = col('Деепричастие Наст. время')
const iGerPast = col('Деепричастие Прош. время')
const iPartActPres = col('Действит. причастие Наст. время')
const iPartActPast = col('Действит. причастие Прош. время')
const iPartPassPast = col('Страдат. причастие Прош. время')

const isWord = (str) => /^[а-яё-]+$/i.test(str || '')

// corrections for corrupt csv rows
const imperativeOverrides = {
  'написать': ['напиши', 'напишите'],
}

let imperative = {}
let perfective = []
let aspectPairs = {}
let gerunds = {}
let participles = {}
rows.slice(1).forEach(r => {
  let inf = (r[iInf] || '').trim()
  if (!inf || !presentTense[inf]) {
    return
  }
  let imp1 = (r[iImp1] || '').trim()
  let imp2 = (r[iImp2] || '').trim()
  if (imperativeOverrides[inf]) {
    imperative[inf] = imperativeOverrides[inf]
  } else if (isWord(imp1) && isWord(imp2)) {
    imperative[inf] = [imp1, imp2]
  }
  let aspect = (r[iAspect] || '').trim()
  let isPerfective = /^совер/.test(aspect)
  if (isPerfective) {
    perfective.push(inf)
  }
  // 'писать/написать' - keyed by the imperfective side
  let pair = (r[iPair] || '').trim()
  let m = pair.match(/^([а-яё]+)\/([а-яё]+)$/)
  if (m && !aspectPairs[m[1]]) {
    aspectPairs[m[1]] = m[2]
  }
  // деепричастия - present-gerund for imperfectives (читая), past-gerund for perfectives (прочитав)
  let gerPres = (r[iGerPres] || '').trim()
  let gerPast = (r[iGerPast] || '').trim()
  let ger = isPerfective ? gerPast : gerPres
  if (isWord(ger)) {
    gerunds[inf] = [ger]
  }
  // причастия - [active-present, active-past, passive-past]
  let actPres = (r[iPartActPres] || '').trim()
  let actPast = (r[iPartActPast] || '').trim()
  let passPast = (r[iPartPassPast] || '').trim()
  if (isWord(actPres) || isWord(actPast) || isWord(passPast)) {
    participles[inf] = [
      isWord(actPres) ? actPres : '',
      isWord(actPast) ? actPast : '',
      isWord(passPast) ? passPast : '',
    ]
  }
})

// ---------- write files ----------

const stringify = function (obj) {
  let lines = Object.keys(obj).map(k => `  "${k}": ${JSON.stringify(obj[k])}`)
  return `export default {\n${lines.join(',\n')}\n}\n`
}

const banner = '// generated by ./learn/conjugation/generate.js\n'
fs.writeFileSync(new URL('../../data/models/verbs/past-tense.js', import.meta.url), banner + stringify(past))
fs.writeFileSync(new URL('../../data/models/verbs/imperative.js', import.meta.url), banner + stringify(imperative))
fs.writeFileSync(new URL('../../data/models/verbs/gerunds.js', import.meta.url), banner + stringify(gerunds))
fs.writeFileSync(new URL('../../data/models/verbs/participles.js', import.meta.url), banner + stringify(participles))
fs.writeFileSync(new URL('../../data/models/verbs/aspect-pairs.js', import.meta.url), banner + stringify(aspectPairs))
fs.writeFileSync(
  new URL('../../data/models/verbs/aspect.js', import.meta.url),
  banner + 'export default ' + JSON.stringify(perfective, null, 0).replace(/","/g, '",\n  "') + '\n'
)

console.log('past-tense:', Object.keys(past).length, ' skipped:', skipped.length, skipped.join(' '))
console.log('imperative:', Object.keys(imperative).length)
console.log('perfective:', perfective.length)
console.log('aspect-pairs:', Object.keys(aspectPairs).length)
console.log('gerunds:', Object.keys(gerunds).length)
console.log('participles:', Object.keys(participles).length)
// spot-checks
const checks = ['быть', 'идти', 'пойти', 'выйти', 'мочь', 'нести', 'вынести', 'учиться', 'вернуться', 'исчезнуть', 'вернуть', 'умереть', 'сесть', 'лезть', 'жечь', 'обойтись', 'произойти']
checks.forEach(k => console.log(' ', k, '→', past[k] ? past[k].join(', ') : '(skipped)'))
