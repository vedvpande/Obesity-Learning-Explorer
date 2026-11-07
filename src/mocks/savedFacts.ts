// Pretend version of GET/POST/DELETE /api/saved-facts (#10).
// Same rules as the real API: 401 when signed out, 400 on bad input,
// 404 when deleting a fact that isn't yours. Stored in this browser only.

import {
  validateSavedFactInput,
  type SavedFactInput,
} from '../lib/savedFactInput.ts'

export type MockUser = { id: string; name: string }

export type SavedFact = SavedFactInput & {
  id: string
  userId: string
  createdAt: string
}

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const STORAGE_KEY = 'demoSavedFacts'
let facts: SavedFact[] = load()
let nextId = facts.length + 1

function load(): SavedFact[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(saved) ? (saved as SavedFact[]) : []
  } catch {
    return []
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(facts))
  } catch {
    // Storage blocked: facts last until the page is reloaded.
  }
}

function requireUser(user: MockUser | null): MockUser {
  if (!user) throw new ApiError(401, 'Sign in to use My Report.')
  return user
}

// GET: only this user's facts, newest first.
export async function getSavedFacts(
  user: MockUser | null,
): Promise<SavedFact[]> {
  const { id } = requireUser(user)
  return facts.filter((f) => f.userId === id).reverse()
}

// POST
export async function saveFact(
  user: MockUser | null,
  input: unknown,
): Promise<SavedFact> {
  const { id } = requireUser(user)
  const result = validateSavedFactInput(input)
  if (!result.ok) throw new ApiError(400, result.error)
  const fact: SavedFact = {
    ...result.value,
    id: String(nextId++),
    userId: id,
    createdAt: new Date().toISOString(),
  }
  facts = [...facts, fact]
  persist()
  return fact
}

// DELETE: someone else's fact looks the same as a missing one (404).
export async function deleteSavedFact(
  user: MockUser | null,
  factId: string,
): Promise<void> {
  const { id } = requireUser(user)
  const fact = facts.find((f) => f.id === factId && f.userId === id)
  if (!fact) throw new ApiError(404, 'Saved fact not found.')
  facts = facts.filter((f) => f !== fact)
  persist()
}

// For tests only.
export function resetSavedFacts() {
  facts = []
  nextId = 1
  persist()
}
