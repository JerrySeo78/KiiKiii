import Phaser from 'phaser'
import { ASSETS } from '../assets'

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene') }

  preload() {
    const W = this.scale.width
    const H = this.scale.height

    // Loading bar
    this.cameras.main.setBackgroundColor('#FFF8F0')
    const bar = this.add.rectangle(W / 2, H / 2 + 20, 0, 6, 0xFF6B35).setOrigin(0, 0.5)
    const bg  = this.add.rectangle(W / 2, H / 2 + 20, W * 0.6, 6, 0xF0E0C0).setOrigin(0.5)
    bar.setX(W / 2 - W * 0.3)
    this.add.text(W / 2, H / 2 - 10, 'KiiiKiii', {
      fontFamily: 'Nunito', fontSize: '26px', fontStyle: 'bold', color: '#FF6B35',
    }).setOrigin(0.5)

    this.load.on('progress', (v: number) => {
      bar.width = W * 0.6 * v
    })

    // Characters (static, used as fallback)
    Object.entries(ASSETS.characters).forEach(([k, v]) => this.load.image(k, v))

    // Spritesheets (6 frames: base / float1 / float2 / float3 / leanR / leanL)
    Object.entries(ASSETS.spritesheets).forEach(([k, v]) =>
      this.load.spritesheet(`${k}-sheet`, v, {
        frameWidth:  ASSETS.SHEET_FRAME_W,
        frameHeight: ASSETS.SHEET_FRAME_H,
      })
    )

    // Cards
    this.load.svg('card-back',   ASSETS.cards.back,   { width: 160, height: 220 })
    this.load.svg('card-normal', ASSETS.cards.normal, { width: 160, height: 220 })
    this.load.svg('card-rare',   ASSETS.cards.rare,   { width: 160, height: 220 })
    this.load.svg('card-sr',     ASSETS.cards.sr,     { width: 160, height: 220 })

    // Backgrounds
    this.load.svg('bg-house', ASSETS.bg.house, { width: 390, height: 844 })
    this.load.svg('bg-game',  ASSETS.bg.game,  { width: 390, height: 600 })

    void bg
  }

  create() {
    // If FTUE not yet done, show member-selection first
    const ftueDone = localStorage.getItem('kk_ftue_done') === '1'
    this.scene.start(ftueDone ? 'HomeScene' : 'FTUEScene')
  }
}
