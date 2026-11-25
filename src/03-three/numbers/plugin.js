import api from './api.js'
import locale from './locale.js'

export default {
  api,
  // our marks, for the shared european-numbers plugin
  model: { two: { europeanNumbers: locale } },
}
