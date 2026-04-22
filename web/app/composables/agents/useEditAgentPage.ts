import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useAgentForm } from '~/composables/agents/useAgentForm'
import { useAgentsStore } from '~/stores/agents'

export function useEditAgentPage() {
  const route = useRoute()
  const agentsStore = useAgentsStore()
  const { error, selectedAgent } = storeToRefs(agentsStore)
  const fullNameInput = ref<HTMLInputElement | null>(null)
  const hasCompletedInitialLoad = ref(false)
  const agentForm = useAgentForm({
    fallbackErrorMessage: 'Could not update agent',
  })

  const agentId = computed(() => {
    const id = route.params.id

    return Array.isArray(id) ? id[0] : String(id)
  })
  const pageAgent = computed(() =>
    selectedAgent.value?._id === agentId.value ? selectedAgent.value : null,
  )
  const isInitialLoading = computed(
    () => !hasCompletedInitialLoad.value && !pageAgent.value && !error.value,
  )
  const canSubmit = computed(
    () => !agentForm.isSubmitting.value && Boolean(pageAgent.value),
  )

  async function loadAgent(): Promise<void> {
    try {
      await agentsStore.fetchAgentById(agentId.value)
      agentForm.populateForm(agentsStore.selectedAgent)
    } finally {
      hasCompletedInitialLoad.value = true
    }
  }

  async function submitAgent(): Promise<void> {
    if (agentForm.isSubmitting.value) {
      return
    }

    const payload = agentForm.toUpdatePayload()

    if (!payload) {
      return
    }

    agentForm.isSubmitting.value = true

    try {
      await agentsStore.updateAgent(agentId.value, payload)
      await navigateTo('/agents')
    } catch (error) {
      agentForm.applyBackendErrors(error, agentsStore.error)
    } finally {
      agentForm.isSubmitting.value = false
    }
  }

  onMounted(async () => {
    await loadAgent().catch(() => undefined)
    fullNameInput.value?.focus()
  })

  return {
    ...agentForm,
    canSubmit,
    error,
    fullNameInput,
    isInitialLoading,
    loadAgent,
    pageAgent,
    submitAgent,
  }
}
