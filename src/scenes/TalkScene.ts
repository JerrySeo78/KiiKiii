import Phaser from 'phaser'

const POSTS = [
  { user: 'sui_love_jp',    avatar: '🌸', content: 'Suiちゃんの新しいビジュ最高すぎる😭💜 #KiiiKiii',                  likes: 482, time: '2분 전',  member: 'Sui' },
  { user: 'kya_fanart',     avatar: '🌟', content: '描いてみた🎨 Kyaのカムバックビジュ！ファンアートです #KyaFanArt',     likes: 1203, time: '15분 전', member: 'Kya' },
  { user: 'jiyu_global',    avatar: '💚', content: 'WAIKIIIKIII TOUR 트랙리스트 보고 눈물남.. Jiyu 보이스 대박이다',       likes: 337,  time: '32분 전', member: 'Jiyu' },
  { user: 'haum_official',  avatar: '🍒', content: 'Haumちゃんの自作曲「夜明け」のティザー来た！！！早く聴きたい🌅',     likes: 921,  time: '1시간 전', member: 'Haum' },
  { user: 'leesol_nightly', avatar: '🌙', content: 'Leesolの深夜ライブ最高だった🥹 ずっと続いてほしい #夜明けのKiii', likes: 654, time: '2시간 전', member: 'Leesol' },
]

export class TalkScene extends Phaser.Scene {
  constructor() { super('TalkScene') }

  create() {
    const W = this.scale.width
    const H = this.scale.height

    const bg = this.add.graphics()
    bg.fillGradientStyle(0x1A0A3D, 0x1A0A3D, 0x0D0621, 0x0D0621, 1)
    bg.fillRect(0, 0, W, H)

    this.add.text(W / 2, 24, '💬 Talk', {
      fontFamily: 'Nunito', fontSize: '20px', fontStyle: 'bold', color: '#F3F0FF',
    }).setOrigin(0.5)
    this.add.text(W / 2, 48, '팬 커뮤니티 · 실시간 피드', {
      fontFamily: 'Nunito', fontSize: '12px', color: '#C4B5FD',
    }).setOrigin(0.5)

    // Hot tag filter
    const tags = ['전체', 'Sui', 'Kya', 'Jiyu', 'Haum', 'Leesol', '팬아트']
    let tx = 16
    tags.forEach((tag, i) => {
      const tagBg = this.add.rectangle(tx + 30, 72, 56, 24, i === 0 ? 0x7C3AED : 0x1A0A3D)
        .setOrigin(0, 0.5)
        .setStrokeStyle(1, 0xA78BFA, 0.4)
      this.add.text(tx + 58, 72, tag, {
        fontFamily: 'Nunito', fontSize: '11px', fontStyle: 'bold',
        color: i === 0 ? '#ffffff' : '#C4B5FD',
      }).setOrigin(0.5)
      tx += 62
      void tagBg
    })

    // Posts
    let y = 96
    POSTS.forEach(post => {
      const cardH = 90
      const cardY = y + cardH / 2

      this.add.rectangle(W / 2, cardY, W - 32, cardH - 4, 0x1A0A3D, 0.9)
        .setStrokeStyle(1, 0xA78BFA, 0.15)
        .setInteractive({ useHandCursor: true })

      // Avatar
      this.add.text(24, cardY - 20, post.avatar, { fontSize: '22px' })
      this.add.text(50, cardY - 22, post.user, {
        fontFamily: 'Nunito', fontSize: '12px', fontStyle: 'bold', color: '#F3F0FF',
      })
      this.add.text(50, cardY - 8, post.time, {
        fontFamily: 'Nunito', fontSize: '10px', color: 'rgba(196,181,253,0.5)',
      })

      // Content (truncated)
      const maxW = W - 56
      const contentTxt = post.content.length > 40 ? post.content.slice(0, 40) + '…' : post.content
      this.add.text(24, cardY + 8, contentTxt, {
        fontFamily: 'Nunito', fontSize: '12px', color: '#E9D5FF',
        wordWrap: { width: maxW },
      })

      // Likes
      const heartTxt = this.add.text(24, cardY + 30, `❤️ ${post.likes}`, {
        fontFamily: 'Nunito', fontSize: '11px', color: '#FF4D6D',
      }).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        heartTxt.setText(`❤️ ${post.likes + 1}`)
      })
      this.add.text(84, cardY + 30, '💬 답글', {
        fontFamily: 'Nunito', fontSize: '11px', color: 'rgba(196,181,253,0.5)',
      })

      y += cardH + 4
    })

    // Write post hint
    const writeBar = this.add.rectangle(W / 2, y + 32, W - 32, 44, 0x1A0A3D)
      .setStrokeStyle(1, 0xA78BFA, 0.3)
      .setInteractive({ useHandCursor: true })
    this.add.text(28, y + 32, '✏️  KiiiKiii에 대한 생각을 공유해요...', {
      fontFamily: 'Nunito', fontSize: '13px', color: 'rgba(196,181,253,0.4)',
    }).setOrigin(0, 0.5)
    void writeBar

    this.cameras.main.fadeIn(300, 13, 6, 33)
  }
}
