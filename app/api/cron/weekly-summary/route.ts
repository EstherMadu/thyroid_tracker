import { NextResponse } from 'next/server'

export async function GET() {
  const now = new Date().toISOString()
  return NextResponse.json({
    ok: true,
    generated_at: now,
    type: 'weekly-summary',
    message: 'Weekly summary cron executed. Connect your email provider to send personal summaries.',
  })
}

