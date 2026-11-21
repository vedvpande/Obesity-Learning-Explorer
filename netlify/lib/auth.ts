// Until Google sign-in arrives next week, every request acts as the fake
// Demo Student whose id is in DEMO_USER_ID. Returns null if it isn't set,
// so routes answer 401 exactly as they will for a signed-out user later.
export function currentUserId(): string | null {
  const id = process.env.DEMO_USER_ID
  return id && /^[0-9a-f-]{36}$/.test(id) ? id : null
}
