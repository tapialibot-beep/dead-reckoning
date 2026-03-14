/**
 * POST /api/sessions
 * Persists a completed GameSessionRecord to Vercel KV.
 *
 * KV structure:
 *   session:{id}                          → GameSessionRecord (full record)
 *   scenario:{scenarioId}:session_ids     → string[] (index for teacher classroom view)
 *
 * Requires env vars: KV_REST_API_URL, KV_REST_API_TOKEN (set in Vercel dashboard)
 */

import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import type { GameSessionRecord } from '@/app/types/scenario'

export async function POST(request: Request) {
  let body: GameSessionRecord

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.id || !body.scenarioId || !body.playerId) {
    return NextResponse.json({ error: 'Missing required fields: id, scenarioId, playerId' }, { status: 400 })
  }

  try {
    // Write the full session record
    await kv.set(`session:${body.id}`, body)

    // Append session ID to the scenario index for classroom view queries
    await kv.lpush(`scenario:${body.scenarioId}:session_ids`, body.id)

    return NextResponse.json({ ok: true, id: body.id })
  } catch (err) {
    console.error('KV write failed:', err)
    return NextResponse.json({ error: 'Failed to persist session' }, { status: 500 })
  }
}
