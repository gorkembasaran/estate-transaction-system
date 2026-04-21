import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DashboardStatCard from '~/components/ui/DashboardStatCard.vue'

describe('DashboardStatCard', () => {
  it('renders label, value, supporting text, and optional metrics', () => {
    const wrapper = mount(DashboardStatCard, {
      props: {
        cornerMetric: '+3 vs prev. 30d',
        cornerMetricTone: 'positive',
        icon: 'check',
        label: 'Completed Transactions',
        supportingLabel: 'Closed transactions',
        value: 12,
        valueMetric: 'stable',
        valueMetricTone: 'neutral',
      },
    })

    expect(wrapper.text()).toContain('Completed Transactions')
    expect(wrapper.text()).toContain('12')
    expect(wrapper.text()).toContain('Closed transactions')
    expect(wrapper.text()).toContain('+3 vs prev. 30d')
    expect(wrapper.find('.stat-card__metric--positive').exists()).toBe(true)
    expect(wrapper.find('.stat-card__metric--neutral').exists()).toBe(true)
  })

  it('shows skeleton content and hides metrics while loading', () => {
    const wrapper = mount(DashboardStatCard, {
      props: {
        cornerMetric: '+3 vs prev. 30d',
        icon: 'document',
        isLoading: true,
        label: 'Total Transactions',
        supportingLabel: 'All time',
        value: 21,
      },
    })

    expect(wrapper.text()).toContain('Total Transactions')
    expect(wrapper.text()).not.toContain('21')
    expect(wrapper.text()).not.toContain('+3 vs prev. 30d')
    expect(wrapper.find('.stat-card__skeleton').exists()).toBe(true)
  })
})
