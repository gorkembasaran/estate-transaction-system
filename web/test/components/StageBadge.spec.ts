import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StageBadge from '~/components/transactions/StageBadge.vue'

describe('StageBadge', () => {
  it('renders a human-readable label and stage-specific class', () => {
    const wrapper = mount(StageBadge, {
      props: {
        stage: 'earnest_money',
      },
    })

    expect(wrapper.text()).toBe('Earnest Money')
    expect(wrapper.classes()).toContain('stage-badge--earnest_money')
  })

  it('renders completed stage clearly', () => {
    const wrapper = mount(StageBadge, {
      props: {
        stage: 'completed',
      },
    })

    expect(wrapper.text()).toBe('Completed')
    expect(wrapper.classes()).toContain('stage-badge--completed')
  })
})
