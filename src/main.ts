import Phaser from 'phaser'
import { BootScene }       from './scenes/BootScene'
import { FTUEScene }       from './scenes/FTUEScene'
import { HomeScene }       from './scenes/HomeScene'
import { MergeScene }      from './scenes/MergeScene'
import { BoxScene }        from './scenes/BoxScene'
import { TodayScene }      from './scenes/TodayScene'
import { ExploreScene }    from './scenes/ExploreScene'
import { PhotoboothScene } from './scenes/PhotoboothScene'
import { RoomScene }       from './scenes/RoomScene'
import { GameState }       from './GameState'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#FFE4F0',
  scene: [BootScene, FTUEScene, HomeScene, MergeScene, BoxScene, TodayScene, ExploreScene, PhotoboothScene, RoomScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}

const game = new Phaser.Game(config)

// Init HUD
GameState.initHUD()

// ── NavBar scene mapping ──────────────────────────────────────────────────
// 5탭: 홈 | 멤버(방) | 박스 | 상점(임시→Home) | 메뉴(임시→Today)
const SCENE_MAP: Record<string, string> = {
  HomeScene:    'HomeScene',
  MemberScene:  'RoomScene',     // 멤버 탭 → 방 꾸미기
  RoomScene:    'RoomScene',
  BoxScene:     'BoxScene',      // 박스 탭
  MergeScene:   'MergeScene',
  ShopScene:    'HomeScene',     // 상점 탭 → 임시 Home
  MenuScene:    'TodayScene',    // 메뉴 탭 → 임시 Today
  TodayScene:   'TodayScene',
  ExploreScene: 'ExploreScene',
}

// Determine starting scene
const ftueDone = localStorage.getItem('kk_ftue_done') === '1'
let activeScene = ftueDone ? 'HomeScene' : 'FTUEScene'

function switchScene(key: string) {
  if (key === activeScene) return
  activeScene = key

  // Update nav active state
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const el = btn as HTMLElement
    const target = el.dataset['scene']
    el.classList.toggle('active', target === key)
  })

  // Phaser scene switch with cream fadeOut
  const manager = game.scene
  const current = manager.getScenes(true)[0]
  if (current) {
    current.cameras.main.fadeOut(200, 255, 245, 251)   // cream: #FFF5FB
    current.cameras.main.once('camerafadeoutcomplete', () => {
      manager.stop(current.scene.key)
      manager.start(key)
    })
  } else {
    manager.start(key)
  }
}

// Nav button click wiring
// Each .nav-btn must have data-scene set to one of the SCENE_MAP keys
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const el = btn as HTMLElement
    const sceneKey = el.dataset['scene']
    if (sceneKey && SCENE_MAP[sceneKey]) {
      switchScene(SCENE_MAP[sceneKey])
    }
  })
})

// Set default active nav tab (홈 = HomeScene) when FTUE done
if (ftueDone) {
  // Prefer data-scene="HomeScene" button; fallback to first nav-btn
  const homeBtn = document.querySelector('[data-scene="HomeScene"]') as HTMLElement | null
  if (homeBtn) {
    homeBtn.classList.add('active')
  } else {
    const firstBtn = document.querySelector('.nav-btn') as HTMLElement | null
    firstBtn?.classList.add('active')
  }
}

export { game }
