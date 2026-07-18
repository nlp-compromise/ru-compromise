export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

// get root form of verb
const getRoot = function (m) {
  m.compute('root')
  let str = m.text('root')
  return str
}

const buduMap = {
  first: 'буду',
  second: 'будешь',
  third: 'будет',
  firstPlural: 'будем',
  secondPlural: 'будете',
  thirdPlural: 'будут',
}
const pronounPerson = {
  'я': 'first',
  'ты': 'second',
  'мы': 'firstPlural',
  'вы': 'secondPlural',
  'они': 'thirdPlural',
  'он': 'third',
  'она': 'third',
  'оно': 'third',
}
const pronounGender = {
  'он': 'masc',
  'она': 'fem',
  'оно': 'neut',
}

// which conjugation-slot is this verb-phrase in?
const getPerson = function (m) {
  if (m.has('#FirstPersonPlural')) {
    return 'firstPlural'
  }
  if (m.has('#SecondPersonPlural')) {
    return 'secondPlural'
  }
  if (m.has('#ThirdPersonPlural')) {
    return 'thirdPlural'
  }
  if (m.has('#FirstPerson')) {
    return 'first'
  }
  if (m.has('#SecondPerson')) {
    return 'second'
  }
  if (m.has('#ThirdPerson')) {
    return 'third'
  }
  // no person-tag (past-tense) - look for a subject-pronoun
  let pron = m.lookBehind('#Pronoun').last().text('normal')
  if (pronounPerson[pron]) {
    return pronounPerson[pron]
  }
  if (m.has('#PastTense') && /(ли|лись)$/.test(m.text('normal'))) {
    return 'thirdPlural'
  }
  return 'third'
}

// which past-tense form (masc/fem/neut/plural) fits this context?
const getPastSlot = function (m, person) {
  if (/Plural/.test(person)) {
    return 'plural'
  }
  let str = m.text('normal')
  if (m.has('#PastTense')) {
    if (/(ли|лись)$/.test(str)) {
      return 'plural'
    }
    if (/(ла|лась)$/.test(str)) {
      return 'fem'
    }
    if (/(ло|лось)$/.test(str)) {
      return 'neut'
    }
    return 'masc'
  }
  let pron = m.lookBehind('#Pronoun').last().text('normal')
  return pronounGender[pron] || 'masc'
}

// split a verb-phrase into its finite head + trailing infinitives
// ('буду читать' → [буду, читать],  'хочет работать' → [хочет, работать])
const parseVerb = function (m) {
  let inf = m.match('#Infinitive')
  let head = m.not('#Infinitive')
  return { head, inf }
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
        let str = getRoot(m)
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

    toPastTense(n) {
      const { toPast } = this.methods.two.transform.verb
      return getNth(this, n).map(m => {
        if (m.has('#PastTense')) {
          return m
        }
        let { head, inf } = parseVerb(m)
        if (!head.found) {
          return m
        }
        let person = getPerson(head)
        let slot = getPastSlot(head, person)
        // 'буду читать' → 'читал',  'будет' → 'был'
        if (head.has('#Copula')) {
          let root = inf.found ? inf.text('normal') : 'быть'
          return m.replaceWith(toPast(root)[slot])
        }
        head.replaceWith(toPast(getRoot(head))[slot])
        return m.toView()
      })
    }

    toPresentTense(n) {
      const { toPresent, isPerfective, getAspectPair } = this.methods.two.transform.verb
      return getNth(this, n).map(m => {
        if (m.has('#PresentTense')) {
          return m
        }
        let { head, inf } = parseVerb(m)
        if (!head.found) {
          return m
        }
        let person = getPerson(head)
        // 'буду читать' → 'читаю'
        if (head.has('#Copula')) {
          if (inf.found) {
            return m.replaceWith(toPresent(inf.text('normal'))[person])
          }
          return m
        }
        let root = getRoot(head)
        // perfective has no present - swap to its imperfective pair ('прочитал' → 'читаю')
        if (isPerfective(root)) {
          root = getAspectPair(root) || root
        }
        head.replaceWith(toPresent(root)[person])
        return m.toView()
      })
    }

    toFutureTense(n) {
      const { toPresent, isPerfective } = this.methods.two.transform.verb
      return getNth(this, n).map(m => {
        if (m.has('#FutureTense')) {
          return m
        }
        let { head, inf } = parseVerb(m)
        if (!head.found) {
          return m
        }
        let person = getPerson(head)
        // 'был'/'есть' → 'будет'
        if (head.has('#Copula')) {
          return m.replaceWith(buduMap[person] + (inf.found ? ' ' + inf.text('normal') : ''))
        }
        let root = getRoot(head)
        // perfective conjugates straight to future; imperfective takes буду + infinitive
        if (isPerfective(root)) {
          head.replaceWith(toPresent(root)[person])
        } else {
          head.replaceWith(buduMap[person] + ' ' + root)
        }
        return m.toView()
      })
    }

    toInfinitive(n) {
      return getNth(this, n).map(m => {
        let { head } = parseVerb(m)
        if (!head.found) {
          return m
        }
        let root = getRoot(head)
        if (head.has('#Copula')) {
          root = 'быть'
        }
        head.replaceWith(root)
        return m.toView()
      })
    }
  }

  View.prototype.verbs = function (n) {
    let m = this.match('#Verb+')
    m = getNth(m, n)
    return new Verbs(this.document, m.pointer)
  }
}
export default api
