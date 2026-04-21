import { describe, expect, it } from 'vitest'
import { getStoreErrorMessage } from '~/utils/store-error'

function createAxiosLikeError(responseData?: unknown): unknown {
  return {
    isAxiosError: true,
    message: 'Request failed',
    response: responseData ? { data: responseData } : undefined,
  }
}

describe('getStoreErrorMessage', () => {
  it('uses Nest string messages from Axios responses', () => {
    expect(
      getStoreErrorMessage(
        createAxiosLikeError({
          message: 'Agent already exists',
          statusCode: 409,
        }),
      ),
    ).toBe('Agent already exists')
  })

  it('joins Nest validation message arrays', () => {
    expect(
      getStoreErrorMessage(
        createAxiosLikeError({
          message: ['email must be an email', 'fullName should not be empty'],
          statusCode: 400,
        }),
      ),
    ).toBe('email must be an email, fullName should not be empty')
  })

  it('uses structured validation errors when message is not directly usable', () => {
    expect(
      getStoreErrorMessage(
        createAxiosLikeError({
          errors: [
            {
              field: 'email',
              messages: ['email must be an email'],
            },
            {
              field: 'fullName',
              messages: ['fullName must be longer than or equal to 2 characters'],
            },
          ],
          message: undefined,
        }),
      ),
    ).toBe(
      'email must be an email, fullName must be longer than or equal to 2 characters',
    )
  })

  it('falls back safely for non-Axios unknown errors', () => {
    expect(getStoreErrorMessage(new Error('Regular failure'))).toBe(
      'Regular failure',
    )
    expect(getStoreErrorMessage('unexpected')).toBe('Unexpected error')
  })
})
