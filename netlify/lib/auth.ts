import { z } from 'zod'

const uuid = z.uuid()

// Until Google sign-in arrives next week, requests act as the fake Demo
// Student whose id is in DEMO_USER_ID. Returns null (so routes answer 401,
// exactly as for a signed-out user) when:
// - APP_ENV is production: the demo stub must never run on the live site,
//   where anyone could read and change the shared demo report;
// - DEMO_USER_ID is missing or not a real uuid.
export function currentUserId(): string | null {
  if (process.env.APP_ENV === 'production') return null
  const id = uuid.safeParse(process.env.DEMO_USER_ID)
  return id.success ? id.data : null
}
