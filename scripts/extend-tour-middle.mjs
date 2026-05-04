/**
 * extend-tour-middle.mjs
 * tour.png y=1110 지점에서 분리 → 배경 픽셀 색상 샘플링으로 그라데이션 브릿지 삽입
 * Gemini 없이 sharp만 사용
 *
 * 결과: 941×2036 (9:19.5)
 */
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const ORIG_W  = 941
const ORIG_H  = 1672
const SPLIT_Y = 1110   // 카드 트레잇 별★ 아래, 버튼 위
const MID_H   = 364    // 삽입 높이 (display gap 151px × 941/390)
const BOT_H   = ORIG_H - SPLIT_Y  // 562

async function sampleRowColor(imgPath, y) {
  // 이미지의 y행에서 배경색 샘플 (좌우 끝 픽셀 평균)
  const { data, info } = await sharp(imgPath)
    .extract({ left: 0, top: y, width: ORIG_W, height: 1 })
    .raw().toBuffer({ resolveWithObject: true })
  const px = new Uint8ClampedArray(data)
  const samples = [0, 40, ORIG_W - 41, ORIG_W - 1].map(x => ({
    r: px[x * 3], g: px[x * 3 + 1], b: px[x * 3 + 2]
  }))
  const avg = samples.reduce((a, c) => ({ r: a.r + c.r / 4, g: a.g + c.g / 4, b: a.b + c.b / 4 }), { r: 0, g: 0, b: 0 })
  return { r: Math.round(avg.r), g: Math.round(avg.g), b: Math.round(avg.b) }
}

async function makeGradientStrip(colorTop, colorBot, width, height, outPath) {
  // 세로 그라데이션 PNG 생성 (row by row)
  const channels = 3
  const buf = Buffer.alloc(width * height * channels)
  for (let y = 0; y < height; y++) {
    const t = y / (height - 1)
    const r = Math.round(colorTop.r + (colorBot.r - colorTop.r) * t)
    const g = Math.round(colorTop.g + (colorBot.g - colorTop.g) * t)
    const b = Math.round(colorTop.b + (colorBot.b - colorTop.b) * t)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b
    }
  }
  await sharp(buf, { raw: { width, height, channels } }).png().toFile(outPath)
}

async function run() {
  const tourPath  = path.join(ROOT, 'keyscreen', 'tour.png')
  const outDir    = path.join(ROOT, 'assets', 'bg')
  fs.mkdirSync(outDir, { recursive: true })

  const topPath   = path.join(outDir, 'tour_top.png')
  const botPath   = path.join(outDir, 'tour_bot.png')
  const midPath   = path.join(outDir, 'tour_mid.png')
  const finalPath = path.join(outDir, 'tour_extended.png')

  // 1. 상하단 분리
  console.log('✂ 상하단 분리...')
  await sharp(tourPath).extract({ left: 0, top: 0,       width: ORIG_W, height: SPLIT_Y }).toFile(topPath)
  await sharp(tourPath).extract({ left: 0, top: SPLIT_Y, width: ORIG_W, height: BOT_H   }).toFile(botPath)

  // 2. 분리 지점 색상 샘플링
  // top의 마지막 5행 평균 → 그라데이션 시작색
  // bottom의 첫 5행 평균 → 그라데이션 끝색
  console.log('🎨 경계 색상 샘플링...')
  const colorTop = await sampleRowColor(tourPath, SPLIT_Y - 3)
  const colorBot = await sampleRowColor(tourPath, SPLIT_Y + 3)
  console.log(`   top: rgb(${colorTop.r},${colorTop.g},${colorTop.b})`)
  console.log(`   bot: rgb(${colorBot.r},${colorBot.g},${colorBot.b})`)

  // 3. 그라데이션 브릿지 생성
  console.log('\n🔧 그라데이션 브릿지 생성...')
  await makeGradientStrip(colorTop, colorBot, ORIG_W, MID_H, midPath)

  // 4. 합성
  console.log('🔧 합성 중...')
  const totalH = SPLIT_Y + MID_H + BOT_H
  await sharp({
    create: { width: ORIG_W, height: totalH, channels: 3, background: colorBot }
  })
  .composite([
    { input: topPath, top: 0,               left: 0 },
    { input: midPath, top: SPLIT_Y,         left: 0 },
    { input: botPath, top: SPLIT_Y + MID_H, left: 0 },
  ])
  .png()
  .toFile(finalPath)

  const meta = await sharp(finalPath).metadata()
  console.log(`\n✅ tour_extended.png — ${meta.width}×${meta.height}`)
}

run().catch(e => { console.error('💥', e.message); process.exit(1) })
