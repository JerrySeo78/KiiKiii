import Phaser from 'phaser'
import { GameState } from '../GameState'

export class TripScene extends Phaser.Scene {
  constructor() { super('TripScene') }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    const bg = this.add.graphics()
    bg.fillGradientStyle(0x1A0A3D, 0x1A0A3D, 0x0D0621, 0x0D0621, 1)
    bg.fillRect(0, 0, W, H)

    this.add.text(W / 2, 24, '✈️ Trip', {
      fontFamily: 'Nunito', fontSize: '20px', fontStyle: 'bold', color: '#F3F0FF',
    }).setOrigin(0.5)
    this.add.text(W / 2, 48, 'Girls Duty Free 팝업 · 롯폰기 힐스', {
      fontFamily: 'Nunito', fontSize: '12px', color: '#C4B5FD',
    }).setOrigin(0.5)

    // Passport card
    this.createPassport(W)

    // Journey steps
    this.createJourneySteps(W, H)

    // Stamp grid
    this.createStampGrid(W, H)

    this.cameras.main.fadeIn(300, 13, 6, 33)
  }

  private createPassport(W: number) {
    const cardY = 108
    this.add.rectangle(W / 2, cardY, W - 32, 80, 0x1E3A5F, 0.9)
      .setStrokeStyle(2, 0x60A5FA, 0.5)

    // Boarding pass style
    this.add.text(24, cardY - 28, '✈  DIGITAL BOARDING PASS', {
      fontFamily: 'Nunito', fontSize: '10px', fontStyle: 'bold', color: 'rgba(96,165,250,0.7)', letterSpacing: 2,
    })
    this.add.text(24, cardY - 12, 'KiiiKiii Passport', {
      fontFamily: 'Nunito', fontSize: '18px', fontStyle: 'bold', color: '#F3F0FF',
    })
    this.add.text(24, cardY + 8, 'Girls Duty Free × KiiiKiii', {
      fontFamily: 'Nunito', fontSize: '12px', color: '#93C5FD',
    })

    // QR placeholder
    const qrX = W - 56, qrY = cardY
    this.add.rectangle(qrX, qrY, 64, 64, 0x0D0621)
      .setStrokeStyle(1, 0x60A5FA, 0.5)
    // Mini QR pattern
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (Math.random() > 0.5) {
          this.add.rectangle(qrX - 24 + i * 12, qrY - 24 + j * 12, 10, 10, 0x60A5FA)
        }
      }
    }

    const state = GameState.get()
    this.add.text(24, cardY + 28, `🪙 KiiKii Coin: ${state.coins}  |  Lv.${state.level}`, {
      fontFamily: 'Nunito', fontSize: '11px', color: '#FFD700',
    })
  }

  private createJourneySteps(W: number, _H: number) {
    this.add.text(16, 162, '팝업 여정', {
      fontFamily: 'Nunito', fontSize: '14px', fontStyle: 'bold', color: '#C4B5FD',
    })

    const steps = [
      { emoji: '🎫', title: '사전 예약', sub: '디지털 보딩패스 발급', done: true },
      { emoji: '📲', title: '입장 체크인', sub: 'QR 스캔 → 캐릭터 환영', done: true },
      { emoji: '🏷️', title: 'NFC 코인 적립', sub: '팝업 내 태그 터치', done: false },
      { emoji: '📸', title: 'AR 셀카', sub: '멤버와 포토존 인증', done: false },
      { emoji: '🎁', title: '여행 등급 사은품', sub: '모든 스탬프 완성 시', done: false },
    ]

    steps.forEach((step, i) => {
      const y = 186 + i * 52
      const color = step.done ? 0x1E3A5F : 0x1A0A3D
      const border = step.done ? 0x60A5FA : 0xA78BFA

      this.add.rectangle(W / 2, y, W - 32, 44, color, 0.9)
        .setStrokeStyle(1, border, step.done ? 0.6 : 0.2)

      this.add.text(24, y, step.emoji, { fontSize: '18px' }).setOrigin(0, 0.5)
      this.add.text(50, y - 8, step.title, {
        fontFamily: 'Nunito', fontSize: '13px', fontStyle: 'bold',
        color: step.done ? '#F3F0FF' : '#C4B5FD',
      })
      this.add.text(50, y + 8, step.sub, {
        fontFamily: 'Nunito', fontSize: '11px', color: 'rgba(196,181,253,0.55)',
      })
      this.add.text(W - 24, y, step.done ? '✅' : '○', {
        fontSize: step.done ? '16px' : '14px', color: step.done ? '#34D399' : 'rgba(196,181,253,0.3)',
      }).setOrigin(1, 0.5)
    })
  }

  private createStampGrid(W: number, H: number) {
    this.add.text(16, H - 138, '스탬프 컬렉션', {
      fontFamily: 'Nunito', fontSize: '14px', fontStyle: 'bold', color: '#C4B5FD',
    })

    const stamps = ['🌸', '⭐', '🎵', '🎀', '✈️']
    const earned = [true, true, false, false, false]
    const slotW = (W - 32) / 5

    stamps.forEach((s, i) => {
      const sx = 16 + i * slotW + slotW / 2
      const sy = H - 92
      this.add.rectangle(sx, sy, slotW - 6, 52, 0x1A0A3D)
        .setStrokeStyle(1, earned[i] ? 0xFFD700 : 0xA78BFA, earned[i] ? 0.8 : 0.2)
      this.add.text(sx, sy - 4, s, { fontSize: '22px' }).setOrigin(0.5).setAlpha(earned[i] ? 1 : 0.2)
      this.add.text(sx, sy + 16, earned[i] ? 'GET!' : '?', {
        fontFamily: 'Nunito', fontSize: '10px', fontStyle: 'bold',
        color: earned[i] ? '#FFD700' : 'rgba(196,181,253,0.3)',
      }).setOrigin(0.5)
    })
  }
}
