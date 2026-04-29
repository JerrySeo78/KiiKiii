import Phaser from 'phaser'
import { MEMBERS } from '../assets'
import { GameState } from '../GameState'

type Grade = 'normal' | 'rare' | 'sr'

interface CardResult {
  member: typeof MEMBERS[number]
  grade: Grade
  textureKey: string
}

const GACHA_COST = 100
const GRADE_RATES = { sr: 0.05, rare: 0.25, normal: 0.70 }

export class BoxScene extends Phaser.Scene {
  private phase: 'idle' | 'pulling' | 'result' = 'idle'
  private collection: CardResult[] = []

  constructor() { super('BoxScene') }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // Gradient BG
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x1A0A3D, 0x1A0A3D, 0x0D0621, 0x0D0621, 1)
    bg.fillRect(0, 0, W, H)

    // Title area
    this.add.text(W / 2, 24, '🎁 Photo Card Box', {
      fontFamily: 'Nunito', fontSize: '20px', fontStyle: 'bold', color: '#F3F0FF',
    }).setOrigin(0.5)
    this.add.text(W / 2, 50, 'KiiiKiii 공식 포토카드 컬렉션', {
      fontFamily: 'Nunito', fontSize: '12px', color: '#C4B5FD',
    }).setOrigin(0.5)

    // Grade rate info
    this.createRateInfo(W)

    // Card box visual
    this.createCardBox(W, H)

    // Collection grid
    this.createCollectionGrid(W, H)

    // Coin display
    this.add.text(W / 2, H - 24, `보유 🪙 ${GameState.get().coins}`, {
      fontFamily: 'Nunito', fontSize: '13px', color: '#FFD700',
    }).setOrigin(0.5).setName('coinDisplay')

    this.cameras.main.fadeIn(300, 13, 6, 33)
  }

  private createRateInfo(W: number) {
    const rates = [
      { label: 'SR', pct: '5%', color: '#FFD700' },
      { label: 'RARE', pct: '25%', color: '#A78BFA' },
      { label: 'NORMAL', pct: '70%', color: '#9CA3AF' },
    ]
    let x = W / 2 - 110
    rates.forEach(r => {
      this.add.text(x, 72, `${r.label} ${r.pct}`, {
        fontFamily: 'Nunito', fontSize: '11px', fontStyle: 'bold', color: r.color,
      }).setOrigin(0, 0.5)
      x += 80
    })
  }

  private createCardBox(W: number, H: number) {
    // Card back display (the "box")
    const cardY = H * 0.35
    const cardImg = this.add.image(W / 2, cardY, 'card-back')
      .setDisplaySize(140, 192)
      .setInteractive({ useHandCursor: true })

    // Pulse glow
    const glow = this.add.ellipse(W / 2, cardY + 80, 200, 30, 0xA78BFA, 0.15)
    this.tweens.add({ targets: glow, scaleX: 1.1, yoyo: true, repeat: -1, duration: 1200 })
    this.tweens.add({ targets: cardImg, y: cardY - 6, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    // Pull button
    const btnY = H * 0.57
    const btnBg = this.add.rectangle(W / 2, btnY, 220, 50, 0xF59E0B)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.doPull())
      .on('pointerover', () => btnBg.setFillStyle(0xFBBF24))
      .on('pointerout',  () => btnBg.setFillStyle(0xF59E0B))
    this.add.text(W / 2, btnY, `🎴 뽑기 (🪙 ${GACHA_COST})`, {
      fontFamily: 'Nunito', fontSize: '16px', fontStyle: 'bold', color: '#1A0A3D',
    }).setOrigin(0.5)
    this.tweens.add({ targets: btnBg, scaleX: 1.03, scaleY: 1.03, yoyo: true, repeat: -1, duration: 1200 })
  }

  private createCollectionGrid(W: number, H: number) {
    this.add.text(16, H * 0.62, '내 컬렉션', {
      fontFamily: 'Nunito', fontSize: '14px', fontStyle: 'bold', color: '#C4B5FD',
    })
    this.add.text(W - 16, H * 0.62, `${this.collection.length}/50`, {
      fontFamily: 'Nunito', fontSize: '12px', color: 'rgba(196,181,253,0.5)',
    }).setOrigin(1, 0).setName('collectionCount')

    // Empty slots
    const cols = 5, slotW = (W - 32) / cols
    for (let i = 0; i < 10; i++) {
      const col = i % cols, row = Math.floor(i / cols)
      const sx = 16 + col * slotW + slotW / 2
      const sy = H * 0.65 + row * (slotW * 1.4 + 4)
      this.add.rectangle(sx, sy, slotW - 4, slotW * 1.3, 0x1A0A3D)
        .setStrokeStyle(1, 0xA78BFA, 0.2)
        .setName(`slot_${i}`)
    }
  }

  private doPull() {
    if (this.phase !== 'idle') return
    if (!GameState.spendCoins(GACHA_COST)) {
      this.showToast('🪙 코인이 부족해요!')
      return
    }

    this.phase = 'pulling'
    const result = this.rollCard()
    this.collection.unshift(result)

    this.showPullResult(result)
  }

  private rollCard(): CardResult {
    const r = Math.random()
    const grade: Grade = r < GRADE_RATES.sr ? 'sr' : r < GRADE_RATES.sr + GRADE_RATES.rare ? 'rare' : 'normal'
    const member = MEMBERS[Math.floor(Math.random() * MEMBERS.length)]
    const textureKey = grade === 'sr' ? 'card-sr' : grade === 'rare' ? 'card-rare' : 'card-normal'
    const xp = grade === 'sr' ? 30 : grade === 'rare' ? 15 : 5
    GameState.addXp(xp)
    return { member, grade, textureKey }
  }

  private showPullResult(result: CardResult) {
    const W = this.scale.width, H = this.scale.height
    const overlay = this.add.container(0, 0).setDepth(50)

    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.92)
    overlay.add(bg)

    // Grade label
    const gradeColor = result.grade === 'sr' ? '#FFD700' : result.grade === 'rare' ? '#A78BFA' : '#9CA3AF'
    const gradeLabel = result.grade.toUpperCase()

    // Particle burst for SR/RARE
    if (result.grade !== 'normal') {
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2
        const circle = this.add.circle(W / 2, H / 2, 4, result.grade === 'sr' ? 0xFFD700 : 0xA78BFA)
        overlay.add(circle)
        this.tweens.add({
          targets: circle,
          x: W / 2 + Math.cos(angle) * 150,
          y: H / 2 + Math.sin(angle) * 200,
          alpha: { from: 1, to: 0 },
          scale: { from: 1.5, to: 0 },
          duration: 800, ease: 'Power2',
        })
      }
    }

    // Card frame
    const frameY = H * 0.38
    const frame = this.add.image(W / 2, frameY, result.textureKey).setDisplaySize(160, 220).setAlpha(0)
    // Character inside card
    const charImg = this.add.image(W / 2, frameY - 10, result.member.id).setDisplaySize(90, 144).setAlpha(0)
    overlay.add([frame, charImg])

    // Flip-in animation
    this.tweens.add({
      targets: [frame, charImg],
      alpha: 1, scaleX: { from: 0, to: 1 },
      duration: 400, ease: 'Back.easeOut',
    })

    // Grade badge
    const badge = this.add.text(W / 2, frameY + 122, gradeLabel, {
      fontFamily: 'Nunito', fontSize: '14px', fontStyle: 'bold', color: gradeColor,
      backgroundColor: '#1A0A3D', padding: { x: 10, y: 4 },
    }).setOrigin(0.5).setAlpha(0)

    // Member name
    const memberTxt = this.add.text(W / 2, H * 0.67, result.member.name, {
      fontFamily: 'Nunito', fontSize: '22px', fontStyle: 'bold', color: result.member.hex,
    }).setOrigin(0.5).setAlpha(0)
    const xpTxt = this.add.text(W / 2, H * 0.72, `XP +${result.grade === 'sr' ? 30 : result.grade === 'rare' ? 15 : 5}`, {
      fontFamily: 'Nunito', fontSize: '14px', color: '#C4B5FD',
    }).setOrigin(0.5).setAlpha(0)

    overlay.add([badge, memberTxt, xpTxt])
    this.tweens.add({ targets: [badge, memberTxt, xpTxt], alpha: 1, duration: 300, delay: 400 })

    // Close button
    const closeBtn = this.add.text(W / 2, H * 0.83, '확인', {
      fontFamily: 'Nunito', fontSize: '16px', fontStyle: 'bold', color: '#ffffff',
      backgroundColor: '#7C3AED', padding: { x: 32, y: 12 },
    }).setOrigin(0.5).setAlpha(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        overlay.destroy()
        this.phase = 'idle'
        this.updateCoinDisplay()
      })
    overlay.add(closeBtn)
    this.tweens.add({ targets: closeBtn, alpha: 1, duration: 300, delay: 600 })
  }

  private updateCoinDisplay() {
    const txt = this.children.getByName('coinDisplay') as Phaser.GameObjects.Text
    if (txt) txt.setText(`보유 🪙 ${GameState.get().coins}`)
    const cnt = this.children.getByName('collectionCount') as Phaser.GameObjects.Text
    if (cnt) cnt.setText(`${this.collection.length}/50`)
  }

  private showToast(msg: string) {
    const W = this.scale.width, H = this.scale.height
    const toast = this.add.text(W / 2, H * 0.85, msg, {
      fontFamily: 'Nunito', fontSize: '14px', fontStyle: 'bold', color: '#ffffff',
      backgroundColor: '#1A0A3D', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(99)
    this.tweens.add({ targets: toast, alpha: 0, y: H * 0.8, duration: 1500, delay: 1000, onComplete: () => toast.destroy() })
  }
}
