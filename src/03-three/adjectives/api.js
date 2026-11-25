import { getNth } from '../verbs/api.js'

// keep the tags, and a sentence-initial capital - 'Новый дом' → 'Новые дом'
const keep = { tags: true, case: true }

// every form of 'самый' - an adjective beside one is already superlative
const samyj = /^сам(ый|ая|ое|ые|ого|ому|ую|ым|ом|ой|ых|ыми)$/
// endings that a feminine noun takes in the oblique cases - 'комнаты', 'комнате', 'дверью'
const femOblique = /([ыие]|ью)$/

const swapWith = function (view, n, fn) {
  return getNth(view, n).map(m => {
    const str = m.text('normal')
    const out = fn(str)
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
      const { toSuperlative } = this.methods.two.transform.adjective
      return getNth(this, n).map(m => {
        const str = m.text('normal')
        // 'самая красивая' is already there
        if (samyj.test(m.lookBehind('.$').text('normal'))) {
          return m
        }
        // 'большой' is masculine, or an oblique feminine - 'в большой комнате'
        const isFeminine = femOblique.test(m.lookAhead('^#Noun').text('normal'))
        const out = toSuperlative(str, isFeminine)
        if (out !== str) {
          m = m.replaceWith(out, keep)
        }
        return m
      })
    }
  }

  View.prototype.adjectives = function (n) {
    let m = this.match('#Adjective')
    m = getNth(m, n)
    return new Adjectives(this.document, m.pointer)
  }
}
export default api
