import Phaser from 'phaser'
import { MEMBERS } from '../assets'
import { GameState } from '../GameState'

// Editorial colour palette
const C = {
  white:    0xFFFFFF,
  cream:    0xFFF8F0,
  coral:    0xFF6B35,
  dark:     0x1A1A1A,
  mid:      0x8B6355,
  border:   0xE8E0D8,
  muted:    0xC0B0A8,
  // legacy (kept for animation helpers)
  sand:     0xF0E0C0,
  green:    0x2D6A4F,
  ocean:    0x0096C7,
  gold:     0xF4A800,
} as const

// Frame index constants
const F = { BASE: 0, UP1: 1, UP2: 2, UP3: 3, LEAN_R: 4, LEAN_L: 5 }

// ─── Section height ratios ───
const HERO_RATIO  = 0.58   // [A] Hero
const STRIP_H     = 40     // [B] Today strip (px)

export class HomeScene extends Phaser.Scene {
  private activeMember = 0
  private charSprite!: Phaser.GameObjects.Sprite
  private charScaleX = 1
  private charScaleY = 1
  private floatTween!: Phaser.Tweens.Tween
  private idleTimer!: Phaser.Time.TimerEvent

  // Tab objects (vertical sidebar)
  private tabBars:   Phaser.GameObjects.Rectangle[] = []
  private tabLabels: Phaser.GameObjects.Text[]      = []

  // Keep intimacyBar for legacy compat (unused in new layout but kept for type safety)
  private intimacyBar!: Phaser.GameObjects.Rectangle

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

    // ── Full-screen white base ──
    this.add.rectangle(W / 2, H / 2, W, H, C.white)

    // ── [A] HERO SECTION ──
    this.buildHero(W, H)

    // ── [B] TODAY STRIP ──
    const stripY = H * HERO_RATIO + STRIP_H / 2
    this.buildTodayStrip(W, stripY)

    // ── [C] QUICK GRID ──
    const gridTop = H * HERO_RATIO + STRIP_H
    this.buildQuickGrid(W, H, gridTop)

    // Fade in — pure white
    this.cameras.main.fadeIn(300, 255, 255, 255)
  }

  // ══════════════════════════════════════════
  //  [A] HERO SECTION — Editorial background + large character
  // ══════════════════════════════════════════
  private buildHero(W: number, H: number) {
    const heroH = H * HERO_RATIO

    // Register animations (once per scene)
    this.registerAnims()

    // ── Background: pure white top ──
    this.add.rectangle(W / 2, heroH / 2, W, heroH, C.white)

    // ── Background: cream gradient effect (bottom 40%) ──
    const gradH = heroH * 0.4
    const gradY = heroH - gradH / 2
    this.add.rectangle(W / 2, gradY, W, gradH, C.cream)

    // ── Subtle deco: large beige ellipse (back-wall feel) ──
    this.add.ellipse(W / 2, heroH * 0.4, W * 1.1, heroH * 0.9, 0xF5E8D5, 0.15)

    // ── Background member-name typography (right side, large) ──
    const m0 = MEMBERS[this.activeMember]
    this.add.text(
      W - 16, heroH * 0.08,
      m0.name.toUpperCase(),
      {
        fontFamily: "'Playfair Display', serif",
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#F0E0C0',
      }
    ).setOrigin(1, 0).setAlpha(0.8)

    // ── Character shadow ellipse ──
    this.add.ellipse(W / 2, heroH * 0.90, 110, 14, 0xE8E0D8, 0.5)

    // ── Character sprite — large, editorial ──
    const charDisplayW = 200
    const charDisplayH = 320
    const charY = heroH * 0.56

    this.charSprite = this.add.sprite(W / 2, charY, `${m0.id}-sheet`, F.BASE)
      .setDisplaySize(charDisplayW, charDisplayH)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.onCharTap())

    // Entrance animation
    this.charScaleX = this.charSprite.scaleX
    this.charScaleY = this.charSprite.scaleY
    this.charSprite.setScale(0).setAlpha(0)
    this.tweens.add({
      targets: this.charSprite,
      scaleX: { from: 0, to: this.charScaleX },
      scaleY: { from: 0, to: this.charScaleY },
      alpha:  { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.startFloat()
        this.startIdleTimer()
      },
    })

    // ── Vertical member tabs (left sidebar) ──
    this.buildMemberTabs(W, heroH)

    // ── Bottom coral divider line ──
    const line = this.add.graphics()
    line.fillStyle(C.coral, 1)
    line.fillRect(0, heroH - 2, W, 2)
  }

  // ══════════════════════════════════════════
  //  Vertical member tabs — left area
  // ══════════════════════════════════════════
  private buildMemberTabs(W: number, heroH: number) {
    const tabX      = 20
    const tabStartY = heroH * 0.15
    const tabSpacing = heroH * 0.13

    MEMBERS.forEach((m, i) => {
      const ty = tabStartY + i * tabSpacing
      const isActive = i === this.activeMember

      // Active indicator: coral vertical bar
      const bar = this.add.rectangle(tabX, ty, 3, 16, isActive ? C.coral : C.border)
        .setOrigin(0, 0.5)

      // Member name label
      const label = this.add.text(
        tabX + 10, ty,
        m.name,
        {
          fontFamily: "'Nunito', sans-serif",
          fontSize: '11px',
          fontStyle: 'bold',
          color: isActive ? '#FF6B35' : '#C0B0A8',
        }
      ).setOrigin(0, 0.5)

      // Hit area covering bar + label
      const hitW = 64
      const hitH = Math.max(tabSpacing - 4, 28)
      this.add.rectangle(tabX + hitW / 2, ty, hitW, hitH, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.selectMember(i))

      this.tabBars.push(bar)
      this.tabLabels.push(label)
    })
  }

  // ══════════════════════════════════════════
  //  [B] TODAY STRIP
  // ══════════════════════════════════════════
  private buildTodayStrip(W: number, stripCenterY: number) {
    // Full-width coral bar
    this.add.rectangle(W / 2, stripCenterY, W, STRIP_H, C.coral)

    // Strip text
    this.add.text(
      W / 2, stripCenterY,
      '● CONCERT D-7 · 도쿄 武道館 · 2026.05.06',
      {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#FFFFFF',
      }
    ).setOrigin(0.5)
  }

  // ══════════════════════════════════════════
  //  [C] QUICK GRID  (2-col editorial cards)
  // ══════════════════════════════════════════
  private buildQuickGrid(W: number, H: number, gridTop: number) {
    const state = GameState.get()

    const cards = [
      {
        tag:   'game',
        title: 'Play Today',
        sub:   `Heart ×${state.hearts}`,
        scene: 'MergeScene' as string | null,
      },
      {
        tag:   'my room',
        title: 'My Room',
        sub:   '방 꾸미기',
        scene: 'RoomScene' as string | null,
      },
      {
        tag:   'explore',
        title: 'Explore',
        sub:   'Visit fan rooms',
        scene: 'ExploreScene' as string | null,
      },
      {
        tag:   'today',
        title: 'Today',
        sub:   'Concert D-7',
        scene: 'TodayScene' as string | null,
      },
    ]

    const GAP   = 12
    const COLS  = 2
    const cardW = (W - GAP * 3) / COLS                     // 12 left + 12 gap + 12 right
    const availH = H - gridTop
    const cardH  = (availH - GAP * 3) / 2                  // 2 rows with padding

    cards.forEach((card, i) => {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const cx  = GAP + col * (cardW + GAP) + cardW / 2
      const cy  = gridTop + GAP + row * (cardH + GAP) + cardH / 2

      this.drawCard(cx, cy, cardW, cardH, card)
    })
  }

  private drawCard(
    cx: number, cy: number, cardW: number, cardH: number,
    card: { tag: string; title: string; sub: string; scene: string | null }
  ) {
    const g = this.add.graphics()

    // Card background
    g.fillStyle(C.cream, 1)
    g.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 8)
    g.lineStyle(1, C.border, 1)
    g.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 8)

    // Drop shadow (subtle)
    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.06)
    shadow.fillRoundedRect(cx - cardW / 2 + 2, cy - cardH / 2 + 3, cardW, cardH, 8)
    shadow.setDepth(-1)

    // Category tag — coral, small caps
    const tagY = cy - cardH / 2 + 14
    this.add.text(
      cx - cardW / 2 + 12, tagY,
      card.tag,
      {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#FF6B35',
        letterSpacing: 1,
      }
    ).setOrigin(0, 0.5)

    // Title — Playfair Display
    const titleY = cy - cardH / 2 + 34
    this.add.text(
      cx - cardW / 2 + 12, titleY,
      card.title,
      {
        fontFamily: "'Playfair Display', serif",
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#1A1A1A',
        wordWrap: { width: cardW - 28 },
      }
    ).setOrigin(0, 0)

    // Sub text — Nunito
    const subY = cy - cardH / 2 + 56
    this.add.text(
      cx - cardW / 2 + 12, subY,
      card.sub,
      {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '11px',
        color: '#8B6355',
      }
    ).setOrigin(0, 0)

    // Arrow → bottom-right
    this.add.text(
      cx + cardW / 2 - 12, cy + cardH / 2 - 12,
      '→',
      {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '14px',
        color: '#C0B0A8',
      }
    ).setOrigin(1, 1)

    // Hit area
    if (card.scene) {
      const targetScene = card.scene
      this.add.rectangle(cx, cy, cardW, cardH, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.tweens.add({ targets: g, alpha: 0.7, duration: 80, yoyo: true })
        })
        .on('pointerup', () => {
          this.cameras.main.fadeOut(200, 255, 255, 255)
          this.cameras.main.once('camerafadeoutcomplete', () =>
            this.scene.start(targetScene)
          )
        })
    }
  }

  // ══════════════════════════════════════════
  //  Member selection
  // ══════════════════════════════════════════
  selectMember(i: number) {
    this.activeMember = i
    localStorage.setItem('kk_selected_member', String(i))
    const m = MEMBERS[i]

    // Character swap
    this.floatTween?.stop()
    this.idleTimer?.remove()
    this.tweens.add({
      targets: this.charSprite,
      scaleX: 0, scaleY: 0, alpha: 0,
      duration: 150, ease: 'Power2.easeIn',
      onComplete: () => {
        this.charSprite.setTexture(`${m.id}-sheet`, F.BASE)
        this.tweens.add({
          targets: this.charSprite,
          scaleX: { from: 0, to: this.charScaleX },
          scaleY: { from: 0, to: this.charScaleY },
          alpha:  { from: 0, to: 1 },
          duration: 350, ease: 'Back.easeOut',
          onComplete: () => { this.startFloat(); this.startIdleTimer() },
        })
      },
    })

    // Update tab visuals
    this.tabBars.forEach((bar, idx) => {
      bar.setFillStyle(idx === i ? C.coral : C.border)
    })
    this.tabLabels.forEach((lbl, idx) => {
      lbl.setColor(idx === i ? '#FF6B35' : '#C0B0A8')
    })
  }

  // ══════════════════════════════════════════
  //  Animation registration
  // ══════════════════════════════════════════
  private registerAnims() {
    MEMBERS.forEach(m => {
      const key = `${m.id}-float`
      if (this.anims.exists(key)) return
      this.anims.create({
        key,
        frames: [
          { key: `${m.id}-sheet`, frame: F.BASE },
          { key: `${m.id}-sheet`, frame: F.UP1  },
          { key: `${m.id}-sheet`, frame: F.UP2  },
          { key: `${m.id}-sheet`, frame: F.UP3  },
          { key: `${m.id}-sheet`, frame: F.UP2  },
          { key: `${m.id}-sheet`, frame: F.UP1  },
        ],
        frameRate: 4,
        repeat: -1,
      })
    })
  }

  // ══════════════════════════════════════════
  //  Float animation
  // ══════════════════════════════════════════
  private startFloat() {
    const m = MEMBERS[this.activeMember]
    this.charSprite.play(`${m.id}-float`)
  }

  // ══════════════════════════════════════════
  //  Idle emotion timer
  // ══════════════════════════════════════════
  private startIdleTimer() {
    const delay = Phaser.Math.Between(3000, 6000)
    this.idleTimer = this.time.delayedCall(delay, () => {
      this.playIdleEmotion()
    })
  }

  private playIdleEmotion() {
    const m     = MEMBERS[this.activeMember]
    const emote = Phaser.Math.RND.pick(['lean', 'bounce', 'shy'])

    if (emote === 'lean') {
      this.charSprite.stop()
      this.charSprite.setFrame(F.LEAN_R)
      this.time.delayedCall(400, () => {
        this.charSprite.setFrame(F.LEAN_L)
        this.time.delayedCall(400, () => {
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

  // ══════════════════════════════════════════
  //  Character tap reaction
  // ══════════════════════════════════════════
  private onCharTap() {
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
        const m = MEMBERS[this.activeMember]
        this.charSprite.play(`${m.id}-float`)
      },
    })

    // Floating hearts
    const hearts = ['❤️', '🩷', '💕']
    for (let i = 0; i < 3; i++) {
      const hx = this.charSprite.x + Phaser.Math.Between(-40, 40)
      const hy = this.charSprite.y - 60
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
