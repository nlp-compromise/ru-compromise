import { getNth } from '../verbs/api.js'

const keep = { tags: true }

// singular determiner-forms → plural
const detPlural = {
  'этот': 'эти', 'эта': 'эти', 'это': 'эти',
  'тот': 'те', 'та': 'те', 'то': 'те',
  'весь': 'все', 'вся': 'все', 'всё': 'все', 'все': 'все',
  'мой': 'мои', 'моя': 'мои', 'моё': 'мои', 'мое': 'мои',
  'твой': 'твои', 'твоя': 'твои', 'твоё': 'твои', 'твое': 'твои',
  'наш': 'наши', 'наша': 'наши', 'наше': 'наши',
  'ваш': 'ваши', 'ваша': 'ваши', 'ваше': 'ваши',
  'свой': 'свои', 'своя': 'свои', 'своё': 'свои', 'свое': 'свои',
  'какой': 'какие', 'какая': 'какие', 'какое': 'какие',
  'такой': 'такие', 'такая': 'такие', 'такое': 'такие',
}
// plural determiner-forms → singular, by gender
const detSingular = {
  'эти': { masculine: 'этот', feminine: 'эта', neuter: 'это' },
  'те': { masculine: 'тот', feminine: 'та', neuter: 'то' },
  'все': { masculine: 'весь', feminine: 'вся', neuter: 'всё' },
  'мои': { masculine: 'мой', feminine: 'моя', neuter: 'моё' },
  'твои': { masculine: 'твой', feminine: 'твоя', neuter: 'твоё' },
  'наши': { masculine: 'наш', feminine: 'наша', neuter: 'наше' },
  'ваши': { masculine: 'ваш', feminine: 'ваша', neuter: 'ваше' },
  'свои': { masculine: 'свой', feminine: 'своя', neuter: 'своё' },
  'какие': { masculine: 'какой', feminine: 'какая', neuter: 'какое' },
  'такие': { masculine: 'такой', feminine: 'такая', neuter: 'такое' },
}

// re-agree the words modifying + governed-by this noun
const agreeAround = function (m, methods, form) {
  const { adjective, verb } = methods
  // preceding adjectives + determiners  ('новая' in 'новая книга')
  const mods = m.before('(#Adjective|#Determiner|#Possessive)+$')
  mods.terms().forEach(t => {
    const str = t.text('normal')
    if (detPlural[str] !== undefined || detSingular[str] !== undefined) {
      const out = form.plural ? detPlural[str] : (detSingular[str] || {})[form.gender]
      if (out) {
        t.replaceWith(out, keep)
      }
      return
    }
    const fns = {
      plural: adjective.toPlural,
      masculine: adjective.toMasculine,
      feminine: adjective.toFeminine,
      neuter: adjective.toNeuter,
    }
    const fn = form.plural ? fns.plural : fns[form.gender]
    const out = fn(str)
    if (out !== str) {
      t.replaceWith(out, keep)
    }
  })
  // the verb right after the noun  ('лежала' in 'книга лежала на столе')
  const vb = m.after('^(#Adverb|#Negative)? [#Verb]', 0)
  if (!vb.found) {
    return
  }
  vb.compute('root')
  let root = vb.text('root')
  if (vb.has('#Copula')) {
    root = 'быть'
  }
  if (vb.has('#PastTense')) {
    const slot = form.plural ? 'plural' : { masculine: 'masc', feminine: 'fem', neuter: 'neut' }[form.gender]
    vb.replaceWith(verb.toPast(root)[slot])
  } else if (vb.has('#ThirdPerson') && form.plural) {
    vb.replaceWith(verb.toPresent(root).thirdPlural)
  } else if (vb.has('#ThirdPersonPlural') && !form.plural) {
    vb.replaceWith(verb.toPresent(root).third)
  }
}

const api = function (View) {
  class Nouns extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Nouns'
    }
    toPlural(n) {
      const methods = this.methods.two.transform
      return getNth(this, n).map(m => {
        // a preceding preposition signals an oblique case ('на столе') - leave it
        if (m.before('#Preposition$').found) {
          return m
        }
        const str = m.text('normal')
        const plural = methods.noun.toPlural(str)
        if (plural !== str) {
          agreeAround(m, methods, { plural: true })
          m = m.replaceWith(plural, keep)
        }
        return m
      })
    }
    toSingular(n) {
      const methods = this.methods.two.transform
      return getNth(this, n).map(m => {
        // a preceding preposition signals an oblique case - leave it
        if (m.before('#Preposition$').found) {
          return m
        }
        const str = m.text('normal')
        const single = methods.noun.toSingular(str)
        if (single !== str) {
          const gender = methods.noun.guessGender(single)
          agreeAround(m, methods, { plural: false, gender })
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
      const genders = this.gender()
      const res = this.filter((m, i) => genders[i] === 'feminine')
      return getNth(res, n)
    }
    isMasculine(n) {
      const genders = this.gender()
      const res = this.filter((m, i) => genders[i] === 'masculine')
      return getNth(res, n)
    }
    isNeuter(n) {
      const genders = this.gender()
      const res = this.filter((m, i) => genders[i] === 'neuter')
      return getNth(res, n)
    }
    isAnimate(n) {
      const { guessAnimate } = this.methods.two.transform.noun
      const res = this.filter(m => m.has('#AnimateNoun') || guessAnimate(m.text('normal')))
      return getNth(res, n)
    }
    // full case-table for each noun - singular + plural
    decline(n) {
      const { decline, declinePlural, guessAnimate } = this.methods.two.transform.noun
      const genders = this.gender()
      return getNth(this, n).map((m, i) => {
        const str = m.text('normal')
        const animate = m.has('#AnimateNoun') || guessAnimate(str)
        const res = decline(str, genders[i], animate)
        res.plural = declinePlural(str, genders[i], animate)
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
