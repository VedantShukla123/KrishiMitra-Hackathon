/**
 * User-scoped localStorage keys. Use userId so each user's progress is isolated.
 * When userId is null (logged out), returns global key - caller should handle.
 */
export function kmKey(base, userId) {
  return userId ? `km_${base}_${userId}` : `km_${base}`
}
