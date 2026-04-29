import Phaser from 'phaser'
import { MEMBERS } from '../assets'
import { GameState } from '../GameState'

// Palette colours
const C = {
  white:  0xFFFFFF,
  coral:  0xFF6B35,
  dark:   0x1A1A1A,
  border: 0xE8E0D8,
  cream:  0xFFF8F0,
} as const

const HEADER_H = 44

// ── Isometric constants (brown_farm_ground_edit 방식 이식) ──
// 그리드 폭 = (COLS+ROWS) * TILE_W/2 → 5+5=10, TILE_W=76 → 380px (390px 화면 거의 꽉 참)
const ISO = {
  TILE_W: 76,   // 타일 너비 px
  TILE_H: 38,   // 타일 높이 px (2:1 비율)
  WALL_H: 100,  // 벽 높이 px
  COLS:   5,
  ROWS:   5,
} as const

/** 그리드(col, row) → 화면 좌표 */
function isoToScreen(col: number, row: number, ox: number, oy: number) {
  return {
    x: ox + (col - row) * (ISO.TILE_W / 2),
    y: oy + (col + row) * (ISO.TILE_H / 2),
  }
}

/** 방 origin 계산 (뒷벽 꼭짓점 위치) */
function roomOrigin(W: number) {
  return {
    ox: W / 2,
    oy: HEADER_H + ISO.WALL_H + 24,
  }
}

export class RoomScene extends Phaser.Scene {
  private decorMode = false
  private placedItems: (string | null)[] = Array(6).fill(null)
  private placedObjs: (Phaser.GameObjects.Text | null)[] = Array(6).fill(null)
  private decorBtnLabel!: Phaser.GameObjects.Text
  private paletteContainer!: Phaser.GameObjects.Container
  private firstPlacement = true

  // Character drag
  private charSprite!: Phaser.GameObjects.Sprite
  private charShadow!: Phaser.GameObjects.Ellipse
  private charFloatTween!: Phaser.Tweens.Tween

  // Zoom / pan state
  private pinchDist    = 0
  private pinchActive  = false
  private pinchMidX    = 0
  private pinchMidY    = 0
  private panActive    = false
  private panStartX    = 0
  private panStartY    = 0
  private camStartX    = 0
  private camStartY    = 0

  constructor() { super('RoomScene') }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    const roomTop = HEADER_H
    const roomH   = H - HEADER_H

    // ── Full white base ──
    this.add.rectangle(W / 2, H / 2, W, H, C.white)

    // ── Room ──
    this.buildRoom(W, roomTop, roomH)

    // ── Character ──
    this.buildCharacter(W, roomTop, roomH)

    // ── Furniture palette ──
    this.buildPalette(W, H)

    // ── Restore saved furniture ──
    this.restorePlacedItems()

    // ── Header (고정 카메라 — 줌에 영향받지 않음) ──
    this.buildHeader(W)

    // ── Zoom / pan ──
    this.setupZoom()

    // Fade in
    this.cameras.main.fadeIn(300, 255, 255, 255)
  }

  // ══════════════════════════════════════════
  //  Header (44px)
  // ══════════════════════════════════════════
  private buildHeader(W: number) {
    const depth = 20

    // Background — setScrollFactor(0)으로 고정
    this.add.rectangle(W / 2, HEADER_H / 2, W, HEADER_H, C.white)
      .setDepth(depth).setScrollFactor(0)

    // Bottom border
    const border = this.add.graphics().setDepth(depth).setScrollFactor(0)
    border.lineStyle(1, C.border, 1)
    border.beginPath()
    border.moveTo(0, HEADER_H)
    border.lineTo(W, HEADER_H)
    border.strokePath()

    // ← 홈 button
    this.add.text(16, HEADER_H / 2, '← 홈', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FF6B35',
    }).setOrigin(0, 0.5).setDepth(depth + 1).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.cameras.main.fadeOut(250, 255, 255, 255)
        this.cameras.main.once('camerafadeoutcomplete', () =>
          this.scene.start('HomeScene')
        )
      })

    // Title
    this.add.text(W / 2, HEADER_H / 2, '마이룸', {
      fontFamily: "'Playfair Display', serif",
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#1A1A1A',
    }).setOrigin(0.5).setDepth(depth + 1).setScrollFactor(0)

    // 꾸미기 ✏️ toggle button
    this.decorBtnLabel = this.add.text(W - 16, HEADER_H / 2, '꾸미기 ✏️', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#FF6B35',
      backgroundColor: '#FFFFFF',
      padding: { x: 8, y: 4 },
    }).setOrigin(1, 0.5).setDepth(depth + 1).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleDecorMode())
  }

  // ══════════════════════════════════════════
  //  Room — 아이소메트릭 (brown_farm_ground_edit 방식)
  //  좌표계: isoToScreen(col, row, ox, oy)
  //  렌더 순서: 벽 → 바닥타일 (col+row 오름차순)
  // ══════════════════════════════════════════
  private buildRoom(W: number, _roomTop: number, _roomH: number) {
    const { ox, oy } = roomOrigin(W)
    const sc = (c: number, r: number) => isoToScreen(c, r, ox, oy)
    const g  = this.add.graphics()

    const back  = sc(0, 0)                        // 뒷벽 꼭짓점
    const left  = sc(0, ISO.ROWS)                 // 좌벽 끝점
    const right = sc(ISO.COLS, 0)                 // 우벽 끝점 (= 배경 우측)

    // ── 좌벽 (col=0 면, 뷰어 왼쪽) ──
    g.fillStyle(0xDDB88A, 1)
    g.fillPoints([
      new Phaser.Geom.Point(back.x,  back.y  - ISO.WALL_H),
      new Phaser.Geom.Point(left.x,  left.y  - ISO.WALL_H),
      new Phaser.Geom.Point(left.x,  left.y),
      new Phaser.Geom.Point(back.x,  back.y),
    ], true)

    // ── 뒷벽 (row=0 면, 뷰어 오른쪽) ──
    g.fillStyle(0xFFF0E4, 1)
    g.fillPoints([
      new Phaser.Geom.Point(back.x,  back.y  - ISO.WALL_H),
      new Phaser.Geom.Point(right.x, right.y - ISO.WALL_H),
      new Phaser.Geom.Point(right.x, right.y),
      new Phaser.Geom.Point(back.x,  back.y),
    ], true)

    // ── 벽 상단 몰딩선 ──
    g.lineStyle(2, 0xFF6B35, 0.5)
    g.beginPath()
    g.moveTo(left.x,  left.y  - ISO.WALL_H)
    g.lineTo(back.x,  back.y  - ISO.WALL_H)
    g.lineTo(right.x, right.y - ISO.WALL_H)
    g.strokePath()

    // ── 걸레받이선 ──
    g.lineStyle(2, 0xFF6B35, 0.8)
    g.beginPath()
    g.moveTo(left.x, left.y); g.lineTo(back.x, back.y); g.lineTo(right.x, right.y)
    g.strokePath()

    // ── 바닥 타일 (체커보드, col+row 오름차순) ──
    const tiles: { col: number; row: number }[] = []
    for (let r = 0; r < ISO.ROWS; r++)
      for (let c = 0; c < ISO.COLS; c++)
        tiles.push({ col: c, row: r })
    tiles.sort((a, b) => (a.col + a.row) - (b.col + b.row))

    tiles.forEach(({ col, row }) => {
      const top   = sc(col,     row)
      const right = sc(col + 1, row)
      const bot   = sc(col + 1, row + 1)
      const left  = sc(col,     row + 1)

      const shade = (col + row) % 2 === 0 ? 0xE8C9A0 : 0xD9B98A
      g.fillStyle(shade, 1)
      g.fillPoints([
        new Phaser.Geom.Point(top.x,   top.y),
        new Phaser.Geom.Point(right.x, right.y),
        new Phaser.Geom.Point(bot.x,   bot.y),
        new Phaser.Geom.Point(left.x,  left.y),
      ], true)

      g.lineStyle(0.5, 0xC4A070, 0.4)
      g.strokePoints([
        new Phaser.Geom.Point(top.x,   top.y),
        new Phaser.Geom.Point(right.x, right.y),
        new Phaser.Geom.Point(bot.x,   bot.y),
        new Phaser.Geom.Point(left.x,  left.y),
      ], true)
    })

    void _roomTop; void _roomH
  }

  // ══════════════════════════════════════════
  //  Zoom — 핀치(모바일) + 휠(데스크톱) + 단일 손가락 팬
  // ══════════════════════════════════════════
  private setupZoom() {
    const cam = this.cameras.main
    const W   = this.scale.width
    const H   = this.scale.height

    // ── 마우스 휠 (커서 위치 기준 줌) ──
    this.input.on('wheel', (
      ptr: Phaser.Input.Pointer, _objs: unknown, _dx: unknown, dy: number
    ) => {
      const oldZoom  = cam.zoom
      const newZoom  = Phaser.Math.Clamp(oldZoom - dy * 0.001, 1, 2.5)
      const worldX   = cam.scrollX + ptr.x / oldZoom
      const worldY   = cam.scrollY + ptr.y / oldZoom
      cam.zoom       = newZoom
      cam.scrollX    = worldX - ptr.x / newZoom
      cam.scrollY    = worldY - ptr.y / newZoom
      this.clampCamera()
    })

    // ── 포인터 이동: 핀치 줌 + 팬 ──
    this.input.on('pointermove', () => {
      const p1 = this.input.pointer1
      const p2 = this.input.pointer2

      if (p1.isDown && p2.isDown) {
        // 두 손가락: 핀치 줌 (중점 기준)
        this.panActive = false
        const dist  = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y)
        const midX  = (p1.x + p2.x) / 2
        const midY  = (p1.y + p2.y) / 2

        if (this.pinchActive && this.pinchDist > 0) {
          const ratio    = dist / this.pinchDist
          const oldZoom  = cam.zoom
          const newZoom  = Phaser.Math.Clamp(oldZoom * ratio, 1, 2.5)

          // 핀치 중점이 world에서 같은 위치에 고정되도록 scroll 보정
          const worldMidX = cam.scrollX + midX / oldZoom
          const worldMidY = cam.scrollY + midY / oldZoom
          cam.zoom     = newZoom
          cam.scrollX  = worldMidX - midX / newZoom
          cam.scrollY  = worldMidY - midY / newZoom
          this.clampCamera()
        }
        this.pinchDist   = dist
        this.pinchMidX   = midX
        this.pinchMidY   = midY
        this.pinchActive = true

      } else if (p1.isDown && cam.zoom > 1.05) {
        // 한 손가락: 팬 (줌된 상태에서만)
        if (!this.panActive) {
          this.panActive = true
          this.panStartX = p1.x
          this.panStartY = p1.y
          this.camStartX = cam.scrollX
          this.camStartY = cam.scrollY
        }
        const dx    = (p1.x - this.panStartX) / cam.zoom
        const dy    = (p1.y - this.panStartY) / cam.zoom
        cam.scrollX = this.camStartX - dx
        cam.scrollY = this.camStartY - dy
        this.clampCamera()

      } else {
        this.pinchActive = false
        this.panActive   = false
      }
    })

    this.input.on('pointerup', () => {
      this.pinchActive = false
      this.panActive   = false
    })

    // 더블탭: 줌 리셋
    let lastTap = 0
    this.input.on('pointerdown', () => {
      const now = Date.now()
      if (now - lastTap < 300) {
        this.tweens.add({
          targets: cam,
          zoom: 1,
          scrollX: W / 2 - W / 2,
          scrollY: H / 2 - H / 2,
          duration: 300,
          ease: 'Power2.easeOut',
        })
      }
      lastTap = now
    })

    void W; void H
  }

  private clampCamera() {
    const cam  = this.cameras.main
    const W    = this.scale.width
    const H    = this.scale.height
    const z    = cam.zoom
    // 줌 초과 영역의 절반 = 스크롤 가능 범위
    const maxX = (W * (z - 1)) / (2 * z)
    const maxY = (H * (z - 1)) / (2 * z)
    cam.scrollX = Phaser.Math.Clamp(cam.scrollX, -maxX, maxX)
    cam.scrollY = Phaser.Math.Clamp(cam.scrollY, -maxY, maxY)
  }

  // ══════════════════════════════════════════
  //  Character (draggable)
  // ══════════════════════════════════════════
  private buildCharacter(W: number, roomTop: number, roomH: number) {
    const idx = parseInt(localStorage.getItem('kk_selected_member') ?? '0')
    const m   = MEMBERS[Math.min(idx, MEMBERS.length - 1)]

    // 저장된 위치 불러오기 (없으면 그리드 중앙 전면 타일 위)
    const { ox, oy } = roomOrigin(W)
    // 캐릭터 발이 타일 중심에 닿도록: tileCenter.y = sc(col,row).y + TILE_H/2
    const frontTile  = isoToScreen(2, ISO.ROWS - 1, ox, oy)
    const defaultPos = { x: frontTile.x, y: frontTile.y + ISO.TILE_H / 2 }
    const savedPos   = this.loadCharPos()
    const charX      = savedPos?.x ?? defaultPos.x
    const charY      = savedPos?.y ?? defaultPos.y

    // 캐릭터 표시 크기 — 타일 1개 너비(76px)에 맞춤
    const CHAR_W = 54
    const CHAR_H = Math.round(CHAR_W * (600 / 391))  // 원본 비율 391:600 유지 ≈ 83px

    // 그림자
    this.charShadow = this.add.ellipse(charX, charY + CHAR_H * 0.08, 44, 7, 0xC4A070, 0.45)
      .setDepth(2)

    this.charSprite = this.add.sprite(charX, charY, `${m.id}-sheet`, 0)
      .setDisplaySize(CHAR_W, CHAR_H)
      .setDepth(3)
      .setInteractive({ useHandCursor: true, draggable: true })

    // 플로팅 tween
    this.startCharFloat()

    const shadowOffY = CHAR_H * 0.08

    // ── 드래그 ──
    this.charSprite.on('dragstart', () => {
      this.charFloatTween?.stop()
      this.charSprite.setFrame(1)
      this.charShadow.setScale(0.7).setAlpha(0.2)
    })

    this.charSprite.on('drag', (_ptr: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      this.charSprite.setPosition(dragX, dragY)
      this.charShadow.setPosition(dragX, dragY + shadowOffY)
    })

    this.charSprite.on('dragend', () => {
      this.charShadow.setScale(1).setAlpha(0.45)
      this.charShadow.setPosition(this.charSprite.x, this.charSprite.y + shadowOffY)
      this.saveCharPos(this.charSprite.x, this.charSprite.y)
      this.startCharFloat()
    })

    // 탭 (드래그 없이 짧게 클릭): 하트 팝업
    this.charSprite.on('pointerup', (ptr: Phaser.Input.Pointer) => {
      const dist = Phaser.Math.Distance.Between(ptr.downX, ptr.downY, ptr.x, ptr.y)
      if (dist < 8) {
        const ht = this.add.text(
          this.charSprite.x, this.charSprite.y - 50, '❤️', { fontSize: '22px' }
        ).setOrigin(0.5).setDepth(10)
        this.tweens.add({
          targets: ht,
          y: this.charSprite.y - 110,
          alpha: 0,
          duration: 800,
          ease: 'Power2.easeOut',
          onComplete: () => ht.destroy(),
        })
      }
    })
  }

  private startCharFloat() {
    this.charFloatTween = this.tweens.add({
      targets: this.charSprite,
      y: this.charSprite.y - 6,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    })
  }

  private saveCharPos(x: number, y: number) {
    localStorage.setItem('kk_room_char_pos', JSON.stringify({ x, y }))
  }

  private loadCharPos(): { x: number; y: number } | null {
    const raw = localStorage.getItem('kk_room_char_pos')
    if (!raw) return null
    try {
      const pos = JSON.parse(raw) as { x: number; y: number }
      // 그리드 범위 밖이면 무효 처리 (레이아웃 변경 시 stale 값 방어)
      const { ox, oy } = roomOrigin(this.scale.width)
      const gridH = (ISO.COLS + ISO.ROWS) * (ISO.TILE_H / 2)
      const minY  = oy - 20
      const maxY  = oy + gridH + 60
      if (pos.y < minY || pos.y > maxY) return null
      return pos
    } catch { return null }
  }

  // ══════════════════════════════════════════
  //  Slot positions — 아이소메트릭 타일 중심
  // ══════════════════════════════════════════
  private slotPos(): { x: number; y: number }[] {
    const { ox, oy } = roomOrigin(this.scale.width)
    const tileCenter = (col: number, row: number) => {
      const s = isoToScreen(col, row, ox, oy)
      return { x: s.x, y: s.y + ISO.TILE_H / 2 }
    }
    return [
      tileCenter(1, 1),  // 뒷벽 근처 좌
      tileCenter(3, 1),  // 뒷벽 근처 우
      tileCenter(0, 2),  // 좌벽 근처
      tileCenter(4, 2),  // 우측
      tileCenter(1, 4),  // 전면 좌
      tileCenter(3, 4),  // 전면 우
    ]
  }

  // ══════════════════════════════════════════
  //  Furniture palette
  // ══════════════════════════════════════════
  private buildPalette(W: number, H: number) {
    const palH = 100
    const items = [
      { emoji: '🛋️', name: '소파'   },
      { emoji: '🌵', name: '선인장' },
      { emoji: '🪴', name: '화분'   },
      { emoji: '🎀', name: '리본'   },
      { emoji: '⭐', name: '별조명' },
      { emoji: '🎵', name: '음표'   },
    ]

    const bg = this.add.rectangle(W / 2, palH / 2, W, palH, C.dark, 0.88)

    const itemSpacing = W / items.length
    const children: Phaser.GameObjects.GameObject[] = [bg]

    items.forEach((item, i) => {
      const ix = itemSpacing * i + itemSpacing / 2
      const iy = palH / 2 - 8

      const emojiTxt = this.add.text(ix, iy, item.emoji, {
        fontSize: '36px',
      }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true })

      const nameTxt = this.add.text(ix, iy + 28, item.name, {
        fontFamily: "'Nunito', sans-serif",
        fontSize: '10px',
        color: '#FFFFFF',
      }).setOrigin(0.5, 0)

      emojiTxt.on('pointerdown', () => {
        if (this.placedItems.includes(item.emoji)) {
          this.removeItem(item.emoji)
        } else {
          this.placeItem(item.emoji)
        }
      })

      children.push(emojiTxt, nameTxt)
    })

    this.paletteContainer = this.add.container(0, H + 100, children)
    this.paletteContainer.setDepth(15).setScrollFactor(0)
    this.paletteContainer.setAlpha(0)
  }

  // ══════════════════════════════════════════
  //  Decor mode toggle
  // ══════════════════════════════════════════
  private toggleDecorMode() {
    const H = this.scale.height

    this.decorMode = !this.decorMode

    if (this.decorMode) {
      this.decorBtnLabel.setText('완료 ✓')
      this.paletteContainer.setAlpha(1)
      this.tweens.add({
        targets: this.paletteContainer,
        y: H - 100,
        duration: 280,
        ease: 'Power2.easeOut',
      })
    } else {
      this.decorBtnLabel.setText('꾸미기 ✏️')
      this.tweens.add({
        targets: this.paletteContainer,
        y: H + 100,
        duration: 240,
        ease: 'Power2.easeIn',
        onComplete: () => {
          this.paletteContainer.setAlpha(0)
        },
      })
    }
  }

  // ══════════════════════════════════════════
  //  Place / remove items
  // ══════════════════════════════════════════
  private placeItem(emoji: string) {
    const slots   = this.slotPos()
    const slotIdx = this.placedItems.findIndex(s => s === null)
    if (slotIdx === -1) return

    this.placedItems[slotIdx] = emoji
    const pos = slots[slotIdx]

    const obj = this.add.text(pos.x, pos.y, emoji, {
      fontSize: '34px',
    }).setOrigin(0.5).setDepth(4)

    this.placedObjs[slotIdx] = obj
    this.saveRoomItems()

    // 첫 배치 시 응모권 지급
    if (this.firstPlacement) {
      this.firstPlacement = false
      GameState.addRaffle(1)
      this.showToast('🎫 +1')
    }
  }

  private removeItem(emoji: string) {
    const idx = this.placedItems.indexOf(emoji)
    if (idx === -1) return

    this.placedObjs[idx]?.destroy()
    this.placedObjs[idx]  = null
    this.placedItems[idx] = null

    this.saveRoomItems()
  }

  private saveRoomItems() {
    localStorage.setItem('kk_room_items', JSON.stringify(this.placedItems))
  }

  private restorePlacedItems() {
    const raw = localStorage.getItem('kk_room_items')
    if (!raw) return

    try {
      const saved: (string | null)[] = JSON.parse(raw)
      const slots = this.slotPos()

      saved.forEach((emoji, i) => {
        if (!emoji || i >= slots.length) return
        const pos = slots[i]
        this.placedItems[i] = emoji
        const obj = this.add.text(pos.x, pos.y, emoji, {
          fontSize: '34px',
        }).setOrigin(0.5).setDepth(4)
        this.placedObjs[i] = obj
      })

      // If there are already items, don't award again
      if (saved.some(e => e !== null)) {
        this.firstPlacement = false
      }
    } catch {
      // ignore corrupt data
    }
  }

  // ══════════════════════════════════════════
  //  Toast notification
  // ══════════════════════════════════════════
  private showToast(message: string) {
    const W = this.scale.width
    const H = this.scale.height

    const toast = this.add.text(W / 2, H * 0.4, message, {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      backgroundColor: '#1A1A1A',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(30).setAlpha(0)

    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: H * 0.38,
      duration: 250,
      ease: 'Power2.easeOut',
      onComplete: () => {
        this.time.delayedCall(1200, () => {
          this.tweens.add({
            targets: toast,
            alpha: 0,
            y: H * 0.33,
            duration: 300,
            ease: 'Power2.easeIn',
            onComplete: () => toast.destroy(),
          })
        })
      },
    })
  }
}
