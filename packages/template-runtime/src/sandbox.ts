/**
 * Template logic sandbox using SES (Hardened JavaScript).
 *
 * Template `logic.ts` files are compiled to plain JS and executed inside
 * an SES Compartment. The compartment has no access to Node APIs, the DOM,
 * the file system, or the network. It can only call the APIs explicitly
 * injected via `endowments`.
 *
 * The sandbox API surface injected into templates:
 *   - parseManaCost(cost: string): string[]   — parses "{W}{U}" → ["W", "U"]
 *   - symbolsInCost(cost: string): number      — counts mana symbols
 *   - Math, Number, String, Array, Object      — standard JS globals (sealed)
 */

// SES must be initialized once at app startup — import it as a side effect
// The `ses` package lockdowns the entire JS environment for security
let sesInitialized = false

export function initSes() {
  if (sesInitialized) return
  // Dynamic import to avoid module-level side effects at bundle time
  // In production electron-vite bundles ses into the renderer
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('ses')
    // @ts-expect-error — lockDown is a global added by ses
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    globalThis.lockDown?.({
      errorTaming: 'unsafe', // Better stack traces in dev
      consoleTaming: 'unsafe',
    })
    sesInitialized = true
  } catch (e) {
    console.warn('SES not available, running without sandbox:', e)
  }
}

/** The API surface injected into every template logic compartment */
export interface TemplateSandboxApi {
  parseManaCost: (cost: string) => string[]
  symbolsInCost: (cost: string) => number
  includesType: (typeLine: string, cardType: string) => boolean
}

export const sandboxApi: TemplateSandboxApi = {
  parseManaCost(cost: string): string[] {
    const matches = cost.matchAll(/\{([^}]+)\}/g)
    return [...matches].map((m) => m[1] ?? '')
  },

  symbolsInCost(cost: string): number {
    return sandboxApi.parseManaCost(cost).length
  },

  includesType(typeLine: string, cardType: string): boolean {
    return typeLine.toLowerCase().includes(cardType.toLowerCase())
  },
}

/**
 * Execute a compiled template logic module string and return its exports.
 * If SES is available, runs in a hardened Compartment.
 * Falls back to Function() in development if SES is not loaded.
 */
export function runLogicModule(
  moduleCode: string,
  fields: Record<string, string>,
): Record<string, unknown> {
  const endowments = {
    ...sandboxApi,
    fields,
    Math,
    Number,
    String,
    Array,
    Object,
    Boolean,
    JSON,
    console: {
      log: (...args: unknown[]) => console.log('[template]', ...args),
      warn: (...args: unknown[]) => console.warn('[template]', ...args),
      error: (...args: unknown[]) => console.error('[template]', ...args),
    },
  }

  try {
    // @ts-expect-error — Compartment is added by ses to globalThis
    if (typeof globalThis.Compartment !== 'undefined') {
      // @ts-expect-error — dynamic SES Compartment
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const compartment = new globalThis.Compartment(endowments)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return compartment.evaluate(moduleCode) as Record<string, unknown>
    }
  } catch {
    // SES not available — fall through to Function fallback
  }

  // Development fallback (not sandboxed)
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(...Object.keys(endowments), moduleCode)
  return fn(...Object.values(endowments)) as Record<string, unknown>
}
