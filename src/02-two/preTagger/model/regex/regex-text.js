export default [
  // #хэштег
  [/^#[a-zа-яё0-9_]{2,}$/i, 'HashTag'],

  // @spencermountain
  [/^@[a-zа-яё0-9_]{2,}$/i, 'AtMention'],

  // period-ones acronyms - Ф.С.Б.
  [/^([А-ЯЁA-Z]\.){2}[А-ЯЁA-Z]?/, ['Acronym', 'Noun'], 'Ф.С.Б.'],
]
