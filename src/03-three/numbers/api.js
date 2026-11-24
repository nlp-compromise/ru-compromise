import find from './find.js'
import classify from './parse/classify.js'
import parse, { parseAll, longCase } from './parse/index.js'
import fromNumber from './parse/fromNumber.js'
import format from './format/index.js'
import { cases } from './data.js'

// return the nth elem of a doc
export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

// accept a number, or a russian number as a string - 'пять', '5', '1 234,5'
// returns null if it's not a number
const toNum = function (view, n) {
  if (typeof n === 'number') {
    return Number.isFinite(n) ? n : null
  }
  if (typeof n !== 'string' || !n.trim()) {
    return null
  }
  const str = n.trim()
  // plain digits, like '12' or '-2,5'
  if (/^[-−+]?[0-9][0-9.,\s]*$/.test(str)) {
    return fromNumber(str).num
  }
  // a written-out number, like 'двенадцать'
  const doc = view.fromText(str)
  const m = find(doc)
  if (m.length !== 1 || m.terms().length !== doc.terms().length) {
    return null
  }
  const num = parseAll(m).num
  return typeof num === 'number' && Number.isFinite(num) ? num : null
}

// make sure each new word has the right tags
const retag = function (val) {
  val.terms().forEach(t => {
    const item = classify(t.docs[0][0])
    // 'минус', or 'процентов'
    if (item.kind === 'sign' || item.kind === 'unknown') {
      t.unTag('Value')
      t.tag('Noun')
      return
    }
    if (item.kind !== 'numeric') {
      t.unTag('Percent')
    }
    t.tag(item.kind === 'numeric' ? 'NumericValue' : 'TextValue')
    t.tag(item.ordinal ? 'Ordinal' : 'Cardinal')
    if (item.kind === 'multiple' && !item.ordinal) {
      t.tag('Multiple')
    }
  })
}

// 'один' and 'два' agree with the thing they count - '1 книга' → 'одна книга'
// digits don't say which gender they are, but the next word often does
const nounGender = function (val, num) {
  const [n, , end] = val.fullPointer[0]
  const sentence = val.document[n]
  const noun = sentence[end]
  const count = Math.abs(num) % 100
  if (!noun || !noun.tags.has('Noun') || /\S/.test(sentence[end - 1].post) || count === 11 || count === 12) {
    return null
  }
  const str = noun.normal
  if (count % 10 === 1) {
    if (/[ую]$/.test(str)) {
      return { gender: 'f', case: 'acc' } // 'одну книгу'
    }
    if (noun.tags.has('FemaleNoun') || /[ая]$/.test(str)) {
      return { gender: 'f', case: 'nom' }
    }
    if (noun.tags.has('NeuterNoun') || /[оеё]$/.test(str)) {
      return { gender: 'n', case: 'nom' }
    }
  }
  // after 'two', the noun is a genitive - 'две книги', but 'два стола'
  if (count % 10 === 2 && !noun.tags.has('MaleNoun') && (noun.tags.has('FemaleNoun') || /[ыи]$/.test(str))) {
    return { gender: 'f', case: 'nom' }
  }
  return null
}

// swap-in the new form of this number
const replace = function (val, str) {
  const [n, start, end] = val.fullPointer[0]
  const sentence = val.document[n]
  const first = sentence[start]
  const last = sentence[end - 1]
  // an abbreviation owns the period after it - '5 тыс. рублей' → 'пять тысяч рублей'
  // (unless it looks like the end of the sentence, too)
  const next = sentence[end]
  if (classify(last).abbr && next && !/^[А-ЯЁA-Z]/.test(next.text) && !/(тыс|млн|млрд|трлн)$/.test(str)) {
    last.post = last.post.replace(/^\./, '')
  }
  // keep a leading capital - 'Пять книг'
  if (/^[А-ЯЁ][а-яё]/.test(first.text)) {
    str = str.charAt(0).toUpperCase() + str.slice(1)
  }
  // a numeric sign can sit in the punctuation before the term - the new text brings its own
  first.pre = first.pre.replace(/[-−]$/, '')
  val.replaceWith(str, { tags: true })
  // ...and make sure that a new sign was not lost with it - '(-5)'
  const now = val.docs[0][0]
  if (/^-/.test(str)) {
    now.pre = now.pre.replace(/[-−]/g, '')
    if (!/^-/.test(now.text)) {
      now.pre += '-'
    }
  }
  retag(val)
}

// re-write this number in a new format
const write = function (val, parsed, fmt) {
  if (fmt === 'TextCardinal' && parsed.hasDigits && !parsed.hasText) {
    parsed.form = nounGender(val, parsed.num) || parsed.form
  }
  let str = format(parsed, fmt)
  // a written number that has no words for it becomes digits - 'пять' + 0.5 → '5,5'
  if (!str && fmt === 'TextCardinal' && parsed.isText) {
    str = format(parsed, 'Cardinal')
  }
  if (str) {
    replace(val, str)
  }
}

// 'TextOrdinal', 'TextCardinal', 'Ordinal' or 'Cardinal'
const getFormat = function (isText, isOrdinal) {
  const fmt = isOrdinal ? 'Ordinal' : 'Cardinal'
  return isText ? 'Text' + fmt : fmt
}

// run a change on each number, and keep the original view pointing at the new terms
const mutate = function (view, fn) {
  const res = view.map(val => {
    const parsed = parseAll(val)
    if (parsed.num !== null) {
      fn(val, parsed)
    }
    return val
  })
  if (view.ptrs) {
    view.ptrs = res.ptrs
  }
  return res
}

// only compare real numbers - null is not less than 5
const compare = function (view, fn) {
  return view.filter(val => {
    const num = parseAll(val).num
    return num !== null && fn(num)
  })
}

const api = function (View) {
  /**   */
  class Numbers extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Numbers'
    }
    parse(n) {
      return getNth(this, n).map(parse, [])
    }
    get(n) {
      return getNth(this, n).map(parse, []).map(o => o.num)
    }
    json(n) {
      // a number selects the nth match, anything else is json options
      const opts = typeof n === 'number' ? undefined : n
      const doc = getNth(this, n)
      return doc.map(p => {
        const json = p.toView().json(opts)[0]
        const parsed = parse(p)
        json.number = {
          prefix: parsed.prefix,
          num: parsed.num,
          suffix: parsed.suffix,
          hasComma: parsed.hasComma,
        }
        return json
      }, [])
    }
    /** write each number in all six cases - 'пять', 'пяти', 'пятью' */
    decline(n) {
      return getNth(this, n).map(val => {
        const parsed = parseAll(val)
        const fmt = getFormat(true, parsed.isOrdinal)
        const res = {}
        cases.forEach(c => {
          const form = { gender: parsed.form.gender, case: c }
          res[longCase[c]] = format(Object.assign({}, parsed, { form, prefix: '', suffix: '' }), fmt)
        })
        return res.nominative ? res : null
      }, [])
    }
    /** any known measurement unit, for the number */
    units() {
      return this.growRight('#Unit').match('#Unit$')
    }
    /** return only ordinal numbers */
    isOrdinal() {
      return this.if('#Ordinal')
    }
    /** return only cardinal numbers*/
    isCardinal() {
      // 'двадцать пятый' has a cardinal in it, too
      return this.ifNo('#Ordinal')
    }

    /** convert to numeric form like '8' or '8-й' */
    toNumber() {
      // return only the numbers that were text
      const m = this.filter(val => parseAll(val).hasText)
      const res = mutate(m, (val, parsed) => {
        parsed.hasComma = false
        write(val, parsed, getFormat(false, parsed.isOrdinal))
      })
      return new Numbers(res.document, res.pointer)
    }
    /** convert to text form like 'восемь' or 'восьмой' */
    toText() {
      const res = mutate(this, (val, parsed) => {
        if (parsed.hasDigits) {
          write(val, parsed, getFormat(true, parsed.isOrdinal))
        }
      })
      return new Numbers(res.document, res.pointer)
    }
    /** convert ordinal to cardinal form, like 'восемь', or '8' */
    toCardinal() {
      const res = mutate(this, (val, parsed) => {
        if (parsed.isOrdinal) {
          write(val, parsed, getFormat(parsed.isText, false))
        }
      })
      return new Numbers(res.document, res.pointer)
    }
    /** convert cardinal to ordinal form, like 'восьмой', or '8-й' */
    toOrdinal() {
      const res = mutate(this, (val, parsed) => {
        if (!parsed.isOrdinal) {
          write(val, parsed, getFormat(parsed.isText, true))
        }
      })
      return new Numbers(res.document, res.pointer)
    }

    /** return only numbers that are == n */
    isEqual(n) {
      return compare(this, num => num === n)
    }
    /** return only numbers that are > n*/
    greaterThan(n) {
      return compare(this, num => num > n)
    }
    /** return only numbers that are < n*/
    lessThan(n) {
      return compare(this, num => num < n)
    }
    /** return only numbers > min and < max */
    between(min, max) {
      return compare(this, num => num > min && num < max)
    }
    /** set these number to n */
    set(n) {
      if (n === undefined) {
        return this // don't bother
      }
      n = toNum(this, n)
      if (n === null) {
        return this // not a number
      }
      const res = mutate(this, (val, parsed) => {
        parsed.num = n
        write(val, parsed, getFormat(parsed.isText, parsed.isOrdinal))
      })
      return new Numbers(res.document, res.pointer)
    }
    /** increase each number by n */
    add(n) {
      n = toNum(this, n)
      if (!n) {
        return this // don't bother
      }
      const res = mutate(this, (val, parsed) => {
        parsed.num = Number((parsed.num + n).toPrecision(15))
        write(val, parsed, getFormat(parsed.isText, parsed.isOrdinal))
      })
      return new Numbers(res.document, res.pointer)
    }
    /** decrease each number by n*/
    subtract(n) {
      n = toNum(this, n)
      if (!n) {
        return this // don't bother
      }
      return this.add(n * -1)
    }
    /** increase each number by 1 */
    increment() {
      return this.add(1)
    }
    /** decrease each number by 1 */
    decrement() {
      return this.add(-1)
    }
    // overloaded - keep Numbers class
    update(pointer) {
      const m = new Numbers(this.document, pointer)
      m._cache = this._cache // share this full thing
      return m
    }
  }
  // aliases
  Numbers.prototype.isBetween = Numbers.prototype.between
  Numbers.prototype.minus = Numbers.prototype.subtract
  Numbers.prototype.plus = Numbers.prototype.add
  Numbers.prototype.equals = Numbers.prototype.isEqual

  View.prototype.numbers = function (n) {
    let m = find(this)
    m = getNth(m, n)
    return new Numbers(this.document, m.pointer)
  }
  // alias
  View.prototype.values = View.prototype.numbers
}
export default api
