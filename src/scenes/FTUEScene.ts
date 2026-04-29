import Phaser from 'phaser'
import { MEMBERS } from '../assets'

// Waikiki colour palette
const C = {
  cream:   0xFFF8F0,
  sand:    0xF0E0C0,
  coral:   0xFF6B35,
  green:   0x2D6A4F,
  ocean:   0x0096C7,
  gold:    0xF4A800,
  dark:    0x2C1810,
  mid:     0x8B6355,
  white:   0xFFFFFF,
} as const

export class FTUEScene extends Phaser.Scene {
  private selectedIndex = -1
  private cardContainers: Phaser.GameObjects.Container[] = []
  private startBtn!: Phaser.GameObjects.Rectangle
  private startBtnText!: Phaser.GameObjects.Text

  constructor() { super('FTUEScene') }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // --- Background: cream fill ---
    this.add.rectangle(W / 2, H / 2, W, H, C.cream)

    // Subtle tropical decoration — soft circles
    const deco = this.add.graphics()
    deco.fillStyle(C.coral, 0.06)
    deco.fillCircle(W * 0.85, H * 0.12, 80)
    deco.fillStyle(C.ocean, 0.05)
    deco.fillCircle(W * 0.1, H * 0.25, 60)
    deco.fillStyle(C.green, 0.05)
    deco.fillCircle(W * 0.9, H * 0.8, 70)

    // --- Header ---
    this.add.text(W / 2, 52, 'KiiiKiii', {
      fontFamily: 'Nunito',
      fontSize: '28px',
      fontStyle: '900',
      color: '#FF6B35',
    }).setOrigin(0.5)

    this.add.text(W / 2, 84, '당신의 최애를 선택하세요', {
      fontFamily: 'Nunito',
      fontSize: '16px',
      color: '#8B6355',
    }).setOrigin(0.5)

    // --- Member cards ---
    this.buildCards(W, H)

    // --- Confirm button ---
    const btnY = H - 60
    this.startBtn = this.add.rectangle(W / 2, btnY, W - 64, 48, C.coral, 0.35)
      .setStrokeStyle(1, C.coral, 0.4)
    this.startBtnText = this.add.text(W / 2, btnY, '시작하기', {
      fontFamily: 'Nunito',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0.4)

    // fade in
    this.cameras.main.fadeIn(350, 255, 248, 240)
  }

  private buildCards(W: number, H: number) {
    // 2 + 3 grid layout
    const cardW = Math.min((W - 56) / 3, 110)
    const cardH = cardW * 1.4
    const gapX  = (W - cardW * 2 - 32) / 3    // padding for row of 2
    const gapX3 = (W - cardW * 3 - 32) / 4    // padding for row of 3

    const row1Y = H * 0.36
    const row2Y = H * 0.62

    // Row 1: Sui (0), Kya (1)
    const row1Positions = [
      { x: gapX + cardW / 2 + 16,          y: row1Y },
      { x: gapX * 2 + cardW * 1.5 + 16,    y: row1Y },
    ]
    // Row 2: Jiyu (2), Haum (3), Leesol (4)
    const row2Positions = [
      { x: gapX3 + cardW / 2 + 16,              y: row2Y },
      { x: gapX3 * 2 + cardW * 1.5 + 16,        y: row2Y },
      { x: gapX3 * 3 + cardW * 2.5 + 16,        y: row2Y },
    ]
    const positions = [...row1Positions, ...row2Positions]

    MEMBERS.forEach((m, i) => {
      const { x, y } = positions[i]
      const container = this.buildCard(x, y, cardW, cardH, m, i)
      this.cardContainers.push(container)
    })
  }

  private buildCard(
    x: number, y: number,
    cardW: number, cardH: number,
    m: typeof MEMBERS[number],
    index: number,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    // Card background
    const bg = this.add.graphics()
    bg.fillStyle(C.sand, 1)
    bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 12)

    // Border (default: sand, selected: member color)
    const border = this.add.graphics()
    this.drawBorder(border, cardW, cardH, C.sand, 2)

    // Character image
    const charImg = this.add.image(0, -cardH * 0.1, m.id)
      .setDisplaySize(cardW * 0.7, cardH * 0.65)

    // Name label
    const nameLabel = this.add.text(0, cardH * 0.38, m.name, {
      fontFamily: 'Nunito',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#2C1810',
    }).setOrigin(0.5)

    // Hit area
    const hit = this.add.rectangle(0, 0, cardW, cardH, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.selectCard(index))

    container.add([bg, border, charImg, nameLabel, hit])

    // Store refs for update
    ;(container as Phaser.GameObjects.Container & { _border: Phaser.GameObjects.Graphics; _cardW: number; _cardH: number; _memberColor: number })
      ._border = border
    ;(container as any)._cardW = cardW
    ;(container as any)._cardH = cardH
    ;(container as any)._memberColor = m.color

    return container
  }

  private drawBorder(
    g: Phaser.GameObjects.Graphics,
    cardW: number, cardH: number,
    color: number,
    alpha: number,
  ) {
    g.clear()
    g.lineStyle(2.5, color, alpha)
    g.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 12)
  }

  private selectCard(index: number) {
    const prev = this.selectedIndex
    this.selectedIndex = index

    this.cardContainers.forEach((c, i) => {
      const ct = c as any
      const isSelected = i === index

      // Update border
      this.drawBorder(ct._border, ct._cardW, ct._cardH,
        isSelected ? ct._memberColor : C.sand,
        isSelected ? 1 : 2,
      )

      // Scale tween
      this.tweens.add({
        targets: c,
        scaleX: isSelected ? 1.05 : (i === prev ? 1.0 : c.scaleX),
        scaleY: isSelected ? 1.05 : (i === prev ? 1.0 : c.scaleY),
        duration: 150,
        ease: 'Back.easeOut',
      })
    })

    // Activate button
    this.startBtn.setFillStyle(C.coral, 1)
    this.startBtn.setStrokeStyle(0)
    this.startBtnText.setAlpha(1)

    // Wire up button on first selection
    if (prev === -1) {
      this.startBtn.setInteractive({ useHandCursor: true })
      this.startBtn
        .on('pointerdown', () => {
          this.tweens.add({ targets: this.startBtn, scaleX: 0.96, scaleY: 0.96, duration: 80, yoyo: true })
        })
        .on('pointerup', () => this.confirm())
    }
  }

  private confirm() {
    if (this.selectedIndex < 0) return
    localStorage.setItem('kk_selected_member', String(this.selectedIndex))
    localStorage.setItem('kk_ftue_done', '1')

    this.cameras.main.fadeOut(300, 255, 248, 240)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('HomeScene')
    })
  }
}
