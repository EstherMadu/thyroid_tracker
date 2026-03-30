import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    type: 'daily-reminder',
    cards: [
      'Log what you ate.',
      'Mark supplements taken.',
      'Score symptoms.',
      'Log water.',
      'Log evening movement.',
    ],
  })
}

