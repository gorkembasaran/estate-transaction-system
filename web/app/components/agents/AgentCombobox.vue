<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Agent } from '~/types/agent'

const props = withDefaults(
  defineProps<{
    agents: Agent[]
    disabled?: boolean
    label: string
    loading?: boolean
    modelValue: string
    name: string
    placeholder?: string
    searchAgents?: (query: string) => Promise<Agent[]>
  }>(),
  {
    disabled: false,
    loading: false,
    placeholder: 'Search active agents',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const rootElement = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const searchResults = ref<Agent[]>([])
const selectedAgentSnapshot = ref<Agent | null>(null)
const isSearching = ref(false)
const searchError = ref<string | null>(null)
const isOpen = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let searchRequestId = 0
let lastSearchedQuery = ''

const selectedAgent = computed(() => {
  const candidates = selectedAgentSnapshot.value
    ? [...props.agents, ...searchResults.value, selectedAgentSnapshot.value]
    : [...props.agents, ...searchResults.value]

  return candidates.find((agent) => agent._id === props.modelValue) ?? null
})
const normalizedSearchQuery = computed(() => searchQuery.value.trim().toLowerCase())
const visibleAgents = computed(() => {
  if (!normalizedSearchQuery.value) {
    return props.agents.slice(0, 10)
  }

  return searchResults.value
})
const helperText = computed(() => {
  if (isSearching.value) {
    return 'Searching active agents...'
  }

  if (selectedAgent.value) {
    return selectedAgent.value.email
  }

  return 'Search active agents from the backend by full name or email.'
})
const shouldShowEmptyState = computed(() => {
  return !props.loading && !isSearching.value && visibleAgents.value.length === 0
})

watch(
  () => props.modelValue,
  (value) => {
    if (!value) {
      selectedAgentSnapshot.value = null
    }

    searchQuery.value = ''
  },
)

watch(searchQuery, () => {
  if (!props.searchAgents) {
    return
  }

  scheduleAgentSearch()
})

async function openList(): Promise<void> {
  if (props.disabled) {
    return
  }

  isOpen.value = true
  await nextTick()
  searchInput.value?.focus()
}

function selectAgent(agent: Agent): void {
  selectedAgentSnapshot.value = agent
  emit('update:modelValue', agent._id)
  searchQuery.value = ''
  isOpen.value = false
}

function clearAgent(): void {
  selectedAgentSnapshot.value = null
  emit('update:modelValue', '')
  searchQuery.value = ''
  isOpen.value = true
}

function closeOnOutsideClick(event: MouseEvent): void {
  if (
    rootElement.value &&
    event.target instanceof Node &&
    !rootElement.value.contains(event.target)
  ) {
    isOpen.value = false
  }
}

function scheduleAgentSearch(): void {
  const query = searchQuery.value.trim()

  searchError.value = null

  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  if (!query) {
    searchRequestId += 1
    searchResults.value = []
    lastSearchedQuery = ''
    isSearching.value = false
    return
  }

  const requestId = ++searchRequestId

  debounceTimer = setTimeout(() => {
    void runAgentSearch(query, requestId)
  }, 300)
}

async function runAgentSearch(query: string, requestId: number): Promise<void> {
  if (!props.searchAgents || query === lastSearchedQuery) {
    return
  }

  lastSearchedQuery = query
  isSearching.value = true
  searchError.value = null

  try {
    const agents = await props.searchAgents(query)

    if (requestId === searchRequestId) {
      searchResults.value = agents
    }
  } catch {
    if (requestId === searchRequestId) {
      searchResults.value = []
      searchError.value = 'Could not search active agents.'
    }
  } finally {
    if (requestId === searchRequestId) {
      isSearching.value = false
    }
  }
}

onMounted(() => {
  document.addEventListener('click', closeOnOutsideClick)
})

onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  document.removeEventListener('click', closeOnOutsideClick)
})
</script>

<template>
  <div
    ref="rootElement"
    class="agent-combobox"
    :data-testid="`${name}-combobox`"
  >
    <label class="agent-combobox-label" :for="name">
      {{ label }} *
    </label>

    <div
      class="agent-combobox-control"
      :class="{
        'is-disabled': disabled,
        'is-open': isOpen,
      }"
      :data-testid="`${name}-combobox-control`"
      @click.stop="openList"
    >
      <div class="agent-combobox-copy">
        <strong v-if="selectedAgent">{{ selectedAgent.fullName }}</strong>
        <strong v-else>{{ placeholder }}</strong>
        <span>{{ helperText }}</span>
      </div>

      <button
        v-if="selectedAgent && !disabled"
        class="agent-clear-button"
        type="button"
        :aria-label="`Clear ${label}`"
        @click.stop="clearAgent"
      >
        ×
      </button>

      <svg class="agent-chevron" viewBox="0 0 16 16" aria-hidden="true">
        <path d="m4 6 4 4 4-4" />
      </svg>
    </div>

    <div v-if="isOpen" class="agent-dropdown">
      <div class="agent-search-field">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m16.5 16.5 3.5 3.5" />
        </svg>
        <input
          :id="name"
          ref="searchInput"
          v-model="searchQuery"
          autocomplete="off"
          :data-testid="`${name}-combobox-search`"
          :disabled="disabled"
          :name="`${name}Search`"
          placeholder="Search active agents by name or email..."
          type="search"
          @keydown.esc.prevent="isOpen = false"
        >
      </div>

      <div v-if="props.loading || isSearching" class="agent-loading-state">
        Searching active agents...
      </div>

      <div v-if="visibleAgents.length > 0" class="agent-options">
        <button
          v-for="agent in visibleAgents"
          :key="agent._id"
          class="agent-option"
          :data-testid="`${name}-combobox-option`"
          type="button"
          @click="selectAgent(agent)"
        >
          <span class="agent-avatar" aria-hidden="true">
            {{ agent.fullName.slice(0, 1).toUpperCase() }}
          </span>
          <span>
            <strong>{{ agent.fullName }}</strong>
            <small>{{ agent.email }}</small>
          </span>
        </button>
      </div>

      <div v-if="searchError" class="agent-empty-state">
        {{ searchError }}
      </div>

      <div v-else-if="shouldShowEmptyState" class="agent-empty-state">
        No active agents found.
      </div>

      <div v-if="!normalizedSearchQuery && visibleAgents.length > 0" class="agent-result-note">
        Showing recent active agents. Type to search the backend.
      </div>
    </div>
  </div>
</template>

<style scoped>
.agent-combobox {
  display: grid;
  gap: 8px;
  position: relative;
}

.agent-combobox-label {
  color: #374151;
  font-size: 13px;
  font-weight: 800;
}

.agent-combobox-control {
  align-items: center;
  background: #fcfcfd;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  gap: 10px;
  min-height: 48px;
  padding: 8px 14px;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease;
}

.agent-combobox-control:hover {
  background: #ffffff;
  border-color: #b8c0cc;
}

.agent-combobox-control.is-open {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgb(79 70 229 / 0.12);
}

.agent-combobox-control.is-disabled {
  cursor: not-allowed;
  opacity: 0.64;
}

.agent-combobox-copy {
  display: grid;
  flex: 1;
  gap: 3px;
  min-width: 0;
}

.agent-combobox-copy strong {
  color: #111827;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent-combobox-copy span {
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent-clear-button {
  align-items: center;
  background: #f3f4f6;
  border: 0;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 18px;
  font-weight: 800;
  height: 28px;
  justify-content: center;
  line-height: 1;
  width: 28px;
}

.agent-clear-button:hover {
  background: #fee2e2;
  color: #b91c1c;
}

.agent-chevron {
  color: #4f46e5;
  flex: 0 0 auto;
  height: 18px;
  margin-left: auto;
  width: 18px;
}

.agent-chevron * {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.agent-dropdown {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 14px 32px rgb(15 23 42 / 0.16);
  display: grid;
  gap: 8px;
  left: 0;
  padding: 10px;
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  z-index: 20;
}

.agent-search-field {
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  display: flex;
  gap: 10px;
  min-height: 42px;
  padding: 0 12px;
}

.agent-search-field:focus-within {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgb(79 70 229 / 0.12);
}

.agent-search-field svg {
  color: #9ca3af;
  height: 18px;
  width: 18px;
}

.agent-search-field svg * {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.agent-search-field input {
  border: 0;
  color: #111827;
  flex: 1;
  font: inherit;
  font-size: 14px;
  min-width: 0;
  outline: 0;
}

.agent-search-field input::placeholder {
  color: #9ca3af;
}

.agent-options {
  display: grid;
  gap: 4px;
  max-height: 282px;
  overflow-y: auto;
}

.agent-option {
  align-items: center;
  background: #ffffff;
  border: 0;
  border-radius: 8px;
  color: #111827;
  cursor: pointer;
  display: flex;
  gap: 10px;
  padding: 10px;
  text-align: left;
  width: 100%;
}

.agent-option:hover {
  background: #eef2ff;
}

.agent-avatar {
  align-items: center;
  background: #eef2ff;
  border-radius: 8px;
  color: #4f46e5;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 14px;
  font-weight: 900;
  height: 34px;
  justify-content: center;
  width: 34px;
}

.agent-option strong,
.agent-option small {
  display: block;
  line-height: 1.25;
}

.agent-option strong {
  color: #111827;
  font-size: 14px;
  font-weight: 800;
}

.agent-option small {
  color: #6b7280;
  font-size: 13px;
  margin-top: 2px;
}

.agent-loading-state,
.agent-empty-state,
.agent-result-note {
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
  padding: 10px;
}

.agent-loading-state {
  background: #eef2ff;
  border-radius: 8px;
  color: #4f46e5;
}

.agent-result-note {
  background: #f9fafb;
  border-radius: 8px;
}
</style>
