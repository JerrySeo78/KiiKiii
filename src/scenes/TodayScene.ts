import Phaser from 'phaser'
import { GameState } from '../GameState'

interface FeedItem {
  type: 'schedule' | 'news' | 'live'
  emoji: string
  title: string
  sub: string
  time: string
}

const FEED: FeedItem[] = [
  { type: 'live',     emoji: '🔴', title: 'LIVE 진행 중 — Leesol',       sub: '심야 아코스틱 세션',         time: '지금' },
  { type: 'schedule', emoji: '🎤', title: '콘서트 · 도쿄 武道館',           sub: 'D-7 · 2026.05.06',         time: '07일 후' },
  { type: 'news',     emoji: '📸', title: '3rd 미니앨범 WAIKIIIKIII TOUR', sub: '컴백 확정 — 트랙리스트 공개', time: '2시간 전' },
  { type: 'schedule', emoji: '🛍️', title: 'Girls Duty Free 팝업',         sub: '롯폰기 힐스 · 5.01-5.05',   time: '6일 후' },
  { type: 'news',     emoji: '🎬', title: 'Jiyu 브이로그 업로드',           sub: 'WAIKIIIKIII TOUR 비하인드',  time: '4시간 전' },
  { type: 'news',     emoji: '🎵', title: 'Haum 자작곡 「夜明け」 티저',    sub: '멤버십 선공개 — 3일 후 공개', time: '6시간 전' },
  { type: 'schedule', emoji: '🤝', title: 'Sui & Kya 팬 미팅',            sub: '오사카 · 사전 응모 마감 D-3', time: '10일 후' },
]

// 씬 진입당 1회 응모권 지급 추적 (앱 세션 내)
let todayRaffleGiven = false

export class TodayScene extends Phaser.Scene {
  constructor() { super('TodayScene') }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // 배경: 크림 단색
    this.add.rectangle(W / 2, H / 2, W, H, 0xFFF8F0)

    // 헤더
    this.createHeader(W)

    // D-Day 카드 (두 번째 피드 아이템: 도쿄 武道館)
    this.createDDayCard(W, 86)

    // 현장 인증 배너 (D-Day 카드 바로 아래)
    const ddayBottom = 86 + 30 // cardY + cardH/2
    this.createQrBanner(W, ddayBottom + 26) // ddayBottom + 26 ≈ 배너 중앙

    // 피드 아이템들
    this.createFeed(W, H)

    // 하트 체크 후 응모권 지급
    if (!todayRaffleGiven) {
      todayRaffleGiven = true
      GameState.addRaffle(1)
    }

    this.cameras.main.fadeIn(300, 255, 248, 240)
  }

  // ─── 헤더 ────────────────────────────────
  private createHeader(W: number) {
    this.add.text(W / 2, 20, 'TODAY', {
      fontFamily: 'Nunito', fontSize: '24px', fontStyle: 'bold', color: '#2C1810',
    }).setOrigin(0.5)

    const dateTxt = new Date().toLocaleDateString('ja-JP', {
      month: 'long', day: 'numeric', weekday: 'short',
    })
    this.add.text(W / 2, 44, dateTxt, {
      fontFamily: 'Nunito', fontSize: '12px', color: '#8B6355',
    }).setOrigin(0.5)
  }

  // ─── D-Day 카드 ──────────────────────────
  private createDDayCard(W: number, cardY: number) {
    const cardH = 60
    const cardW = W - 32

    // 코랄 배경 카드
    const card = this.add.graphics()
    card.fillStyle(0xFF6B35, 1)
    card.fillRoundedRect(16, cardY - cardH / 2, cardW, cardH, 10)

    // 아이콘 + 제목
    this.add.text(28, cardY - 14, '🎤  도쿄 武道館 콘서트', {
      fontFamily: 'Nunito', fontSize: '14px', fontStyle: 'bold', color: '#ffffff',
    })
    this.add.text(28, cardY + 6, '2026.05.06 (수) · 開場 17:00 / 開演 18:00', {
      fontFamily: 'Nunito', fontSize: '11px', color: 'rgba(255,255,255,0.85)',
    })

    // D-7 배지
    const badgeBg = this.add.graphics()
    badgeBg.fillStyle(0xF4A800, 1)
    badgeBg.fillRoundedRect(W - 68, cardY - 16, 48, 32, 6)
    this.add.text(W - 44, cardY, 'D-7', {
      fontFamily: 'Nunito', fontSize: '16px', fontStyle: 'bold', color: '#2C1810',
    }).setOrigin(0.5)
  }

  // ─── 피드 목록 ───────────────────────────
  private createFeed(W: number, _H: number) {
    // D-Day 카드(~116) + QR 배너(52px) + 간격
    let y = 182
    const ITEM_H = 68
    const BANNER_H = 34

    FEED.forEach((item, i) => {
      // 3번째 아이템 뒤에 응모권 획득 배너 삽입
      if (i === 3) {
        this.createRaffleBanner(W, y + BANNER_H / 2)
        y += BANNER_H + 6
      }

      this.createFeedItem(W, item, y + ITEM_H / 2, ITEM_H)
      y += ITEM_H + 6
    })
  }

  private createFeedItem(W: number, item: FeedItem, cardY: number, itemH: number) {
    const cardW = W - 32
    const g = this.add.graphics()

    // 타입별 배경 색상
    let bgColor: number
    let borderColor: number

    if (item.type === 'live') {
      bgColor = 0xFF6B35     // 코랄
      borderColor = 0xFF4D6D
    } else if (item.type === 'schedule') {
      bgColor = 0xE8F4F8     // 연한 오션블루
      borderColor = 0x0096C7
    } else {
      bgColor = 0xF0E0C0     // 샌드
      borderColor = 0xFF6B35
    }

    g.fillStyle(bgColor, 1)
    g.fillRoundedRect(16, cardY - itemH / 2, cardW, itemH, 8)
    g.lineStyle(1.5, borderColor, 0.3)
    g.strokeRoundedRect(16, cardY - itemH / 2, cardW, itemH, 8)

    const titleColor = item.type === 'live' ? '#ffffff' : '#2C1810'
    const subColor = item.type === 'live' ? 'rgba(255,255,255,0.85)' : '#8B6355'
    const timeColor = item.type === 'live' ? '#FFE0D0' : '#8B6355'

    this.add.text(28, cardY - 14, `${item.emoji}  ${item.title}`, {
      fontFamily: 'Nunito', fontSize: '13px', fontStyle: 'bold', color: titleColor,
    })
    this.add.text(28, cardY + 6, item.sub, {
      fontFamily: 'Nunito', fontSize: '11px', color: subColor,
    })
    this.add.text(W - 20, cardY - 14, item.time, {
      fontFamily: 'Nunito', fontSize: '11px', color: timeColor,
    }).setOrigin(1, 0)

    // LIVE: 빨간 점 블링크
    if (item.type === 'live') {
      const dot = this.add.circle(W - 24, cardY + 10, 5, 0xFF4D6D)
      this.tweens.add({
        targets: dot, alpha: 0.2, yoyo: true, repeat: -1, duration: 600,
      })
    }
  }

  // ─── 응모권 획득 배너 ─────────────────────
  private createRaffleBanner(W: number, bannerY: number) {
    const g = this.add.graphics()
    g.fillStyle(0xF4A800, 0.9)
    g.fillRoundedRect(16, bannerY - 14, W - 32, 28, 6)

    this.add.text(W / 2, bannerY, '📅 오늘의 일정 확인 완료!  🎫 +1', {
      fontFamily: 'Nunito', fontSize: '11px', fontStyle: 'bold', color: '#2C1810',
    }).setOrigin(0.5)
  }

  // ─── 현장 인증 QR 배너 ───────────────────
  private createQrBanner(W: number, bannerY: number) {
    const bannerH = 52
    const cardW = W - 32
    const alreadyDone = localStorage.getItem('kk_qr_done') === '1'

    const g = this.add.graphics()
    g.fillStyle(0x1A1A1A, 1)
    g.fillRoundedRect(16, bannerY - bannerH / 2, cardW, bannerH, 8)
    g.lineStyle(1.5, 0xFF6B35, 1)
    g.strokeRoundedRect(16, bannerY - bannerH / 2, cardW, bannerH, 8)

    // 왼쪽 텍스트
    this.add.text(28, bannerY, '📍 Girls Duty Free 팝업', {
      fontFamily: 'Nunito', fontSize: '13px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0, 0.5)

    // 오른쪽 버튼
    const btnW = 92
    const btnX = W - 24 - btnW
    const btnBg = this.add.graphics()

    if (alreadyDone) {
      // 이미 인증 완료
      btnBg.fillStyle(0x8B6355, 1)
      btnBg.fillRoundedRect(btnX, bannerY - 14, btnW, 28, 6)
      this.add.text(btnX + btnW / 2, bannerY, '✅ 인증 완료', {
        fontFamily: 'Nunito', fontSize: '11px', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5)
    } else {
      btnBg.fillStyle(0xFF6B35, 1)
      btnBg.fillRoundedRect(btnX, bannerY - 14, btnW, 28, 6)
      const btnTxt = this.add.text(btnX + btnW / 2, bannerY, 'QR 인증하기 →', {
        fontFamily: 'Nunito', fontSize: '11px', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5)

      const hitZone = this.add.rectangle(btnX + btnW / 2, bannerY, btnW, 28, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
      void btnTxt

      hitZone.on('pointerup', () => this.startQrFlow(W, btnBg, btnX, bannerY, btnW))
    }
  }

  // ─── QR 인증 플로우 오버레이 ─────────────
  private startQrFlow(
    W: number,
    btnBg: Phaser.GameObjects.Graphics,
    btnX: number,
    bannerY: number,
    btnW: number,
  ) {
    const H = this.scale.height

    // ── 오버레이 컨테이너 (depth 20) ──
    const overlay = this.add.container(0, 0).setDepth(20)

    // 어두운 배경
    const dimBg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75)
    overlay.add(dimBg)

    // 스캔 중 카드 배경
    const cardW = W - 64
    const cardH = 160
    const cardX = W / 2
    const cardY = H / 2

    const cardBg = this.add.graphics()
    cardBg.fillStyle(0x1A1A1A, 1)
    cardBg.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 12)
    cardBg.lineStyle(2, 0xFF6B35, 1)
    cardBg.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 12)
    overlay.add(cardBg)

    // QR 아이콘
    const qrIcon = this.add.text(cardX, cardY - 44, '📷', {
      fontSize: '36px',
    }).setOrigin(0.5)
    overlay.add(qrIcon)

    // "QR 스캔 중..." 텍스트
    const scanTxt = this.add.text(cardX, cardY + 4, 'QR 스캔 중', {
      fontFamily: 'Nunito', fontSize: '16px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)
    overlay.add(scanTxt)

    // 점 3개 순차 깜빡임
    const dots: Phaser.GameObjects.Text[] = []
    for (let d = 0; d < 3; d++) {
      const dot = this.add.text(cardX + 42 + d * 14, cardY + 4, '.', {
        fontFamily: 'Nunito', fontSize: '20px', fontStyle: 'bold', color: '#FF6B35',
      }).setOrigin(0.5).setAlpha(0.2)
      overlay.add(dot)
      dots.push(dot)
      // 순차 깜빡임: 0ms, 500ms, 1000ms 시작
      this.tweens.add({
        targets: dot, alpha: 1, duration: 300, yoyo: true,
        repeat: -1, delay: d * 500,
      })
    }

    // 1.5초 후 → "✅ 인증 완료!"
    this.time.delayedCall(1500, () => {
      // 점 트윈 정지
      dots.forEach(dot => { this.tweens.killTweensOf(dot); dot.destroy() })
      scanTxt.setText('✅ 인증 완료!').setColor('#2D6A4F')
      qrIcon.destroy()

      // 0.5초 후 혜택 지급 카드로 교체
      this.time.delayedCall(500, () => {
        // 스캔 카드 제거, 혜택 카드 표시
        cardBg.destroy()
        scanTxt.destroy()
        this.showBenefitCard(overlay, W, H, cardX, cardY, cardW, btnBg, btnX, bannerY, btnW)
      })
    })
  }

  private showBenefitCard(
    overlay: Phaser.GameObjects.Container,
    W: number,
    _H: number,
    cardX: number,
    cardY: number,
    cardW: number,
    btnBg: Phaser.GameObjects.Graphics,
    btnX: number,
    bannerY: number,
    btnW: number,
  ) {
    const cardH = 240

    const newCard = this.add.graphics()
    newCard.fillStyle(0xFFF8F0, 1)
    newCard.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 12)
    newCard.lineStyle(2, 0xFF6B35, 1)
    newCard.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 12)
    overlay.add(newCard)

    const lines: [string, string][] = [
      ['🎁 현장 방문 혜택 지급!', 'bold 16px #1A1A1A'],
      ['', ''],
      ['🏷️ Girls Duty Free 10% 할인쿠폰', '13px #2C1810'],
      ['🎫 응모권 ×5 지급', '13px #2C1810'],
      ['🌴 한정 스탬프 "WAIKIKI" 획득', '13px #2C1810'],
    ]
    const startY = cardY - cardH / 2 + 36
    lines.forEach((line, i) => {
      if (!line[0]) return
      const [msg, style] = line
      const isBold = style.includes('bold')
      const sizeMatch = style.match(/(\d+)px/)
      const sz = sizeMatch ? sizeMatch[1] : '13'
      const colorMatch = style.match(/#[0-9A-Fa-f]{6}/)
      const col = colorMatch ? colorMatch[0] : '#2C1810'

      const t = this.add.text(cardX, startY + i * 26, msg, {
        fontFamily: 'Nunito',
        fontSize: `${sz}px`,
        fontStyle: isBold ? 'bold' : 'normal',
        color: col,
      }).setOrigin(0.5)
      overlay.add(t)
    })

    // 확인 버튼
    const confirmBtnW = cardW - 32
    const confirmBtnH = 44
    const confirmBtnY = cardY + cardH / 2 - 30
    const confirmBg = this.add.graphics()
    confirmBg.fillStyle(0xFF6B35, 1)
    confirmBg.fillRoundedRect(cardX - confirmBtnW / 2, confirmBtnY - confirmBtnH / 2, confirmBtnW, confirmBtnH, 8)
    overlay.add(confirmBg)

    const confirmTxt = this.add.text(cardX, confirmBtnY, '확인', {
      fontFamily: 'Nunito', fontSize: '14px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)
    overlay.add(confirmTxt)

    const confirmHit = this.add.rectangle(cardX, confirmBtnY, confirmBtnW, confirmBtnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true }).setDepth(21)

    confirmHit.on('pointerup', () => {
      // 오버레이 닫힘
      overlay.destroy()
      confirmHit.destroy()

      // 응모권 지급 (1회만)
      if (localStorage.getItem('kk_qr_done') !== '1') {
        localStorage.setItem('kk_qr_done', '1')
        GameState.addRaffle(5)
      }

      // 배너 버튼을 "인증 완료" 비활성 상태로 교체
      btnBg.clear()
      btnBg.fillStyle(0x8B6355, 1)
      btnBg.fillRoundedRect(btnX, bannerY - 14, btnW, 28, 6)
      // 기존 버튼 텍스트 위에 새 텍스트 (간단하게 depth로 덮기)
      this.add.text(btnX + btnW / 2, bannerY, '✅ 인증 완료', {
        fontFamily: 'Nunito', fontSize: '11px', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5).setDepth(1)
    })

    void confirmTxt
    void W
  }
}
