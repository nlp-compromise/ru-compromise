// is this a form of an adjective that we know? - 'красивой', 'синей', 'новом'
const adjectiveLookup = function (terms, i, world) {
  const term = terms[i]
  const forms = world.model.two.adjectiveForms || {}
  if (term.tags.size === 0 && forms.hasOwnProperty(term.normal)) {
    world.methods.one.setTag([term], 'Adjective', world, false, '2-adjective-form')
    term.confidence = 0.9
    return true
  }
  return null
}
export default adjectiveLookup
