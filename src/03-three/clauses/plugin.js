// russian word-rules for .clauses() - the method itself comes from compromise/shared
const clauses = {
  // a comma, but not a clause break
  notClause: [
    '@hasComma (и|или) .', // большой, и сильный
  ],
  // split a clause after these
  splitAfter: [
    '^#Pron (сказал|сказала|говорит)', // он сказал
  ],
  // split a clause before these
  splitBefore: [
    '(сказал|сказала|говорит) #Prop$',
    '. . если .{4}', // ... если бы это было так
    'и пока',
    'теперь когда',
    'с тех пор как',
    'хотя',
    'даже если',
    'тогда как', // whereas
    'как будто',
    'пока не',
    '(чей|чья|чьё|чьи)', // whose
  ],
  // split a clause before the [captured] word
  splitBeforeGroup: [
    '#Verb .* [но] .* #Verb', // это хорошо но это ..
    'если .{2,9} [то] .', // если это так то иначе
    'если .{2,9} [тогда] .',
  ],
}

export default {
  model: { three: { clauses } },
}
