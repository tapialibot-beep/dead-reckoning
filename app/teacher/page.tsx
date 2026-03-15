/**
 * KAR-33 + KAR-43 — Teacher Dashboard
 * Server component: reads KV env vars and scenario index, passes to client.
 */

import { readFile } from 'fs/promises'
import { join } from 'path'
import ValidatorClient from './ValidatorClient'
import type { ScenarioIndexEntry } from '@/app/types/scenario'

export default async function TeacherPage() {
  const kvConfigured = !!(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  )

  // Load scenario index from public directory
  let scenarios: ScenarioIndexEntry[] = []
  try {
    const indexPath = join(process.cwd(), 'public', 'scenarios', 'index.json')
    const raw = await readFile(indexPath, 'utf-8')
    scenarios = JSON.parse(raw)
  } catch (err) {
    console.error('Failed to load scenario index:', err)
  }

  return <ValidatorClient kvConfigured={kvConfigured} scenarios={scenarios} />
}
