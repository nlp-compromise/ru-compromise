import classify from './parse/classify.js'

const fresh = () => ({ count: 0, digits: false, canGroup: false, h: false, t: false, u: false, mag: Infinity, afterMult: false, done: false })

// can this word continue the number we've got so far?
// 'двадцать пять' is one number, but 'пять шесть' is two
const fits = function (s, item, term) {
  if (s.done) {
    return false
  }
  const isFirst = s.count === 0
  let ok = false
  if (item.kind === 'numeric') {
    const isSmall = /^[0-9]{1,3}$/.test(term.text)
    if (isFirst) {
      s.digits = true
      s.canGroup = isSmall
      ok = true
    } else if (s.canGroup && /^[0-9]{3}([.,][0-9]+|-[а-яё]{1,3})?$/i.test(term.text)) {
      s.canGroup = isSmall // '1 234,5' and '1 000-й' end here
      ok = true // '5 000'
    } else if (s.afterMult && isSmall) {
      s.canGroup = false
      ok = true // '3 млн 200 тыс'
    }
    if (ok) {
      s.h = true
      s.t = true
      s.u = true
      s.afterMult = false
    }
  } else if (item.kind === 'multiple') {
    // each one has to be smaller than the last - 'миллион двести тысяч'
    ok = item.num < s.mag && (item.count === undefined || item.count === 1 || !(s.h || s.t || s.u))
    if (ok) {
      s.mag = item.num
      s.h = false
      s.t = false
      s.u = false
      s.afterMult = true
      s.canGroup = false
    }
  } else if (s.digits && !s.afterMult && !isFirst) {
    ok = false // '5 пять'
  } else {
    if (item.kind === 'unknown' || item.kind === 'zero' || item.kind === 'half') {
      ok = isFirst && !s.digits
      s.done = item.kind !== 'half'
      s.h = true
      s.t = true
      s.u = true
    } else if (item.kind === 'hundred') {
      ok = !s.h && !s.t && !s.u
      s.h = true
    } else if (item.kind === 'ten') {
      ok = !s.t && !s.u
      s.t = true
    } else if (item.kind === 'teen') {
      ok = !s.t && !s.u
      s.t = true
      s.u = true
    } else if (item.kind === 'unit') {
      ok = !s.u
      s.u = true
    }
    s.canGroup = false
    s.afterMult = false
  }
  if (ok) {
    s.count += 1
    // an ordinal is always the end - 'двадцать пятый'
    if (item.ordinal || item.collective) {
      s.done = true
    }
  }
  return ok
}

const isValue = term => term.tags.has('Value') && !term.tags.has('NumberRange')

// anything between two words breaks a number - 'пять, шесть'
const isBroken = function (before, after) {
  const post = before.post.replace(/^\.(?=\s)/, match => (classify(before).abbr ? '' : match))
  return /\S/.test(post) || /\S/.test(after.pre)
}

// find each number, as a [n, start, end] pointer
const findNumbers = function (view) {
  const ptrs = []
  const document = view.document
  view.fullPointer.forEach(ptr => {
    const [n, min, max] = ptr
    const terms = document[n]
    let start = null
    let state = null
    let group = null // where the words since the last 'тысяча' began
    const close = function (end) {
      if (start !== null) {
        // '9km' is two terms, written as one
        while (end < max && terms[end].text === '' && terms[end].implicit) {
          end += 1
        }
        ptrs.push([n, start, end])
      }
      start = null
    }
    for (let i = min; i < max; i += 1) {
      const term = terms[i]
      if (!isValue(term)) {
        close(i)
        continue
      }
      const item = classify(term)
      if (start !== null && !isBroken(terms[i - 1], term)) {
        if (fits(state, item, term)) {
          if (item.kind === 'multiple') {
            group = null
          } else if (group === null) {
            group = i
          }
          continue
        }
        // 'пять тысяч шесть тысяч' - that 'шесть' was the start of a new number
        if (item.kind === 'multiple' && group !== null && group > start) {
          close(group)
          i = group - 1
          continue
        }
      }
      // begin a new number
      close(i)
      start = i
      state = fresh()
      fits(state, item, term)
      group = item.kind === 'multiple' ? null : i
      // a written-out sign belongs to its number - 'минус пять градусов'
      // (but 'десять минус пять' is a subtraction)
      const sign = terms[i - 1]
      if (i > min && sign.normal === 'минус' && !isBroken(sign, term)) {
        if (i - 2 < min || !terms[i - 2].tags.has('Value')) {
          start = i - 1
        }
      }
    }
    close(max)
  })
  return view.update(ptrs)
}
export default findNumbers
