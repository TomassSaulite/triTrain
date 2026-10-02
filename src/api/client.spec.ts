import { describe, expect, it, vi } from 'vitest'
import { ApiClient, ApiError } from './client'

function respond(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeClient(response: Response | Error, token: string | null = 'secret') {
  const fetch = vi.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  )
  const onUnauthorized = vi.fn()
  const client = new ApiClient({ baseUrl: 'https://api.test/v1/', token: () => token, onUnauthorized, fetch })

  return { client, fetch, onUnauthorized }
}

describe('ApiClient', () => {
  it('sends JSON with the bearer token and returns the parsed body', async () => {
    const { client, fetch } = makeClient(respond(201, { data: { id: 1 } }))

    await expect(client.post('/races', { name: 'Jurmala' })).resolves.toEqual({ data: { id: 1 } })

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.test/v1/races')
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"name":"Jurmala"}')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer secret', 'Content-Type': 'application/json' })
  })

  it('builds query strings without empty values', () => {
    const { client } = makeClient(respond(200, {}))

    expect(client.url('calendar', { from: '2026-10-05', to: undefined, sport: '', page: 2 })).toBe(
      'https://api.test/v1/calendar?from=2026-10-05&page=2',
    )
  })

  it('returns undefined for no-content responses', async () => {
    const { client } = makeClient(respond(204))

    await expect(client.delete('races/1')).resolves.toBeUndefined()
  })

  it('keeps validation errors from the API', async () => {
    const { client } = makeClient(
      respond(422, {
        message: 'The date field must be a date after today.',
        errors: { date: ['Must be after today.'] },
      }),
    )

    const error = await client.post('races', {}).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).isValidation).toBe(true)
    expect((error as ApiError).fieldError('date')).toBe('Must be after today.')
    expect((error as ApiError).message).toBe('The date field must be a date after today.')
  })

  it('reports a rejected token', async () => {
    const { client, onUnauthorized } = makeClient(respond(401, { message: 'Unauthenticated.' }))

    await expect(client.get('me')).rejects.toMatchObject({ status: 401 })
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('does not report 401s when signed out, e.g. a failed login', async () => {
    const { client, onUnauthorized } = makeClient(respond(401, { message: 'Nope' }), null)

    await expect(client.get('me')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('turns network failures into a readable error', async () => {
    const { client } = makeClient(new TypeError('Failed to fetch'))

    await expect(client.get('me')).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining('reach the server'),
    })
  })
})
