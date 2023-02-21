
const verbForm = function (term) {
  let want = [
    'FirstPerson',
    'SecondPerson',
    'ThirdPerson',
    'FirstPersonPlural',
    'SecondPersonPlural',
    'ThirdPersonPlural',
  ]
  return want.find(tag => term.tags.has(tag))
}


const root = function (view) {
  const { verb, noun, adjective } = view.world.methods.two.transform
  view.docs.forEach(terms => {
    terms.forEach(term => {
      let str = term.implicit || term.normal || term.text

      // get infinitive form of the verb
      if (term.tags.has('Verb')) {
        let form = verbForm(term)
        if (term.tags.has('PresentTense')) {
          term.root = verb.fromPresent(str, form)
        } else {
          // guess!
          term.root = verb.fromPresent(str, form)
        }
      }
    })
  })
  return view
}
export default root