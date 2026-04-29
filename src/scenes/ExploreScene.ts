import Phaser from 'phaser'
import { GameState } from '../GameState'

interface FanRoom {
  username: string
  member: string
  room: string
  visitors: number
  level: number
  badge: string
}

const FAN_ROOMS: FanRoom[] = [
  { username: '@sui_fan_yuki',   member: 'Sui',    room: 'Waikiki 해변방 🌴',  visitors: 12, level: 8,  badge: '🌸' },
  { username: '@kya_love_hana',  member: 'Kya',    room: '보라빛 스튜디오 🎵', visitors: 8,  level: 5,  badge: '💜' },
  { username: '@jiyu_world_mio', member: 'Jiyu',   room: '바다 카페 ☕',        visitors: 23, level: 12, badge: '🌊' },
  { username: '@haum_daily_rin', member: 'Haum',   room: '오렌지 선셋 방 🌅',  visitors: 6,  level: 3,  badge: '🍊' },
  { username: '@leesol_fan_ai',  member: 'Leesol', room: '그린 정원 🌿',       visitors: 15, level: 9,  badge: '✨' },
]

// 멤버별 컬러
const MEMBER_COLORS: Record<string, number> = {
  Sui:    0xFF6B35,
  Kya:    0x9B59B6,
  Jiyu:   0x0096C7,
  Haum:   0xF4A800,
  Leesol: 0x2D6A4F,
}

type FilterTab = '내 최애 팬' | '전체' | '팔로잉'
const TABS: FilterTab[] = ['내 최애 팬', '전체', '팔로잉']

export class ExploreScene extends Phaser.Scene {
  private activeTab: FilterTab = '내 최애 팬'
  private visitedRooms = new Set<number>()
  private tabObjs: { bg: Phaser.GameObjects.Graphics; txt: Phaser.GameObjects.Text; tab: FilterTab }[] = []

  constructor() { super('ExploreScene') }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // 배경: 크림
    this.add.rectangle(W / 2, H / 2, W, H, 0xFFF8F0)

    // 헤더
    this.createHeader(W)

    // 필터 탭
    this.createFilterTabs(W)

    // 팬 방 카드 목록
    this.createFanRooms(W, H)

    // 하단 포토부스 CTA 배너
    this.createPhotoboothBanner(W, H)

    this.cameras.main.fadeIn(300, 255, 248, 240)
  }

  // ─── 헤더 ────────────────────────────────
  private createHeader(W: number) {
    this.add.text(W / 2, 22, 'EXPLORE', {
      fontFamily: 'Nunito', fontSize: '24px', fontStyle: 'bold', color: '#2C1810',
    }).setOrigin(0.5)

    this.add.text(W / 2, 46, '같은 최애 팬들의 방을 방문해보세요', {
      fontFamily: 'Nunito', fontSize: '12px', color: '#8B6355',
    }).setOrigin(0.5)

    // 홈 버튼
    const homeBtn = this.add.rectangle(36, 22, 56, 28, 0xFF6B35, 1)
      .setInteractive({ useHandCursor: true })
    this.add.text(36, 22, '← 홈', {
      fontFamily: 'Nunito', fontSize: '12px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)
    homeBtn.on('pointerup', () => {
      this.cameras.main.fadeOut(200, 255, 248, 240)
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('HomeScene'))
    })
  }

  // ─── 필터 탭 ─────────────────────────────
  private createFilterTabs(W: number) {
    const tabY = 70
    const tabW = 90
    const tabH = 30
    const startX = W / 2 - tabW - 4

    this.tabObjs = []

    TABS.forEach((tab, i) => {
      const x = startX + i * (tabW + 4)
      const isActive = tab === this.activeTab

      const bg = this.add.graphics()
      this.drawTabBg(bg, x, tabY - tabH / 2, tabW, tabH, isActive)

      const txt = this.add.text(x + tabW / 2, tabY, tab, {
        fontFamily: 'Nunito',
        fontSize: '12px',
        fontStyle: isActive ? 'bold' : 'normal',
        color: isActive ? '#ffffff' : '#8B6355',
      }).setOrigin(0.5)

      const hitZone = this.add.rectangle(x + tabW / 2, tabY, tabW, tabH, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
      hitZone.on('pointerup', () => this.onTabClick(tab))

      this.tabObjs.push({ bg, txt, tab })
    })
  }

  private drawTabBg(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, active: boolean) {
    g.clear()
    if (active) {
      g.fillStyle(0xFF6B35, 1)
    } else {
      g.fillStyle(0xF0E0C0, 1)
    }
    g.fillRoundedRect(x, y, w, h, 6)
  }

  private onTabClick(tab: FilterTab) {
    this.activeTab = tab
    this.tabObjs.forEach(({ bg, txt, tab: t }, i) => {
      const isActive = t === tab
      const W = this.scale.width
      const tabW = 90
      const tabH = 30
      const startX = W / 2 - tabW - 4
      const x = startX + i * (tabW + 4)
      const tabY = 70
      this.drawTabBg(bg, x, tabY - tabH / 2, tabW, tabH, isActive)
      txt.setColor(isActive ? '#ffffff' : '#8B6355')
      txt.setFontStyle(isActive ? 'bold' : 'normal')
    })
    this.showToast(`"${tab}" 보기`, 0x0096C7)
  }

  // ─── 팬 방 카드 목록 ─────────────────────
  private createFanRooms(W: number, _H: number) {
    const startY = 100
    const CARD_H = 72
    const CARD_GAP = 8

    FAN_ROOMS.forEach((room, idx) => {
      const cardY = startY + idx * (CARD_H + CARD_GAP) + CARD_H / 2
      this.createRoomCard(W, room, idx, cardY, CARD_H)
    })
  }

  private createRoomCard(W: number, room: FanRoom, idx: number, cardY: number, cardH: number) {
    const cardW = W - 32
    const memberColor = MEMBER_COLORS[room.member] ?? 0xFF6B35

    // 카드 배경 (샌드)
    const g = this.add.graphics()
    g.fillStyle(0xF0E0C0, 1)
    g.fillRoundedRect(16, cardY - cardH / 2, cardW, cardH, 10)
    g.lineStyle(1.5, memberColor, 0.3)
    g.strokeRoundedRect(16, cardY - cardH / 2, cardW, cardH, 10)

    // 배지 원형 배경
    const badgeBg = this.add.circle(48, cardY, 26, memberColor, 0.15)
    void badgeBg
    this.add.text(48, cardY, room.badge, { fontSize: '22px' }).setOrigin(0.5)

    // 유저명
    this.add.text(82, cardY - 18, room.username, {
      fontFamily: 'Nunito', fontSize: '13px', fontStyle: 'bold', color: '#FF6B35',
    })

    // 방 이름
    this.add.text(82, cardY - 2, room.room, {
      fontFamily: 'Nunito', fontSize: '12px', color: '#2C1810',
    })

    // 레벨 + 방문자
    this.add.text(82, cardY + 16, `Lv.${room.level} · 방문자 ${room.visitors}명 오늘`, {
      fontFamily: 'Nunito', fontSize: '11px', color: '#8B6355',
    })

    // 방문하기 버튼
    const btnX = W - 24
    const btnW = 72
    const visited = this.visitedRooms.has(idx)

    const visitBtnBg = this.add.graphics()
    visitBtnBg.fillStyle(visited ? 0x8B6355 : 0xFFF8F0, 1)
    visitBtnBg.lineStyle(1.5, visited ? 0x8B6355 : 0xFF6B35, 1)
    visitBtnBg.fillRoundedRect(btnX - btnW, cardY - 14, btnW, 28, 6)
    visitBtnBg.strokeRoundedRect(btnX - btnW, cardY - 14, btnW, 28, 6)

    const visitTxt = this.add.text(btnX - btnW / 2, cardY, visited ? '방문 중...' : '방문하기 →', {
      fontFamily: 'Nunito', fontSize: '11px', fontStyle: 'bold',
      color: visited ? '#ffffff' : '#FF6B35',
    }).setOrigin(0.5)

    const hitZone = this.add.rectangle(btnX - btnW / 2, cardY, btnW, 28, 0x000000, 0)
      .setInteractive({ useHandCursor: true })

    hitZone.on('pointerup', () => {
      if (this.visitedRooms.has(idx)) return
      this.visitedRooms.add(idx)

      // 버튼 상태 변경
      visitBtnBg.clear()
      visitBtnBg.fillStyle(0x8B6355, 1)
      visitBtnBg.fillRoundedRect(btnX - btnW, cardY - 14, btnW, 28, 6)
      visitTxt.setText('방문 중...').setColor('#ffffff')

      // 응모권 +1
      GameState.addRaffle(1)
      this.showToast('🎫 응모권 +1 획득!', 0xF4A800)
    })
  }

  // ─── 포토부스 CTA 배너 ─────────────────
  private createPhotoboothBanner(W: number, H: number) {
    const bannerH = 44
    const bannerY = H - bannerH / 2 - 8

    const g = this.add.graphics()
    g.fillStyle(0x2D6A4F, 1)
    g.fillRoundedRect(16, bannerY - bannerH / 2, W - 32, bannerH, 10)

    const txt = this.add.text(W / 2, bannerY, '📸 포토부스 — 최애와 함께 찍어 공유하기', {
      fontFamily: 'Nunito', fontSize: '12px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)

    const hitZone = this.add.rectangle(W / 2, bannerY, W - 32, bannerH, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
    void txt

    hitZone.on('pointerup', () => {
      this.cameras.main.fadeOut(200, 255, 248, 240)
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('PhotoboothScene'))
    })
  }

  // ─── 토스트 ───────────────────────────────
  private showToast(msg: string, color: number) {
    const W = this.scale.width
    const H = this.scale.height
    const toastY = H - 64
    const bg = this.add.rectangle(W / 2, toastY, Math.min(msg.length * 10 + 32, W - 32), 38, color, 0.92)
      .setDepth(20)
    const txt = this.add.text(W / 2, toastY, msg, {
      fontFamily: 'Nunito', fontSize: '13px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setDepth(20)
    bg.setAlpha(0)
    txt.setAlpha(0)
    this.tweens.add({
      targets: [bg, txt], alpha: 1, duration: 180, ease: 'Power1',
    })
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: [bg, txt], alpha: 0, duration: 300,
        onComplete: () => { bg.destroy(); txt.destroy() },
      })
    })
  }
}
