import { config } from '@vue/test-utils'
import { vi } from 'vitest'

config.global.stubs = {
  NuxtLink: {
    props: ['to'],
    template: '<a :href="typeof to === \'string\' ? to : \'#\'"><slot /></a>',
  },
}

Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query: string) => ({
    addEventListener: vi.fn(),
    addListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches: false,
    media: query,
    onchange: null,
    removeEventListener: vi.fn(),
    removeListener: vi.fn(),
  })),
  writable: true,
})
