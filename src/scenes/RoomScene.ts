import Phaser from 'phaser'
import { MEMBERS } from '../assets'
import { GameState } from '../GameState'

// ── Colour palette ──────────────────────────────────────────────────
const C = {
  mainPink:   0xFF6B9D,
  deepPink:   0xE8478A,
  purple:     0x9B6DD9,
  coral:      0xFF7B54,
  gold:       0xFFB830,
  cream:      0xFFF5FB,
  lightPink:  0xFFE4F0,
  white:      0xFFFFFF,
  dark:       0x2A1A2E,
  lavender:   0xF0E4FF,
  softGray:   0xF5F0F8,
} as const

// ── Layout constants ────────────────────────────────────────────────
const HEADER_H    = 48
const LEFT_W      = 90
const TAB_BAR_H   = 50
const CONTENT_H   = 200
const BOTTOM_BTN_H = 44

type TabKey = 'deco' | 'outfit' | 'furniture' | 'gift' | 'chat'

interface DecoItem {
  key: string
  label: string
  selected: boolean
}

export class RoomScene extends Phaser.Scene {
  // ── Tab state ──
  private activeTab: TabKey = 'deco'
  private tabContainers: Record<TabKey, Phaser.GameObjects.Container> = {} as Record<TabKey, Phaser.GameObjects.Container>
  private tabBtns: { key: TabKey; bg: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image; label: Phaser.GameObjects.Text }[] = []

  // ── Outfit / furniture selection ──
  private outfitItems: DecoItem[] = [
    { key: 'outfit_0', label: '빨간 카디건', selected: true  },
    { key: 'outfit_1', label: '버니 후디',   selected: false },
    { key: 'outfit_2', label: '세일러',      selected: false },
    { key: 'outfit_3', label: '스트로우 햇', selected: false },
  ]
  private furnitureItems: DecoItem[] = [
    { key: 'furn_0', label: '침대',         selected: false },
    { key: 'furn_1', label: '드레싱 테이블', selected: false },
    { key: 'furn_2', label: '발코니 뷰',    selected: false },
    { key: 'furn_3', label: '화분 러그',    selected: false },
  ]

  // ── Character ──
  private charSprite!: Phaser.GameObjects.Sprite
  private charFloatTween!: Phaser.Tweens.Tween

  constructor() { super('RoomScene') }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    this.cameras.main.fadeIn(300, 255, 245, 251)

    // ── Background base ──
    this.add.rectangle(W / 2, H / 2, W, H, C.cream)

    // ── Zones (top to bottom) ──
    // Header: 0 ~ HEADER_H
    // Left panel: HEADER_H ~ H-TAB_BAR_H-CONTENT_H-BOTTOM_BTN_H, width = LEFT_W
    // Room: HEADER_H ~ H-TAB_BAR_H-CONTENT_H-BOTTOM_BTN_H
    // Tab bar: H-TAB_BAR_H-CONTENT_H-BOTTOM_BTN_H ~ H-CONTENT_H-BOTTOM_BTN_H
    // Content: H-CONTENT_H-BOTTOM_BTN_H ~ H-BOTTOM_BTN_H
    // Bottom buttons: H-BOTTOM_BTN_H ~ H

    const roomTop   = HEADER_H
    const roomBot   = H - TAB_BAR_H - CONTENT_H - BOTTOM_BTN_H
    const tabBarY   = roomBot
    const contentY  = tabBarY + TAB_BAR_H
    const btnY      = H - BOTTOM_BTN_H

    this.buildRoom(W, roomTop, roomBot)
    this.buildCharacter(W, roomTop, roomBot)
    this.buildSpeechBubble(W, roomTop, roomBot)
    this.buildLeftPanel(roomTop, roomBot)
    this.buildHeader(W)
    this.buildTabBar(W, tabBarY)
    this.buildContentArea(W, contentY, CONTENT_H)
    this.buildBottomButtons(W, btnY, BOTTOM_BTN_H)

    void GameState.get()
  }

  // ══════════════════════════════════════════════════════════════════
  //  Header
  // ══════════════════════════════════════════════════════════════════
  private buildHeader(W: number) {
    const depth = 30

    // BG
    this.add.rectangle(W / 2, HEADER_H / 2, W, HEADER_H, C.white)
      .setDepth(depth).setScrollFactor(0)

    // Bottom border
    const g = this.add.graphics().setDepth(depth).setScrollFactor(0)
    g.lineStyle(1, C.lightPink, 1)
    g.beginPath(); g.moveTo(0, HEADER_H); g.lineTo(W, HEADER_H); g.strokePath()

    // ← Back button
    this.add.text(14, HEADER_H / 2, '←', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#FF6B9D',
    }).setOrigin(0, 0.5).setDepth(depth + 1).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.cameras.main.fadeOut(250, 255, 245, 251)
        this.cameras.main.once('camerafadeoutcomplete', () =>
          this.scene.start('HomeScene')
        )
      })

    // Title
    this.add.text(W / 2, HEADER_H / 2, '멤버 하우스 / 꾸미기', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#FF6B9D',
    }).setOrigin(0.5).setDepth(depth + 1).setScrollFactor(0)

    // ? Help button
    const helpBg = this.add.circle(W - 18, HEADER_H / 2, 13, C.lightPink)
      .setDepth(depth + 1).setScrollFactor(0)
    this.add.text(W - 18, HEADER_H / 2, '?', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FF6B9D',
    }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showToast('도움말 준비 중 🌸'))
    void helpBg
  }

  // ══════════════════════════════════════════════════════════════════
  //  Left panel
  // ══════════════════════════════════════════════════════════════════
  private buildLeftPanel(roomTop: number, roomBot: number) {
    const depth = 10
    const panelH = roomBot - roomTop
    const px = LEFT_W / 2
    const py = roomTop + panelH / 2

    // Semi-transparent panel
    const bg = this.add.rectangle(px, py, LEFT_W, panelH, C.lightPink, 0.88)
      .setDepth(depth).setScrollFactor(0)
    void bg

    // Label: "추천 멤버"
    this.add.text(px, roomTop + 10, '추천 멤버', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '9px',
      color: '#FF6B9D',
    }).setOrigin(0.5, 0).setDepth(depth + 1).setScrollFactor(0)

    // Member name
    const idx = parseInt(localStorage.getItem('kk_selected_member') ?? '0')
    const m   = MEMBERS[Math.min(idx, MEMBERS.length - 1)]

    this.add.text(px, roomTop + 26, m.name, {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#2A1A2E',
    }).setOrigin(0.5, 0).setDepth(depth + 1).setScrollFactor(0)

    // Intimacy level — use levelFrame image if available
    const levelY = roomTop + 50
    if (this.textures.exists('uiframe-levelFrame')) {
      this.add.image(LEFT_W / 2, levelY, 'uiframe-levelFrame')
        .setDisplaySize(LEFT_W - 8, 28)
        .setDepth(depth + 1).setScrollFactor(0)
    } else {
      this.add.text(px, roomTop + 44, '친밀도 Lv.6', {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '9px',
        color: '#9B6DD9',
      }).setOrigin(0.5, 0).setDepth(depth + 1).setScrollFactor(0)
    }

    // XP bar
    const barX = 6
    const barY = roomTop + 58
    const barW = LEFT_W - 12
    const barH = 6
    if (this.textures.exists('uiframe-affinityBar')) {
      this.add.image(LEFT_W / 2, barY + barH / 2, 'uiframe-affinityBar')
        .setDisplaySize(LEFT_W - 8, 12)
        .setDepth(depth + 1).setScrollFactor(0)
    } else {
      this.add.rectangle(barX + barW / 2, barY + barH / 2, barW, barH, C.softGray)
        .setDepth(depth + 1).setScrollFactor(0)
      // XP fill (720/1000 = 72%)
      const fillW = Math.round(barW * 0.72)
      this.add.rectangle(barX + fillW / 2, barY + barH / 2, fillW, barH, C.mainPink)
        .setDepth(depth + 2).setScrollFactor(0)
    }

    // XP text
    this.add.text(px, barY + barH + 3, '720 / 1,000', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '8px',
      color: '#9B6DD9',
    }).setOrigin(0.5, 0).setDepth(depth + 1).setScrollFactor(0)

    // "친밀도 보상" button
    const rewardY = barY + barH + 16
    const rewardBg = this.add.rectangle(px, rewardY + 9, LEFT_W - 12, 18, C.white)
      .setDepth(depth + 1).setScrollFactor(0)
    const rewardG = this.add.graphics().setDepth(depth + 2).setScrollFactor(0)
    rewardG.lineStyle(1, C.mainPink, 1)
    rewardG.strokeRect(barX, rewardY, barW, 18)
    this.add.text(px, rewardY + 9, '친밀도 보상', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#FF6B9D',
    }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showToast('준비 중 🎁'))
    void rewardBg

    // Right side vertical buttons
    const btns = [
      { icon: '🎤', label: '오늘의\n보이스', btnKey: 'voice' },
      { icon: '✉️', label: '편지',          btnKey: 'letter' },
      { icon: '📷', label: 'AR 포즈',      btnKey: 'ar'     },
    ]
    const btnStartY = roomTop + 14
    const btnSpacing = (panelH - 60) / btns.length
    const btnX = LEFT_W - 20

    btns.forEach((b, i) => {
      const by = btnStartY + i * btnSpacing + btnSpacing / 2
      const btnImgKey = `btn-${b.btnKey}`

      if (this.textures.exists(btnImgKey)) {
        this.add.image(btnX, by, btnImgKey)
          .setDisplaySize(34, 28)
          .setDepth(depth + 1).setScrollFactor(0)
      } else {
        const bbg = this.add.rectangle(btnX, by, 34, 40, C.white, 0.9)
          .setDepth(depth + 1).setScrollFactor(0)
        void bbg

        const outlineG = this.add.graphics().setDepth(depth + 2).setScrollFactor(0)
        outlineG.lineStyle(1, C.lightPink, 1)
        outlineG.strokeRect(btnX - 17, by - 20, 34, 40)
      }

      this.add.text(btnX, by - 8, b.icon, {
        fontSize: '14px',
      }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0)

      this.add.text(btnX, by + 6, b.label, {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '7px',
        color: '#2A1A2E',
        align: 'center',
      }).setOrigin(0.5, 0).setDepth(depth + 3).setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.showToast(`${b.label} 준비 중`))
    })
  }

  // ══════════════════════════════════════════════════════════════════
  //  Room background (bg-room 이미지 or 그라데이션 fallback)
  // ══════════════════════════════════════════════════════════════════
  private buildRoom(W: number, roomTop: number, roomBot: number) {
    const roomH = roomBot - roomTop
    const roomCX = (LEFT_W + W) / 2
    const roomCY = roomTop + roomH / 2

    // bg-room 이미지가 있으면 이미지로 교체, 없으면 기존 그라데이션
    if (this.textures.exists('bg-room')) {
      this.add.image(roomCX, roomCY, 'bg-room')
        .setDisplaySize(W - LEFT_W, roomH)
        .setDepth(1)
      return
    }

    // Fallback: 그라데이션 그래픽
    const g = this.add.graphics().setDepth(1)

    // Sky gradient — multiple horizontal bands
    const bands = [
      { pct: 0,    color: 0xF7D4E8 },
      { pct: 0.25, color: 0xEFC1E0 },
      { pct: 0.55, color: 0xD4A5DC },
      { pct: 0.80, color: 0xC9A8E0 },
      { pct: 1,    color: 0xE8C8F0 },
    ]
    for (let i = 0; i < bands.length - 1; i++) {
      const y0 = roomTop + bands[i].pct * roomH
      const y1 = roomTop + bands[i + 1].pct * roomH
      const h  = y1 - y0
      const steps = Math.max(1, Math.ceil(h))
      for (let s = 0; s < steps; s++) {
        const t   = s / steps
        const c0  = Phaser.Display.Color.IntegerToColor(bands[i].color)
        const c1  = Phaser.Display.Color.IntegerToColor(bands[i + 1].color)
        const r   = Math.round(c0.red   + (c1.red   - c0.red)   * t)
        const gv  = Math.round(c0.green + (c1.green - c0.green) * t)
        const b   = Math.round(c0.blue  + (c1.blue  - c0.blue)  * t)
        g.fillStyle(Phaser.Display.Color.GetColor(r, gv, b), 1)
        g.fillRect(LEFT_W, y0 + s, W - LEFT_W, 1)
      }
    }

    // Floor
    g.fillStyle(0xF2D0E8, 1)
    g.fillRect(LEFT_W, roomBot - roomH * 0.28, W - LEFT_W, roomH * 0.28)

    // Floor rug (oval)
    g.fillStyle(0xFFB8D4, 0.6)
    g.fillEllipse((LEFT_W + W) / 2, roomBot - roomH * 0.10, (W - LEFT_W) * 0.55, roomH * 0.10)

    // Window (arched) — decorative
    const winCX = W - 60
    const winCY = roomTop + roomH * 0.28
    const winW  = 70
    const winH  = 90
    g.fillStyle(0xA8D8F8, 0.5)
    g.fillRect(winCX - winW / 2, winCY - winH * 0.5, winW, winH * 0.7)
    g.fillStyle(0xA8D8F8, 0.5)
    g.fillEllipse(winCX, winCY - winH * 0.5 + 2, winW, winW * 0.9)
    // Window frame
    g.lineStyle(2, 0xE8D0F0, 1)
    g.strokeRect(winCX - winW / 2, winCY - winH * 0.5, winW, winH * 0.7)

    // Light string (horizontal line with dots)
    const strY = roomTop + 18
    g.lineStyle(1, 0xFFB830, 0.6)
    g.beginPath(); g.moveTo(LEFT_W + 10, strY); g.lineTo(W - 10, strY); g.strokePath()
    for (let lx = LEFT_W + 20; lx < W - 10; lx += 22) {
      g.fillStyle(0xFFD700, 0.9)
      g.fillCircle(lx, strY + 4, 3)
    }

    // Bed (simple rect shape) — bottom-left of room
    const bedX = LEFT_W + 20
    const bedY = roomBot - roomH * 0.20
    g.fillStyle(0xFF8FAF, 0.9)
    g.fillRoundedRect(bedX, bedY, 60, 40, 5)
    g.fillStyle(0xFFE4F0, 1)
    g.fillRoundedRect(bedX + 4, bedY + 4, 52, 18, 4)

    // Mirror / dressing table — right wall
    const dresserX = W - 50
    const dresserY = roomBot - roomH * 0.32
    g.fillStyle(0xF5C4D8, 0.9)
    g.fillRoundedRect(dresserX - 18, dresserY, 36, 30, 3)
    // Mirror oval
    g.fillStyle(0xD4F0FF, 0.7)
    g.fillEllipse(dresserX, dresserY - 20, 28, 36)
    g.lineStyle(2, 0xE8A0C0, 1)
    g.strokeEllipse(dresserX, dresserY - 20, 28, 36)

    // Plant pot — left of window
    const plantX = W - 100
    const plantY = roomBot - roomH * 0.28
    g.fillStyle(0xFF9B6D, 0.9)
    g.fillRoundedRect(plantX - 8, plantY + 20, 16, 12, 2)
    g.fillStyle(0x7DC47D, 0.9)
    g.fillEllipse(plantX, plantY + 12, 24, 20)
    g.fillEllipse(plantX - 10, plantY + 18, 16, 14)
    g.fillEllipse(plantX + 10, plantY + 18, 16, 14)
  }

  // ══════════════════════════════════════════════════════════════════
  //  Character
  // ══════════════════════════════════════════════════════════════════
  private buildCharacter(W: number, roomTop: number, roomBot: number) {
    const idx = parseInt(localStorage.getItem('kk_selected_member') ?? '0')
    const m   = MEMBERS[Math.min(idx, MEMBERS.length - 1)]

    const cx = (LEFT_W + W) / 2
    const cy = roomTop + (roomBot - roomTop) * 0.55

    // Try sprite sheet → standing image → circle placeholder 순서
    const textureKey  = `${m.id}-sheet`
    const standingKey = `standing-${m.id}`

    if (this.textures.exists(textureKey)) {
      this.charSprite = this.add.sprite(cx, cy, textureKey, 0)
        .setDisplaySize(70, 108)
        .setDepth(5)
        .setInteractive({ useHandCursor: true })
    } else if (this.textures.exists(standingKey)) {
      // standing 이미지로 교체
      this.add.image(cx, cy, standingKey)
        .setDisplaySize(160, 250)
        .setDepth(5)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', (ptr: Phaser.Input.Pointer) => {
          const dist = Phaser.Math.Distance.Between(ptr.downX, ptr.downY, ptr.x, ptr.y)
          if (dist < 10) this.spawnHeart(cx, cy)
        })
      // Dummy invisible sprite for float tween target
      this.charSprite = this.add.sprite(cx, cy, '__DEFAULT')
        .setAlpha(0)
        .setDepth(5)
    } else {
      // Placeholder circle with member colour
      const g = this.add.graphics().setDepth(5)
      g.fillStyle(m.color, 1)
      g.fillCircle(cx, cy, 35)
      g.fillStyle(C.white, 0.3)
      g.fillCircle(cx - 8, cy - 10, 10)
      // Create dummy sprite for float tween
      this.charSprite = this.add.sprite(cx, cy, '__DEFAULT')
        .setAlpha(0)
        .setDepth(5)
    }

    // Tap → heart popup
    this.charSprite.on('pointerup', (ptr: Phaser.Input.Pointer) => {
      const dist = Phaser.Math.Distance.Between(ptr.downX, ptr.downY, ptr.x, ptr.y)
      if (dist < 10) this.spawnHeart(this.charSprite.x, this.charSprite.y)
    })

    this.startCharFloat()
  }

  private spawnHeart(x: number, y: number) {
    const ht = this.add.text(x, y - 40, '❤️', { fontSize: '22px' })
      .setOrigin(0.5).setDepth(20)
    this.tweens.add({
      targets: ht,
      y: y - 100,
      alpha: 0,
      duration: 800,
      ease: 'Power2.easeOut',
      onComplete: () => ht.destroy(),
    })
  }

  private startCharFloat() {
    if (!this.charSprite) return
    this.charFloatTween = this.tweens.add({
      targets: this.charSprite,
      y: this.charSprite.y - 8,
      duration: 2200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    })
  }

  // ══════════════════════════════════════════════════════════════════
  //  Speech bubble
  // ══════════════════════════════════════════════════════════════════
  private buildSpeechBubble(W: number, roomTop: number, roomBot: number) {
    const cx  = (LEFT_W + W) / 2 + 20
    const cy  = roomTop + (roomBot - roomTop) * 0.28
    const bW  = 130
    const bH  = 36
    const depth = 8

    const g = this.add.graphics().setDepth(depth)
    g.fillStyle(C.white, 0.95)
    g.fillRoundedRect(cx - bW / 2, cy - bH / 2, bW, bH, 10)
    g.lineStyle(1.5, C.mainPink, 1)
    g.strokeRoundedRect(cx - bW / 2, cy - bH / 2, bW, bH, 10)

    // Tail
    g.fillStyle(C.white, 0.95)
    g.fillTriangle(cx - 20, cy + bH / 2, cx - 10, cy + bH / 2, cx - 15, cy + bH / 2 + 8)
    g.lineStyle(1.5, C.mainPink, 1)
    g.lineBetween(cx - 20, cy + bH / 2, cx - 15, cy + bH / 2 + 8)
    g.lineBetween(cx - 15, cy + bH / 2 + 8, cx - 10, cy + bH / 2)

    this.add.text(cx, cy, '오늘은 이런 스타일로\n꾸밀까요?', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '8.5px',
      color: '#2A1A2E',
      align: 'center',
    }).setOrigin(0.5).setDepth(depth + 1)
  }

  // ══════════════════════════════════════════════════════════════════
  //  Tab bar
  // ══════════════════════════════════════════════════════════════════
  private buildTabBar(W: number, tabBarY: number) {
    const depth = 20
    const tabs: { key: TabKey; icon: string; label: string }[] = [
      { key: 'deco',      icon: '🎨', label: '꾸미기' },
      { key: 'outfit',    icon: '👗', label: '의상'   },
      { key: 'furniture', icon: '🛋️', label: '가구'   },
      { key: 'gift',      icon: '🎁', label: '선물'   },
      { key: 'chat',      icon: '💬', label: '대화'   },
    ]

    // BG
    this.add.rectangle(W / 2, tabBarY + TAB_BAR_H / 2, W, TAB_BAR_H, C.white)
      .setDepth(depth).setScrollFactor(0)

    // Top border
    const bg = this.add.graphics().setDepth(depth).setScrollFactor(0)
    bg.lineStyle(1, C.lightPink, 1)
    bg.beginPath(); bg.moveTo(0, tabBarY); bg.lineTo(W, tabBarY); bg.strokePath()

    const tabW = W / tabs.length

    tabs.forEach((tab, i) => {
      const tx = tabW * i + tabW / 2
      const ty = tabBarY + TAB_BAR_H / 2

      const isActive = tab.key === this.activeTab
      const txtColor = isActive ? '#FF6B9D' : '#8B6B8E'

      const imgKey = `roomtab-${tab.key === 'deco' ? 'decorate' : tab.key === 'chat' ? 'conversation' : tab.key}`

      let tabBg: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image

      if (this.textures.exists(imgKey)) {
        tabBg = this.add.image(tx, ty, imgKey)
          .setDisplaySize(tabW - 4, TAB_BAR_H - 8)
          .setAlpha(isActive ? 1.0 : 0.65)
          .setDepth(depth + 1).setScrollFactor(0)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.switchTab(tab.key))
      } else {
        const bgColor = isActive ? 0xFF6B9D : 0xFFFFFF
        tabBg = this.add.rectangle(tx, ty, tabW - 4, TAB_BAR_H - 8, bgColor)
          .setDepth(depth + 1).setScrollFactor(0)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.switchTab(tab.key))
      }

      this.add.text(tx, ty - 7, tab.icon, { fontSize: '14px' })
        .setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0)

      const lbl = this.add.text(tx, ty + 7, tab.label, {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '9px',
        fontStyle: isActive ? 'bold' : 'normal',
        color: txtColor,
      }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0)

      this.tabBtns.push({ key: tab.key, bg: tabBg, label: lbl })
    })
  }

  private switchTab(key: TabKey) {
    if (this.activeTab === key) return
    this.activeTab = key

    // Update tab button appearance
    this.tabBtns.forEach(t => {
      const isA = t.key === key
      if (t.bg instanceof Phaser.GameObjects.Image) {
        t.bg.setAlpha(isA ? 1.0 : 0.65)
      } else {
        t.bg.setFillStyle(isA ? 0xFF6B9D : 0xFFFFFF)
      }
      t.label.setColor(isA ? '#FF6B9D' : '#8B6B8E')
      t.label.setFontStyle(isA ? 'bold' : 'normal')
    })

    // Show/hide content containers
    const keys: TabKey[] = ['deco', 'outfit', 'furniture', 'gift', 'chat']
    keys.forEach(k => {
      const c = this.tabContainers[k]
      if (c) c.setVisible(k === key)
    })
  }

  // ══════════════════════════════════════════════════════════════════
  //  Content area (below tab bar)
  // ══════════════════════════════════════════════════════════════════
  private buildContentArea(W: number, contentY: number, contentH: number) {
    const depth = 20

    // White BG for content area
    this.add.rectangle(W / 2, contentY + contentH / 2, W, contentH, C.white)
      .setDepth(depth).setScrollFactor(0)

    this.buildDecoTab(W, contentY, contentH, depth)
    this.buildOutfitTabFull(W, contentY, contentH, depth)
    this.buildFurnitureTabFull(W, contentY, contentH, depth)
    this.buildComingSoonTab(W, contentY, contentH, depth, 'gift')
    this.buildComingSoonTab(W, contentY, contentH, depth, 'chat')

    // Show only active tab
    const keys: TabKey[] = ['deco', 'outfit', 'furniture', 'gift', 'chat']
    keys.forEach(k => {
      if (this.tabContainers[k]) {
        this.tabContainers[k].setVisible(k === this.activeTab)
      }
    })
  }

  // ── 꾸미기 탭 (의상 + 가구 same view) ──────────────────────────
  private buildDecoTab(W: number, contentY: number, contentH: number, depth: number) {
    const children: Phaser.GameObjects.GameObject[] = []

    let cy = contentY + 8

    // ── Outfit section ──
    const outfitHdr = this.add.text(12, cy, '🎀 의상', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#2A1A2E',
    }).setDepth(depth + 1).setScrollFactor(0)
    children.push(outfitHdr)

    const moreOutfit = this.add.text(W - 12, cy, '더보기 >', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '10px',
      color: '#FF6B9D',
    }).setOrigin(1, 0).setDepth(depth + 1).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.switchTab('outfit'))
    children.push(moreOutfit)

    cy += 16
    const outfitRow = this.buildItemRow(W, cy, this.outfitItems, depth + 1, false)
    outfitRow.forEach(o => children.push(o))

    cy += 80

    // ── Furniture section ──
    const furnHdr = this.add.text(12, cy, '🛋️ 가구', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#2A1A2E',
    }).setDepth(depth + 1).setScrollFactor(0)
    children.push(furnHdr)

    const moreFurn = this.add.text(W - 12, cy, '더보기 >', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '10px',
      color: '#FF6B9D',
    }).setOrigin(1, 0).setDepth(depth + 1).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.switchTab('furniture'))
    children.push(moreFurn)

    cy += 16
    const furnRow = this.buildItemRow(W, cy, this.furnitureItems, depth + 1, false)
    furnRow.forEach(o => children.push(o))

    this.tabContainers['deco'] = this.add.container(0, 0, children)
      .setDepth(depth).setScrollFactor(0)

    void contentH
  }

  // ── 의상 탭 (전체) ────────────────────────────────────────────
  private buildOutfitTabFull(W: number, contentY: number, contentH: number, depth: number) {
    const children: Phaser.GameObjects.GameObject[] = []
    const hdr = this.add.text(12, contentY + 8, '👗 의상 전체', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#2A1A2E',
    }).setDepth(depth + 1).setScrollFactor(0)
    children.push(hdr)

    const row = this.buildItemRow(W, contentY + 26, this.outfitItems, depth + 1, true)
    row.forEach(o => children.push(o))

    this.tabContainers['outfit'] = this.add.container(0, 0, children)
      .setDepth(depth).setScrollFactor(0)

    void contentH
  }

  // ── 가구 탭 (전체) ────────────────────────────────────────────
  private buildFurnitureTabFull(W: number, contentY: number, contentH: number, depth: number) {
    const children: Phaser.GameObjects.GameObject[] = []
    const hdr = this.add.text(12, contentY + 8, '🛋️ 가구 전체', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#2A1A2E',
    }).setDepth(depth + 1).setScrollFactor(0)
    children.push(hdr)

    const row = this.buildItemRow(W, contentY + 26, this.furnitureItems, depth + 1, true)
    row.forEach(o => children.push(o))

    this.tabContainers['furniture'] = this.add.container(0, 0, children)
      .setDepth(depth).setScrollFactor(0)

    void contentH
  }

  // ── 준비 중 탭 ────────────────────────────────────────────────
  private buildComingSoonTab(W: number, contentY: number, contentH: number, depth: number, key: TabKey) {
    const children: Phaser.GameObjects.GameObject[] = []
    const lbl = this.add.text(W / 2, contentY + contentH / 2, '✨ 준비 중', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '14px',
      color: '#B0A0B8',
    }).setOrigin(0.5).setDepth(depth + 1).setScrollFactor(0)
    children.push(lbl)

    this.tabContainers[key] = this.add.container(0, 0, children)
      .setDepth(depth).setScrollFactor(0)
  }

  // ── Item row builder ──────────────────────────────────────────
  private buildItemRow(
    W: number,
    rowY: number,
    items: DecoItem[],
    depth: number,
    showAll: boolean,
  ): Phaser.GameObjects.GameObject[] {
    const displayItems = showAll ? items : items.slice(0, 4)
    const cardW = 60
    const cardH = 72
    const gap   = 8
    const totalW = displayItems.length * cardW + (displayItems.length - 1) * gap
    const startX = (W - totalW) / 2

    const objs: Phaser.GameObjects.GameObject[] = []

    displayItems.forEach((item, i) => {
      const cx = startX + i * (cardW + gap) + cardW / 2

      // Card BG
      const cardColor = item.selected ? C.lightPink : C.softGray
      const cardBg = this.add.rectangle(cx, rowY + cardH / 2, cardW, cardH, cardColor)
        .setDepth(depth).setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.selectItem(item, items, cardBg, checkMark))
      objs.push(cardBg)

      // Card border
      const borderG = this.add.graphics().setDepth(depth + 1).setScrollFactor(0)
      const borderColor = item.selected ? C.mainPink : 0xDDD0E8
      borderG.lineStyle(1.5, borderColor, 1)
      borderG.strokeRect(cx - cardW / 2, rowY, cardW, cardH)
      objs.push(borderG)

      // Thumb area
      const thumbG = this.add.graphics().setDepth(depth + 1).setScrollFactor(0)
      thumbG.fillStyle(item.selected ? 0xFFB8D4 : 0xEAE0F0, 1)
      thumbG.fillRoundedRect(cx - cardW / 2 + 5, rowY + 5, cardW - 10, cardH - 24, 4)
      objs.push(thumbG)

      // Item label
      const lbl = this.add.text(cx, rowY + cardH - 10, item.label, {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '8px',
        color: '#2A1A2E',
        align: 'center',
        wordWrap: { width: cardW - 4 },
      }).setOrigin(0.5, 1).setDepth(depth + 2).setScrollFactor(0)
      objs.push(lbl)

      // Check mark
      const checkMark = this.add.text(
        cx + cardW / 2 - 6,
        rowY + 5,
        '✓',
        { fontFamily: "'Nunito', sans-serif", fontSize: '10px', fontStyle: 'bold', color: '#FF6B9D' }
      ).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0)
        .setVisible(item.selected)
      objs.push(checkMark)
    })

    return objs
  }

  private selectItem(
    item: DecoItem,
    _group: DecoItem[],
    cardBg: Phaser.GameObjects.Rectangle,
    checkMark: Phaser.GameObjects.Text,
  ) {
    item.selected = !item.selected
    cardBg.setFillStyle(item.selected ? C.lightPink : C.softGray)
    checkMark.setVisible(item.selected)
    if (item.selected) {
      GameState.addXp(5)
      this.showToast('💾 저장됨')
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  Bottom buttons (저장 / 미리보기 / 꾸미기 적용)
  // ══════════════════════════════════════════════════════════════════
  private buildBottomButtons(W: number, btnY: number, btnH: number) {
    const depth = 25

    // BG
    this.add.rectangle(W / 2, btnY + btnH / 2, W, btnH, C.white)
      .setDepth(depth).setScrollFactor(0)

    // Top border
    const borderG = this.add.graphics().setDepth(depth).setScrollFactor(0)
    borderG.lineStyle(1, C.lightPink, 1)
    borderG.beginPath(); borderG.moveTo(0, btnY); borderG.lineTo(W, btnY); borderG.strokePath()

    const cy    = btnY + btnH / 2
    const pad   = 8
    const applyW = (W - pad * 2) * 0.4
    const outlineW = (W - pad * 3) * 0.3

    const saveX   = pad + outlineW / 2
    const previewX = saveX + outlineW + pad
    const applyX  = previewX + outlineW / 2 + pad + applyW / 2

    // "저장" outline button
    if (this.textures.exists('btn-save')) {
      this.add.image(saveX, cy, 'btn-save')
        .setDisplaySize(outlineW, btnH - 10)
        .setDepth(depth + 1).setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.showToast('💾 저장 처리 중…'))
    } else {
      this.makeOutlineBtn(saveX, cy, outlineW, btnH - 10, '💾 저장', depth)
    }

    // "미리보기" outline button
    if (this.textures.exists('btn-preview')) {
      this.add.image(previewX, cy, 'btn-preview')
        .setDisplaySize(outlineW, btnH - 10)
        .setDepth(depth + 1).setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.showToast('👁 미리보기 처리 중…'))
    } else {
      this.makeOutlineBtn(previewX, cy, outlineW, btnH - 10, '👁 미리보기', depth)
    }

    // "꾸미기 적용" filled button
    if (this.textures.exists('btn-applyDecorate')) {
      this.add.image(applyX, cy, 'btn-applyDecorate')
        .setDisplaySize(applyW, btnH - 10)
        .setDepth(depth + 1).setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.applyDecor())
    } else {
      this.add.rectangle(applyX, cy, applyW, btnH - 10, C.mainPink)
        .setDepth(depth + 1).setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.applyDecor())

      this.add.text(applyX, cy, '✨ 꾸미기 적용', {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#FFFFFF',
      }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0)
    }
  }

  private makeOutlineBtn(x: number, y: number, w: number, h: number, label: string, depth: number) {
    const g = this.add.graphics().setDepth(depth + 1).setScrollFactor(0)
    g.lineStyle(1.5, C.mainPink, 1)
    g.strokeRect(x - w / 2, y - h / 2, w, h)

    this.add.text(x, y, label, {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#FF6B9D',
    }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showToast(`${label} 처리 중…`))
  }

  private applyDecor() {
    GameState.addRaffle(1)
    this.showToast('🎀 꾸미기 적용 완료!')
  }

  // ══════════════════════════════════════════════════════════════════
  //  Toast
  // ══════════════════════════════════════════════════════════════════
  private showToast(message: string) {
    const W = this.scale.width
    const H = this.scale.height

    const toast = this.add.text(W / 2, H * 0.42, message, {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      backgroundColor: '#2A1A2E',
      padding: { x: 14, y: 7 },
    }).setOrigin(0.5).setDepth(50).setAlpha(0).setScrollFactor(0)

    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: H * 0.40,
      duration: 220,
      ease: 'Power2.easeOut',
      onComplete: () => {
        this.time.delayedCall(1200, () => {
          this.tweens.add({
            targets: toast,
            alpha: 0,
            y: H * 0.35,
            duration: 280,
            ease: 'Power2.easeIn',
            onComplete: () => toast.destroy(),
          })
        })
      },
    })
  }
}
