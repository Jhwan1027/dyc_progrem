import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import sharp from "sharp";

dotenv.config({ path: ".env.local" });

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY가 .env.local에 없습니다.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

const OUTPUT_DIR = "images/objects";
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// 흰 배경 제거 (모서리에서 플러드필로 연결된 밝은 픽셀 투명화)
async function removeBackground(inputBuffer) {
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const visited = new Uint8Array(width * height);
  const queue = [0, width - 1, width * (height - 1), width * height - 1];

  while (queue.length > 0) {
    const idx = queue.pop();
    if (visited[idx]) continue;
    visited[idx] = 1;

    const p = idx * channels;
    const r = data[p], g = data[p + 1], b = data[p + 2];

    if (r > 210 && g > 210 && b > 210) {
      data[p + 3] = 0;
      const x = idx % width, y = Math.floor(idx / width);
      if (x > 0)        queue.push(idx - 1);
      if (x < width - 1) queue.push(idx + 1);
      if (y > 0)        queue.push(idx - width);
      if (y < height - 1) queue.push(idx + width);
    }
  }

  return sharp(Buffer.from(data), { raw: { width, height, channels } })
    .png()
    .toBuffer();
}

const CHARACTERS = [
  // 의공학관
  {
    file: "char_beauty_style.png",
    prompt:
      "cute pastel anime cartoon illustration of a cheerful female college student sitting at a desk styling a wig on a mannequin head, scissors on desk, white background, full body visible, soft pastel colors, no text",
  },
  {
    file: "char_beauty_cut.png",
    prompt:
      "cute pastel anime cartoon illustration of a smiling college student holding scissors and laughing, white background, full body visible, soft pastel colors, no text",
  },
  // 인문학관
  {
    file: "char_craft_make.png",
    prompt:
      "cute pastel anime cartoon illustration of a college student sitting at a craft table carefully shaping a small squishy toy with their hands, colorful craft supplies around, white background, full body visible, soft pastel colors, no text",
  },
  {
    file: "char_craft_keycap.png",
    prompt:
      "cute pastel anime cartoon illustration of a college student holding up a small colorful resin keycap they just made, delighted expression, white background, full body visible, soft pastel colors, no text",
  },
  // 건양회관
  {
    file: "char_movie.png",
    prompt:
      "cute pastel anime cartoon illustration of a college student sitting in a chair holding a popcorn bucket, watching something with an excited happy expression, white background, full body visible, soft pastel colors, no text",
  },
];

let success = 0;
let failed = 0;

for (const char of CHARACTERS) {
  try {
    process.stdout.write(`⏳ ${char.file} 생성 중...`);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: char.prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    });

    const parts = result.response.candidates[0].content.parts;
    const imagePart = parts.find((p) => p.inlineData);

    if (!imagePart) {
      console.log(` ❌ 이미지 데이터 없음`);
      failed++;
      continue;
    }

    const rawBuffer = Buffer.from(imagePart.inlineData.data, "base64");
    const cleanBuffer = await removeBackground(rawBuffer);

    const outputPath = path.join(OUTPUT_DIR, char.file);
    fs.writeFileSync(outputPath, cleanBuffer);
    console.log(` ✅ 완료`);
    success++;

    await new Promise((r) => setTimeout(r, 1500));
  } catch (err) {
    console.log(` ❌ 오류: ${err.message}`);
    failed++;
  }
}

console.log(`\n📊 결과: ${success}개 성공 / ${failed}개 실패`);
console.log(`📁 저장 위치: ${OUTPUT_DIR}/`);
