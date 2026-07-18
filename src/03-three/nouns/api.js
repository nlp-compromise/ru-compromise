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
    // gender of each noun - from the lexicon-tag, else the ending
    gender(n) {
      const { guessGender } = this.methods.two.transform.noun
      return getNth(this, n).map(m => {
        if (m.has('#FemaleNoun')) {
          return 'feminine'
        }
        if (m.has('#MaleNoun')) {
          return 'masculine'
        }
        if (m.has('#NeuterNoun')) {
          return 'neuter'
        }
        return guessGender(m.text('normal'))
      }, [])
    }
    isFeminine(n) {
      let genders = this.gender()
      let res = this.filter((m, i) => genders[i] === 'feminine')
      return getNth(res, n)
    }
    isMasculine(n) {
      let genders = this.gender()
      let res = this.filter((m, i) => genders[i] === 'masculine')
      return getNth(res, n)
    }
    isNeuter(n) {
      let genders = this.gender()
      let res = this.filter((m, i) => genders[i] === 'neuter')
      return getNth(res, n)
    }
    // full singular case-table for each noun
    decline(n) {
      const { decline } = this.methods.two.transform.noun
      const { toPlural } = this.methods.two.transform.noun
      let genders = this.gender()
      return getNth(this, n).map((m, i) => {
        let str = m.text('normal')
        let res = decline(str, genders[i])
        res.plural = toPlural(str)
        return res
      }, [])
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
