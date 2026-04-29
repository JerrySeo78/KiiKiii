import Phaser from 'phaser'
import { BootScene }       from './scenes/BootScene'
import { FTUEScene }       from './scenes/FTUEScene'
import { HomeScene }       from './scenes/HomeScene'
import { MergeScene }      from './scenes/MergeScene'
import { TodayScene }      from './scenes/TodayScene'
import { ExploreScene }    from './scenes/ExploreScene'
import { PhotoboothScene } from './scenes/PhotoboothScene'
import { RoomScene }       from './scenes/RoomScene'
import { GameState }       from './GameState'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#FFF8F0',
  scene: [BootScene, FTUEScene, HomeScene, MergeScene, TodayScene, ExploreScene, PhotoboothScene, RoomScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}

const game = new Phaser.Game(config)

// Init HUD
GameState.initHUD()

// NavBar wiring
const SCENE_MAP: Record<string, string> = {
  HomeScene:    'HomeScene',
  TodayScene:   'TodayScene',
  MergeScene:   'MergeScene',
  ExploreScene: 'ExploreScene',
  RoomScene:    'RoomScene',
}

// Determine starting scene: FTUE or Home
const ftueДone = localStorage.getItem('kk_ftue_done') === '1'
let activeScene = ftueДone ? 'HomeScene' : 'FTUEScene'

function switchScene(key: string) {
  if (key === activeScene) return
  activeScene = key

  // Update nav active state
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const el = btn as HTMLElement
    const target = el.dataset['scene']
    el.classList.toggle('active', target === key)
  })

  // Phaser scene switch
  const manager = game.scene
  const current = manager.getScenes(true)[0]
  if (current) {
    current.cameras.main.fadeOut(200, 255, 248, 240)
    current.cameras.main.once('camerafadeoutcomplete', () => {
      manager.stop(current.scene.key)
      manager.start(key)
    })
  } else {
    manager.start(key)
  }
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const el = btn as HTMLElement
    const scene = el.dataset['scene']
    if (scene && SCENE_MAP[scene]) switchScene(scene)
  })
})

// Set default active nav (HomeScene button) when FTUE is done
if (ftueДone) {
  document.querySelector('[data-scene="HomeScene"]')?.classList.add('active')
}

export { game }
