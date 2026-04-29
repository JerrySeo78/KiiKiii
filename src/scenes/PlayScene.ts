import Phaser from 'phaser'
import { GameState } from '../GameState'

interface Star { x: number; y: number; vy: number; value: number; color: number; size: number; pulse: number; obj: Phaser.GameObjects.Graphics }
interface Bomb { x: number; y: number; vy: number; obj: Phaser.GameObjects.Text }
interface Particle { x: number; y: number; vx: number; vy: number; color: number; life: number; maxLife: number; obj: Phaser.GameObjects.Arc }

type Phase = 'idle' | 'playing' | 'gameover' | 'refill'

export class PlayScene extends Phaser.Scene {
  private phase: Phase = 'idle'
  private score = 0
  private combo = 0
  private comboTimer = 0
  private spawnTimer = 0
  private stars: Star[] = []
  private bombs: Bomb[] = []
  private particles: Particle[] = []
  private charImg!: Phaser.GameObjects.Image
  private scoreTxt!: Phaser.GameObjects.Text
  private comboTxt!: Phaser.GameObjects.Text
  private overlay!: Phaser.GameObjects.Container
  private heartIcons: Phaser.GameObjects.Text[] = []

  constructor() { super('PlayScene') }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    this.add.image(W / 2, H / 2, 'bg-game').setDisplaySize(W, H)

    // Character
    this.charImg = this.add.image(W / 2, H - 100, 'sui').setDisplaySize(100, 160)
    this.tweens.add({
      targets: this.charImg, y: H - 108,
      duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })

    // HUD
    this.scoreTxt = this.add.text(16, 16, '★ 0', {
      fontFamily: 'Nunito', fontSize: '22px', fontStyle: 'bold', color: '#FFD700',
    }).setDepth(10)
    this.comboTxt = this.add.text(W / 2, 70, '', {
      fontFamily: 'Nunito', fontSize: '22px', fontStyle: 'bold', color: '#FFD700',
    }).setOrigin(0.5).setDepth(10).setAlpha(0)

    // Heart icons
    this.createHeartHUD(W)

    // Touch input
    this.input.on('pointerdown', this.onTap, this)

    this.showIdleOverlay()
    this.cameras.main.fadeIn(300, 13, 6, 33)
  }

  private createHeartHUD(W: number) {
    this.heartIcons = []
    for (let i = 0; i < 5; i++) {
      const t = this.add.text(W - 16 - (4 - i) * 22, 20, '❤️', { fontSize: '16px' }).setDepth(10)
      this.heartIcons.push(t)
    }
    this.updateHeartHUD()
  }

  private updateHeartHUD() {
    const h = GameState.get().hearts
    this.heartIcons.forEach((icon, i) => icon.setAlpha(i < h ? 1 : 0.2))
  }

  update(_: number, delta: number) {
    if (this.phase !== 'playing') return
    const dt = delta / 16.67

    this.spawnTimer += dt
    const rate = Math.max(30, 80 - Math.floor(this.score / 50) * 5)
    if (this.spawnTimer >= rate) {
      this.spawnTimer = 0
      this.spawnStar()
    }

    if (this.score > 30 && Math.floor(this.time.now / 2000) !== Math.floor((this.time.now - delta) / 2000)) {
      this.spawnBomb()
    }

    this.updateStars(dt)
    this.updateBombs(dt)
    this.updateParticles(dt)

    if (this.comboTimer > 0) {
      this.comboTimer -= dt
      if (this.combo >= 3) {
        this.comboTxt.setAlpha(Math.min(1, this.comboTimer / 20))
        this.comboTxt.setText(`COMBO x${this.combo}! ✨`)
      }
      if (this.comboTimer <= 0) this.comboTxt.setAlpha(0)
    }
  }

  private spawnStar() {
    const W = this.scale.width
    const g = Math.random()
    const value = g < 0.1 ? 5 : g < 0.3 ? 3 : 1
    const color = g < 0.1 ? 0xFFD700 : g < 0.3 ? 0xA78BFA : 0xEC4899
    const size  = g < 0.1 ? 22 : g < 0.3 ? 18 : 14
    const star: Star = {
      x: 30 + Math.random() * (W - 60),
      y: -20,
      vy: 1.5 + Math.random() * 1.5 + this.score / 300,
      value, color, size, pulse: Math.random() * Math.PI * 2,
      obj: this.add.graphics(),
    }
    this.drawStar(star)
    this.stars.push(star)
  }

  private spawnBomb() {
    const W = this.scale.width
    const bomb: Bomb = {
      x: 30 + Math.random() * (W - 60),
      y: -20,
      vy: 1 + Math.random() + this.score / 400,
      obj: this.add.text(0, 0, '💣', { fontSize: '28px' }).setOrigin(0.5),
    }
    bomb.obj.setPosition(bomb.x, bomb.y)
    this.bombs.push(bomb)
  }

  private drawStar(star: Star) {
    const g = star.obj
    g.clear()
    g.fillStyle(star.color, 1)
    const r = star.size * (1 + Math.sin(star.pulse) * 0.1)
    // draw 5-point star
    const spikes = 5, step = Math.PI / spikes
    let rot = -Math.PI / 2
    g.beginPath()
    g.moveTo(star.x + Math.cos(rot) * r, star.y + Math.sin(rot) * r)
    for (let i = 0; i < spikes; i++) {
      rot += step
      g.lineTo(star.x + Math.cos(rot) * r * 0.45, star.y + Math.sin(rot) * r * 0.45)
      rot += step
      g.lineTo(star.x + Math.cos(rot) * r, star.y + Math.sin(rot) * r)
    }
    g.closePath()
    g.fillPath()
  }

  private updateStars(dt: number) {
    const H = this.scale.height
    this.stars = this.stars.filter(star => {
      star.y += star.vy * dt
      star.pulse += 0.1
      if (star.y > H + 30) { star.obj.destroy(); return false }
      this.drawStar(star)
      return true
    })
  }

  private updateBombs(dt: number) {
    const H = this.scale.height
    this.bombs = this.bombs.filter(bomb => {
      bomb.y += bomb.vy * dt
      bomb.obj.setY(bomb.y)
      if (bomb.y > H + 30) { bomb.obj.destroy(); return false }
      if (bomb.y > H - 60) {
        bomb.obj.destroy()
        this.endGame()
        return false
      }
      return true
    })
  }

  private updateParticles(dt: number) {
    this.particles = this.particles.filter(p => {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.15 * dt
      p.life -= dt
      if (p.life <= 0) { p.obj.destroy(); return false }
      p.obj.setPosition(p.x, p.y)
      p.obj.setAlpha(p.life / p.maxLife)
      p.obj.setRadius(4 * (p.life / p.maxLife))
      return true
    })
  }

  private onTap(ptr: Phaser.Input.Pointer) {
    if (this.phase !== 'playing') return
    const px = ptr.x, py = ptr.y
    let hit = false

    this.stars = this.stars.filter(star => {
      const dx = px - star.x, dy = py - star.y
      if (Math.sqrt(dx * dx + dy * dy) < 36) {
        hit = true
        this.score += star.value * (1 + Math.floor(this.combo / 3))
        this.combo++
        this.comboTimer = 60
        this.scoreTxt.setText(`★ ${this.score}`)
        this.spawnParticles(star.x, star.y, star.color)
        star.obj.destroy()
        return false
      }
      return true
    })
    if (!hit) { this.combo = 0; this.comboTxt.setAlpha(0) }
  }

  private spawnParticles(x: number, y: number, color: number) {
    for (let i = 0; i < 8; i++) {
      const life = 25 + Math.random() * 15
      const p: Particle = {
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5 - 2,
        color, life, maxLife: life,
        obj: this.add.circle(x, y, 4, color).setDepth(5),
      }
      this.particles.push(p)
    }
  }

  private endGame() {
    if (this.phase !== 'playing') return
    this.phase = 'gameover'
    const xp    = Math.floor(this.score / 10)
    const coins = Math.floor(this.score / 5)
    GameState.updateBest(this.score)
    if (xp > 0)    GameState.addXp(xp)
    if (coins > 0) GameState.addCoins(coins)
    this.clearGameObjects()
    this.showGameOverOverlay(xp, coins)
  }

  private clearGameObjects() {
    this.stars.forEach(s => s.obj.destroy()); this.stars = []
    this.bombs.forEach(b => b.obj.destroy()); this.bombs = []
    this.particles.forEach(p => p.obj.destroy()); this.particles = []
  }

  private startGame() {
    if (!GameState.useHeart()) { this.showRefillOverlay(); return }
    this.updateHeartHUD()
    this.score = 0; this.combo = 0; this.comboTimer = 0; this.spawnTimer = 0
    this.scoreTxt.setText('★ 0')
    this.comboTxt.setAlpha(0)
    this.overlay?.destroy()
    this.phase = 'playing'
  }

  // --- Overlays ---

  private makeOverlay(alpha = 0.85): Phaser.GameObjects.Container {
    this.overlay?.destroy()
    const W = this.scale.width, H = this.scale.height
    const cont = this.add.container(0, 0).setDepth(20)
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x0D0621, alpha)
    cont.add(bg)
    this.overlay = cont
    return cont
  }

  private showIdleOverlay() {
    this.phase = 'idle'
    const W = this.scale.width, H = this.scale.height
    const cont = this.makeOverlay()
    const best = GameState.get().bestScore

    const charPreview = this.add.image(W / 2, H * 0.35, 'sui').setDisplaySize(140, 224)
    this.tweens.add({ targets: charPreview, y: H * 0.35 - 8, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    const title = this.add.text(W / 2, H * 0.58, 'Star Catch!', {
      fontFamily: 'Nunito', fontSize: '28px', fontStyle: 'bold', color: '#F3F0FF',
    }).setOrigin(0.5)
    const bestTxt = this.add.text(W / 2, H * 0.63, `최고기록: ★ ${best}`, {
      fontFamily: 'Nunito', fontSize: '14px', color: '#C4B5FD',
    }).setOrigin(0.5)
    const btn = this.makeStartBtn(W / 2, H * 0.73, '❤️ 게임 시작', () => this.startGame())
    cont.add([charPreview, title, bestTxt, btn])
  }

  private showGameOverOverlay(xp: number, coins: number) {
    const W = this.scale.width, H = this.scale.height
    const cont = this.makeOverlay()
    const isNew = this.score >= GameState.get().bestScore && this.score > 0

    const emoji = this.add.text(W / 2, H * 0.35, '💫', { fontSize: '48px' }).setOrigin(0.5)
    const title = this.add.text(W / 2, H * 0.45, '게임 종료!', {
      fontFamily: 'Nunito', fontSize: '22px', fontStyle: 'bold', color: '#F3F0FF',
    }).setOrigin(0.5)
    const scoreTxt = this.add.text(W / 2, H * 0.52, `★ ${this.score}`, {
      fontFamily: 'Nunito', fontSize: '36px', fontStyle: 'bold', color: '#FFD700',
    }).setOrigin(0.5)
    const newRec = isNew
      ? this.add.text(W / 2, H * 0.59, '🏆 새 최고기록!', { fontFamily: 'Nunito', fontSize: '14px', color: '#FFD700' }).setOrigin(0.5)
      : this.add.text(W / 2, H * 0.59, '', {})
    const reward = this.add.text(W / 2, H * 0.63, `XP +${xp} · 🪙 +${coins}`, {
      fontFamily: 'Nunito', fontSize: '13px', color: '#C4B5FD',
    }).setOrigin(0.5)
    const btn = this.makeStartBtn(W / 2, H * 0.73, '❤️ 다시 시작', () => this.startGame())
    cont.add([emoji, title, scoreTxt, newRec, reward, btn])
    this.tweens.add({ targets: cont, alpha: { from: 0, to: 1 }, duration: 300 })
  }

  private showRefillOverlay() {
    this.phase = 'refill'
    const W = this.scale.width, H = this.scale.height
    const cont = this.makeOverlay()

    const emoji = this.add.text(W / 2, H * 0.38, '💔', { fontSize: '48px' }).setOrigin(0.5)
    const title = this.add.text(W / 2, H * 0.48, '하트가 부족해요', {
      fontFamily: 'Nunito', fontSize: '20px', fontStyle: 'bold', color: '#F3F0FF',
    }).setOrigin(0.5)
    const sub = this.add.text(W / 2, H * 0.54, '하트를 충전하고 계속 플레이하세요', {
      fontFamily: 'Nunito', fontSize: '13px', color: '#C4B5FD',
    }).setOrigin(0.5)

    // Refill button
    const refillBg = this.add.rectangle(W / 2, H * 0.64, 220, 46, 0xFF4D6D)
      .setInteractive({ useHandCursor: true })
    const refillTxt = this.add.text(W / 2, H * 0.64, '❤️ 하트 충전 (₩1,100)', {
      fontFamily: 'Nunito', fontSize: '14px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)

    // Later button
    const laterTxt = this.add.text(W / 2, H * 0.73, '나중에', {
      fontFamily: 'Nunito', fontSize: '13px', color: '#C4B5FD',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { this.overlay?.destroy(); this.showIdleOverlay() })

    cont.add([emoji, title, sub, refillBg, refillTxt, laterTxt])
    void refillBg
  }

  private makeStartBtn(x: number, y: number, label: string, cb: () => void): Phaser.GameObjects.Container {
    const cont = this.add.container(x, y)
    const bg = this.add.rectangle(0, 0, 200, 48, 0x7C3AED)
      .setStrokeStyle(2, 0xEC4899)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { bg.setFillStyle(0xEC4899); cb() })
      .on('pointerover', () => bg.setFillStyle(0x9B5AFF))
      .on('pointerout',  () => bg.setFillStyle(0x7C3AED))
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'Nunito', fontSize: '16px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)
    this.tweens.add({ targets: cont, scaleX: 1.03, scaleY: 1.03, yoyo: true, repeat: -1, duration: 1000 })
    cont.add([bg, txt])
    return cont
  }
}
