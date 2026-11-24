import { lookup } from '../data.js'

const hasDigit = /[0-9]/
// '5-й', '2-го', '1990-х'
const isOrdinal = /[0-9]-[а-яё]{1,3}$/i

// what part does this term play, in a number?
// { kind: 'numeric' | 'unit' | 'teen' | 'ten' | 'hundred' | 'multiple' | 'zero' | 'half' | 'sign' | 'unknown' }
const classify = function (term) {
  if (hasDigit.test(term.text)) {
    return { kind: 'numeric', ordinal: isOrdinal.test(term.text) }
  }
  if (term.normal === 'минус') {
    return { kind: 'sign' }
  }
  return lookup(term.normal) || { kind: 'unknown' }
}
export default classify
