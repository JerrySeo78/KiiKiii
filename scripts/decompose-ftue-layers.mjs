/**
 * decompose-ftue-layers.mjs
 * tour.png(941×1672)를 4개 레이어로 분해
 *
 * Layer 1: ftue_bg.png         — Gemini로 9:19.5 배경 재생성
 * Layer 2: ftue_logo.png       — 로고 크롭 (y=30~200)
 * Layer 3: ftue_panel.png      — 멤버 선택 패널 크롭 (y=220~1130)
 * Layer 4a: ftue_btn_start.png — 여행 시작하기 버튼 크롭 (y=1260~1390)
 * Layer 4b: ftue_btn_random.png— 랜덤 선택 버튼 크롭 (y=1400~1530)
 */
import { GoogleGenAI } from '@google/genai'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const envPath = path.join(ROOT, '.env.local')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim()
  })
}

const MODEL = 'gemini-2.5-flash-image'
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })

const TOUR  = path.join(ROOT, 'keyscreen', 'tour.png')
const OUT   = path.join(ROOT, 'assets', 'bg')
fs.mkdirSync(OUT, { recursive: true })

const W = 941, H = 1672

// ── 크롭 영역 정의 ──────────────────────────────────────────────
const REGIONS = {
  logo:       { left: 0, top: 30,   width: W, height: 180 },  // 로고 타이틀
  panel:      { left: 0, top: 220,  width: W, height: 910 },  // 카드 패널 (y=220~1130)
  btn_start:  { left: 60, top: 1260, width: 820, height: 140 }, // 여행 시작하기
  btn_random: { left: 200, top: 1410, width: 540, height: 120 }, // 랜덤 선택
}

async function cropLayer(name, region) {
  const out = path.join(OUT, `ftue_${name}.png`)
  await sharp(TOUR).extract(region).png().toFile(out)
  const m = await sharp(out).metadata()
  console.log(`✂ ftue_${name}.png — ${m.width}×${m.height}`)
  return out
}

async function generateBg() {
  console.log('\n🎨 Gemini 배경 재생성 중...')

  // 레퍼런스: tour.png 전체를 배경 참고용으로 제공
  const refBase64 = fs.readFileSync(TOUR).toString('base64')

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ parts: [
      { inlineData: { mimeType: 'image/png', data: refBase64 } },
      { text: `This is a K-pop mobile game screen (WAIKIIIIKIII TOUR) with a resort/travel flat-lay style.

Regenerate ONLY the background of this image:
- Same flat-lay bird's-eye view of a resort/travel scene
- Same pink/coral/beige/cream color palette
- Scattered props: plumeria flowers, starfish, tropical leaves, postcards, small decorative items
- Same warm soft illustration style, pastel watercolor feel
- IMPORTANT: NO text, NO UI elements, NO cards, NO buttons — pure background only
- Output should be a tall portrait image (9:19.5 ratio, like 390×844 or similar)
- The scene should have visual breathing room top and bottom for UI overlay

Generate the full background scene for this mobile game screen.` }
    ]}],
    config: { responseModalities: ['image', 'text'] }
  })

  const parts = response.candidates?.[0]?.content?.parts ?? []
  const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'))
  if (!imgPart) throw new Error('이미지 응답 없음: ' + JSON.stringify(parts.map(p => p.text?.slice(0, 80))))

  const rawPath = path.join(OUT, 'ftue_bg_raw.png')
  fs.writeFileSync(rawPath, Buffer.from(imgPart.inlineData.data, 'base64'))
  const rawMeta = await sharp(rawPath).metadata()
  console.log(`   raw: ${rawMeta.width}×${rawMeta.height}`)

  // 9:19.5 비율로 크롭/리사이즈 (390×844 기준)
  const TARGET_W = 390, TARGET_H = 844
  const outPath = path.join(OUT, 'ftue_bg.png')
  await sharp(rawPath)
    .resize(TARGET_W, TARGET_H, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(outPath)

  const m = await sharp(outPath).metadata()
  console.log(`✅ ftue_bg.png — ${m.width}×${m.height}`)
  return outPath
}

async function run() {
  console.log('=== FTUE 4레이어 분해 ===\n')

  // Layer 2: 로고
  await cropLayer('logo', REGIONS.logo)

  // Layer 3: 멤버 선택 패널
  await cropLayer('panel', REGIONS.panel)

  // Layer 4a: 여행 시작하기 버튼
  await cropLayer('btn_start', REGIONS.btn_start)

  // Layer 4b: 랜덤 선택 버튼
  await cropLayer('btn_random', REGIONS.btn_random)

  // Layer 1: 배경 재생성 (Gemini)
  await generateBg()

  console.log('\n=== 완료 ===')
  console.log('생성된 파일:')
  console.log('  assets/bg/ftue_bg.png      — 배경 (9:19.5)')
  console.log('  assets/bg/ftue_logo.png    — 로고')
  console.log('  assets/bg/ftue_panel.png   — 멤버 선택 패널')
  console.log('  assets/bg/ftue_btn_start.png  — 버튼1')
  console.log('  assets/bg/ftue_btn_random.png — 버튼2')
}

run().catch(e => { console.error('💥', e.message); process.exit(1) })
