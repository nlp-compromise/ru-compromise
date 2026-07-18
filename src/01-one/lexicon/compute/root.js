
// tag-name → conjugation-model key
const tagToForm = {
  FirstPerson: 'first',
  SecondPerson: 'second',
  ThirdPerson: 'third',
  FirstPersonPlural: 'firstPlural',
  SecondPersonPlural: 'secondPlural',
  ThirdPersonPlural: 'thirdPlural',
}

const verbForm = function (term) {
  let found = Object.keys(tagToForm).find(tag => term.tags.has(tag))
  return found ? tagToForm[found] : null
}


const root = function (view) {
  const { verb } = view.world.methods.two.transform
  view.docs.forEach(terms => {
    terms.forEach(term => {
      let str = term.implicit || term.normal || term.text

      // get infinitive form of the verb
      if (term.tags.has('Verb')) {
        if (term.tags.has('Infinitive')) {
          term.root = str
        } else if (term.tags.has('PastTense')) {
          term.root = verb.fromPast(str)
        } else if (term.tags.has('Imperative')) {
          term.root = verb.fromImperative(str)
        } else if (term.tags.has('PresentTense')) {
          term.root = verb.fromPresent(str, verbForm(term))
        } else {
          // guess!
          term.root = verb.fromPresent(str, verbForm(term))
        }
      }
    })
  })
  return view
}
export default root