import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured in .env.local' }, { status: 500 })
  }

  let imageBase64: string
  let mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

  try {
    const body = await req.json()
    imageBase64 = body.imageBase64
    mimeType = body.mimeType ?? 'image/jpeg'
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!imageBase64) {
    return Response.json({ error: 'No image provided' }, { status: 400 })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: imageBase64 },
            },
            {
              type: 'text',
              text: `Analyse this food image for thyroid health tracking. Respond ONLY with valid JSON — no markdown, no explanation, just the raw JSON object.

{
  "food": "descriptive name of the food",
  "calories_estimate": "estimated calories e.g. ~350 kcal per serving",
  "gluten_status": "one of: Gluten-free | Contains gluten | May contain gluten",
  "gluten_detail": "brief reason e.g. made with wheat flour",
  "key_ingredients": ["ingredient1", "ingredient2", "ingredient3"],
  "thyroid_notes": "1-2 sentences on thyroid relevance — goitrogens, iodine content, selenium, anti-inflammatory properties, etc.",
  "triggers": ["only include items from this exact list that apply: Gluten, Dairy, Soy, Processed sugar, Cruciferous veg, Iodine-rich, Caffeine, Alcohol"]
}`,
            },
          ],
        },
      ],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let data: Record<string, unknown>
    try {
      data = JSON.parse(cleaned)
    } catch {
      return Response.json({ error: 'Could not parse AI response', raw }, { status: 500 })
    }

    return Response.json(data)
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: 'Invalid Anthropic API key' }, { status: 401 })
    }
    if (err instanceof Anthropic.RateLimitError) {
      return Response.json({ error: 'Rate limit reached. Try again in a moment.' }, { status: 429 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
