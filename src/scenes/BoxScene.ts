import Phaser from 'phaser'
import { MEMBERS } from '../assets'
import { GameState } from '../GameState'

// ── 컬러 팔레트 ──────────────────────────────────────────────
const C = {
  mainPink:  0xFF6B9D,
  deepPink:  0xE8478A,
  purple:    0x9B6DD9,
  coral:     0xFF7B54,
  gold:      0xFFB830,
  cream:     0xFFF5FB,
  lightPink: 0xFFE4F0,
  white:     0xFFFFFF,
  dark:      0x2A1A2E,
  ssrGold:   0xFFD700,
  srPurple:  0xC8A0E8,
  rBlue:     0xA8D8EA,
} as const

type CardGrade = 'SSR' | 'SR' | 'R'
type MemberId = 'sui' | 'kya' | 'jiyu' | 'haum' | 'leesol' | 'group'

interface CardData {
  id: string
  memberId: MemberId
  memberName: string
  grade: CardGrade
  eventName: string
  isNew?: boolean
  isFeatured?: boolean
}

// ── 기본 카드 목록 ────────────────────────────────────────────
const DEFAULT_CARDS: CardData[] = [
  { id: '0001', memberId: 'kya',    memberName: '키아',   grade: 'R',   eventName: '데뷔 스페셜' },
  { id: '0002', memberId: 'jiyu',   memberName: '지유',   grade: 'R',   eventName: '데뷔 스페셜' },
  { id: '0003', memberId: 'sui',    memberName: '수이',   grade: 'SR',  eventName: '서머 투어' },
  { id: '0004', memberId: 'haum',   memberName: '하음',   grade: 'SR',  eventName: '서머 투어' },
  { id: '0005', memberId: 'leesol', memberName: '이솔',   grade: 'R',   eventName: '데뷔 스페셜' },
  { id: '0006', memberId: 'group',  memberName: '단체',   grade: 'SSR', eventName: 'WAIKIIIKI TOUR' },
  { id: '0007', memberId: 'sui',    memberName: '수이',   grade: 'SSR', eventName: '이름 스페셜', isNew: true, isFeatured: true },
]

const TABS = ['전체', '⭐수이', '⭐키아', '⭐지유', '⭐하음', '⭐이솔'] as const
type TabLabel = typeof TABS[number]

// ── 탭→멤버ID 매핑 ──────────────────────────────────────────
const TAB_MEMBER: Record<TabLabel, MemberId | null> = {
  '전체':  null,
  '⭐수이': 'sui',
  '⭐키아': 'kya',
  '⭐지유': 'jiyu',
  '⭐하음': 'haum',
  '⭐이솔': 'leesol',
}

const TICKET_COST = 12

export class BoxScene extends Phaser.Scene {
  private activeTab: TabLabel = '전체'
  private cardObjects: Array<{ data: CardData; container: Phaser.GameObjects.Container }> = []
  private tabObjects: Array<{ label: TabLabel; bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }> = []
  private ticketCountText!: Phaser.GameObjects.Text

  constructor() { super('BoxScene') }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // ── 배경 ───────────────────────────────────────────────
    const bg = this.add.graphics()
    bg.fillGradientStyle(C.cream, C.cream, C.lightPink, C.lightPink, 1)
    bg.fillRect(0, 0, W, H)

    // 배경 장식 원형들
    this.drawBgDecorations(W, H)

    // ── 헤더 ───────────────────────────────────────────────
    this.createHeader(W)

    // ── 멤버 탭 필터 ───────────────────────────────────────
    this.createMemberTabs(W)

    // ── 메인 컨텐츠 영역 ───────────────────────────────────
    this.createMainContent(W, H)

    // ── 하단 바 ────────────────────────────────────────────
    this.createBottomBar(W, H)

    this.cameras.main.fadeIn(250, 255, 245, 251)
  }

  // ── 배경 장식 ─────────────────────────────────────────────
  private drawBgDecorations(W: number, _H: number) {
    const g = this.add.graphics().setAlpha(0.25)
    g.fillStyle(C.mainPink)
    g.fillCircle(W - 30, 80, 40)
    g.fillStyle(C.purple)
    g.fillCircle(20, 160, 25)
    g.fillStyle(C.gold)
    g.fillCircle(W - 15, 200, 18)
  }

  // ── 헤더 ──────────────────────────────────────────────────
  private createHeader(W: number) {
    const headerH = 52
    // 헤더 배경
    const hBg = this.add.graphics()
    hBg.fillStyle(C.white, 0.95)
    hBg.fillRect(0, 0, W, headerH)
    // 하단 핑크 테두리 라인
    hBg.lineStyle(1.5, C.mainPink, 0.4)
    hBg.lineBetween(0, headerH, W, headerH)

    // ← 뒤로가기
    const backBtn = this.add.text(14, headerH / 2, '←', {
      fontFamily: 'Nunito', fontSize: '22px', color: '#FF6B9D',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
    backBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 255, 245, 251)
      this.time.delayedCall(200, () => this.scene.start('HomeScene'))
    })
    backBtn.on('pointerover', () => backBtn.setAlpha(0.6))
    backBtn.on('pointerout',  () => backBtn.setAlpha(1))

    // 중앙 타이틀
    this.add.text(W / 2, headerH / 2 - 1, '📷 포토 박스', {
      fontFamily: 'Nunito', fontSize: '19px', fontStyle: 'bold', color: '#FF6B9D',
    }).setOrigin(0.5)

    // 카드 수량 카운터
    this.add.text(W / 2, headerH / 2 + 14, '38 / 120', {
      fontFamily: 'Nunito', fontSize: '10px', color: '#999999',
    }).setOrigin(0.5)

    // ? 버튼
    const qBtn = this.add.circle(W - 14, 16, 11, C.lightPink)
    qBtn.setInteractive({ useHandCursor: true })
    this.add.text(W - 14, 16, '?', {
      fontFamily: 'Nunito', fontSize: '13px', fontStyle: 'bold', color: '#FF6B9D',
    }).setOrigin(0.5)

    // 홈 버튼
    const homeBtn = this.add.circle(W - 14, 37, 11, C.lightPink)
    homeBtn.setInteractive({ useHandCursor: true })
    homeBtn.on('pointerdown', () => this.scene.start('HomeScene'))
    this.add.text(W - 14, 37, '🏠', {
      fontFamily: 'Nunito', fontSize: '10px',
    }).setOrigin(0.5)
  }

  // ── 멤버 탭 ───────────────────────────────────────────────
  private createMemberTabs(W: number) {
    const tabY = 68
    const tabH = 22
    const tabPadX = 8

    // 탭 배경
    const tabBg = this.add.graphics()
    tabBg.fillStyle(C.white, 0.9)
    tabBg.fillRect(0, 54, W, 30)

    let xCursor = 8
    TABS.forEach((label) => {
      const isActive = label === this.activeTab
      const txtObj = this.add.text(0, tabY, label, {
        fontFamily: 'Nunito', fontSize: '10px', fontStyle: 'bold',
        color: isActive ? '#FFFFFF' : '#FF6B9D',
      }).setOrigin(0, 0.5)
      const txtW = txtObj.width + tabPadX * 2
      txtObj.destroy()

      // pill 배경
      const pillBg = this.add.graphics()
      pillBg.fillStyle(isActive ? C.mainPink : C.white, 1)
      pillBg.fillRoundedRect(xCursor, tabY - tabH / 2, txtW, tabH, tabH / 2)
      if (!isActive) {
        pillBg.lineStyle(1, C.mainPink, 0.7)
        pillBg.strokeRoundedRect(xCursor, tabY - tabH / 2, txtW, tabH, tabH / 2)
      }

      const pillText = this.add.text(xCursor + txtW / 2, tabY, label, {
        fontFamily: 'Nunito', fontSize: '10px', fontStyle: 'bold',
        color: isActive ? '#FFFFFF' : '#FF6B9D',
      }).setOrigin(0.5)

      // 히트 영역
      const hitZone = this.add.rectangle(xCursor + txtW / 2, tabY, txtW, tabH)
        .setInteractive({ useHandCursor: true })
      hitZone.on('pointerdown', () => this.switchTab(label))

      // 탭 데이터 저장 (배경 재그리기를 위해 rectangle로 대체)
      const pillRect = this.add.rectangle(xCursor, tabY - tabH / 2, txtW, tabH, isActive ? C.mainPink : C.white)
        .setOrigin(0, 0)
        .setAlpha(0) // pillBg가 그려주므로 투명

      this.tabObjects.push({ label, bg: pillRect, text: pillText })

      xCursor += txtW + 5
    })
  }

  // ── 탭 전환 ───────────────────────────────────────────────
  private switchTab(label: TabLabel) {
    if (this.activeTab === label) return
    this.activeTab = label
    this.filterCards()
    this.redrawTabs()
  }

  private redrawTabs() {
    // 탭 컨테이너 영역만 재생성 (기존 제거 후 재그리기)
    // 간단히 텍스트 색상만 갱신
    this.tabObjects.forEach(({ label, text }) => {
      const isActive = label === this.activeTab
      text.setColor(isActive ? '#FFFFFF' : '#FF6B9D')
      text.setStyle({
        fontFamily: 'Nunito', fontSize: '10px', fontStyle: 'bold',
        color: isActive ? '#FFFFFF' : '#FF6B9D',
        backgroundColor: isActive ? '#FF6B9D' : undefined,
        padding: isActive ? { x: 6, y: 3 } : { x: 6, y: 3 },
      })
    })
    this.filterCards()
  }

  // ── 카드 필터링 ───────────────────────────────────────────
  private filterCards() {
    const targetMember = TAB_MEMBER[this.activeTab]
    this.cardObjects.forEach(({ data, container }) => {
      if (targetMember === null) {
        // 전체
        this.tweens.add({ targets: container, alpha: 1, duration: 200 })
      } else {
        const match = data.memberId === targetMember
        this.tweens.add({ targets: container, alpha: match ? 1 : 0.25, duration: 200 })
      }
    })
  }

  // ── 메인 컨텐츠 (피처드 + 그리드) ────────────────────────
  private createMainContent(W: number, H: number) {
    const contentTop = 90   // 탭 아래
    const contentH   = H - contentTop - 100 // 하단 바 위
    const featuredW  = 108
    const gridLeft   = featuredW + 8
    const gridW      = W - gridLeft - 4

    // 컨텐츠 배경 (노트북 페이지 느낌)
    const cBg = this.add.graphics()
    cBg.fillStyle(C.white, 0.85)
    cBg.fillRoundedRect(4, contentTop, W - 8, contentH, 10)

    // 피처드 카드
    const featured = DEFAULT_CARDS.find(c => c.isFeatured) ?? DEFAULT_CARDS[6]
    this.createFeaturedPanel(4, contentTop + 4, featuredW, contentH - 8, featured)

    // 구분선
    const divider = this.add.graphics()
    divider.lineStyle(1, C.lightPink, 0.8)
    divider.lineBetween(featuredW + 6, contentTop + 8, featuredW + 6, contentTop + contentH - 8)

    // 카드 그리드
    this.createCardGrid(gridLeft + 4, contentTop + 4, gridW - 8, contentH - 8)
  }

  // ── 피처드 패널 ───────────────────────────────────────────
  private createFeaturedPanel(x: number, y: number, w: number, _h: number, card: CardData) {
    // NEW 배지
    const newBadge = this.add.graphics()
    newBadge.fillStyle(C.coral, 1)
    newBadge.fillRoundedRect(x + 4, y + 4, 34, 14, 5)
    this.add.text(x + 21, y + 11, 'NEW', {
      fontFamily: 'Nunito', fontSize: '8px', fontStyle: 'bold', color: '#FFFFFF',
    }).setOrigin(0.5)

    // 카드 ID
    this.add.text(x + w / 2, y + 22, `ID.${card.id}`, {
      fontFamily: 'Nunito', fontSize: '9px', color: '#AAAAAA',
    }).setOrigin(0.5)

    // 등급 별 (SSR = 3개)
    const starStr = card.grade === 'SSR' ? '★★★' : card.grade === 'SR' ? '★★' : '★'
    const starColor = card.grade === 'SSR' ? '#FFD700' : card.grade === 'SR' ? '#C8A0E8' : '#A8D8EA'
    this.add.text(x + w / 2, y + 33, starStr, {
      fontFamily: 'Nunito', fontSize: '10px', color: starColor,
    }).setOrigin(0.5)

    // 등급 배지
    const gradeColor = card.grade === 'SSR' ? C.ssrGold : card.grade === 'SR' ? C.srPurple : C.rBlue
    const gradeBg = this.add.graphics()
    gradeBg.fillStyle(gradeColor, 1)
    gradeBg.fillRoundedRect(x + w / 2 - 15, y + 38, 30, 14, 4)
    this.add.text(x + w / 2, y + 45, card.grade, {
      fontFamily: 'Nunito', fontSize: '8px', fontStyle: 'bold', color: '#FFFFFF',
    }).setOrigin(0.5)

    // 멤버 이름 (크게)
    this.add.text(x + w / 2, y + 62, card.memberName, {
      fontFamily: 'Nunito', fontSize: '18px', fontStyle: 'bold', color: '#FF6B9D',
    }).setOrigin(0.5)

    // 이벤트명
    this.add.text(x + w / 2, y + 78, card.eventName, {
      fontFamily: 'Nunito', fontSize: '8px', color: '#888888',
    }).setOrigin(0.5)

    // 서명 스타일 텍스트
    this.add.text(x + w / 2, y + 92, `${card.memberName}♡`, {
      fontFamily: 'Georgia', fontSize: '12px', fontStyle: 'italic', color: '#FF6B9D',
    }).setOrigin(0.5)

    // 바코드 장식
    const barcodeG = this.add.graphics()
    barcodeG.lineStyle(1, 0xCCCCCC, 0.6)
    for (let i = 0; i < 16; i++) {
      const bx = x + 8 + i * 5.5
      const bh = i % 3 === 0 ? 10 : 7
      barcodeG.lineBetween(bx, y + 104, bx, y + 104 + bh)
    }
  }

  // ── 카드 그리드 ───────────────────────────────────────────
  private createCardGrid(x: number, y: number, w: number, _h: number) {
    const cols = 3
    const gap  = 4
    const cardW = (w - gap * (cols - 1)) / cols
    const cardH = cardW * 1.35

    // 피처드 카드 제외한 그리드용 카드
    const gridCards = DEFAULT_CARDS.filter(c => !c.isFeatured)

    gridCards.forEach((card, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const cx  = x + col * (cardW + gap)
      const cy  = y + row * (cardH + gap)

      const container = this.add.container(cx, cy)
      this.buildCardTile(container, card, cardW, cardH)
      this.cardObjects.push({ data: card, container })
    })
  }

  // ── 카드 타일 빌드 ────────────────────────────────────────
  private buildCardTile(
    container: Phaser.GameObjects.Container,
    card: CardData,
    w: number,
    h: number,
  ) {
    const gradeColor  = card.grade === 'SSR' ? C.ssrGold  : card.grade === 'SR' ? C.srPurple : C.rBlue
    const gradeDark   = card.grade === 'SSR' ? 0xCC9900   : card.grade === 'SR' ? 0x9060C0   : 0x70A8C0
    const textColor   = card.grade === 'SSR' ? '#FFD700'  : card.grade === 'SR' ? '#C8A0E8'  : '#A8D8EA'

    // 카드 배경 그라데이션
    const bg = this.add.graphics()
    bg.fillGradientStyle(gradeColor, gradeColor, gradeDark, gradeDark, 0.35)
    bg.fillRoundedRect(0, 0, w, h, 6)
    bg.lineStyle(1.5, gradeColor, 0.8)
    bg.strokeRoundedRect(0, 0, w, h, 6)
    container.add(bg)

    // 캐릭터 플레이스홀더 (원형)
    const circleG = this.add.graphics()
    circleG.fillStyle(0xFFFFFF, 0.15)
    circleG.fillCircle(w / 2, h * 0.42, w * 0.32)
    container.add(circleG)

    // 멤버 첫 글자
    const initial = card.memberName[0]
    const initTxt = this.add.text(w / 2, h * 0.42, initial, {
      fontFamily: 'Nunito', fontSize: `${Math.floor(w * 0.3)}px`, fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5).setAlpha(0.6)
    container.add(initTxt)

    // 멤버 이름
    const nameTxt = this.add.text(w / 2, h * 0.82, card.memberName, {
      fontFamily: 'Nunito', fontSize: '10px', fontStyle: 'bold', color: '#FFFFFF',
    }).setOrigin(0.5)
    container.add(nameTxt)

    // 등급 배지 (우상단)
    const badgeW = 22
    const badgeBg = this.add.graphics()
    badgeBg.fillStyle(gradeColor, 1)
    badgeBg.fillRoundedRect(w - badgeW - 2, 2, badgeW, 13, 3)
    container.add(badgeBg)

    const badgeTxt = this.add.text(w - badgeW / 2 - 2, 8, card.grade, {
      fontFamily: 'Nunito', fontSize: '7px', fontStyle: 'bold', color: '#FFFFFF',
    }).setOrigin(0.5)
    container.add(badgeTxt)

    // 상호작용
    const hitZone = this.add.rectangle(w / 2, h / 2, w, h)
      .setInteractive({ useHandCursor: true })
    container.add(hitZone)
    hitZone.on('pointerdown', () => this.showCardDetail(card))
    hitZone.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 100 })
    })
    hitZone.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 })
    })
  }

  // ── 하단 바 ───────────────────────────────────────────────
  private createBottomBar(W: number, H: number) {
    const barTop = H - 96
    const barH   = 96

    // 하단 바 배경
    const barBg = this.add.graphics()
    barBg.fillStyle(C.white, 0.97)
    barBg.fillRect(0, barTop, W, barH)
    barBg.lineStyle(1, C.lightPink, 0.6)
    barBg.lineBetween(0, barTop, W, barTop)

    // ── 첫 번째 줄: 소형 버튼들 ───────────────────────────
    const row1Y = barTop + 14
    const smallBtns = [
      { label: '🎤 보이스 토큰', isNew: true },
      { label: '📅 시즌', isNew: false },
      { label: '↕ 정렬', isNew: false },
      { label: '🔍 필터', isNew: false },
    ]

    let bx = 6
    smallBtns.forEach(btn => {
      const txt = this.add.text(0, row1Y, btn.label, {
        fontFamily: 'Nunito', fontSize: '9px', fontStyle: 'bold', color: '#FF6B9D',
      })
      const tw = txt.width + 10
      txt.destroy()

      const btnBg = this.add.graphics()
      btnBg.fillStyle(C.lightPink, 1)
      btnBg.fillRoundedRect(bx, row1Y - 9, tw, 18, 5)

      const btnTxt = this.add.text(bx + tw / 2, row1Y, btn.label, {
        fontFamily: 'Nunito', fontSize: '9px', fontStyle: 'bold', color: '#FF6B9D',
      }).setOrigin(0.5)

      if (btn.isNew) {
        const newBg = this.add.graphics()
        newBg.fillStyle(C.coral, 1)
        newBg.fillRoundedRect(bx + tw - 2, row1Y - 13, 18, 10, 3)
        this.add.text(bx + tw + 7, row1Y - 8, 'NEW', {
          fontFamily: 'Nunito', fontSize: '6px', fontStyle: 'bold', color: '#FFFFFF',
        }).setOrigin(0.5)
      }

      bx += tw + 5
    })

    // 포카 티켓 표시 (우측)
    const ticketX = W - 6
    this.add.text(ticketX, row1Y, '🎫 포카 티켓', {
      fontFamily: 'Nunito', fontSize: '9px', color: '#888888',
    }).setOrigin(1, 0.5)
    this.ticketCountText = this.add.text(ticketX, row1Y + 11, `×${GameState.get().raffleTickets}`, {
      fontFamily: 'Nunito', fontSize: '11px', fontStyle: 'bold', color: '#FF6B9D',
    }).setOrigin(1, 0.5).setName('ticketCount')

    // ── 두 번째 줄: CTA 버튼 ──────────────────────────────
    const btnTop  = barTop + 36
    const btnH    = 44
    const btnW    = W - 16

    const ctaBg = this.add.graphics()
    ctaBg.fillGradientStyle(C.mainPink, C.deepPink, C.mainPink, C.deepPink, 1)
    ctaBg.fillRoundedRect(8, btnTop, btnW, btnH, 14)

    // 버튼 광택
    const gloss = this.add.graphics()
    gloss.fillStyle(C.white, 0.15)
    gloss.fillRoundedRect(8, btnTop, btnW, btnH / 2, 14)

    const ctaBtn = this.add.rectangle(8 + btnW / 2, btnTop + btnH / 2, btnW, btnH)
      .setInteractive({ useHandCursor: true })
    ctaBtn.on('pointerdown', () => {
      ctaBg.setAlpha(0.85)
      this.time.delayedCall(100, () => ctaBg.setAlpha(1))
      this.onOpenPack()
    })
    ctaBtn.on('pointerover', () => ctaBg.setAlpha(0.9))
    ctaBtn.on('pointerout',  () => ctaBg.setAlpha(1))

    this.add.text(8 + btnW / 2, btnTop + btnH / 2 - 6, '✨ 12 연속 오픈', {
      fontFamily: 'Nunito', fontSize: '16px', fontStyle: 'bold', color: '#FFFFFF',
    }).setOrigin(0.5)
    this.add.text(8 + btnW / 2, btnTop + btnH / 2 + 11, '포카를 한 번에 열 수 있어요!', {
      fontFamily: 'Nunito', fontSize: '9px', color: 'rgba(255,255,255,0.8)',
    }).setOrigin(0.5)

    // 버튼 pulse 애니메이션
    this.tweens.add({
      targets: ctaBg,
      scaleX: 1.01, scaleY: 1.02,
      yoyo: true, repeat: -1,
      duration: 1400, ease: 'Sine.easeInOut',
    })
  }

  // ── 12 연속 오픈 처리 ─────────────────────────────────────
  private onOpenPack() {
    const state = GameState.get()
    if (state.raffleTickets < TICKET_COST) {
      this.showToast('🎫 티켓이 부족합니다!')
      return
    }
    GameState.spendRaffle(TICKET_COST)
    this.updateTicketDisplay()
    this.showOpenAnimation()
  }

  private updateTicketDisplay() {
    const txt = this.children.getByName('ticketCount') as Phaser.GameObjects.Text
    if (txt) txt.setText(`×${GameState.get().raffleTickets}`)
  }

  // ── 오픈 애니메이션 팝업 ──────────────────────────────────
  private showOpenAnimation() {
    const W = this.scale.width, H = this.scale.height
    const overlay = this.add.container(0, 0).setDepth(100)

    const dimBg = this.add.rectangle(W / 2, H / 2, W, H, 0x2A1A2E, 0.88)
    overlay.add(dimBg)

    // 빛나는 원들
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2
      const dot = this.add.circle(W / 2, H / 2, 5, C.ssrGold)
      overlay.add(dot)
      this.tweens.add({
        targets: dot,
        x: W / 2 + Math.cos(angle) * 120,
        y: H / 2 + Math.sin(angle) * 120,
        alpha: { from: 1, to: 0 },
        scaleX: { from: 1.5, to: 0 },
        scaleY: { from: 1.5, to: 0 },
        duration: 700, ease: 'Power2',
      })
    }

    // 카드 팩 아이콘
    const packTxt = this.add.text(W / 2, H * 0.38, '🎴', {
      fontSize: '64px',
    }).setOrigin(0.5).setAlpha(0)
    overlay.add(packTxt)
    this.tweens.add({
      targets: packTxt,
      alpha: 1,
      scaleX: { from: 0.3, to: 1 },
      scaleY: { from: 0.3, to: 1 },
      duration: 400, ease: 'Back.easeOut',
    })

    // 결과 텍스트
    const resultTxt = this.add.text(W / 2, H * 0.58, '12장의 포카를 획득했습니다!', {
      fontFamily: 'Nunito', fontSize: '15px', fontStyle: 'bold', color: '#FFD700',
    }).setOrigin(0.5).setAlpha(0)
    overlay.add(resultTxt)
    this.tweens.add({ targets: resultTxt, alpha: 1, duration: 300, delay: 450 })

    // 확인 버튼
    const closeBtn = this.add.text(W / 2, H * 0.72, '확인', {
      fontFamily: 'Nunito', fontSize: '15px', fontStyle: 'bold', color: '#FFFFFF',
      backgroundColor: '#FF6B9D', padding: { x: 36, y: 12 },
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true })
    closeBtn.on('pointerdown', () => overlay.destroy())
    overlay.add(closeBtn)
    this.tweens.add({ targets: closeBtn, alpha: 1, duration: 300, delay: 650 })
  }

  // ── 카드 상세 팝업 ────────────────────────────────────────
  private showCardDetail(card: CardData) {
    const W = this.scale.width, H = this.scale.height
    const overlay = this.add.container(0, 0).setDepth(100)

    const dimBg = this.add.rectangle(W / 2, H / 2, W, H, 0x2A1A2E, 0.82)
      .setInteractive()
    dimBg.on('pointerdown', () => overlay.destroy())
    overlay.add(dimBg)

    const gradeColor  = card.grade === 'SSR' ? C.ssrGold  : card.grade === 'SR' ? C.srPurple : C.rBlue
    const gradeDark   = card.grade === 'SSR' ? 0xCC9900   : card.grade === 'SR' ? 0x9060C0   : 0x70A8C0

    // 카드 패널
    const panelW = W * 0.72, panelH = H * 0.52
    const panelX = W / 2 - panelW / 2
    const panelY = H / 2 - panelH / 2

    const panelBg = this.add.graphics()
    panelBg.fillGradientStyle(gradeColor, gradeColor, gradeDark, gradeDark, 0.5)
    panelBg.fillRoundedRect(panelX, panelY, panelW, panelH, 16)
    panelBg.lineStyle(2, gradeColor, 1)
    panelBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 16)
    overlay.add(panelBg)

    // 등급
    const gradeHex = card.grade === 'SSR' ? '#FFD700' : card.grade === 'SR' ? '#C8A0E8' : '#A8D8EA'
    const gradeTxt = this.add.text(W / 2, panelY + 28, card.grade, {
      fontFamily: 'Nunito', fontSize: '22px', fontStyle: 'bold', color: gradeHex,
    }).setOrigin(0.5).setAlpha(0)
    overlay.add(gradeTxt)
    this.tweens.add({ targets: gradeTxt, alpha: 1, duration: 300 })

    // 캐릭터 원형
    const circleG = this.add.graphics()
    circleG.fillStyle(0xFFFFFF, 0.12)
    circleG.fillCircle(W / 2, H / 2 - 10, panelW * 0.26)
    overlay.add(circleG)

    // 첫 글자
    const initTxt = this.add.text(W / 2, H / 2 - 10, card.memberName[0], {
      fontFamily: 'Nunito', fontSize: '40px', fontStyle: 'bold', color: '#FFFFFF',
    }).setOrigin(0.5).setAlpha(0.6)
    overlay.add(initTxt)

    // 멤버 이름
    const nameTxt = this.add.text(W / 2, panelY + panelH - 62, card.memberName, {
      fontFamily: 'Nunito', fontSize: '20px', fontStyle: 'bold', color: '#FFFFFF',
    }).setOrigin(0.5).setAlpha(0)
    overlay.add(nameTxt)
    this.tweens.add({ targets: nameTxt, alpha: 1, duration: 300, delay: 150 })

    // 이벤트명
    const evtTxt = this.add.text(W / 2, panelY + panelH - 40, card.eventName, {
      fontFamily: 'Nunito', fontSize: '11px', color: 'rgba(255,255,255,0.75)',
    }).setOrigin(0.5).setAlpha(0)
    overlay.add(evtTxt)
    this.tweens.add({ targets: evtTxt, alpha: 1, duration: 300, delay: 200 })

    // ID
    const idTxt = this.add.text(W / 2, panelY + panelH - 20, `ID.${card.id}`, {
      fontFamily: 'Nunito', fontSize: '9px', color: 'rgba(255,255,255,0.5)',
    }).setOrigin(0.5)
    overlay.add(idTxt)

    // 닫기 힌트
    const hintTxt = this.add.text(W / 2, panelY + panelH + 18, '탭하면 닫힙니다', {
      fontFamily: 'Nunito', fontSize: '10px', color: 'rgba(255,255,255,0.45)',
    }).setOrigin(0.5)
    overlay.add(hintTxt)

    // 팝인 애니메이션
    overlay.setScale(0.85)
    this.tweens.add({ targets: overlay, scaleX: 1, scaleY: 1, duration: 250, ease: 'Back.easeOut' })
  }

  // ── 토스트 메시지 ─────────────────────────────────────────
  private showToast(msg: string) {
    const W = this.scale.width, H = this.scale.height
    const toast = this.add.text(W / 2, H - 110, msg, {
      fontFamily: 'Nunito', fontSize: '13px', fontStyle: 'bold', color: '#FFFFFF',
      backgroundColor: '#2A1A2E', padding: { x: 18, y: 9 },
    }).setOrigin(0.5).setDepth(200)
    this.tweens.add({
      targets: toast,
      alpha: 0, y: H - 130,
      duration: 1400, delay: 1000,
      onComplete: () => toast.destroy(),
    })
  }
}
