import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CHARS_DIR = join(__dirname, '../assets/characters')

const MAPPING = [
  { src: 'char_haeum.png',  out: 'haum.png'   },
  { src: 'char_jiyu.png',   out: 'jiyu.png'   },
  { src: 'char_jiwoo.png',  out: 'kya.png'    },
  { src: 'char_subin.png',  out: 'sui.png'    },
  { src: 'char_sumin.png',  out: 'leesol.png' },
]

// 흰색/근사 흰색 픽셀을 투명으로 변환
// threshold: 이 값 이상이면 배경으로 간주 (0~255)
const THRESHOLD = 240
const TOLERANCE = 20  // 흰색에서의 허용 편차

async function removeBg(srcPath, outPath) {
  const img = sharp(srcPath)
  const { width, height } = await img.metadata()

  // RGBA raw 픽셀 버퍼로 변환
  const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  const buf = Buffer.from(data)

  // 플러드필 방식 대신 코너 기준 배경색 샘플링 후 유사 픽셀 제거
  // 코너 4픽셀의 평균 색상을 배경으로 간주
  function getPixel(x, y) {
    const idx = (y * width + x) * 4
    return { r: buf[idx], g: buf[idx+1], b: buf[idx+2], a: buf[idx+3] }
  }

  // 배경색 = 흰색 기준 (코너 샘플링)
  const corners = [
    getPixel(0, 0), getPixel(width-1, 0),
    getPixel(0, height-1), getPixel(width-1, height-1)
  ]
  const bgR = Math.round(corners.reduce((s,c) => s+c.r, 0) / 4)
  const bgG = Math.round(corners.reduce((s,c) => s+c.g, 0) / 4)
  const bgB = Math.round(corners.reduce((s,c) => s+c.b, 0) / 4)

  console.log(`  배경색 샘플: rgb(${bgR},${bgG},${bgB})`)

  // 배경과 유사한 픽셀 투명화 (플러드필 대신 전체 스캔 + 경계 보정)
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4
    const r = buf[idx], g = buf[idx+1], b = buf[idx+2]

    const dr = Math.abs(r - bgR)
    const dg = Math.abs(g - bgG)
    const db = Math.abs(b - bgB)

    // 배경색과 가깝고 전체적으로 밝은 픽셀
    if (dr < TOLERANCE && dg < TOLERANCE && db < TOLERANCE &&
        r > THRESHOLD && g > THRESHOLD && b > THRESHOLD) {
      buf[idx+3] = 0  // 투명
    }
  }

  // 발 아래 그림자 (회색 원) 도 제거
  // 밝은 회색 영역 처리
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4
    const r = buf[idx], g = buf[idx+1], b = buf[idx+2], a = buf[idx+3]
    if (a === 0) continue

    // 밝은 회색 (그림자): r≈g≈b, 모두 200 이상
    const isGray = Math.abs(r-g) < 15 && Math.abs(g-b) < 15 && Math.abs(r-b) < 15
    if (isGray && r > 200) {
      // 알파를 그라디언트로 줄임 (부드럽게)
      const brightness = (r + g + b) / 3
      const alpha = Math.round((1 - (brightness - 200) / 55) * 255)
      buf[idx+3] = Math.max(0, Math.min(255, alpha))
    }
  }

  // 사이즈 조절: 세로 600px 기준 (화면에서 충분히 크게)
  const targetH = 600
  const targetW = Math.round(width * (targetH / height))

  await sharp(buf, { raw: { width, height, channels: 4 } })
    .resize(targetW, targetH, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } })
    .png()
    .toFile(outPath)

  console.log(`  → ${targetW}×${targetH} 저장 완료`)
}

async function main() {
  for (const { src, out } of MAPPING) {
    const srcPath = join(CHARS_DIR, src)
    const outPath = join(CHARS_DIR, out)
    console.log(`처리 중: ${src} → ${out}`)
    try {
      await removeBg(srcPath, outPath)
    } catch (e) {
      console.error(`  오류: ${e.message}`)
    }
  }
  console.log('\n✅ 완료')
}

main()
