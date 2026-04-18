<script setup lang="ts">
import { computed } from 'vue'
import type { TransactionStage } from '~/types/transaction'
import { getTransactionStageLabel } from '~/utils/transaction-format'

const props = defineProps<{
  stage: TransactionStage
}>()

const label = computed(() => getTransactionStageLabel(props.stage))
const badgeClass = computed(() => `stage-badge--${props.stage}`)
</script>

<template>
  <span class="stage-badge" :class="badgeClass">
    {{ label }}
  </span>
</template>

<style scoped>
.stage-badge {
  align-items: center;
  border-radius: 8px;
  display: inline-flex;
  font-size: 12px;
  font-weight: 700;
  justify-content: center;
  line-height: 1;
  min-height: 26px;
  padding: 0 10px;
  white-space: nowrap;
}

.stage-badge--agreement {
  background: #f3f4f6;
  color: #4b5563;
}

.stage-badge--earnest_money {
  background: #dbeafe;
  color: #1d4ed8;
}

.stage-badge--title_deed {
  background: #ffedd5;
  color: #c2410c;
}

.stage-badge--completed {
  background: #dcfce7;
  color: #15803d;
}
</style>
