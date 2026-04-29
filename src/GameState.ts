export interface State {
  hearts: number
  maxHearts: number
  coins: number
  xp: number
  level: number
  bestScore: number
  raffleTickets: number
}

const XP_PER_LEVEL = 100

const state: State = {
  hearts: 5,
  maxHearts: 5,
  coins: parseInt(localStorage.getItem('kk_coins') ?? '0'),
  xp: parseInt(localStorage.getItem('kk_xp') ?? '0'),
  level: parseInt(localStorage.getItem('kk_level') ?? '1'),
  bestScore: parseInt(localStorage.getItem('kk_best') ?? '0'),
  raffleTickets: parseInt(localStorage.getItem('kk_raffle') ?? '0'),
}

function save() {
  localStorage.setItem('kk_coins', String(state.coins))
  localStorage.setItem('kk_xp', String(state.xp))
  localStorage.setItem('kk_level', String(state.level))
  localStorage.setItem('kk_best', String(state.bestScore))
  localStorage.setItem('kk_raffle', String(state.raffleTickets))
}

function updateHUD() {
  const pct = (state.xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100
  const el = {
    lv:     document.getElementById('lv-text'),
    xp:     document.getElementById('xp-fill'),
    heart:  document.getElementById('heart-val'),
    coin:   document.getElementById('coin-val'),
    raffle: document.getElementById('raffle-val'),
  }
  if (el.lv)     el.lv.textContent  = `Lv.${state.level}`
  if (el.xp)     (el.xp as HTMLElement).style.width = `${pct}%`
  if (el.heart)  el.heart.textContent = String(state.hearts)
  if (el.coin)   el.coin.textContent  = String(state.coins)
  if (el.raffle) el.raffle.textContent = String(state.raffleTickets)
}

export const GameState = {
  get: (): Readonly<State> => state,

  useHeart(): boolean {
    if (state.hearts <= 0) return false
    state.hearts--
    updateHUD()
    return true
  },

  addHeart(n = 1) {
    state.hearts = Math.min(state.hearts + n, state.maxHearts)
    updateHUD()
  },

  addCoins(n: number) {
    state.coins += n
    save()
    updateHUD()
  },

  spendCoins(n: number): boolean {
    if (state.coins < n) return false
    state.coins -= n
    save()
    updateHUD()
    return true
  },

  addRaffle(n: number) {
    state.raffleTickets += n
    save()
    updateHUD()
  },

  spendRaffle(n: number): boolean {
    if (state.raffleTickets < n) return false
    state.raffleTickets -= n
    save()
    updateHUD()
    return true
  },

  addXp(n: number) {
    state.xp += n
    while (state.xp >= state.level * XP_PER_LEVEL) {
      state.xp -= state.level * XP_PER_LEVEL
      state.level++
    }
    save()
    updateHUD()
  },

  updateBest(score: number) {
    if (score > state.bestScore) {
      state.bestScore = score
      save()
    }
  },

  initHUD: updateHUD,
}
