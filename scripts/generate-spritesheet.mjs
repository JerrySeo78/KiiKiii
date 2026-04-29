/**
 * 캐릭터 스프라이트시트 생성기
 * 단일 PNG → 6프레임 스프라이트시트 (가로 배열)
 *
 * 프레임 구성:
 *   0: 기본
 *   1: 위로 4px (float up)
 *   2: 위로 8px (float peak)
 *   3: 위로 4px (float down)
 *   4: 오른쪽 1.5도 회전 (lean right)
 *   5: 왼쪽 1.5도 회전 (lean left)
 */

import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CHARS_DIR = join(__dirname, '../assets/characters')
const OUT_DIR   = join(__dirname, '../assets/spritesheets')

const MEMBERS = ['sui', 'kya', 'jiyu', 'haum', 'leesol']

const FRAME_W = 391
const FRAME_H = 600
const FRAMES  = 6
const SHEET_W = FRAME_W * FRAMES

// 단일 프레임 버퍼 생성 (위치 오프셋 + 회전)
async function makeFrame(srcBuf, srcMeta, offsetY = 0, rotateDeg = 0) {
  const { width: W, height: H } = srcMeta

  let img = sharp(srcBuf, { raw: { width: W, height: H, channels: 4 } })

  let charBuf
  if (rotateDeg !== 0) {
    const rotated = await img.png().toBuffer()
    // 회전 후 FRAME 크기 내로 맞게 리사이즈 (비율 유지)
    charBuf = await sharp(rotated)
      .rotate(rotateDeg, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .resize(FRAME_W, FRAME_H, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
  } else {
    charBuf = await img.png().toBuffer()
  }

  // 캔버스 크기(FRAME_W × FRAME_H)에 맞게 배치
  const canvas = sharp({
    create: {
      width: FRAME_W,
      height: FRAME_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })

  const charMeta = await sharp(charBuf).metadata()
  const cW = charMeta.width
  const cH = charMeta.height

  const left = Math.round((FRAME_W - cW) / 2)
  const top  = Math.round((FRAME_H - cH) / 2) + offsetY

  return canvas.composite([{ input: charBuf, left, top }]).png().toBuffer()
}

async function generateSpritesheet(member) {
  const srcPath = join(CHARS_DIR, `${member}.png`)

  const srcBuf  = await sharp(srcPath).ensureAlpha().raw().toBuffer()
  const srcMeta = await sharp(srcPath).metadata()

  console.log(`  프레임 생성 중...`)

  const frames = await Promise.all([
    makeFrame(srcBuf, srcMeta,  0,    0),   // 0: 기본
    makeFrame(srcBuf, srcMeta, -4,    0),   // 1: float up
    makeFrame(srcBuf, srcMeta, -8,    0),   // 2: float peak
    makeFrame(srcBuf, srcMeta, -4,    0),   // 3: float down
    makeFrame(srcBuf, srcMeta,  0,  1.5),   // 4: lean right
    makeFrame(srcBuf, srcMeta,  0, -1.5),   // 5: lean left
  ])

  // 가로로 이어붙이기
  const composites = frames.map((buf, i) => ({ input: buf, left: i * FRAME_W, top: 0 }))

  const outPath = join(OUT_DIR, `${member}-sheet.png`)
  await sharp({
    create: {
      width:    SHEET_W,
      height:   FRAME_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png({ compressionLevel: 7 })
    .toFile(outPath)

  console.log(`  → ${SHEET_W}×${FRAME_H} (${FRAMES}프레임) 저장`)
  return outPath
}

// spritesheets 폴더 생성
import { mkdirSync } from 'fs'
mkdirSync(OUT_DIR, { recursive: true })

console.log(`스프라이트시트 생성 시작 (${FRAME_W}×${FRAME_H} × ${FRAMES}프레임)\n`)
for (const member of MEMBERS) {
  console.log(`[${member}]`)
  await generateSpritesheet(member)
}
console.log('\n✅ 완료 →', OUT_DIR)
