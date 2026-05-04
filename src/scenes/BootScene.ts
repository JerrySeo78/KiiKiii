import Phaser from 'phaser'
import { ASSETS } from '../assets'

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene') }

  preload() {
    // 다른 씬에서 쓸 에셋 전부 로드
    Object.entries(ASSETS.characters).forEach(([k, v]) => this.load.image(k, v))
    Object.entries(ASSETS.ftueCards).forEach(([k, v]) => this.load.image(`ftuecard-${k}`, v))
    Object.entries(ASSETS.spritesheets).forEach(([k, v]) =>
      this.load.spritesheet(`${k}-sheet`, v, { frameWidth: ASSETS.SHEET_FRAME_W, frameHeight: ASSETS.SHEET_FRAME_H })
    )
    this.load.svg('card-back',   ASSETS.cards.back,   { width: 160, height: 220 })
    this.load.svg('card-normal', ASSETS.cards.normal, { width: 160, height: 220 })
    this.load.svg('card-rare',   ASSETS.cards.rare,   { width: 160, height: 220 })
    this.load.svg('card-sr',     ASSETS.cards.sr,     { width: 160, height: 220 })
    this.load.svg('bg-house', ASSETS.bg.house, { width: 390, height: 844 })
    this.load.svg('bg-game',  ASSETS.bg.game,  { width: 390, height: 600 })

    Object.entries(ASSETS.portraits).forEach(([k, v])  => this.load.image(`portrait-${k}`, v))
    Object.entries(ASSETS.standing).forEach(([k, v])   => this.load.image(`standing-${k}`, v))

    this.load.image('bg-home',  ASSETS.bg.home)
    this.load.image('bg-room',  ASSETS.bg.room)
    this.load.image('bg-beach', ASSETS.bg.beach)

    Object.entries(ASSETS.uiFrame).forEach(([k, v]) => {
      if (typeof v === 'string') this.load.image(`uiframe-${k}`, v)
    })
    Object.entries(ASSETS.icons).forEach(([k, v])    => this.load.image(`icon-${k}`, v))
    Object.entries(ASSETS.sprites).forEach(([k, v])  =>
      this.load.spritesheet(`sprite-${k}`, v, { frameWidth: 256, frameHeight: 256 })
    )
    Object.entries(ASSETS.buttons).forEach(([k, v])  => this.load.image(`btn-${k}`, v))
    Object.entries(ASSETS.checkin).forEach(([k, v])  => this.load.image(`checkin-${k}`, v))
    Object.entries(ASSETS.roomTabs).forEach(([k, v]) => this.load.image(`roomtab-${k}`, v))
    Object.entries(ASSETS.boxTabs).forEach(([k, v])  => this.load.image(`boxtab-${k}`, v))
    Object.entries(ASSETS.charIcons).forEach(([k, v])=> this.load.image(`charicon-${k}`, v))

    this.load.image('uiframe-charInfoPanel', ASSETS.uiFrame.charInfoPanel)
    this.load.image('uiframe-speechBubble',  ASSETS.uiFrame.speechBubble)
    this.load.image('uiframe-selectionBase', ASSETS.uiFrame.selectionBase)
    this.load.image('uiframe-logo',          ASSETS.uiFrame.logo)
    this.load.image('uiframe-welcomeMsg',    ASSETS.uiFrame.welcomeMsg)
    Object.entries(ASSETS.uiFrame.nameplates).forEach(([k, v]) => this.load.image(`nameplate-${k}`, v))
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // ── 헤더/네비 숨기고 부트 이미지 표시 ──
    this.setUI(false)

    // Phaser 캔버스 투명 배경
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)')
    this.game.canvas.style.background = 'transparent'

    // ── 버튼 히트 영역 3개 ──
    // 위치는 이미지 비율 기준 (타겟 디자인 맞춤)
    const FW = window.innerWidth
    const FH = window.innerHeight

    // TOUCH TO START — 중앙 하단
    const startY  = FH * 0.855
    const startHit = this.add.rectangle(FW / 2, startY, FW * 0.72, 60, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
    startHit.on('pointerdown', (_p: Phaser.Input.Pointer) => {
      this.ripple(FW / 2, startY, 0xFFFFFF)
      this.flashButtons()
      this.time.delayedCall(300, () => this.goNext())
    })

    // SETTINGS — 좌하단
    const settingsHit = this.add.rectangle(FW * 0.12, FH * 0.935, 100, 44, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
    settingsHit.on('pointerdown', (_p: Phaser.Input.Pointer) => {
      this.ripple(FW * 0.12, FH * 0.935, 0xFFFFFF)
      this.flashButtons()
    })

    // NOTICE — 우하단
    const noticeHit = this.add.rectangle(FW * 0.88, FH * 0.935, 100, 44, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
    noticeHit.on('pointerdown', (_p: Phaser.Input.Pointer) => {
      this.ripple(FW * 0.88, FH * 0.935, 0xFFFFFF)
      this.flashButtons()
    })

    // 화면 어디든 탭 → 다음 씬 (버튼 아닌 곳)
    this.input.on('pointerdown', () => this.goNext())

    void settingsHit
    void noticeHit
  }

  // ── 리플 이펙트 ─────────────────────────────────────────────
  private ripple(x: number, y: number, color: number) {
    const circle = this.add.circle(x, y, 10, color, 0.5)
    this.tweens.add({
      targets: circle,
      radius:  80,
      alpha:   0,
      duration: 400,
      ease: 'Power2.easeOut',
      onComplete: () => circle.destroy(),
    })
  }

  // ── 버튼 플래시 이펙트 ──────────────────────────────────────
  private flashButtons() {
    const ids = ['boot-btn-settings', 'boot-btn-start', 'boot-btn-notice']
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (!el) return
      el.classList.remove('boot-btn-flash')
      void el.offsetWidth
      el.classList.add('boot-btn-flash')
      el.addEventListener('animationend', () => el.classList.remove('boot-btn-flash'), { once: true })
    })
  }

  // ── HTML UI 토글 ────────────────────────────────────────────
  private setUI(visible: boolean) {
    const header = document.getElementById('kk-header')
    const nav    = document.getElementById('kk-nav')
    const boot   = document.getElementById('boot-screen')
    if (header) header.style.display = visible ? '' : 'none'
    if (nav)    nav.style.display    = visible ? '' : 'none'
    if (boot)   boot.style.display   = visible ? 'none' : 'block'
  }

  // ── 다음 씬으로 ─────────────────────────────────────────────
  private goNext() {
    this.input.off('pointerdown')

    this.cameras.main.fadeOut(300, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.setUI(true)
      this.game.canvas.style.background = ''
      const ftueDone = localStorage.getItem('kk_ftue_done') === '1'
      this.scene.start(ftueDone ? 'HomeScene' : 'FTUEScene')
    })
  }
}
