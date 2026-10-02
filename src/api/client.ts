/**
 * Minimal fetch wrapper for the TriTrain API: JSON in and out, bearer token,
 * and one error type that keeps Laravel's validation messages.
 */

export type ValidationErrors = Record<string, string[]>

export class ApiError extends Error {
  readonly status: number
  readonly errors: ValidationErrors

  constructor(status: number, message: string, errors: ValidationErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }

  get isValidation(): boolean {
    return this.status === 422
  }

  /** The first message for a field, for showing next to its input. */
  fieldError(field: string): string | undefined {
    return this.errors[field]?.[0]
  }
}

export type Query = Record<string, string | number | boolean | null | undefined>

export interface RequestOptions {
  query?: Query
  body?: unknown
}

export interface ClientConfig {
  baseUrl: string
  token: () => string | null
  onUnauthorized?: () => void
  fetch?: typeof fetch
}

export class ApiClient {
  private readonly config: ClientConfig

  constructor(config: ClientConfig) {
    this.config = config
  }

  get<T>(path: string, query?: Query): Promise<T> {
    return this.request<T>('GET', path, { query })
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body })
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, { body })
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, { body })
  }

  delete<T = void>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }

  async request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' }
    const token = this.config.token()

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }

    const doFetch = this.config.fetch ?? fetch
    let response: Response

    try {
      response = await doFetch(this.url(path, options.query), {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      })
    } catch {
      throw new ApiError(0, 'Could not reach the server. Check your connection and try again.')
    }

    if (response.status === 401 && token) {
      this.config.onUnauthorized?.()
    }

    if (response.status === 204) {
      return undefined as T
    }

    const payload: unknown = await response.json().catch(() => null)

    if (!response.ok) {
      const body = (payload ?? {}) as { message?: string; errors?: ValidationErrors }
      throw new ApiError(
        response.status,
        body.message || response.statusText || 'Request failed',
        body.errors,
      )
    }

    return payload as T
  }

  url(path: string, query?: Query): string {
    const base = this.config.baseUrl.replace(/\/+$/, '')
    const params = new URLSearchParams()

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value))
      }
    }

    const search = params.toString()

    return `${base}/${path.replace(/^\/+/, '')}${search ? `?${search}` : ''}`
  }
}
