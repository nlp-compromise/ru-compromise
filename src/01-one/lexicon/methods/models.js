import { uncompress } from 'suffix-thumb'
import { unpack } from 'efrt'
import model from './_data.js'

// uncompress them
const result = {}
Object.keys(model).forEach(k => {
  // efrt-packed word-list of perfective infinitives
  if (k === 'perfective') {
    result.perfective = unpack(model[k])
    return
  }
  result[k] = {}
  Object.keys(model[k]).forEach(form => {
    result[k][form] = uncompress(model[k][form])
  })
})
export default result
