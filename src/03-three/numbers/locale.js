// how russian writes its digits, for the shared european-numbers plugin
// '3,5', '1 234', and a numeric ordinal - '5-й', '2-го', '1990-х'
// .. and the words beside a number - '50 процентов', '100 р.'
export default {
  decimal: ',',
  group: ' ',
  ordinal: '-[а-яё]{1,3}',
  percent: ['процент', 'процента', 'проценту', 'процентом', 'проценте', 'проценты', 'процентов', 'процентам', 'процентами', 'процентах'],
  currencies: ['р', 'руб'],
}
