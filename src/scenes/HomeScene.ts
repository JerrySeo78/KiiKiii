import Phaser from 'phaser'
import { MEMBERS } from '../assets'
import { GameState } from '../GameState'

// ── New colour palette ──
const C = {
  pink:      0xFF6B9D,
  deepPink:  0xE8478A,
  purple:    0x9B6DD9,
  coral:     0xFF7B54,
  gold:      0xFFB830,
  cream:     0xFFF5FB,
  lightPink: 0xFFE4F0,
  white:     0xFFFFFF,
  dark:      0x2A1A2E,
  mid:       0x8B6B8E,
  lavender:  0xF0E4FF,
} as const

// Sidebar widths
const LEFT_W  = 80
const RIGHT_W = 90

// Frame index constants (spritesheet)
const F = { BASE: 0, UP1: 1, UP2: 2, UP3: 3, LEAN_R: 4, LEAN_L: 5 }

// ── Daily plan tasks ──
const PLAN_TASKS = [
  { label: '데일리 로그인',       done: true  },
  { label: '메시지 사서함기\n(72/120)', done: true  },
  { label: '미니게임 1회 플레이어', done: false },
  { label: '사진 찍기 1회',       done: false },
  { label: '하루에 만나기',       done: false },
]

// ── Weekly check-in days ──
const CHECKIN_DAYS = [
  { day: '1일차', reward: '',   icon: '✓',  done: true  },
  { day: '2일차', reward: '',   icon: '✓',  done: true  },
  { day: '3일차', reward: '300', icon: '♡', done: false },
  { day: '4일차', reward: '50',  icon: '◇', done: false },
  { day: '5일차', reward: '100', icon: '★', done: false },
  { day: '6일차', reward: '500', icon: '🎁',done: false },
]

export class HomeScene extends Phaser.Scene {
  private activeMember = 0
  private charSprite!: Phaser.GameObjects.Sprite | null
  private charPlaceholder!: Phaser.GameObjects.Arc | null
  private charScaleX = 1
  private charScaleY = 1
  private floatTween!: Phaser.Tweens.Tween
  private idleTimer!: Phaser.Time.TimerEvent

  // Left sidebar member cards (for visual update on select)
  private memberCards: Array<{
    bg:   Phaser.GameObjects.Graphics
    name: Phaser.GameObjects.Text
    sub:  Phaser.GameObjects.Text
  }> = []

  constructor() { super('HomeScene') }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // Restore last selected member
    const saved = localStorage.getItem('kk_selected_member')
    if (saved !== null) {
      const idx = parseInt(saved)
      if (idx >= 0 && idx < MEMBERS.length) this.activeMember = idx
    }

    // Register sprite animations
    this.registerAnims()

    // ── [BG] Full gradient background (pink-purple tropical) ──
    this.drawBackground(W, H)

    // ── [A] Left member sidebar ──
    this.buildLeftSidebar(W, H)

    // ── [B] Centre main area ──
    this.buildCentreArea(W, H)

    // ── [C] Right plan sidebar ──
    this.buildRightSidebar(W, H)

    // ── [D] Bottom CTA ──
    this.buildCTA(W, H)

    // Fade in
    this.cameras.main.fadeIn(300, 42, 26, 46)
  }

  // ════════════════════════════════════════════
  //  Background — layered gradient effect
  // ════════════════════════════════════════════
  private drawBackground(W: number, H: number) {
    const g = this.add.graphics()

    // Sky: deep purple → pink (top 55%)
    const skyH = H * 0.55
    const steps = 20
    for (let i = 0; i < steps; i++) {
      const t   = i / steps
      const r   = Math.round(Phaser.Math.Linear(0x2A, 0xFF, t))
      const grn = Math.round(Phaser.Math.Linear(0x1A, 0x6B, t))
      const b   = Math.round(Phaser.Math.Linear(0x2E, 0x9D, t))
      g.fillStyle((r << 16) | (grn << 8) | b, 1)
      g.fillRect(0, (skyH / steps) * i, W, skyH / steps + 1)
    }

    // Ocean floor: pink → coral (bottom 45%)
    const seaY = skyH
    const seaH = H - skyH
    const seaSteps = 15
    for (let i = 0; i < seaSteps; i++) {
      const t   = i / seaSteps
      const r   = Math.round(Phaser.Math.Linear(0xFF, 0xFF, t))
      const grn = Math.round(Phaser.Math.Linear(0x9B, 0x7B, t))
      const b   = Math.round(Phaser.Math.Linear(0xD9, 0x54, t))
      g.fillStyle((r << 16) | (grn << 8) | b, 1)
      g.fillRect(0, seaY + (seaH / seaSteps) * i, W, seaH / seaSteps + 1)
    }

    // Decorative deco circles (floating orbs)
    g.fillStyle(C.pink, 0.12)
    g.fillCircle(W * 0.15, H * 0.1, 35)
    g.fillStyle(C.purple, 0.10)
    g.fillCircle(W * 0.8, H * 0.18, 25)
    g.fillStyle(C.coral, 0.08)
    g.fillCircle(W * 0.6, H * 0.06, 18)

    // Horizon glow strip
    g.fillStyle(C.lightPink, 0.3)
    g.fillRect(0, H * 0.52, W, 8)

    // bg-home 이미지 오버레이 (존재 시)
    if (this.textures.exists('bg-home')) {
      this.add.image(W / 2, H / 2, 'bg-home')
        .setDisplaySize(W, H)
        .setAlpha(0.4)
    }
  }

  // ════════════════════════════════════════════
  //  [A] Left member sidebar
  // ════════════════════════════════════════════
  private buildLeftSidebar(W: number, H: number) {
    const ctaH   = 54
    const areaH  = H - ctaH
    const CARD_H = 52
    const sidebarBg = this.add.graphics()

    // Semi-transparent sidebar bg
    sidebarBg.fillStyle(0x2A1A2E, 0.55)
    sidebarBg.fillRoundedRect(2, 2, LEFT_W - 4, areaH - 4, { tl: 0, tr: 8, bl: 0, br: 8 })

    // "다시 왔어요!" greeting bubble (top)
    const greetBg = this.add.graphics()
    greetBg.fillStyle(C.pink, 1)
    greetBg.fillRoundedRect(4, 6, LEFT_W - 8, 34, 8)

    this.add.text(LEFT_W / 2, 23, '다시 왔어요!', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5)

    // Sub text below greeting
    this.add.text(LEFT_W / 2, 47, '오늘도 수이와\n여행을 떠나요', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '7px',
      color: '#FFE4F0',
      align: 'center',
    }).setOrigin(0.5)

    // Member cards (all 5 members, active one highlighted)
    const listStartY = 68
    const listSpacing = CARD_H + 4

    MEMBERS.forEach((m, i) => {
      const cy = listStartY + i * listSpacing + CARD_H / 2

      const cardBg = this.add.graphics()
      this.drawMemberCard(cardBg, i, 4, cy - CARD_H / 2, LEFT_W - 8, CARD_H)

      // Member avatar: portrait 이미지 or 색깔 원형 fallback
      const portraitKey = `portrait-${m.id}`
      const circle = this.add.graphics()
      circle.fillStyle(m.color, 1)
      circle.fillCircle(18, cy, 14)
      circle.lineStyle(2, 0xFFFFFF, 0.6)
      circle.strokeCircle(18, cy, 14)

      // Portrait 이미지 (존재 시 원형 위에 오버레이)
      if (this.textures.exists(portraitKey)) {
        this.add.image(18, cy, portraitKey)
          .setDisplaySize(40, 50)
      }

      // Initial letter (portrait 없을 때만 표시)
      const initial = this.add.text(18, cy, m.name.charAt(0), {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#FFFFFF',
      }).setOrigin(0.5)
      if (this.textures.exists(portraitKey)) initial.setVisible(false)

      // Member name
      const nameText = this.add.text(35, cy - 8, m.name, {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '9px',
        fontStyle: 'bold',
        color: i === this.activeMember ? '#FF6B9D' : '#FFF5FB',
      }).setOrigin(0, 0.5)

      // Sub label (member trait)
      const traitLabels = ['♥ 귀여워', '★ 차분함', '♡ 발랄함', '◆ 다정함', '◇ 도전적']
      const subText = this.add.text(35, cy + 6, traitLabels[i] ?? '', {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '7px',
        color: i === this.activeMember ? '#FFB830' : '#8B6B8E',
      }).setOrigin(0, 0.5)

      // Hit area
      this.add.rectangle(LEFT_W / 2, cy, LEFT_W - 4, CARD_H - 2, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.selectMember(i))
        .on('pointerover', () => { nameText.setColor('#FF6B9D') })
        .on('pointerout',  () => { nameText.setColor(i === this.activeMember ? '#FF6B9D' : '#FFF5FB') })

      this.memberCards.push({ bg: cardBg, name: nameText, sub: subText })
    })

    // "데일리 체크인" button at bottom of sidebar
    const btnY = listStartY + MEMBERS.length * listSpacing + 14
    if (btnY < areaH - 20) {
      const dailyBg = this.add.graphics()
      dailyBg.fillStyle(C.deepPink, 1)
      dailyBg.fillRoundedRect(6, btnY, LEFT_W - 12, 22, 6)

      this.add.text(LEFT_W / 2, btnY + 11, '데일리 체크인', {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '7px',
        fontStyle: 'bold',
        color: '#FFFFFF',
      }).setOrigin(0.5)

      this.add.rectangle(LEFT_W / 2, btnY + 11, LEFT_W - 12, 22, 0, 0)
        .setInteractive({ useHandCursor: true })
    }
  }

  private drawMemberCard(g: Phaser.GameObjects.Graphics, idx: number, x: number, y: number, w: number, h: number) {
    g.clear()
    const isActive = idx === this.activeMember
    if (isActive) {
      g.fillStyle(C.pink, 0.25)
      g.fillRoundedRect(x, y, w, h, 6)
      g.lineStyle(1.5, C.pink, 0.8)
      g.strokeRoundedRect(x, y, w, h, 6)
    } else {
      g.fillStyle(C.white, 0.08)
      g.fillRoundedRect(x, y, w, h, 6)
    }
  }

  // ════════════════════════════════════════════
  //  [B] Centre main area
  // ════════════════════════════════════════════
  private buildCentreArea(W: number, H: number) {
    const ctaH   = 54
    const cx     = LEFT_W + (W - LEFT_W - RIGHT_W) / 2
    const centreW = W - LEFT_W - RIGHT_W

    // ── Speech bubble ──
    this.buildSpeechBubble(LEFT_W + 8, 10, centreW - 16, 44)

    // ── Character ──
    const charY = H * 0.42
    this.buildCharacter(cx, charY)

    // ── "메인 멤버" badge ──
    const badgeBg = this.add.graphics()
    badgeBg.fillStyle(C.deepPink, 1)
    badgeBg.fillRoundedRect(cx - 42, charY + 80, 84, 20, 10)
    this.add.text(cx, charY + 90, `메인 멤버 ${MEMBERS[this.activeMember].name}`, {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5)

    // ── Weekly check-in strip ──
    const stripY = H * 0.64
    this.buildCheckinStrip(LEFT_W, stripY, centreW, cx)

    // ── Content cards ──
    const cardsY = H * 0.78
    this.buildContentCards(LEFT_W, cardsY, centreW, H - ctaH - cardsY)
  }

  private buildSpeechBubble(x: number, y: number, w: number, h: number) {
    const g = this.add.graphics()
    g.fillStyle(C.white, 0.92)
    g.fillRoundedRect(x, y, w, h, 10)
    g.lineStyle(2, C.pink, 1)
    g.strokeRoundedRect(x, y, w, h, 10)

    // Tail pointing left-down
    g.fillStyle(C.white, 0.92)
    g.fillTriangle(x + 16, y + h, x + 8, y + h + 8, x + 24, y + h)

    this.add.text(x + w / 2, y + h / 2, '오늘도 수이와 여행을 떠나요 ✦', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#E8478A',
    }).setOrigin(0.5)
  }

  private buildCharacter(cx: number, charY: number) {
    const m = MEMBERS[this.activeMember]
    const spriteKey   = `sprite-${m.id}`    // 새 idle 3-frame 시트
    const standingKey = `standing-${m.id}`  // 정적 chibi 이미지

    if (this.textures.exists(spriteKey)) {
      this.charSprite = this.add.sprite(cx, charY, spriteKey, 0)
        .setDisplaySize(200, 200)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.onCharTap())

      this.charScaleX = this.charSprite.scaleX
      this.charScaleY = this.charSprite.scaleY

      this.charSprite.setScale(0).setAlpha(0)
      this.tweens.add({
        targets: this.charSprite,
        scaleX:  { from: 0, to: this.charScaleX },
        scaleY:  { from: 0, to: this.charScaleY },
        alpha:   { from: 0, to: 1 },
        duration: 500,
        ease: 'Back.easeOut',
        onComplete: () => { this.startFloat(); this.startIdleTimer() },
      })
      this.charPlaceholder = null
    } else if (this.textures.exists(standingKey)) {
      // standing 이미지 사용
      const img = this.add.image(cx, charY, standingKey)
        .setDisplaySize(180, 280)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.onCharTap())

      img.setScale(0).setAlpha(0)
      this.tweens.add({
        targets: img,
        scaleX: { from: 0, to: img.scaleX },
        scaleY: { from: 0, to: img.scaleY },
        alpha:  { from: 0, to: 1 },
        duration: 500,
        ease: 'Back.easeOut',
        onComplete: () => this.startIdleTimer(),
      })
      this.tweens.add({
        targets: img,
        y: charY - 8,
        duration: 2200,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      })
      this.charSprite = null
      this.charPlaceholder = null
    } else {
      this.charPlaceholder = this.add.circle(cx, charY, 70, m.color, 0.9)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.onCharTap())
      this.add.text(cx, charY, m.name.charAt(0), {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#FFFFFF',
      }).setOrigin(0.5)
      this.charSprite = null
    }

    this.add.ellipse(cx, charY + 100, 100, 12, 0x000000, 0.15)
  }

  private buildCheckinStrip(leftX: number, y: number, areaW: number, cx: number) {
    const g = this.add.graphics()
    g.fillStyle(C.white, 0.18)
    g.fillRoundedRect(leftX + 4, y, areaW - 8, 52, 10)

    // Header
    this.add.text(leftX + 12, y + 7, '주간 체크인', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#FFE4F0',
    })

    const count   = CHECKIN_DAYS.length
    const padH    = 6
    const cellW   = (areaW - 8 - padH * 2) / count

    CHECKIN_DAYS.forEach((d, i) => {
      const dx = leftX + 4 + padH + i * cellW + cellW / 2
      const dy = y + 32

      const markerKey = d.done ? 'checkin-claimed' : 'checkin-unclaimed'
      if (this.textures.exists(markerKey)) {
        this.add.image(dx, dy, markerKey).setDisplaySize(24, 24)
      } else {
        const circleBg = this.add.graphics()
        if (d.done) {
          circleBg.fillStyle(0xFF6B9D, 1)
        } else {
          circleBg.fillStyle(0xFFFFFF, 0.25)
          circleBg.lineStyle(1, 0xFF6B9D, 0.6)
          circleBg.strokeCircle(dx, dy, 13)
        }
        circleBg.fillCircle(dx, dy, 13)
        this.add.text(dx, dy, d.done ? d.icon : (d.reward || d.icon), {
          fontFamily: "'Nunito', sans-serif",
          fontSize: d.done ? '10px' : '8px',
          fontStyle: 'bold',
          color: d.done ? '#FFFFFF' : '#FFE4F0',
        }).setOrigin(0.5)
      }

      this.add.text(dx, y + 10, d.day, {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '6px',
        color: '#FFE4F0',
      }).setOrigin(0.5)
    })
  }

  private buildContentCards(leftX: number, y: number, areaW: number, maxH: number) {
    const cards = [
      { icon: '✈', title: '스토리 여행',  sub: '새로운 에피소드를\n감상해요',   scene: 'TripScene'  },
      { icon: '🎮', title: '미니게임',     sub: '귀여운 게임으로\n즐거운 시간!', scene: 'MergeScene' },
      { icon: '📷', title: '포토 박스',   sub: '추억을 담고\n앨범을 꾸며요',   scene: 'BoxScene'   },
    ]

    const GAP   = 6
    const cardW = (areaW - GAP * 4) / 3
    const cardH = Math.min(maxH - 6, 72)

    cards.forEach((card, i) => {
      const cx = leftX + GAP + i * (cardW + GAP) + cardW / 2
      const cy = y + cardH / 2 + 2

      // Card background gradient-ish
      const g = this.add.graphics()
      // Base pink fill
      g.fillStyle(C.deepPink, 1)
      g.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 8)
      // Lighter top accent
      g.fillStyle(C.pink, 0.5)
      g.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH * 0.45, { tl: 8, tr: 8, bl: 0, br: 0 })

      // Icon
      this.add.text(cx, cy - cardH / 2 + 14, card.icon, {
        fontSize: '16px',
      }).setOrigin(0.5)

      // Title
      this.add.text(cx, cy - cardH / 2 + 32, card.title, {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#FFFFFF',
      }).setOrigin(0.5)

      // Sub
      this.add.text(cx, cy - cardH / 2 + 50, card.sub, {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '6.5px',
        color: '#FFE4F0',
        align: 'center',
        lineSpacing: 1,
      }).setOrigin(0.5)

      // Arrow bottom-right
      this.add.text(cx + cardW / 2 - 8, cy + cardH / 2 - 6, '→', {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '10px',
        color: '#FFE4F0',
      }).setOrigin(1, 1)

      // Hit area
      const target = card.scene
      this.add.rectangle(cx, cy, cardW, cardH, 0, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.tweens.add({ targets: g, alpha: 0.6, duration: 80, yoyo: true })
        })
        .on('pointerup', () => {
          this.cameras.main.fadeOut(200, 42, 26, 46)
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(target))
        })
    })
  }

  // ════════════════════════════════════════════
  //  [C] Right plan sidebar
  // ════════════════════════════════════════════
  private buildRightSidebar(W: number, H: number) {
    const x    = W - RIGHT_W
    const ctaH = 54

    // Sidebar bg
    const g = this.add.graphics()
    g.fillStyle(0x2A1A2E, 0.55)
    g.fillRoundedRect(x + 2, 2, RIGHT_W - 4, H - ctaH - 4, { tl: 8, tr: 0, bl: 8, br: 0 })

    // Header
    const hdrBg = this.add.graphics()
    hdrBg.fillStyle(C.purple, 1)
    hdrBg.fillRoundedRect(x + 4, 6, RIGHT_W - 8, 26, 8)
    this.add.text(x + RIGHT_W / 2, 19, '오늘의 플랜 ✦', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '8.5px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5)

    // Task list
    const taskStartY = 42
    const taskH      = 36

    PLAN_TASKS.forEach((task, i) => {
      const ty = taskStartY + i * taskH

      // Row bg
      const rowBg = this.add.graphics()
      rowBg.fillStyle(task.done ? C.pink : C.white, task.done ? 0.15 : 0.06)
      rowBg.fillRoundedRect(x + 4, ty, RIGHT_W - 8, taskH - 2, 5)

      // Checkbox
      const cbKey = task.done ? 'checkin-checked' : 'checkin-unchecked'
      if (this.textures.exists(cbKey)) {
        this.add.image(x + 14, ty + (taskH - 2) / 2, cbKey).setDisplaySize(14, 14)
      } else {
        const cbg = this.add.graphics()
        if (task.done) {
          cbg.fillStyle(C.pink, 1)
          cbg.fillCircle(x + 14, ty + (taskH - 2) / 2, 7)
          this.add.text(x + 14, ty + (taskH - 2) / 2, '✓', {
            fontSize: '8px', fontStyle: 'bold', color: '#FFFFFF',
          }).setOrigin(0.5)
        } else {
          cbg.lineStyle(1.5, 0x8B6B8E, 0.8)
          cbg.strokeCircle(x + 14, ty + (taskH - 2) / 2, 7)
        }
      }

      // Task label
      this.add.text(x + 24, ty + (taskH - 2) / 2, task.label, {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '7px',
        color: task.done ? '#FFE4F0' : '#C0A8C8',
        lineSpacing: 1,
        wordWrap: { width: RIGHT_W - 32 },
      }).setOrigin(0, 0.5)
    })

    // Reward button
    const rewardY = taskStartY + PLAN_TASKS.length * taskH + 8
    if (rewardY < H - ctaH - 30) {
      const rbg = this.add.graphics()
      rbg.fillStyle(C.gold, 1)
      rbg.fillRoundedRect(x + 6, rewardY, RIGHT_W - 12, 26, 8)

      this.add.text(x + RIGHT_W / 2, rewardY + 13, '플랜 완료 → 50 ✦', {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '7.5px',
        fontStyle: 'bold',
        color: '#2A1A2E',
      }).setOrigin(0.5)

      this.add.rectangle(x + RIGHT_W / 2, rewardY + 13, RIGHT_W - 12, 26, 0, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.tweens.add({ targets: rbg, alpha: 0.7, duration: 80, yoyo: true })
        })
    }
  }

  // ════════════════════════════════════════════
  //  [D] Bottom CTA
  // ════════════════════════════════════════════
  private buildCTA(W: number, H: number) {
    const ctaH = 54
    const y    = H - ctaH

    // Gradient bar (pink → coral)
    const g = this.add.graphics()
    const steps = 20
    for (let i = 0; i < steps; i++) {
      const t   = i / steps
      const r   = Math.round(Phaser.Math.Linear(0xFF, 0xFF, t))
      const grn = Math.round(Phaser.Math.Linear(0x6B, 0x7B, t))
      const b   = Math.round(Phaser.Math.Linear(0x9D, 0x54, t))
      g.fillStyle((r << 16) | (grn << 8) | b, 1)
      g.fillRect((W / steps) * i, y, W / steps + 1, ctaH)
    }

    // Star decorations
    const starPositions = [20, 60, W - 60, W - 20]
    starPositions.forEach(sx => {
      this.add.text(sx, y + ctaH / 2, '★', {
        fontSize: '13px',
        color: '#FFFFFF',
      }).setOrigin(0.5).setAlpha(0.7)
    })

    // Main CTA text
    this.add.text(W / 2, y + ctaH / 2, '✈  오늘의 여행 시작', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5)

    // Hit area
    this.add.rectangle(W / 2, y + ctaH / 2, W, ctaH, 0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.tweens.add({ targets: g, alpha: 0.75, duration: 80, yoyo: true })
      })
      .on('pointerup', () => {
        this.cameras.main.fadeOut(200, 42, 26, 46)
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TripScene'))
      })
  }

  // ════════════════════════════════════════════
  //  Member selection
  // ════════════════════════════════════════════
  selectMember(i: number) {
    this.activeMember = i
    localStorage.setItem('kk_selected_member', String(i))
    const m = MEMBERS[i]

    // Update member card visuals
    this.memberCards.forEach((card, idx) => {
      this.drawMemberCard(card.bg, idx,
        4, 68 + idx * 56 + 56 / 2 - 56 / 2,
        LEFT_W - 8, 52)
      card.name.setColor(idx === i ? '#FF6B9D' : '#FFF5FB')
      const traitColors = ['♥ 귀여워', '★ 차분함', '♡ 발랄함', '◆ 다정함', '◇ 도전적']
      card.sub.setColor(idx === i ? '#FFB830' : '#8B6B8E')
    })

    // Character swap
    if (this.floatTween) this.floatTween.stop()
    if (this.idleTimer) this.idleTimer.remove()

    if (this.charSprite) {
      this.tweens.add({
        targets: this.charSprite,
        scaleX: 0, scaleY: 0, alpha: 0,
        duration: 150, ease: 'Power2.easeIn',
        onComplete: () => {
          if (this.charSprite) {
            this.charSprite.setTexture(`sprite-${m.id}`, 0)
            this.tweens.add({
              targets: this.charSprite,
              scaleX: { from: 0, to: this.charScaleX },
              scaleY: { from: 0, to: this.charScaleY },
              alpha:  { from: 0, to: 1 },
              duration: 350, ease: 'Back.easeOut',
              onComplete: () => { this.startFloat(); this.startIdleTimer() },
            })
          }
        },
      })
    } else if (this.charPlaceholder) {
      this.charPlaceholder.setFillStyle(m.color, 0.9)
    }
  }

  // ════════════════════════════════════════════
  //  Animation registration
  // ════════════════════════════════════════════
  private registerAnims() {
    MEMBERS.forEach(m => {
      const spriteKey = `sprite-${m.id}`
      if (!this.textures.exists(spriteKey)) return
      if (this.anims.exists(`${m.id}-float`)) return

      this.anims.create({
        key: `${m.id}-float`,
        frames: [
          { key: spriteKey, frame: 0 },
          { key: spriteKey, frame: 1 },
          { key: spriteKey, frame: 2 },
          { key: spriteKey, frame: 1 },
        ],
        frameRate: 4,
        repeat: -1,
      })
    })
  }

  // ════════════════════════════════════════════
  //  Float animation
  // ════════════════════════════════════════════
  private startFloat() {
    if (!this.charSprite) return
    const m = MEMBERS[this.activeMember]
    if (this.textures.exists(`sprite-${m.id}`)) {
      this.charSprite.play(`${m.id}-float`)
    }
  }

  // ════════════════════════════════════════════
  //  Idle emotion timer
  // ════════════════════════════════════════════
  private startIdleTimer() {
    const delay = Phaser.Math.Between(3000, 6000)
    this.idleTimer = this.time.delayedCall(delay, () => this.playIdleEmotion())
  }

  private playIdleEmotion() {
    if (!this.charSprite) { this.startIdleTimer(); return }
    const m     = MEMBERS[this.activeMember]
    const emote = Phaser.Math.RND.pick(['lean', 'bounce', 'shy'])

    if (emote === 'lean') {
      this.charSprite.stop()
      this.charSprite.setFrame(F.LEAN_R)
      this.time.delayedCall(400, () => {
        if (!this.charSprite) return
        this.charSprite.setFrame(F.LEAN_L)
        this.time.delayedCall(400, () => {
          if (!this.charSprite) return
          this.charSprite.play(`${m.id}-float`)
          this.startIdleTimer()
        })
      })
    } else if (emote === 'bounce') {
      const baseY = this.charSprite.y
      this.tweens.add({
        targets: this.charSprite,
        y: baseY - 18,
        duration: 200, ease: 'Power2.easeOut', yoyo: true,
        onComplete: () => this.startIdleTimer(),
      })
    } else {
      // shy
      this.tweens.add({
        targets: this.charSprite,
        scaleX: this.charScaleX * 0.88,
        scaleY: this.charScaleY * 0.88,
        duration: 200, ease: 'Power2.easeOut', yoyo: true,
        onComplete: () => this.startIdleTimer(),
      })
    }
  }

  // ════════════════════════════════════════════
  //  Character tap reaction
  // ════════════════════════════════════════════
  private onCharTap() {
    if (this.charSprite) {
      const baseY = this.charSprite.y
      this.charSprite.stop()
      this.charSprite.setFrame(F.UP2)
      this.tweens.add({
        targets: this.charSprite,
        y:      baseY - 30,
        scaleX: this.charScaleX * 1.15,
        scaleY: this.charScaleY * 1.15,
        duration: 180, ease: 'Power2.easeOut',
        yoyo: true,
        onComplete: () => {
          if (!this.charSprite) return
          const m = MEMBERS[this.activeMember]
          this.charSprite.play(`${m.id}-float`)
        },
      })
    } else if (this.charPlaceholder) {
      this.tweens.add({
        targets: this.charPlaceholder,
        scaleX: 1.15, scaleY: 1.15,
        duration: 180, ease: 'Power2.easeOut',
        yoyo: true,
      })
    }

    // Floating hearts
    const heartX = this.charSprite?.x ?? this.charPlaceholder?.x ?? this.scale.width / 2
    const heartY = (this.charSprite?.y ?? this.charPlaceholder?.y ?? this.scale.height / 2) - 60
    const hearts = ['❤️', '🩷', '💕']
    for (let i = 0; i < 3; i++) {
      const hx = heartX + Phaser.Math.Between(-40, 40)
      const hy = heartY
      const ht = this.add.text(hx, hy, Phaser.Math.RND.pick(hearts), { fontSize: '22px' })
        .setOrigin(0.5)
      this.tweens.add({
        targets: ht,
        y:     hy - 70,
        alpha: 0,
        duration: 900,
        delay:   i * 120,
        ease:    'Power2.easeOut',
        onComplete: () => ht.destroy(),
      })
    }
  }
}
