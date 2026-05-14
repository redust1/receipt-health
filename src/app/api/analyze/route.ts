import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  ...(process.env.ANTHROPIC_BASE_URL && { baseURL: process.env.ANTHROPIC_BASE_URL }),
});

const SYSTEM_PROMPT = `あなたは日本のスーパー・コンビニのレシートを分析する健康アドバイザーAIです。
レシートの画像から購入商品を読み取り、以下のJSON形式で返答してください。

{
  "healthScore": 0〜100の整数（食品・飲料の健康度を総合評価）,
  "summary": "全体的な健康評価の一言コメント（日本語、30文字以内）",
  "items": [
    {
      "name": "商品名",
      "category": "食品" | "飲料" | "日用品",
      "warning": "green" | "yellow" | "red",
      "reason": "健康上の注意点（日本語、食品・飲料のみ、日用品は空文字）",
      "ingredients": ["注目成分1", "注目成分2"] // 食品・飲料のみ、最大4つ
    }
  ]
}

warningの基準:
- green: 健康的（野菜、果物、低糖質、自然食品など）
- yellow: 適量なら問題なし（炭水化物多め、塩分やや高いなど）
- red: 過剰摂取に注意（高糖質、高脂質、添加物多いなど）

JSONのみ返答し、他のテキストは不要です。`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mediaType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: "このレシートを分析してください。",
          },
        ],
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  const result = JSON.parse(jsonMatch[0]);
  return NextResponse.json(result);
}
