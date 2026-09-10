import { getNth } from '../verbs/api.js'

const keep = { tags: true }

const swapWith = function (view, n, fn) {
  return getNth(view, n).map(m => {
    let str = m.text('normal')
    let out = fn(str)
    if (out !== str) {
      m = m.replaceWith(out, keep)
    }
    return m
  })
}

const api = function (View) {
  class Adjectives extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Adjectives'
    }
    toMasculine(n) {
      return swapWith(this, n, this.methods.two.transform.adjective.toMasculine)
    }
    toFeminine(n) {
      return swapWith(this, n, this.methods.two.transform.adjective.toFeminine)
    }
    toNeuter(n) {
      return swapWith(this, n, this.methods.two.transform.adjective.toNeuter)
    }
    toPlural(n) {
      return swapWith(this, n, this.methods.two.transform.adjective.toPlural)
    }
    toComparative(n) {
      return swapWith(this, n, this.methods.two.transform.adjective.toComparative)
    }
    toSuperlative(n) {
      return swapWith(this, n, this.methods.two.transform.adjective.toSuperlative)
    }
  }

  View.prototype.adjectives = function (n) {
    let m = this.match('#Adjective')
    m = getNth(m, n)
    return new Adjectives(this.document, m.pointer)
  }
}
export default api
