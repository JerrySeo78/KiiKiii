import Phaser from 'phaser'
import { MEMBERS } from '../assets'

const DISPLAY_ORDER: readonly number[] = [1, 2, 0, 3, 4]
const RECOMMENDED_DISPLAY_IDX = 2   // 수이

export class FTUEScene extends Phaser.Scene {
  private selectedIdx = -1
  private _cleanup: (() => void) | null = null

  constructor() { super('FTUEScene') }

  create() {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)')
    this.game.canvas.style.background = 'transparent'

    const screen = document.getElementById('ftue-screen')!
    const header = document.getElementById('kk-header')!
    const nav    = document.getElementById('kk-nav')!

    header.style.display = 'none'
    nav.style.display    = 'none'
    screen.classList.add('visible')

    this.setupCards()
    this.setupButtons()
    this.selectCard(RECOMMENDED_DISPLAY_IDX)

    this.cameras.main.fadeIn(350, 0, 0, 0)
  }

  private setupCards() {
    const cards = document.querySelectorAll<HTMLElement>('.ftue-card')
    const handlers: Array<() => void> = []

    cards.forEach((el, i) => {
      const fn = () => this.selectCard(i)
      el.addEventListener('click', fn)
      handlers.push(() => el.removeEventListener('click', fn))
    })

    const prev = this._cleanup
    this._cleanup = () => {
      prev?.()
      handlers.forEach(h => h())
    }
  }

  private setupButtons() {
    const startBtn  = document.getElementById('ftue-btn-start')!
    const randomBtn = document.getElementById('ftue-btn-random')!

    const onStart  = () => { if (this.selectedIdx >= 0) this.confirm() }
    const onRandom = () => {
      const rnd = Phaser.Math.Between(0, MEMBERS.length - 1)
      this.selectCard(rnd)
    }

    startBtn.addEventListener('click', onStart)
    randomBtn.addEventListener('click', onRandom)

    const prev = this._cleanup
    this._cleanup = () => {
      prev?.()
      startBtn.removeEventListener('click', onStart)
      randomBtn.removeEventListener('click', onRandom)
    }
  }

  private selectCard(displayIdx: number) {
    this.selectedIdx = displayIdx
    document.querySelectorAll<HTMLElement>('.ftue-card').forEach((el, i) => {
      el.classList.toggle('selected', i === displayIdx)
    })
    document.getElementById('ftue-btn-start-wrap')!.classList.add('active')
  }

  private confirm() {
    const memberIdx = DISPLAY_ORDER[this.selectedIdx]
    localStorage.setItem('kk_selected_member', String(memberIdx))
    localStorage.setItem('kk_ftue_done', '1')

    this.cameras.main.fadeOut(300, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.teardown()
      this.scene.start('HomeScene')
    })
  }

  private teardown() {
    this._cleanup?.()
    this._cleanup = null

    const screen = document.getElementById('ftue-screen')
    const header = document.getElementById('kk-header')
    const nav    = document.getElementById('kk-nav')

    screen?.classList.remove('visible')
    document.querySelectorAll<HTMLElement>('.ftue-card').forEach(el => el.classList.remove('selected'))
    document.getElementById('ftue-btn-start-wrap')?.classList.remove('active')

    if (header) header.style.display = ''
    if (nav)    nav.style.display    = ''
    this.game.canvas.style.background = ''
  }
}
