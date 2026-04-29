// 에셋 경로 레지스트리 — 실제 이미지로 교체 시 여기만 수정
export const ASSETS = {
  characters: {
    sui:    'assets/characters/sui.png',
    kya:    'assets/characters/kya.png',
    jiyu:   'assets/characters/jiyu.png',
    haum:   'assets/characters/haum.png',
    leesol: 'assets/characters/leesol.png',
  },
  spritesheets: {
    sui:    'assets/spritesheets/sui-sheet.png',
    kya:    'assets/spritesheets/kya-sheet.png',
    jiyu:   'assets/spritesheets/jiyu-sheet.png',
    haum:   'assets/spritesheets/haum-sheet.png',
    leesol: 'assets/spritesheets/leesol-sheet.png',
  },
  SHEET_FRAME_W: 391,
  SHEET_FRAME_H: 600,
  cards: {
    back:   'assets/cards/card-back.svg',
    normal: 'assets/cards/frame-normal.svg',
    rare:   'assets/cards/frame-rare.svg',
    sr:     'assets/cards/frame-sr.svg',
  },
  bg: {
    house: 'assets/bg/house-bg.svg',
    game:  'assets/bg/game-bg.svg',
  },
} as const

export const MEMBERS = [
  { id: 'sui'    as const, name: 'Sui',    color: 0x8B6FBF, hex: '#8B6FBF', light: '#C4B5FD' },
  { id: 'kya'    as const, name: 'Kya',    color: 0xD4A843, hex: '#D4A843', light: '#FDE68A' },
  { id: 'jiyu'   as const, name: 'Jiyu',   color: 0x2C7A4B, hex: '#2C7A4B', light: '#6EE7B7' },
  { id: 'haum'   as const, name: 'Haum',   color: 0x8B3A3A, hex: '#8B3A3A', light: '#FCA5A5' },
  { id: 'leesol' as const, name: 'Leesol', color: 0x1A4A8B, hex: '#1A4A8B', light: '#93C5FD' },
] as const
