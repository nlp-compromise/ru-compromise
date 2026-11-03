// npm install papaparse --no-save
import Papa from 'papaparse'
import fs from 'node:fs'

const file = '/Users/spencer/mountain/ru-compromise/learn/conjugation/verbs.csv'
const csv = fs.readFileSync(file).toString()
const data = Papa.parse(csv, { delimiter: ";", header: true }).data

const inf = 'Инфинитив'
const first = 'Я'
const second = 'Ты'
const third = 'Он/Она/Оно'
const firstPlural = 'Мы'
const secondPlural = 'Вы'
const thirdPlural = 'Они'
const imperative1 = 'Повелительное накл. 1'
const imperative2 = 'Повелительное накл. 2'

const all = {}
data.forEach(o => {
  // NOTE: the 'Мы' and 'Вы' columns in verbs.csv contain each-other's data
  // (мочь row has Мы=можете, Вы=можем) - so we read them swapped, on purpose.
  // if the csv is ever re-exported, re-check this.
  all[o[inf]] = [
    o[first],
    o[second],
    o[third],
    o[secondPlural],//swapped
    o[firstPlural],//swapped
    o[thirdPlural],
  ]
})
Object.keys(all).forEach(k => {
  all[k] = all[k].filter(str => str)
  if (all[k].length !== 6) {
    delete all[k]
  }
})
// console.log(all['танцевать'])
// console.log(all['мешать'])
console.log(JSON.stringify(all, null, 2))