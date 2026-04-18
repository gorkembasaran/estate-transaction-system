<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useAgentsStore } from '~/stores/agents'
import type { Agent } from '~/types/agent'
import { formatDate } from '~/utils/transaction-format'

const agentsStore = useAgentsStore()
const {
  error,
  isLoading,
  items: agents,
} = storeToRefs(agentsStore)

const searchQuery = ref('')

const normalizedSearchQuery = computed(() =>
  searchQuery.value.trim().toLowerCase(),
)
const filteredAgents = computed(() => {
  if (!normalizedSearchQuery.value) {
    return agents.value
  }

  return agents.value.filter((agent) => {
    const searchableText = `${agent.fullName} ${agent.email}`.toLowerCase()

    return searchableText.includes(normalizedSearchQuery.value)
  })
})
const showSkeletonRows = computed(
  () => isLoading.value && agents.value.length === 0,
)
const hasSearch = computed(() => normalizedSearchQuery.value.length > 0)
const resultSummary = computed(() => {
  const visibleCount = filteredAgents.value.length
  const totalCount = agents.value.length

  return `Showing ${visibleCount} of ${totalCount} active agent${
    totalCount === 1 ? '' : 's'
  }`
})
const emptyStateTitle = computed(() =>
  hasSearch.value ? 'No active agents match your search' : 'No active agents yet',
)
const emptyStateDescription = computed(() =>
  hasSearch.value
    ? 'Try a different name or email address.'
    : 'Create your first active agent before creating transactions.',
)

async function loadAgents(forceRefresh = false): Promise<void> {
  await agentsStore.fetchAgents(forceRefresh).catch(() => undefined)
}

async function retryAgents(): Promise<void> {
  await loadAgents(true)
}

function getAgentInitials(agent: Agent): string {
  const initials = agent.fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return initials || 'A'
}

onMounted(() => {
  void loadAgents()
})
</script>

<template>
  <section class="agents-page" aria-labelledby="agents-title">
    <header class="agents-header">
      <div>
        <h1 id="agents-title">
          Agents
        </h1>
        <p>Manage active real estate agents</p>
      </div>

      <NuxtLink class="create-button" to="/agents/create">
        <span aria-hidden="true">+</span>
        Create Agent
      </NuxtLink>
    </header>

    <div v-if="error" class="agents-alert" role="alert">
      <div>
        <strong>Could not load active agents</strong>
        <p>{{ error }}</p>
      </div>

      <button type="button" @click="retryAgents">
        Retry
      </button>
    </div>

    <section class="agents-toolbar" aria-label="Agent search">
      <div class="search-field">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m16.5 16.5 3.5 3.5" />
        </svg>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search active agents by name or email..."
          aria-label="Search active agents"
        >
      </div>

      <p>{{ resultSummary }}</p>
    </section>

    <section class="agents-table-card" aria-label="Active agents">
      <div class="agents-table-wrap">
        <table class="agents-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Created Date</th>
            </tr>
          </thead>

          <tbody v-if="showSkeletonRows">
            <tr v-for="row in 6" :key="row">
              <td v-for="cell in 4" :key="cell">
                <span class="table-skeleton" />
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="filteredAgents.length > 0">
            <tr v-for="agent in filteredAgents" :key="agent._id">
              <td>
                <div class="agent-name-cell">
                  <span class="agent-avatar" aria-hidden="true">
                    {{ getAgentInitials(agent) }}
                  </span>
                  <strong>{{ agent.fullName }}</strong>
                </div>
              </td>
              <td>
                <a class="agent-email-link" :href="`mailto:${agent.email}`">
                  {{ agent.email }}
                </a>
              </td>
              <td>
                <span
                  class="status-badge"
                  :class="{ 'is-active': agent.isActive }"
                >
                  {{ agent.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>{{ formatDate(agent.createdAt) }}</td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr>
              <td colspan="4">
                <div class="empty-state">
                  <strong>{{ emptyStateTitle }}</strong>
                  <span>{{ emptyStateDescription }}</span>
                  <NuxtLink
                    v-if="!hasSearch"
                    class="empty-action"
                    to="/agents/create"
                  >
                    Create Agent
                  </NuxtLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<style scoped>
.agents-page {
  display: grid;
  gap: 32px;
}

.agents-header {
  align-items: flex-start;
  display: flex;
  gap: 24px;
  justify-content: space-between;
}

.agents-header h1 {
  color: #111827;
  font-size: 42px;
  line-height: 1.1;
  margin: 0;
}

.agents-header p {
  color: #4b5563;
  font-size: 20px;
  font-weight: 500;
  margin: 14px 0 0;
}

.create-button,
.empty-action {
  align-items: center;
  background: #4f46e5;
  border-radius: 8px;
  box-shadow: 0 3px 6px rgb(79 70 229 / 0.26);
  color: #ffffff;
  display: inline-flex;
  font-weight: 800;
  gap: 10px;
}

.create-button {
  flex: 0 0 auto;
  font-size: 16px;
  min-height: 52px;
  padding: 0 26px;
}

.create-button:hover,
.empty-action:hover {
  background: #4338ca;
}

.create-button span {
  font-size: 28px;
  font-weight: 400;
  line-height: 1;
  margin-top: -2px;
}

.agents-alert {
  align-items: center;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  color: #9a3412;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 16px 18px;
}

.agents-alert strong {
  color: #7c2d12;
  display: block;
  font-size: 14px;
}

.agents-alert p {
  font-size: 14px;
  margin: 4px 0 0;
}

.agents-alert button {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #111827;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  padding: 10px 14px;
}

.agents-alert button:hover {
  border-color: #4f46e5;
  color: #4f46e5;
}

.agents-toolbar {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgb(15 23 42 / 0.08);
  display: grid;
  gap: 20px;
  padding: 28px 32px;
}

.search-field {
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  display: flex;
  gap: 12px;
  min-height: 50px;
  padding: 0 16px;
}

.search-field:focus-within {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgb(79 70 229 / 0.12);
}

.search-field svg {
  color: #9ca3af;
  flex: 0 0 auto;
  height: 24px;
  width: 24px;
}

.search-field svg * {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.search-field input {
  border: 0;
  color: #111827;
  flex: 1;
  font: inherit;
  font-size: 17px;
  min-width: 0;
  outline: 0;
}

.search-field input::placeholder {
  color: #6b7280;
}

.agents-toolbar p {
  color: #4b5563;
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.agents-table-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgb(15 23 42 / 0.08);
  overflow: hidden;
}

.agents-table-wrap {
  overflow-x: auto;
}

.agents-table {
  border-collapse: collapse;
  min-width: 920px;
  width: 100%;
}

.agents-table th,
.agents-table td {
  border-top: 1px solid #edf0f3;
  padding: 20px 32px;
  text-align: left;
  vertical-align: middle;
}

.agents-table thead tr:first-child th {
  border-top: 0;
}

.agents-table th {
  background: #f9fafb;
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.agents-table td {
  color: #4b5563;
  font-size: 15px;
}

.agent-name-cell {
  align-items: center;
  color: #111827;
  display: flex;
  gap: 14px;
}

.agent-name-cell strong {
  font-weight: 800;
}

.agent-avatar {
  align-items: center;
  background: #eef2ff;
  border-radius: 999px;
  color: #4f46e5;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 14px;
  font-weight: 900;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.agent-email-link {
  color: #374151;
  font-weight: 650;
}

.agent-email-link:hover {
  color: #4f46e5;
}

.status-badge {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  color: #4b5563;
  display: inline-flex;
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  padding: 7px 11px;
}

.status-badge.is-active {
  background: #dcfce7;
  border-color: #bbf7d0;
  color: #15803d;
}

.table-skeleton {
  animation: pulse 1.25s ease-in-out infinite;
  background: #e5e7eb;
  border-radius: 8px;
  display: block;
  height: 18px;
  max-width: 180px;
  width: 100%;
}

.empty-state {
  align-items: center;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
  min-height: 188px;
  text-align: center;
}

.empty-state strong {
  color: #111827;
}

.empty-action {
  font-size: 14px;
  min-height: 40px;
  padding: 0 16px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.65;
  }

  50% {
    opacity: 1;
  }
}

@media (max-width: 720px) {
  .agents-header {
    flex-direction: column;
  }

  .agents-header h1 {
    font-size: 34px;
  }

  .agents-header p {
    font-size: 17px;
  }

  .create-button {
    justify-content: center;
    width: 100%;
  }

  .agents-alert {
    align-items: flex-start;
    flex-direction: column;
  }

  .agents-toolbar {
    padding: 22px;
  }
}
</style>
