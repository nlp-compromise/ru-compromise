
import presentTense from './present-tense.js'
import pastTense from './past-tense.js'
import imperative from './imperative.js'
import gerunds from './gerunds.js'
import participles from './participles.js'

const vbOrder = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']
const pastOrder = ['masc', 'fem', 'neut', 'plural']
const impOrder = ['second', 'secondPlural']
const gerundOrder = ['gerund']
const participleOrder = ['activePresent', 'activePast', 'passivePast']
const todo = {
  presentTense: { data: presentTense, keys: vbOrder },
  pastTense: { data: pastTense, keys: pastOrder },
  imperative: { data: imperative, keys: impOrder },
  gerund: { data: gerunds, keys: gerundOrder },
  participle: { data: participles, keys: participleOrder },
}

// turn our conjugation data into word-pairs
let model = {}
Object.keys(todo).forEach(k => {
  model[k] = {}
  let { data, keys } = todo[k]
  keys.forEach((form, i) => {
    let pairs = []
    Object.keys(data).forEach(inf => {
      // not every verb has every form (perfectives lack a present-gerund..)
      if (data[inf][i]) {
        pairs.push([inf, data[inf][i]])
      }
    })
    model[k][form] = pairs
    // console.log(k, form, pairs.length)
  })
})

export default model
