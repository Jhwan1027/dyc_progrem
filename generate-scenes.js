import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env.local" });

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY가 .env.local에 없습니다.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

const OUTPUT_DIR = "images/scenes";
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const SCENES = [
  {
    file: "engineering_interior.png",
    prompt:
      "anime visual novel background art, wide horizontal scene, university classroom transformed into a beauty workshop, 2 college students doing stress relief activities: one student energetically cutting hair with scissors in a dynamic snipping pose, another student dramatically throwing a mannequin head into the air with both hands raised, wig display mannequin heads that have only a smooth human-shaped face form with no facial features at all — completely blank smooth surface with no eyes no nose no mouth, just the shape of a human head, marker doodle scribbles drawn on the smooth surface of the mannequin heads, colorful wigs, scissors and beauty tools on tables, snack boxes visible, pastel pink warm decorations, warm soft lighting, soft pastel colors, no text",
  },
  {
    file: "humanities_interior.png",
    prompt:
      "anime visual novel background art, ultra-wide establishing shot, full room visible, zoomed out, university classroom set up as a craft workshop, 2 small happy college students in the distance sitting at tables making handmade crafts, colorful craft supplies visible, resin keycaps and squishy toys on shelves, pastel mint and lavender color scheme, characters appear small within the wide room, soft pastel colors, no text",
  },
  {
    file: "fountain_interior.png",
    prompt:
      "anime visual novel background art, ultra-wide establishing shot, full scene visible, zoomed out, peaceful Korean university campus outdoor fountain area, 2 small college students relaxing on colorful picnic mats on green grass far from viewer, circular stone fountain with sparkling water in background, lush trees framing sides, soft blue sky, characters appear small in the wide landscape, soft pastel colors, no text",
  },
  {
    file: "hall_interior.png",
    prompt:
      "anime visual novel background art, ultra-wide establishing shot, full room visible, zoomed out, cozy university room converted into a mini cinema, 2 small college students sitting on floor cushions watching a large projection screen, one holding popcorn, warm dim lighting with string fairy lights, movie posters on walls, characters appear small within the wide room, soft pastel warm tones, no text",
  },
];

let success = 0;
let failed = 0;

for (const scene of SCENES) {
  try {
    process.stdout.write(`⏳ ${scene.file} 생성 중...`);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: scene.prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    });

    const parts = result.response.candidates[0].content.parts;
    const imagePart = parts.find((p) => p.inlineData);

    if (!imagePart) {
      console.log(` ❌ 이미지 데이터 없음`);
      failed++;
      continue;
    }

    const outputPath = path.join(OUTPUT_DIR, scene.file);
    fs.writeFileSync(outputPath, Buffer.from(imagePart.inlineData.data, "base64"));
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
