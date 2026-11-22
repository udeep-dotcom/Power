// अङ्क — Nepali numerals १–१० with their names. Children count real objects by tapping them
// one by one (each tap says the next number), which builds one-to-one correspondence — the
// foundation of counting — instead of just memorising a sequence.

export interface NumberItem { n: number; digit: string; ne: string; roman: string }

export const NUMBERS: NumberItem[] = [
  { n: 1, digit: '१', ne: 'एक', roman: 'ek' },
  { n: 2, digit: '२', ne: 'दुई', roman: 'dui' },
  { n: 3, digit: '३', ne: 'तीन', roman: 'tin' },
  { n: 4, digit: '४', ne: 'चार', roman: 'chaar' },
  { n: 5, digit: '५', ne: 'पाँच', roman: 'paanch' },
  { n: 6, digit: '६', ne: 'छ', roman: 'chha' },
  { n: 7, digit: '७', ne: 'सात', roman: 'saat' },
  { n: 8, digit: '८', ne: 'आठ', roman: 'aath' },
  { n: 9, digit: '९', ne: 'नौ', roman: 'nau' },
  { n: 10, digit: '१०', ne: 'दस', roman: 'das' },
];

/** Things to count, with the Nepali word used in "कति वटा … छन्?" (How many … are there?). */
export const COUNTABLES: { pic: string; ne: string; en: string }[] = [
  { pic: '🍎', ne: 'स्याउ', en: 'apples' },
  { pic: '🐟', ne: 'माछा', en: 'fish' },
  { pic: '⭐', ne: 'तारा', en: 'stars' },
  { pic: '🌸', ne: 'फूल', en: 'flowers' },
  { pic: '🪁', ne: 'चङ्गा', en: 'kites' },
  { pic: '🦋', ne: 'पुतली', en: 'butterflies' },
  { pic: '🥟', ne: 'मम', en: 'momos' },
  { pic: '🐤', ne: 'चल्ला', en: 'chicks' },
];
