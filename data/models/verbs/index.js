
import presentTense from './present-tense.js'
import pastTense from './past-tense.js'
import imperative from './imperative.js'
// import futureTense from './future-tense.js'
// import conditional from './conditional.js'

const vbOrder = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']
const pastOrder = ['masc', 'fem', 'neut', 'plural']
const impOrder = ['second', 'secondPlural']
const todo = {
  presentTense: { data: presentTense, keys: vbOrder },
  pastTense: { data: pastTense, keys: pastOrder },
  imperative: { data: imperative, keys: impOrder },
}

// turn our conjugation data into word-pairs
let model = {}
Object.keys(todo).forEach(k => {
  model[k] = {}
  let { data, keys } = todo[k]
  keys.forEach((form, i) => {
    let pairs = []
    Object.keys(data).forEach(inf => {
      pairs.push([inf, data[inf][i]])
    })
    model[k][form] = pairs
    // console.log(k, form, pairs.length)
  })
})

export default model
