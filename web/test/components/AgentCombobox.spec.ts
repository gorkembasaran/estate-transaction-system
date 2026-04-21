import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import AgentCombobox from '~/components/agents/AgentCombobox.vue'
import { createAgent } from '../factories'
import type { Agent } from '~/types/agent'

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return {
    promise,
    reject,
    resolve,
  }
}

describe('AgentCombobox', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows recent active agents before searching', async () => {
    const wrapper = mount(AgentCombobox, {
      props: {
        agents: [
          createAgent({
            _id: 'agent-1',
            email: 'sarah@example.com',
            fullName: 'Sarah Johnson',
          }),
        ],
        label: 'Listing Agent',
        modelValue: '',
        name: 'listingAgentId',
      },
    })

    await wrapper.find('.agent-combobox-control').trigger('click')

    expect(wrapper.text()).toContain('Sarah Johnson')
    expect(wrapper.text()).toContain('Showing recent active agents')
  })

  it('debounces backend search and renders returned agents', async () => {
    vi.useFakeTimers()
    const searchResult = createAgent({
      _id: 'agent-2',
      email: 'michael@example.com',
      fullName: 'Michael Chen',
    })
    const searchAgents = vi.fn<[], Promise<Agent[]>>().mockResolvedValue([
      searchResult,
    ])
    const wrapper = mount(AgentCombobox, {
      props: {
        agents: [],
        label: 'Selling Agent',
        modelValue: '',
        name: 'sellingAgentId',
        searchAgents,
      },
    })

    await wrapper.find('.agent-combobox-control').trigger('click')
    await wrapper.find('input[type="search"]').setValue('michael')

    expect(searchAgents).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(299)
    expect(searchAgents).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    await flushPromises()

    expect(searchAgents).toHaveBeenCalledTimes(1)
    expect(searchAgents).toHaveBeenCalledWith('michael')
    expect(wrapper.text()).toContain('Michael Chen')
    expect(wrapper.text()).toContain('michael@example.com')
  })

  it('shows a loading state while async search is pending', async () => {
    vi.useFakeTimers()
    const deferred = createDeferred<Agent[]>()
    const searchAgents = vi.fn<[], Promise<Agent[]>>().mockReturnValue(
      deferred.promise,
    )
    const wrapper = mount(AgentCombobox, {
      props: {
        agents: [],
        label: 'Listing Agent',
        modelValue: '',
        name: 'listingAgentId',
        searchAgents,
      },
    })

    await wrapper.find('.agent-combobox-control').trigger('click')
    await wrapper.find('input[type="search"]').setValue('emily')
    await vi.advanceTimersByTimeAsync(300)
    await nextTick()

    expect(wrapper.text()).toContain('Searching active agents...')

    deferred.resolve([])
    await flushPromises()
  })

  it('emits the selected agent id and keeps a selected-agent snapshot visible', async () => {
    vi.useFakeTimers()
    const searchResult = createAgent({
      _id: 'agent-3',
      email: 'emily@example.com',
      fullName: 'Emily Rodriguez',
    })
    const wrapper = mount(AgentCombobox, {
      props: {
        agents: [],
        label: 'Listing Agent',
        modelValue: '',
        name: 'listingAgentId',
        searchAgents: vi.fn<[], Promise<Agent[]>>().mockResolvedValue([
          searchResult,
        ]),
      },
    })

    await wrapper.find('.agent-combobox-control').trigger('click')
    await wrapper.find('input[type="search"]').setValue('emily')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    await wrapper.find('.agent-option').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['agent-3']])
    await wrapper.setProps({ modelValue: 'agent-3' })

    expect(wrapper.text()).toContain('Emily Rodriguez')
    expect(wrapper.text()).toContain('emily@example.com')
    expect(wrapper.find('.agent-dropdown').exists()).toBe(false)
  })

  it('shows a truthful empty state when no active agents match', async () => {
    vi.useFakeTimers()
    const wrapper = mount(AgentCombobox, {
      props: {
        agents: [],
        label: 'Listing Agent',
        modelValue: '',
        name: 'listingAgentId',
        searchAgents: vi.fn<[], Promise<Agent[]>>().mockResolvedValue([]),
      },
    })

    await wrapper.find('.agent-combobox-control').trigger('click')
    await wrapper.find('input[type="search"]').setValue('missing')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(wrapper.text()).toContain('No active agents found.')
  })
})
