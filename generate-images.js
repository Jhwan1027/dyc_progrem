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
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-image",
});

const OUTPUT_DIR = "images/objects";
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const OBJECTS = [
  // 의공학관
  {
    file: "hair.png",
    prompt: "cute pastel cartoon hair piece / wig, isolated on transparent background, soft pink and brown colors, no text",
  },
  {
    file: "scissors.png",
    prompt: "cute pastel cartoon scissors, isolated on transparent background, pastel colors, no text",
  },
  {
    file: "face_board.png",
    prompt: "cute cartoon picture frame with a funny smiley face drawn on it with marker, pastel colors, transparent background, no text",
  },
  {
    file: "snack_box.png",
    prompt: "cute pastel cartoon snack box overflowing with candy and chips, transparent background, no text",
  },

  // 인문학관
  {
    file: "craft_box.png",
    prompt: "cute pastel cartoon open craft supply box with colorful paper, glue, and scissors inside, transparent background, no text",
  },
  {
    file: "squishy.png",
    prompt: "cute pastel cartoon squishy stress ball toy, soft round fluffy shape, pastel mint and pink colors, transparent background, no text",
  },
  {
    file: "keycap.png",
    prompt: "cute pastel cartoon keyboard keycap made of resin, colorful swirl pattern inside, transparent background, no text",
  },
  {
    file: "waxball.png",
    prompt: "cute pastel cartoon soft squishy ball with small colorful wax balls visible through translucent shell, transparent background, no text",
  },
  {
    file: "poster.png",
    prompt: "cute pastel cartoon notice board poster with decorative border, blank content area, soft colors, transparent background, no text",
  },

  // 분수대
  {
    file: "fountain_obj.png",
    prompt: "cute cartoon decorative water fountain with sparkling water droplets, pastel blue and white, transparent background, no text",
  },
  {
    file: "mat_meditate.png",
    prompt: "cute pastel cartoon illustration of a college student sitting cross-legged on a colorful picnic mat on grass, eyes closed, peaceful meditation pose, soft colors, transparent background, no text",
  },
  {
    file: "mat_zone_out.png",
    prompt: "cute pastel cartoon illustration of a college student lying relaxed on a colorful picnic mat on grass, looking up at the sky with a dreamy expression, soft colors, transparent background, no text",
  },

  // 건양회관
  {
    file: "poster_insideout2.png",
    prompt: "cute cartoon movie poster illustration for an animated film about colorful emotion characters, joy character in yellow and anxiety in purple, pastel colors, poster frame design, transparent background, no text",
  },
  {
    file: "poster_veteran2.png",
    prompt: "cute cartoon movie poster illustration for a Korean action crime thriller, detective in action pose, dynamic composition, pastel colors, poster frame design, transparent background, no text",
  },
  {
    file: "popcorn.png",
    prompt: "cute cartoon popcorn bucket with popcorn overflowing, red and white striped bucket, pastel yellow popcorn, transparent background, no text",
  },
  {
    file: "schedule_board.png",
    prompt: "cute pastel cartoon cinema schedule board frame, decorative film reel border, title banner at top, two clearly empty blank white rectangular slots in the center for text, NO text or writing inside the empty slots, soft pastel colors, illustration style, transparent background",
  },
];

let success = 0;
let failed = 0;

for (const obj of OBJECTS) {
  try {
    process.stdout.write(`⏳ ${obj.file} 생성 중...`);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: obj.prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    });

    const parts = result.response.candidates[0].content.parts;
    const imagePart = parts.find((p) => p.inlineData);

    if (!imagePart) {
      console.log(` ❌ 이미지 데이터 없음`);
      failed++;
      continue;
    }

    const outputPath = path.join(OUTPUT_DIR, obj.file);
    fs.writeFileSync(outputPath, Buffer.from(imagePart.inlineData.data, "base64"));
    console.log(` ✅ 완료`);
    success++;

    // API 과부하 방지를 위한 짧은 대기
    await new Promise((r) => setTimeout(r, 1000));
  } catch (err) {
    console.log(` ❌ 오류: ${err.message}`);
    failed++;
  }
}

console.log(`\n📊 결과: ${success}개 성공 / ${failed}개 실패`);
console.log(`📁 저장 위치: ${OUTPUT_DIR}/`);
