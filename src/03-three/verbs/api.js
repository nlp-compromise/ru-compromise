export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

// get root form of adjective
const getRoot = function (m) {
  m.compute('root')
  let str = m.text('root')
  return str
}

const api = function (View) {
  class Verbs extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Verbs'
    }
    conjugate(n) {
      const methods = this.methods.two.transform.verb
      const { toPresent, toPast, toFuture, toImperative, toGerund, isPerfective, getAspectPair } = methods
      return getNth(this, n).map(m => {
        let str = getRoot(m, methods)
        let perfective = isPerfective(str)
        return {
          infinitive: str,
          aspect: perfective ? 'perfective' : 'imperfective',
          // the matching verb of the opposite aspect, if known
          aspectPair: getAspectPair(str),
          // for perfective verbs, non-past morphology is semantically future-tense
          presentTense: toPresent(str),
          futureTense: toFuture(str),
          pastTense: toPast(str),
          imperative: toImperative(str),
          gerund: toGerund(str),
        }
      }, [])
    }
  }

  View.prototype.verbs = function (n) {
    let m = this.match('#Verb+')
    m = getNth(m, n)
    return new Verbs(this.document, m.pointer)
  }
}
export default api