import { z } from 'zod'

const uuid = z.uuid()

// Until Google sign-in arrives next week, requests act as the fake Demo
// Student whose id is in DEMO_USER_ID. Returns null (so routes answer 401,
// exactly as for a signed-out user) when:
// - APP_ENV is production and ALLOW_DEMO_USER is not "true": the demo stub
//   only runs on the live site while it is switched on on purpose
//   (delete ALLOW_DEMO_USER when real sign-in ships);
// - DEMO_USER_ID is missing or not a real uuid.
export function currentUserId(): string | null {
  if (
    process.env.APP_ENV === 'production' &&
    process.env.ALLOW_DEMO_USER !== 'true'
  ) {
    return null
  }
  const id = uuid.safeParse(process.env.DEMO_USER_ID)
  return id.success ? id.data : null
}
