// npm install papaparse --no-save
import Papa from 'papaparse'
import fs from 'fs'

let file = '/Users/spencer/mountain/ru-compromise/learn/conjugation/verbs.csv'
let csv = fs.readFileSync(file).toString()
let data = Papa.parse(csv, { delimiter: ";", header: true }).data

let inf = 'Инфинитив'
let first = 'Я'
let second = 'Ты'
let third = 'Он/Она/Оно'
let firstPlural = 'Мы'
let secondPlural = 'Вы'
let thirdPlural = 'Они'
let imperative1 = 'Повелительное накл. 1'
let imperative2 = 'Повелительное накл. 2'

let all = {}
data.forEach(o => {
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