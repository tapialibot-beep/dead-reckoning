/**
 * POST /api/rooms — Create a new classroom room
 * GET  /api/rooms?code=XXXXXX — Get room by code (+ all sessions)
 *
 * KV structure:
 *   room:{code}                     → Room record
 *   room:{code}:session_ids         → string[] (session IDs in this room)
 *   room:{code}:teams               → string[] (team names for uniqueness check)
 *
 * KAR-43: Class management
 */

import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import type { Room, GameSessionRecord } from '@/app/types/scenario'

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous I/O/0/1
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export async function POST(request: Request) {
  let body: { scenarioId: string; historicalMode?: boolean }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.scenarioId) {
    return NextResponse.json({ error: 'Missing required field: scenarioId' }, { status: 400 })
  }

  // Generate unique code (retry on collision)
  let code: string
  let attempts = 0
  do {
    code = generateRoomCode()
    const existing = await kv.get(`room:${code}`)
    if (!existing) break
    attempts++
  } while (attempts < 10)

  if (attempts >= 10) {
    return NextResponse.json({ error: 'Failed to generate unique room code' }, { status: 500 })
  }

  const now = new Date()
  const room: Room = {
    code,
    scenarioId: body.scenarioId,
    historicalMode: body.historicalMode ?? false,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + THIRTY_DAYS_MS).toISOString(),
  }

  try {
    await kv.set(`room:${code}`, room)
    return NextResponse.json({ ok: true, room })
  } catch (err) {
    console.error('KV write failed (room create):', err)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')?.toUpperCase()

  if (!code) {
    return NextResponse.json({ error: 'Missing query param: code' }, { status: 400 })
  }

  try {
    const room = await kv.get<Room>(`room:${code}`)

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check expiry
    if (new Date(room.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Room expired' }, { status: 410 })
    }

    // Fetch all sessions in this room
    const sessionIds = await kv.lrange<string>(`room:${code}:session_ids`, 0, -1) ?? []
    const sessions: GameSessionRecord[] = []

    if (sessionIds.length > 0) {
      const sessionPromises = sessionIds.map(id => kv.get<GameSessionRecord>(`session:${id}`))
      const results = await Promise.all(sessionPromises)
      for (const s of results) {
        if (s) sessions.push(s)
      }
    }

    const teams = await kv.lrange<string>(`room:${code}:teams`, 0, -1) ?? []

    return NextResponse.json({ room, sessions, teams })
  } catch (err) {
    console.error('KV read failed (room get):', err)
    return NextResponse.json({ error: 'Failed to read room' }, { status: 500 })
  }
}
