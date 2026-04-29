import Phaser from 'phaser'
import { GameState } from '../GameState'
import { MEMBERS } from '../assets'

// ─── 상수 ────────────────────────────────
const C = {
  white:  0xFFFFFF,
  cream:  0xFFF8F0,
  coral:  0xFF6B35,
  dark:   0x1A1A1A,
  mid:    0x8B6355,
  border: 0xE8E0D8,
  gold:   0xF4A800,
  green:  0x2D6A4F,
} as const

interface Pose {
  name: string
  emoji: string
}

interface BgOption {
  name: string
  color: number
}

const POSES: Pose[] = [
  { name: '기본 서기', emoji: '🧍‍♀️' },
  { name: '손 흔들기', emoji: '👋' },
  { name: '하트 포즈', emoji: '🫶' },
  { name: '윙크',     emoji: '😉' },
  { name: '점프',     emoji: '🦘' },
  { name: '앉기',     emoji: '🪑' },
]

const BG_OPTIONS: BgOption[] = [
  { name: 'Waikiki 해변',  color: 0x87CEEB },
  { name: '선셋 오렌지',    color: 0xFF8C35 },
  { name: '트로피컬 그린',  color: 0x2D6A4F },
  { name: '크림 스튜디오',  color: 0xFFF8F0 },
]

export class PhotoboothScene extends Phaser.Scene {
  private step = 1
  private selectedPose = 0
  private selectedBg  = 0
  private memberIdx   = 0
  private currentContainer: Phaser.GameObjects.Container | null = null

  constructor() { super('PhotoboothScene') }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // 멤버 결정
    const raw = localStorage.getItem('kk_selected_member') ?? '0'
    this.memberIdx = Math.min(parseInt(raw), MEMBERS.length - 1)

    // 배경
    this.add.rectangle(W / 2, H / 2, W, H, C.cream)

    this.showStep(W, H)
    this.cameras.main.fadeIn(300, 255, 248, 240)
  }

  // ─── 단계 전환 ───────────────────────────
  private showStep(W: number, H: number) {
    if (this.currentContainer) {
      this.currentContainer.destroy()
      this.currentContainer = null
    }
    const container = this.add.container(0, 0)
    this.currentContainer = container

    if (this.step === 1) this.buildStep1(W, H, container)
    else if (this.step === 2) this.buildStep2(W, H, container)
    else this.buildStep3(W, H, container)
  }

  // ─── 공통 헤더 빌더 ──────────────────────
  private buildHeader(
    W: number,
    container: Phaser.GameObjects.Container,
    stepLabel: string,
    stepNum: number,
  ) {
    // 제목
    const title = this.add.text(W / 2, 24, 'PHOTOBOOTH', {
      fontFamily: '"Playfair Display", serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#1A1A1A',
    }).setOrigin(0.5)
    container.add(title)

    // 스텝 라벨
    const subTxt = this.add.text(W / 2, 48, stepLabel, {
      fontFamily: 'Nunito',
      fontSize: '12px',
      color: '#8B6355',
    }).setOrigin(0.5)
    container.add(subTxt)

    // 진행 바 (3칸)
    const barW = 60
    const barH = 4
    const barGap = 6
    const totalW = barW * 3 + barGap * 2
    const startX = W / 2 - totalW / 2

    for (let i = 0; i < 3; i++) {
      const g = this.add.graphics()
      const active = i < stepNum
      g.fillStyle(active ? C.coral : C.border, 1)
      g.fillRoundedRect(startX + i * (barW + barGap), 62, barW, barH, 2)
      container.add(g)
    }
  }

  // ─── Step 1: 포즈 선택 ───────────────────
  private buildStep1(W: number, H: number, container: Phaser.GameObjects.Container) {
    this.buildHeader(W, container, '1 / 3  포즈 선택', 1)

    const gridStartY = 82
    const cellSize = 80
    const cellGap  = 10
    const cols     = 2
    const gridW    = cols * cellSize + (cols - 1) * cellGap
    const gridX    = W / 2 - gridW / 2

    // 포즈 셀 그래픽 캐시 (선택 상태 업데이트용)
    const cellBgs: Phaser.GameObjects.Graphics[] = []

    POSES.forEach((pose, idx) => {
      const col = idx % cols
      const row = Math.floor(idx / cols)
      const cx  = gridX + col * (cellSize + cellGap)
      const cy  = gridStartY + row * (cellSize + cellGap)

      const bg = this.add.graphics()
      cellBgs.push(bg)
      this.drawPoseCell(bg, cx, cy, cellSize, idx === this.selectedPose)
      container.add(bg)

      const emojiTxt = this.add.text(cx + cellSize / 2, cy + 28, pose.emoji, {
        fontSize: '32px',
      }).setOrigin(0.5)
      container.add(emojiTxt)

      const nameTxt = this.add.text(cx + cellSize / 2, cy + cellSize - 12, pose.name, {
        fontFamily: 'Nunito', fontSize: '10px', color: '#1A1A1A',
      }).setOrigin(0.5)
      container.add(nameTxt)

      const hitZone = this.add.rectangle(cx + cellSize / 2, cy + cellSize / 2, cellSize, cellSize, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
      container.add(hitZone)

      hitZone.on('pointerup', () => {
        const prev = this.selectedPose
        this.selectedPose = idx
        this.drawPoseCell(cellBgs[prev], gridX + (prev % cols) * (cellSize + cellGap), gridStartY + Math.floor(prev / cols) * (cellSize + cellGap), cellSize, false)
        this.drawPoseCell(bg, cx, cy, cellSize, true)
      })
    })

    // 다음 버튼
    const btnY = H - 60
    this.addFullWidthBtn(container, W, btnY, '다음 →', () => {
      this.cameras.main.fadeOut(200, 255, 248, 240)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.step = 2
        this.cameras.main.fadeIn(250, 255, 248, 240)
        this.showStep(W, H)
      })
    })
  }

  private drawPoseCell(g: Phaser.GameObjects.Graphics, x: number, y: number, size: number, selected: boolean) {
    g.clear()
    g.fillStyle(C.white, 1)
    g.fillRoundedRect(x, y, size, size, 8)
    g.lineStyle(selected ? 2 : 1, selected ? C.coral : C.border, 1)
    g.strokeRoundedRect(x, y, size, size, 8)
  }

  // ─── Step 2: 배경 선택 ───────────────────
  private buildStep2(W: number, H: number, container: Phaser.GameObjects.Container) {
    this.buildHeader(W, container, '2 / 3  배경 선택', 2)

    // 미리보기 (상단 중앙)
    const previewW = W - 64
    const previewH = 120
    const previewX = W / 2
    const previewY = 116

    const previewBg = this.add.graphics()
    this.drawPreviewBg(previewBg, previewX, previewY, previewW, previewH, BG_OPTIONS[this.selectedBg].color)
    container.add(previewBg)

    // 캐릭터 이미지 (미리보기)
    const member = MEMBERS[this.memberIdx]
    const charImg = this.add.image(previewX, previewY + 10, member.id)
      .setDisplaySize(60, 80)
      .setOrigin(0.5)
    container.add(charImg)

    // 배경 그리드 (2×2)
    const cellSize = 80
    const cellGap  = 10
    const cols     = 2
    const gridW    = cols * cellSize + (cols - 1) * cellGap
    const gridX    = W / 2 - gridW / 2
    const gridStartY = previewY + previewH / 2 + 18

    const cellBgs: Phaser.GameObjects.Graphics[] = []

    BG_OPTIONS.forEach((opt, idx) => {
      const col = idx % cols
      const row = Math.floor(idx / cols)
      const cx  = gridX + col * (cellSize + cellGap)
      const cy  = gridStartY + row * (cellSize + cellGap)

      const bg = this.add.graphics()
      cellBgs.push(bg)
      this.drawBgCell(bg, cx, cy, cellSize, opt.color, idx === this.selectedBg)
      container.add(bg)

      const nameTxt = this.add.text(cx + cellSize / 2, cy + cellSize - 12, opt.name, {
        fontFamily: 'Nunito', fontSize: '10px', color: '#1A1A1A',
      }).setOrigin(0.5)
      container.add(nameTxt)

      const hitZone = this.add.rectangle(cx + cellSize / 2, cy + cellSize / 2, cellSize, cellSize, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
      container.add(hitZone)

      hitZone.on('pointerup', () => {
        const prev = this.selectedBg
        this.selectedBg = idx
        const prevCol = prev % cols
        const prevRow = Math.floor(prev / cols)
        const prevCx  = gridX + prevCol * (cellSize + cellGap)
        const prevCy  = gridStartY + prevRow * (cellSize + cellGap)
        this.drawBgCell(cellBgs[prev], prevCx, prevCy, cellSize, BG_OPTIONS[prev].color, false)
        this.drawBgCell(bg, cx, cy, cellSize, opt.color, true)
        // 미리보기 갱신
        this.drawPreviewBg(previewBg, previewX, previewY, previewW, previewH, opt.color)
      })
    })

    // 하단 버튼 (이전 + 다음)
    const btnY = H - 60
    this.addTwoButtons(
      container, W, btnY,
      '← 이전', () => {
        this.cameras.main.fadeOut(200, 255, 248, 240)
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.step = 1
          this.cameras.main.fadeIn(250, 255, 248, 240)
          this.showStep(W, H)
        })
      },
      '다음 →', () => {
        this.cameras.main.fadeOut(200, 255, 248, 240)
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.step = 3
          this.cameras.main.fadeIn(250, 255, 248, 240)
          this.showStep(W, H)
        })
      },
    )
  }

  private drawPreviewBg(
    g: Phaser.GameObjects.Graphics,
    cx: number, cy: number,
    w: number, h: number,
    color: number,
  ) {
    g.clear()
    g.fillStyle(color, 1)
    g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 10)
    g.lineStyle(1.5, C.border, 1)
    g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 10)
  }

  private drawBgCell(
    g: Phaser.GameObjects.Graphics,
    x: number, y: number, size: number,
    color: number, selected: boolean,
  ) {
    g.clear()
    g.fillStyle(color, 1)
    g.fillRoundedRect(x, y, size, size, 8)
    if (selected) {
      g.lineStyle(3, C.white, 1)
      g.strokeRoundedRect(x + 3, y + 3, size - 6, size - 6, 6)
    }
  }

  // ─── Step 3: SNS 공유 ────────────────────
  private buildStep3(W: number, H: number, container: Phaser.GameObjects.Container) {
    this.buildHeader(W, container, '3 / 3  공유하기', 3)

    // 결과 프레임
    const frameW = W - 48
    const frameH = Math.round(frameW * 3 / 4)
    const frameX = W / 2
    const frameY = 76 + frameH / 2

    const frameBg = this.add.graphics()
    frameBg.fillStyle(BG_OPTIONS[this.selectedBg].color, 1)
    frameBg.fillRoundedRect(frameX - frameW / 2, frameY - frameH / 2, frameW, frameH, 0)
    frameBg.lineStyle(3, C.coral, 1)
    frameBg.strokeRoundedRect(frameX - frameW / 2, frameY - frameH / 2, frameW, frameH, 0)
    container.add(frameBg)

    // 캐릭터 이미지
    const member = MEMBERS[this.memberIdx]
    const charImg = this.add.image(frameX, frameY + 8, member.id)
      .setDisplaySize(Math.round(frameW * 0.55), Math.round(frameH * 0.8))
      .setOrigin(0.5)
    container.add(charImg)

    // 워터마크 — 좌하단
    const wmTxt = this.add.text(
      frameX - frameW / 2 + 10,
      frameY + frameH / 2 - 14,
      'KiiiKiii',
      {
        fontFamily: '"Playfair Display", serif',
        fontSize: '11px',
        fontStyle: 'italic',
        color: '#ffffff',
      },
    ).setOrigin(0, 1).setAlpha(0.7)
    container.add(wmTxt)

    // 멤버명 + 하트 — 우상단
    const memberNameTxt = this.add.text(
      frameX + frameW / 2 - 10,
      frameY - frameH / 2 + 14,
      `❤️ ${member.name}`,
      {
        fontFamily: 'Nunito', fontSize: '12px', fontStyle: 'bold', color: '#ffffff',
      },
    ).setOrigin(1, 0)
    container.add(memberNameTxt)

    // 응모권 안내
    const infoTxt = this.add.text(W / 2, frameY + frameH / 2 + 16, '📸 공유 완료 시  🎫 +2 획득', {
      fontFamily: 'Nunito', fontSize: '12px', color: '#8B6355',
    }).setOrigin(0.5)
    container.add(infoTxt)

    // 공유 버튼 3개
    const shareButtons: { label: string; flag: string }[] = [
      { label: '📷 Instagram', flag: 'kk_share_ig' },
      { label: '🐦 X',         flag: 'kk_share_x'  },
      { label: '💬 LINE',      flag: 'kk_share_ln' },
    ]
    const shareBtnW   = (W - 48 - 12) / 3  // 3개, 간격 6×2
    const shareBtnH   = 40
    const shareBtnY   = frameY + frameH / 2 + 44
    const shareBtnStartX = 16

    shareButtons.forEach((btn, i) => {
      const bx = shareBtnStartX + i * (shareBtnW + 6)
      const bg = this.add.graphics()
      bg.fillStyle(C.dark, 1)
      bg.fillRoundedRect(bx, shareBtnY - shareBtnH / 2, shareBtnW, shareBtnH, 8)
      bg.lineStyle(1.5, C.border, 1)
      bg.strokeRoundedRect(bx, shareBtnY - shareBtnH / 2, shareBtnW, shareBtnH, 8)
      container.add(bg)

      const labelTxt = this.add.text(bx + shareBtnW / 2, shareBtnY, btn.label, {
        fontFamily: 'Nunito', fontSize: '11px', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5)
      container.add(labelTxt)

      const hitZone = this.add.rectangle(bx + shareBtnW / 2, shareBtnY, shareBtnW, shareBtnH, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
      container.add(hitZone)

      hitZone.on('pointerup', () => {
        // 응모권 지급 (공유 버튼 어느 것이든 최초 1회)
        const anyShared = ['kk_share_ig', 'kk_share_x', 'kk_share_ln'].some(
          f => localStorage.getItem(f) === '1',
        )
        if (!anyShared) {
          GameState.addRaffle(2)
        }
        localStorage.setItem(btn.flag, '1')
        this.showToast('공유 준비 중...', C.mid)
      })
    })

    // 하단 버튼 (다시 찍기 + 홈으로)
    const bottomBtnY = H - 60
    this.addTwoButtons(
      container, W, bottomBtnY,
      '← 다시 찍기', () => {
        this.cameras.main.fadeOut(200, 255, 248, 240)
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.step = 1
          this.cameras.main.fadeIn(250, 255, 248, 240)
          this.showStep(W, H)
        })
      },
      '홈으로', () => {
        this.cameras.main.fadeOut(200, 255, 248, 240)
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('HomeScene'))
      },
    )
  }

  // ─── 버튼 헬퍼: 전체 너비 ────────────────
  private addFullWidthBtn(
    container: Phaser.GameObjects.Container,
    W: number,
    btnY: number,
    label: string,
    cb: () => void,
  ) {
    const btnW = W - 32
    const btnH = 48
    const bg = this.add.graphics()
    bg.fillStyle(C.coral, 1)
    bg.fillRoundedRect(16, btnY - btnH / 2, btnW, btnH, 10)
    container.add(bg)

    const txt = this.add.text(W / 2, btnY, label, {
      fontFamily: 'Nunito', fontSize: '15px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)
    container.add(txt)

    const hit = this.add.rectangle(W / 2, btnY, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
    container.add(hit)
    hit.on('pointerup', cb)
  }

  // ─── 버튼 헬퍼: 이전 + 다음 ──────────────
  private addTwoButtons(
    container: Phaser.GameObjects.Container,
    W: number,
    btnY: number,
    leftLabel: string,
    leftCb: () => void,
    rightLabel: string,
    rightCb: () => void,
  ) {
    const halfW = (W - 40) / 2
    const btnH  = 48

    // 왼쪽 (테두리)
    const leftBg = this.add.graphics()
    leftBg.lineStyle(2, C.coral, 1)
    leftBg.strokeRoundedRect(16, btnY - btnH / 2, halfW, btnH, 10)
    container.add(leftBg)

    const leftTxt = this.add.text(16 + halfW / 2, btnY, leftLabel, {
      fontFamily: 'Nunito', fontSize: '14px', fontStyle: 'bold', color: '#FF6B35',
    }).setOrigin(0.5)
    container.add(leftTxt)

    const leftHit = this.add.rectangle(16 + halfW / 2, btnY, halfW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
    container.add(leftHit)
    leftHit.on('pointerup', leftCb)

    // 오른쪽 (코랄)
    const rightX = 16 + halfW + 8
    const rightBg = this.add.graphics()
    rightBg.fillStyle(C.coral, 1)
    rightBg.fillRoundedRect(rightX, btnY - btnH / 2, halfW, btnH, 10)
    container.add(rightBg)

    const rightTxt = this.add.text(rightX + halfW / 2, btnY, rightLabel, {
      fontFamily: 'Nunito', fontSize: '14px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)
    container.add(rightTxt)

    const rightHit = this.add.rectangle(rightX + halfW / 2, btnY, halfW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
    container.add(rightHit)
    rightHit.on('pointerup', rightCb)
  }

  // ─── 토스트 ───────────────────────────────
  private showToast(msg: string, color: number) {
    const W = this.scale.width
    const H = this.scale.height
    const toastY = H - 72
    const bg = this.add.rectangle(W / 2, toastY, Math.min(msg.length * 11 + 32, W - 32), 38, color, 0.92).setDepth(30)
    const txt = this.add.text(W / 2, toastY, msg, {
      fontFamily: 'Nunito', fontSize: '13px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setDepth(30)
    bg.setAlpha(0); txt.setAlpha(0)
    this.tweens.add({ targets: [bg, txt], alpha: 1, duration: 180 })
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: [bg, txt], alpha: 0, duration: 300,
        onComplete: () => { bg.destroy(); txt.destroy() },
      })
    })
  }
}
