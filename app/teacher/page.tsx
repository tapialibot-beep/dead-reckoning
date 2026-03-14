/**
 * KAR-33 — Teacher Scenario Validation Page
 * Server component: reads KV env vars and passes kvConfigured to the client.
 */

import ValidatorClient from './ValidatorClient'

export default function TeacherPage() {
  const kvConfigured = !!(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  )

  return <ValidatorClient kvConfigured={kvConfigured} />
}
