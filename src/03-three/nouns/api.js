import { getNth } from '../verbs/api.js'

const keep = { tags: true }

const api = function (View) {
  class Nouns extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Nouns'
    }
    toPlural(n) {
      const { toPlural } = this.methods.two.transform.noun
      return getNth(this, n).map(m => {
        let str = m.text('normal')
        let plural = toPlural(str)
        if (plural !== str) {
          m = m.replaceWith(plural, keep)
        }
        return m
      })
    }
    toSingular(n) {
      const { toSingular } = this.methods.two.transform.noun
      return getNth(this, n).map(m => {
        let str = m.text('normal')
        let single = toSingular(str)
        if (single !== str) {
          m = m.replaceWith(single, keep)
        }
        return m
      })
    }
  }

  View.prototype.nouns = function (n) {
    let m = this.match('#Noun')
    // pronouns + names don't pluralize well
    m = m.not('#Pronoun')
    m = m.not('#ProperNoun')
    m = getNth(m, n)
    return new Nouns(this.document, m.pointer)
  }
}
export default api
