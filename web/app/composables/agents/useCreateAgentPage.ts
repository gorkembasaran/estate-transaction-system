import { onMounted, ref } from 'vue'
import { useAgentForm } from '~/composables/agents/useAgentForm'
import { useAgentsStore } from '~/stores/agents'

export function useCreateAgentPage() {
  const agentsStore = useAgentsStore()
  const fullNameInput = ref<HTMLInputElement | null>(null)
  const agentForm = useAgentForm({
    fallbackErrorMessage: 'Could not create agent',
  })

  async function submitAgent(): Promise<void> {
    if (agentForm.isSubmitting.value) {
      return
    }

    const payload = agentForm.toCreatePayload()

    if (!payload) {
      return
    }

    agentForm.isSubmitting.value = true

    try {
      await agentsStore.createAgent(payload)
      await navigateTo('/agents')
    } catch (error) {
      agentForm.applyBackendErrors(error, agentsStore.error)
    } finally {
      agentForm.isSubmitting.value = false
    }
  }

  onMounted(() => {
    fullNameInput.value?.focus()
  })

  return {
    ...agentForm,
    fullNameInput,
    submitAgent,
  }
}
