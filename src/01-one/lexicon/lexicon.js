import lexData from './_data.js'
import { unpack } from 'efrt'
import misc from './misc.js'

let lexicon = misc

Object.keys(lexData).forEach(tag => {
  let wordsObj = unpack(lexData[tag])
  Object.keys(wordsObj).forEach(w => {
    lexicon[w] = tag
  })
})

export default lexicon