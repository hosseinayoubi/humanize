export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`Timeout after ${ms}ms`)), ms)),
  ])
}

export function isRetryableMessage(msg: string) {
  const m = msg.toLowerCase()

  // شبکه / سرویس / قطع و وصل
  if (m.includes("timeout")) return true
  if (m.includes("econnreset") || m.includes("socket hang up")) return true
  if (m.includes("fetch failed") || m.includes("network")) return true
  if (m.includes("connection") && (m.includes("closed") || m.includes("terminated") || m.includes("refused"))) return true

  // Postgres transient
  if (m.includes("deadlock detected")) return true
  if (m.includes("could not serialize access")) return true // 40001
  if (m.includes("remaining connection slots are reserved")) return true
  if (m.includes("too many connections")) return true
  if (m.includes("prepared statement") && m.includes("already exists")) return true // 42P05 (pgbouncer)
  if (m.includes("the server closed the connection unexpectedly")) return true

  // rate limit / overload
  if (m.includes("rate limit") || m.includes("429")) return true
  if (m.includes("overloaded") || m.includes("529")) return true

  return false
}

export async function retry<T>(
  fn: () => Promise<T>,
  opts?: {
    attempts?: number
    baseDelayMs?: number
    maxDelayMs?: number
    jitter?: number
    tag?: string
  },
): Promise<T> {
  const attempts = opts?.attempts ?? 4
  const base = opts?.baseDelayMs ?? 400
  const max = opts?.maxDelayMs ?? 5000
  const jitter = opts?.jitter ?? 0.25

  let lastErr: any

  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn()
    } catch (e: any) {
      lastErr = e
      const msg = e?.message ? String(e.message) : String(e)

      // اگر retryable نیست، همون لحظه بنداز بیرون
      if (!isRetryableMessage(msg) || i === attempts) throw e

      // backoff با jitter
      const raw = Math.min(max, base * Math.pow(2, i - 1))
      const j = raw * jitter * (Math.random() * 2 - 1) // ±jitter
      await sleep(Math.max(0, Math.floor(raw + j)))
    }
  }

  throw lastErr
}

// کنترل همزمانی ساده (برای هر اینستنس). جلوی burst و rate-limit را می‌گیرد.
class Semaphore {
  private queue: Array<() => void> = []
  private inUse = 0
  constructor(private readonly limit: number) {}

  async acquire() {
    if (this.inUse < this.limit) {
      this.inUse++
      return
    }
    await new Promise<void>((resolve) => this.queue.push(resolve))
    this.inUse++
  }

  release() {
    this.inUse = Math.max(0, this.inUse - 1)
    const next = this.queue.shift()
    if (next) next()
  }
}

export const humanizeSemaphore = new Semaphore(2) // همزمانی 2 تا در هر instance
