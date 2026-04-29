import Phaser from 'phaser'
import { GameState } from '../GameState'

const GRID_COLS = 5
const GRID_ROWS = 7
const TILE_SIZE = 52
const TILE_GAP = 6
const TILE_COLORS = [
  0,          // 0: unused
  0xFFE0D0,   // 1: 연한 코랄
  0xFFD0A0,   // 2: 연한 골드
  0xFFB830,   // 3: 골드
  0xFF8C35,   // 4: 오렌지코랄
  0xFF6B35,   // 5: 코랄
  0xE85D2F,   // 6: 진코랄
  0xC0392B,   // 7: 레드
  0x2D6A4F,   // 8: 트로피컬그린 (특별)
]
const TILE_TEXT_COLORS = [
  '',
  '#2C1810', '#2C1810', '#2C1810', '#ffffff',
  '#ffffff', '#ffffff', '#ffffff', '#ffffff',
]

export class MergeScene extends Phaser.Scene {
  private grid: (number | null)[][] = []
  private tileObjs: (Phaser.GameObjects.Container | null)[][] = []
  private selected: { row: number; col: number } | null = null
  private gridOffsetX = 0
  private gridOffsetY = 0
  private clearAchieved = false
  private todayRaffleAdded = false

  constructor() { super('MergeScene') }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // 하트 체크
    if (GameState.get().hearts <= 0) {
      this.showHeartEmptyPopup()
      return
    }

    // 배경
    this.add.rectangle(W / 2, H / 2, W, H, 0xFFF8F0)

    // 그리드 오프셋 계산 (중앙 정렬)
    const totalW = GRID_COLS * (TILE_SIZE + TILE_GAP) - TILE_GAP
    const totalH = GRID_ROWS * (TILE_SIZE + TILE_GAP) - TILE_GAP
    this.gridOffsetX = (W - totalW) / 2
    this.gridOffsetY = 90

    // 상단 UI
    this.createTopUI(W)

    // 그리드 배경
    this.add.rectangle(W / 2, this.gridOffsetY + totalH / 2 + 4, totalW + 20, totalH + 20, 0xF0E0C0, 1)
      .setStrokeStyle(2, 0xFFB830, 0.4)

    // 그리드 초기화
    this.initGrid()
    this.renderAllTiles()

    // 하단 UI
    this.createBottomUI(W, H)

    this.cameras.main.fadeIn(300, 255, 248, 240)
  }

  // ─── 상단 UI ──────────────────────────────
  private createTopUI(W: number) {
    // 제목
    this.add.text(W / 2, 22, 'MERGE', {
      fontFamily: 'Nunito', fontSize: '22px', fontStyle: 'bold', color: '#2C1810',
    }).setOrigin(0.5)

    // 하트 표시
    const hearts = GameState.get().hearts
    this.add.text(W - 16, 22, `♥ ${hearts}`, {
      fontFamily: 'Nunito', fontSize: '14px', fontStyle: 'bold', color: '#FF4D6D',
    }).setOrigin(1, 0.5)

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

  // ─── 그리드 초기화 ──────────────────────────
  private initGrid() {
    // 빈 그리드
    this.grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null))
    this.tileObjs = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null))

    // 랜덤 15개 배치 (레벨 1~3)
    const positions: { row: number; col: number }[] = []
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++)
        positions.push({ row: r, col: c })

    // 셔플
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[positions[i], positions[j]] = [positions[j], positions[i]]
    }

    for (let k = 0; k < 15; k++) {
      const { row, col } = positions[k]
      this.grid[row][col] = Math.floor(Math.random() * 3) + 1
    }
  }

  // ─── 타일 전체 렌더링 ───────────────────────
  private renderAllTiles() {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        this.renderTile(r, c)
      }
    }
  }

  private renderTile(row: number, col: number) {
    // 기존 오브젝트 제거
    if (this.tileObjs[row][col]) {
      this.tileObjs[row][col]!.destroy()
      this.tileObjs[row][col] = null
    }

    const level = this.grid[row][col]
    const x = this.gridOffsetX + col * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2
    const y = this.gridOffsetY + row * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2

    // 빈 칸: 희미한 배경만
    if (level === null) {
      const g = this.add.graphics()
      g.fillStyle(0xF0E0C0, 0.5)
      g.fillRoundedRect(x - TILE_SIZE / 2, y - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 8)
      const container = this.add.container(0, 0, [g])
      container.setInteractive(new Phaser.Geom.Rectangle(x - TILE_SIZE / 2, y - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE), Phaser.Geom.Rectangle.Contains)
      container.on('pointerup', () => this.onTileTap(row, col))
      this.tileObjs[row][col] = container
      return
    }

    const color = TILE_COLORS[level]
    const textColor = TILE_TEXT_COLORS[level]
    const isSelected = this.selected?.row === row && this.selected?.col === col

    const g = this.add.graphics()

    // 선택 테두리 (아래에 그려야 함)
    if (isSelected) {
      g.fillStyle(0xF4A800, 1)
      g.fillRoundedRect(x - TILE_SIZE / 2 - 3, y - TILE_SIZE / 2 - 3, TILE_SIZE + 6, TILE_SIZE + 6, 10)
    }

    // 타일 배경
    g.fillStyle(color, 1)
    g.fillRoundedRect(x - TILE_SIZE / 2, y - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 8)

    // 레벨 8 특별: 빛나는 효과
    if (level === 8) {
      g.lineStyle(2, 0xF4A800, 0.8)
      g.strokeRoundedRect(x - TILE_SIZE / 2 + 2, y - TILE_SIZE / 2 + 2, TILE_SIZE - 4, TILE_SIZE - 4, 6)
    }

    const txt = this.add.text(x, y, String(level), {
      fontFamily: 'Nunito', fontSize: '22px', fontStyle: 'bold', color: textColor,
    }).setOrigin(0.5)

    const container = this.add.container(0, 0, [g, txt])
    container.setInteractive(
      new Phaser.Geom.Rectangle(x - TILE_SIZE / 2 - 3, y - TILE_SIZE / 2 - 3, TILE_SIZE + 6, TILE_SIZE + 6),
      Phaser.Geom.Rectangle.Contains
    )
    container.on('pointerup', () => this.onTileTap(row, col))
    this.tileObjs[row][col] = container
  }

  // ─── 탭 처리 ───────────────────────────────
  private onTileTap(row: number, col: number) {
    if (this.clearAchieved) return

    const level = this.grid[row][col]

    // 빈 칸 탭: 선택 해제
    if (level === null) {
      if (this.selected) {
        const prev = this.selected
        this.selected = null
        this.renderTile(prev.row, prev.col)
      }
      return
    }

    // 첫 번째 탭: 선택
    if (!this.selected) {
      this.selected = { row, col }
      this.renderTile(row, col)
      return
    }

    // 같은 타일 탭: 선택 해제
    if (this.selected.row === row && this.selected.col === col) {
      this.selected = null
      this.renderTile(row, col)
      return
    }

    const selLevel = this.grid[this.selected.row][this.selected.col]

    // 같은 레벨: 합치기
    if (selLevel === level) {
      this.mergeTiles(this.selected.row, this.selected.col, row, col)
      return
    }

    // 다른 레벨: 선택 변경
    const prev = this.selected
    this.selected = { row, col }
    this.renderTile(prev.row, prev.col)
    this.renderTile(row, col)
  }

  // ─── 머지 처리 ─────────────────────────────
  private mergeTiles(r1: number, c1: number, r2: number, c2: number) {
    const level = this.grid[r1][c1]!
    const newLevel = Math.min(level + 1, 8)

    // 첫 번째 타일 제거, 두 번째 타일 업그레이드
    this.grid[r1][c1] = null
    this.grid[r2][c2] = newLevel
    this.selected = null

    // 파티클 효과 (스파크)
    this.showMergeParticles(r2, c2)

    // 타일 렌더링 갱신
    this.renderTile(r1, c1)

    // 잠깐 딜레이 후 업그레이드 타일 표시 (애니메이션 효과)
    this.time.delayedCall(80, () => {
      this.renderTile(r2, c2)
      // 레벨 8 달성 체크
      if (newLevel === 8 && !this.clearAchieved) {
        this.time.delayedCall(400, () => this.showClearPopup())
      }
    })
  }

  // ─── 파티클 효과 ───────────────────────────
  private showMergeParticles(row: number, col: number) {
    const x = this.gridOffsetX + col * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2
    const y = this.gridOffsetY + row * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const spark = this.add.circle(x, y, 4, 0xF4A800)
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 28,
        y: y + Math.sin(angle) * 28,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 350,
        ease: 'Power2',
        onComplete: () => spark.destroy(),
      })
    }
  }

  // ─── 새 타일 추가 ──────────────────────────
  private addNewTile() {
    if (!GameState.useHeart()) {
      this.showHeartEmptyPopup()
      return
    }

    // 하트 소진 체크 (사용 후 0이 됐을 때)
    if (GameState.get().hearts === 0) {
      this.showHeartEmptyPopup()
    }

    // 빈 칸 찾기
    const empty: { row: number; col: number }[] = []
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++)
        if (this.grid[r][c] === null) empty.push({ row: r, col: c })

    if (empty.length === 0) {
      this.showToast('빈 칸이 없습니다!', 0xFF6B35)
      GameState.addHeart(1) // 환불
      return
    }

    const { row, col } = empty[Math.floor(Math.random() * empty.length)]
    this.grid[row][col] = 1
    this.renderTile(row, col)
    this.showToast('새 타일 추가! ♥ -1', 0xFF6B35)
  }

  // ─── 하단 UI ──────────────────────────────
  private createBottomUI(W: number, H: number) {
    const btnY = H - 36
    const addBtn = this.add.rectangle(W / 2, btnY, W - 32, 44, 0xFF6B35, 1)
      .setInteractive({ useHandCursor: true })
    this.add.text(W / 2, btnY, '+ 새 타일 추가  ♥ ×1', {
      fontFamily: 'Nunito', fontSize: '14px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)
    addBtn.on('pointerup', () => this.addNewTile())
  }

  // ─── 클리어 팝업 ──────────────────────────
  private showClearPopup() {
    if (this.clearAchieved) return
    this.clearAchieved = true

    GameState.addRaffle(1)
    GameState.addXp(20)
    GameState.addCoins(50)

    const W = this.scale.width
    const H = this.scale.height

    // 오버레이
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5)
    overlay.setDepth(10)

    // 팝업 카드
    const card = this.add.rectangle(W / 2, H / 2, 280, 220, 0xFFF8F0, 1)
      .setStrokeStyle(3, 0xF4A800, 1)
      .setDepth(11)

    const title = this.add.text(W / 2, H / 2 - 72, '🎉 아이템 획득!', {
      fontFamily: 'Nunito', fontSize: '20px', fontStyle: 'bold', color: '#2C1810',
    }).setOrigin(0.5).setDepth(11)

    const sub = this.add.text(W / 2, H / 2 - 38, 'MERGE Lv.8 달성', {
      fontFamily: 'Nunito', fontSize: '13px', color: '#8B6355',
    }).setOrigin(0.5).setDepth(11)

    const reward1 = this.add.text(W / 2, H / 2 - 6, '🎫 응모권 +1', {
      fontFamily: 'Nunito', fontSize: '15px', fontStyle: 'bold', color: '#FF6B35',
    }).setOrigin(0.5).setDepth(11)

    const reward2 = this.add.text(W / 2, H / 2 + 22, '⭐ XP +20   💰 코인 +50', {
      fontFamily: 'Nunito', fontSize: '13px', color: '#2C1810',
    }).setOrigin(0.5).setDepth(11)

    const homeBtn = this.add.rectangle(W / 2, H / 2 + 68, 180, 40, 0xFF6B35, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(11)
    const homeTxt = this.add.text(W / 2, H / 2 + 68, '← 홈으로', {
      fontFamily: 'Nunito', fontSize: '14px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setDepth(11)

    homeBtn.on('pointerup', () => {
      this.cameras.main.fadeOut(200, 255, 248, 240)
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('HomeScene'))
    })

    // 팝업 스케일 인 애니메이션
    card.setScale(0.7)
    title.setScale(0.7); sub.setScale(0.7)
    reward1.setScale(0.7); reward2.setScale(0.7)
    homeBtn.setScale(0.7); homeTxt.setScale(0.7)
    const targets = [card, title, sub, reward1, reward2, homeBtn, homeTxt]
    this.tweens.add({
      targets, scaleX: 1, scaleY: 1, duration: 250, ease: 'Back.easeOut',
    })
  }

  // ─── 하트 소진 팝업 (씬 입장 시 & 게임 중 소진 시 공통) ──
  private showHeartEmptyPopup() {
    const W = this.scale.width
    const H = this.scale.height

    // 씬 미초기화 상태(하트 0으로 진입)일 때 배경 깔기
    if (!this.sys.displayList.exists(this.cameras.main as unknown as Phaser.GameObjects.GameObject)) {
      this.add.rectangle(W / 2, H / 2, W, H, 0xFFF8F0)
    }

    // 전체 화면 오버레이
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
      .setDepth(10)
      .setInteractive()  // 클릭 블로킹

    // 팝업 카드 (280×320, 흰색)
    const CARD_W = 280
    const CARD_H = 320
    const cardX  = W / 2
    const cardY  = H / 2

    const cardBg = this.add.graphics().setDepth(11)
    cardBg.fillStyle(0xFFFFFF, 1)
    cardBg.fillRoundedRect(cardX - CARD_W / 2, cardY - CARD_H / 2, CARD_W, CARD_H, 16)

    // ♥ 큰 하트
    const heartTxt = this.add.text(cardX, cardY - CARD_H / 2 + 44, '♥', {
      fontSize: '48px',
      color: '#FF6B35',
    }).setOrigin(0.5).setDepth(11)

    // 제목
    const titleTxt = this.add.text(cardX, cardY - CARD_H / 2 + 104, '하트가 모두 소진됐어요', {
      fontFamily: "'Playfair Display', serif",
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#1A1A1A',
    }).setOrigin(0.5).setDepth(11)

    // 서브 텍스트
    const subTxt = this.add.text(cardX, cardY - CARD_H / 2 + 132, '30분마다 1개씩 자동 충전됩니다', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '12px',
      color: '#8B6355',
    }).setOrigin(0.5).setDepth(11)

    // 구분선
    const divider = this.add.graphics().setDepth(11)
    divider.lineStyle(1, 0xE8E0D8, 1)
    divider.lineBetween(
      cardX - CARD_W / 2 + 20, cardY - CARD_H / 2 + 156,
      cardX + CARD_W / 2 - 20, cardY - CARD_H / 2 + 156
    )

    // 충전 버튼 (코랄 배경, 전체 너비)
    const CHARGE_BTN_Y = cardY - CARD_H / 2 + 196
    const chargeBtnBg = this.add.graphics().setDepth(11)
    chargeBtnBg.fillStyle(0xFF6B35, 1)
    chargeBtnBg.fillRoundedRect(cardX - CARD_W / 2 + 20, CHARGE_BTN_Y - 22, CARD_W - 40, 44, 8)

    const chargeBtnHit = this.add.rectangle(cardX, CHARGE_BTN_Y, CARD_W - 40, 44, 0x000000, 0)
      .setDepth(11)
      .setInteractive({ useHandCursor: true })

    const chargeBtnTxt = this.add.text(cardX, CHARGE_BTN_Y, '❤️ 하트 3개 충전   ¥120', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(11)

    chargeBtnHit.on('pointerup', () => this.showToast('결제 준비 중...', 0xFF6B35))

    // "또는 30분 기다리기" 텍스트
    const orTxt = this.add.text(cardX, CHARGE_BTN_Y + 34, '또는 30분 기다리기', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '11px',
      color: '#C0B0A8',
    }).setOrigin(0.5).setDepth(11)

    // 홈으로 버튼 (테두리만, 코랄)
    const HOME_BTN_Y = cardY + CARD_H / 2 - 40
    const homeBtnBg = this.add.graphics().setDepth(11)
    homeBtnBg.lineStyle(2, 0xFF6B35, 1)
    homeBtnBg.strokeRoundedRect(cardX - CARD_W / 2 + 20, HOME_BTN_Y - 20, CARD_W - 40, 40, 8)

    const homeBtnHit = this.add.rectangle(cardX, HOME_BTN_Y, CARD_W - 40, 40, 0x000000, 0)
      .setDepth(11)
      .setInteractive({ useHandCursor: true })

    const homeBtnTxt = this.add.text(cardX, HOME_BTN_Y, '← 홈으로', {
      fontFamily: "'Nunito', sans-serif",
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FF6B35',
    }).setOrigin(0.5).setDepth(11)

    homeBtnHit.on('pointerup', () => {
      this.cameras.main.fadeOut(200, 255, 248, 240)
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('HomeScene'))
    })

    // 팝업 등장 애니메이션 (scale 0.8 → 1, Back.easeOut)
    const popupObjs = [
      cardBg, heartTxt, titleTxt, subTxt, divider,
      chargeBtnBg, chargeBtnHit, chargeBtnTxt, orTxt,
      homeBtnBg, homeBtnHit, homeBtnTxt,
    ]
    popupObjs.forEach(obj => { obj.setScale(0.8) })
    this.tweens.add({
      targets: popupObjs,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut',
    })

    // 씬 입장 시 fadeIn
    this.cameras.main.fadeIn(300, 255, 248, 240)
  }

  // ─── 토스트 ───────────────────────────────
  private showToast(msg: string, color: number) {
    const W = this.scale.width
    const H = this.scale.height
    const bg = this.add.rectangle(W / 2, H - 80, 240, 36, color, 0.9).setDepth(20)
    const txt = this.add.text(W / 2, H - 80, msg, {
      fontFamily: 'Nunito', fontSize: '13px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setDepth(20)
    this.time.delayedCall(1800, () => {
      this.tweens.add({ targets: [bg, txt], alpha: 0, duration: 300, onComplete: () => { bg.destroy(); txt.destroy() } })
    })
  }
}
