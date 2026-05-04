/**
 * generate-ftue-cards.mjs
 * tour.png 레퍼런스로 캐릭터별 카드 프레임 생성 → 마젠타 알파 제거
 * 출력: assets/bg/ftue_card_{id}.png
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

// tour.png 크기: 941×1672
// 카드 5개가 y≈430~y≈1060 구간에 위치
// 각 카드 폭 ≈ 160px, 높이 ≈ 380px
const TOUR_CROP = {
  left: 20, top: 400, width: 175, height: 680   // 키아 카드 (프레임 명확히 보임)
}

const CARDS = [
  { id: 'kya',    name: '키아',  color: 'soft lavender purple', hex: '#C4AAFF', border: '#9B6DD9' },
  { id: 'jiyu',   name: '지유',  color: 'warm peach pink',      hex: '#FFD4B8', border: '#FF9E6B' },
  { id: 'sui',    name: '수이',  color: 'pure white cream',     hex: '#FFFFFF', border: '#FF6B9D' },
  { id: 'haum',   name: '하음',  color: 'soft rose pink',       hex: '#FFB8C8', border: '#E8478A' },
  { id: 'leesol', name: '이솔',  color: 'light mint lavender',  hex: '#C8D8FF', border: '#7B8FD9' },
]

async function removeMagenta(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const pixels = new Uint8ClampedArray(data)
  const { width, height } = info

  // 코너 샘플로 배경색 확인
  const corners = [[2,2],[width-3,2],[2,height-3],[width-3,height-3]]
  const [BR, BG, BB] = corners.reduce(([ar,ag,ab],[x,y]) => {
    const i = (y*width+x)*4
    return [ar+pixels[i]/4, ag+pixels[i+1]/4, ab+pixels[i+2]/4]
  }, [0,0,0])
  console.log(`   배경 샘플 rgb(${Math.round(BR)},${Math.round(BG)},${Math.round(BB)})`)

  let removed = 0
  for (let i = 0; i < width*height; i++) {
    const r=pixels[i*4], g=pixels[i*4+1], b=pixels[i*4+2]
    const dist = Math.sqrt((r-BR)**2+(g-BG)**2+(b-BB)**2)
    if (dist < 60) { pixels[i*4+3] = 0; removed++ }
  }
  console.log(`   제거: ${(removed/width/height*100).toFixed(1)}%`)
  await sharp(Buffer.from(pixels),{raw:{width,height,channels:4}}).png().toFile(outputPath)
}

async function generateCard(refBase64, card) {
  const outDir = path.join(ROOT, 'assets', 'bg')
  fs.mkdirSync(outDir, { recursive: true })

  const rawPath   = path.join(outDir, `ftue_card_${card.id}_raw.png`)
  const alphaPath = path.join(outDir, `ftue_card_${card.id}.png`)

  const prompt = `This is a character selection card frame from a K-pop mobile game.

Redraw ONLY the card frame (NO character inside) on a solid magenta #FF00FF background:
- Tall portrait card shape with soft rounded corners (radius ~16px)
- Card background color: ${card.color} (${card.hex}) — light, soft gradient from top to bottom
- Border: 2px colored border in ${card.border}, with a soft inner glow
- Small decorative sparkle/star icons (★ ☆) in corners or edges of the card
- Small circular stage/platform at the bottom center of the card (where character would stand)
- The platform is a soft circle with subtle shadow, color matching the border ${card.border}
- Card is centered and fills ~80% of the image
- Solid magenta #FF00FF background — completely uniform, NO other elements outside the card

Do NOT include any character, text, or UI elements inside the card.`

  console.log(`\n🃏 ${card.name} 카드 생성 중...`)

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ parts: [
      { inlineData: { mimeType: 'image/png', data: refBase64 } },
      { text: prompt }
    ]}],
    config: { responseModalities: ['image', 'text'] }
  })

  const parts = response.candidates?.[0]?.content?.parts ?? []
  const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'))
  if (!imgPart) {
    console.warn('   ⚠ 이미지 응답 없음:', parts.map(p=>p.text?.slice(0,80)))
    return
  }

  fs.writeFileSync(rawPath, Buffer.from(imgPart.inlineData.data, 'base64'))
  console.log(`   raw 저장: ftue_card_${card.id}_raw.png`)

  await removeMagenta(rawPath, alphaPath)
  console.log(`   alpha 저장: ftue_card_${card.id}.png`)
}

async function run() {
  // 레퍼런스 카드 크롭 (수이 카드 중앙)
  const tourPath = path.join(ROOT, 'keyscreen', 'tour.png')
  const cropPath = path.join(ROOT, 'assets', 'bg', 'ftue_card_ref_crop.png')

  console.log('✂ 레퍼런스 카드 크롭...')
  await sharp(tourPath)
    .extract({ left: TOUR_CROP.left, top: TOUR_CROP.top, width: TOUR_CROP.width, height: TOUR_CROP.height })
    .toFile(cropPath)
  console.log(`   저장: ftue_card_ref_crop.png`)

  const refBase64 = fs.readFileSync(cropPath).toString('base64')

  for (const card of CARDS) {
    await generateCard(refBase64, card)
    // API 레이트 리밋 방지
    await new Promise(r => setTimeout(r, 1500))
  }

  console.log('\n✅ 완료 — assets/bg/ftue_card_{id}.png')
}

run().catch(e => { console.error('💥', e.message); process.exit(1) })
