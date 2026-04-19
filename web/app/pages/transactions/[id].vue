<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import StageBadge from '~/components/transactions/StageBadge.vue'
import { useTransactionsStore } from '~/stores/transactions'
import type {
  FinancialBreakdown,
  StageHistoryItem,
  Transaction,
  TransactionStage,
} from '~/types/transaction'
import {
  formatAmountWithCurrency,
  formatDate,
  formatDateTime,
  getAgentEditPath,
  getAgentDisplayEmail,
  getAgentDisplayName,
  getTransactionStageLabel,
} from '~/utils/transaction-format'

const nextStageByStage: Partial<Record<TransactionStage, TransactionStage>> = {
  agreement: 'earnest_money',
  earnest_money: 'title_deed',
  title_deed: 'completed',
}

const route = useRoute()
const transactionsStore = useTransactionsStore()
const { error, isLoading, selectedTransaction } = storeToRefs(transactionsStore)

const selectedNextStage = ref<TransactionStage | ''>('')
const localError = ref<string | null>(null)

const transactionId = computed(() => {
  const param = route.params.id

  return Array.isArray(param) ? param[0] : param
})
const transaction = computed<Transaction | null>(() =>
  selectedTransaction.value?._id === transactionId.value
    ? selectedTransaction.value
    : null,
)
const breakdown = computed(() => transaction.value?.breakdown ?? null)
const stageHistory = computed(() =>
  [...(transaction.value?.stageHistory ?? [])].sort(
    (firstItem, secondItem) =>
      new Date(firstItem.changedAt).getTime() -
      new Date(secondItem.changedAt).getTime(),
  ),
)
const nextStageOptions = computed(() => {
  const currentStage = transaction.value?.stage

  if (!currentStage) {
    return []
  }

  const nextStage = nextStageByStage[currentStage]

  return nextStage
    ? [
        {
          label: getTransactionStageLabel(nextStage),
          value: nextStage,
        },
      ]
    : []
})
const canUpdateStage = computed(
  () => selectedNextStage.value !== '' && !isLoading.value,
)
const pageError = computed(() => localError.value || error.value)
const showInitialLoading = computed(
  () => isLoading.value && transaction.value === null,
)

async function loadTransaction(): Promise<void> {
  localError.value = null

  if (!transactionId.value) {
    localError.value = 'Transaction id is missing.'
    return
  }

  await transactionsStore
    .fetchTransactionById(transactionId.value)
    .catch(() => undefined)
}

async function updateStage(): Promise<void> {
  localError.value = null

  if (!transaction.value || !selectedNextStage.value) {
    return
  }

  try {
    await transactionsStore.updateTransactionStage(
      transaction.value._id,
      selectedNextStage.value,
    )
    selectedNextStage.value = ''
  } catch {
    // Store error is displayed on the page.
  }
}

function isCurrentHistoryItem(
  item: StageHistoryItem,
  index: number,
): boolean {
  return (
    index === stageHistory.value.length - 1 &&
    item.toStage === transaction.value?.stage
  )
}

function getAgencyShareLabel(currentBreakdown: FinancialBreakdown): string {
  if (!transaction.value || transaction.value.totalServiceFee <= 0) {
    return 'Agency share'
  }

  const percentage = Math.round(
    (currentBreakdown.agencyAmount / transaction.value.totalServiceFee) * 100,
  )

  return `${percentage}% of total service fee`
}

watch(
  () => transaction.value?.stage,
  () => {
    selectedNextStage.value = ''
  },
)

onMounted(() => {
  void loadTransaction()
})
</script>

<template>
  <section class="transaction-detail-page" aria-labelledby="transaction-title">
    <NuxtLink class="back-link" to="/transactions">
      <span aria-hidden="true">←</span>
      Back to Transactions
    </NuxtLink>

    <div v-if="pageError" class="detail-alert" role="alert">
      <div>
        <strong>Could not load transaction</strong>
        <p>{{ pageError }}</p>
      </div>

      <button type="button" @click="loadTransaction">
        Retry
      </button>
    </div>

    <div v-if="showInitialLoading" class="detail-card detail-skeleton-card">
      <span />
      <small />
      <small />
    </div>

    <template v-else-if="transaction">
      <section class="detail-card detail-hero">
        <div>
          <h1 id="transaction-title">
            {{ transaction.propertyTitle }}
          </h1>

          <div class="current-stage">
            <span>Current Stage:</span>
            <StageBadge :stage="transaction.stage" />
          </div>
        </div>

        <div class="stage-update">
          <label for="next-stage">Update Transaction Stage</label>
          <div class="stage-update__controls">
            <select
              id="next-stage"
              v-model="selectedNextStage"
              :disabled="nextStageOptions.length === 0 || isLoading"
            >
              <option value="">
                {{
                  nextStageOptions.length === 0
                    ? 'No further stages'
                    : 'Select new stage...'
                }}
              </option>
              <option
                v-for="stageOption in nextStageOptions"
                :key="stageOption.value"
                :value="stageOption.value"
              >
                {{ stageOption.label }}
              </option>
            </select>

            <button
              type="button"
              :disabled="!canUpdateStage"
              @click="updateStage"
            >
              {{ isLoading ? 'Updating...' : 'Update Stage' }}
            </button>
          </div>
        </div>
      </section>

      <div class="detail-grid">
        <section class="detail-card info-card">
          <h2>Transaction Information</h2>

          <dl>
            <div>
              <dt>Property Title</dt>
              <dd>{{ transaction.propertyTitle }}</dd>
            </div>

            <div>
              <dt>Listing Agent</dt>
              <dd>
                <NuxtLink
                  v-if="getAgentEditPath(transaction.listingAgentId)"
                  class="agent-detail-link"
                  :to="getAgentEditPath(transaction.listingAgentId) || '/'"
                >
                  {{ getAgentDisplayName(transaction.listingAgentId) }}
                </NuxtLink>
                <strong v-else>
                  {{ getAgentDisplayName(transaction.listingAgentId) }}
                </strong>
                <span>{{ getAgentDisplayEmail(transaction.listingAgentId) }}</span>
              </dd>
            </div>

            <div>
              <dt>Selling Agent</dt>
              <dd>
                <NuxtLink
                  v-if="getAgentEditPath(transaction.sellingAgentId)"
                  class="agent-detail-link"
                  :to="getAgentEditPath(transaction.sellingAgentId) || '/'"
                >
                  {{ getAgentDisplayName(transaction.sellingAgentId) }}
                </NuxtLink>
                <strong v-else>
                  {{ getAgentDisplayName(transaction.sellingAgentId) }}
                </strong>
                <span>{{ getAgentDisplayEmail(transaction.sellingAgentId) }}</span>
              </dd>
            </div>

            <div>
              <dt>Service Fee</dt>
              <dd>
                {{
                  formatAmountWithCurrency(
                    transaction.totalServiceFee,
                    transaction.currency,
                  )
                }}
              </dd>
            </div>

            <div>
              <dt>Currency</dt>
              <dd>{{ transaction.currency }}</dd>
            </div>

            <div>
              <dt>Created Date</dt>
              <dd>{{ formatDate(transaction.createdAt) }}</dd>
            </div>
          </dl>
        </section>

        <section class="detail-card timeline-card">
          <h2>Stage History Timeline</h2>

          <ol v-if="stageHistory.length > 0" class="stage-timeline">
            <li
              v-for="(historyItem, index) in stageHistory"
              :key="`${historyItem.toStage}-${historyItem.changedAt}`"
              class="stage-timeline__item"
              :class="{ 'stage-timeline__item--last': index === stageHistory.length - 1 }"
            >
              <span class="stage-timeline__marker" aria-hidden="true">✓</span>

              <div>
                <strong>
                  {{ getTransactionStageLabel(historyItem.toStage) }}
                  <span v-if="isCurrentHistoryItem(historyItem, index)">
                    Current
                  </span>
                </strong>
                <time :datetime="historyItem.changedAt">
                  {{ formatDateTime(historyItem.changedAt) }}
                </time>
              </div>
            </li>
          </ol>

          <p v-else class="empty-copy">
            Stage history is not available for this transaction.
          </p>
        </section>
      </div>

      <section class="detail-card breakdown-section">
        <h2>Financial Breakdown</h2>

        <div v-if="breakdown" class="breakdown-grid">
          <article class="breakdown-card">
            <span>Agency Amount</span>
            <strong>
              {{
                formatAmountWithCurrency(
                  breakdown.agencyAmount,
                  transaction.currency,
                )
              }}
            </strong>
            <p>{{ getAgencyShareLabel(breakdown) }}</p>
          </article>

          <article class="breakdown-card breakdown-card--listing">
            <span>Listing Agent Amount</span>
            <strong>
              {{
                formatAmountWithCurrency(
                  breakdown.listingAgentAmount,
                  transaction.currency,
                )
              }}
            </strong>
            <p>
              <NuxtLink
                v-if="getAgentEditPath(transaction.listingAgentId)"
                class="breakdown-agent-link"
                :to="getAgentEditPath(transaction.listingAgentId) || '/'"
              >
                {{ getAgentDisplayName(transaction.listingAgentId) }}
              </NuxtLink>
              <span v-else>
                {{ getAgentDisplayName(transaction.listingAgentId) }}
              </span>
            </p>
            <small>{{ breakdown.listingAgentReason }}</small>
          </article>

          <article class="breakdown-card breakdown-card--selling">
            <span>Selling Agent Amount</span>
            <strong>
              {{
                formatAmountWithCurrency(
                  breakdown.sellingAgentAmount,
                  transaction.currency,
                )
              }}
            </strong>
            <p>
              <NuxtLink
                v-if="getAgentEditPath(transaction.sellingAgentId)"
                class="breakdown-agent-link"
                :to="getAgentEditPath(transaction.sellingAgentId) || '/'"
              >
                {{ getAgentDisplayName(transaction.sellingAgentId) }}
              </NuxtLink>
              <span v-else>
                {{ getAgentDisplayName(transaction.sellingAgentId) }}
              </span>
            </p>
            <small>{{ breakdown.sellingAgentReason }}</small>
          </article>
        </div>

        <div v-else class="breakdown-empty">
          <strong>Breakdown is not available yet</strong>
          <span>
            Financial breakdown is calculated when the transaction reaches
            completed.
          </span>
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.transaction-detail-page {
  display: grid;
  gap: 28px;
}

.back-link {
  align-items: center;
  color: #4b5563;
  display: inline-flex;
  font-size: 16px;
  font-weight: 700;
  gap: 8px;
  width: fit-content;
}

.back-link:hover {
  color: #4f46e5;
}

.back-link span {
  font-size: 20px;
  line-height: 1;
}

.detail-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgb(15 23 42 / 0.08);
}

.detail-hero {
  display: grid;
  gap: 20px;
  padding: 24px;
}

.detail-hero h1 {
  color: #111827;
  font-size: 30px;
  line-height: 1.1;
  margin: 0;
}

.current-stage {
  align-items: center;
  color: #4b5563;
  display: flex;
  flex-wrap: wrap;
  font-size: 15px;
  font-weight: 700;
  gap: 10px;
  margin-top: 14px;
}

.stage-update {
  border-top: 1px solid #e5e7eb;
  display: grid;
  gap: 14px;
  padding-top: 20px;
}

.stage-update label {
  color: #111827;
  font-size: 15px;
  font-weight: 800;
}

.stage-update__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.stage-update select,
.stage-update button {
  border-radius: 8px;
  font: inherit;
  font-size: 16px;
  min-height: 42px;
}

.stage-update select {
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #111827;
  min-width: 220px;
  outline: 0;
  padding: 0 14px;
}

.stage-update select:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgb(79 70 229 / 0.12);
}

.stage-update button {
  background: #4f46e5;
  border: 1px solid #4f46e5;
  color: #ffffff;
  cursor: pointer;
  font-weight: 800;
  padding: 0 20px;
}

.stage-update button:hover:not(:disabled) {
  background: #4338ca;
}

.stage-update button:disabled,
.stage-update select:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.detail-grid {
  display: grid;
  gap: 22px;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.info-card,
.timeline-card,
.breakdown-section {
  padding: 24px;
}

.info-card h2,
.timeline-card h2,
.breakdown-section h2 {
  color: #111827;
  font-size: 18px;
  line-height: 1.2;
  margin: 0;
}

.info-card dl {
  display: grid;
  gap: 18px;
  margin: 28px 0 0;
}

.info-card dt {
  color: #6b7280;
  font-size: 14px;
  font-weight: 800;
  margin-bottom: 10px;
}

.info-card dd {
  color: #111827;
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}

.info-card dd span {
  color: #6b7280;
  display: block;
  font-size: 15px;
  font-weight: 600;
  margin-top: 6px;
}

.agent-detail-link,
.breakdown-agent-link {
  color: #4f46e5;
  font-weight: 800;
}

.agent-detail-link:hover,
.breakdown-agent-link:hover {
  color: #312e81;
}

.stage-timeline {
  display: grid;
  gap: 0;
  list-style: none;
  margin: 26px 0 0;
  padding: 0;
}

.stage-timeline__item {
  display: grid;
  gap: 18px;
  grid-template-columns: 38px minmax(0, 1fr);
  min-height: 92px;
  position: relative;
}

.stage-timeline__item::after {
  background: #4f46e5;
  content: "";
  height: calc(100% - 38px);
  left: 18px;
  position: absolute;
  top: 38px;
  width: 2px;
}

.stage-timeline__item--last {
  min-height: 38px;
}

.stage-timeline__item--last::after {
  display: none;
}

.stage-timeline__marker {
  align-items: center;
  background: #4f46e5;
  border-radius: 999px;
  color: #ffffff;
  display: flex;
  font-size: 16px;
  height: 38px;
  justify-content: center;
  width: 38px;
}

.stage-timeline strong {
  align-items: center;
  color: #111827;
  display: flex;
  flex-wrap: wrap;
  font-size: 17px;
  gap: 8px;
  line-height: 1.2;
}

.stage-timeline strong span {
  background: #eef2ff;
  border-radius: 8px;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 800;
  padding: 3px 8px;
}

.stage-timeline time {
  color: #6b7280;
  display: block;
  font-size: 15px;
  font-weight: 600;
  margin-top: 8px;
}

.breakdown-section {
  display: grid;
  gap: 22px;
}

.breakdown-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.breakdown-card {
  align-items: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-height: 118px;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.breakdown-card--listing {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.breakdown-card--selling {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.breakdown-card span {
  color: #6b7280;
  font-size: 14px;
  font-weight: 800;
}

.breakdown-card strong {
  color: #111827;
  font-size: 28px;
  line-height: 1.1;
  margin-top: 14px;
}

.breakdown-card p {
  color: #6b7280;
  font-size: 15px;
  font-weight: 600;
  margin: 10px 0 0;
}

.breakdown-card small {
  color: #6b7280;
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-top: 8px;
}

.breakdown-card--listing span,
.breakdown-card--listing p {
  color: #4f46e5;
}

.breakdown-card--listing strong {
  color: #312e81;
}

.breakdown-card--selling span,
.breakdown-card--selling p {
  color: #15803d;
}

.breakdown-card--selling strong {
  color: #14532d;
}

.breakdown-empty,
.empty-copy {
  color: #6b7280;
  font-size: 15px;
  font-weight: 600;
}

.breakdown-empty {
  align-items: center;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 120px;
  justify-content: center;
  text-align: center;
}

.breakdown-empty strong {
  color: #111827;
}

.detail-alert {
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

.detail-alert strong {
  color: #7c2d12;
  display: block;
  font-size: 14px;
}

.detail-alert p {
  font-size: 14px;
  margin: 4px 0 0;
}

.detail-alert button {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #111827;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  padding: 10px 14px;
}

.detail-alert button:hover {
  border-color: #4f46e5;
  color: #4f46e5;
}

.detail-skeleton-card {
  display: grid;
  gap: 14px;
  padding: 32px;
}

.detail-skeleton-card span,
.detail-skeleton-card small {
  animation: pulse 1.25s ease-in-out infinite;
  background: #e5e7eb;
  border-radius: 8px;
  display: block;
}

.detail-skeleton-card span {
  height: 34px;
  width: min(360px, 70%);
}

.detail-skeleton-card small {
  height: 18px;
  width: min(260px, 56%);
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

@media (max-width: 1120px) {
  .detail-grid,
  .breakdown-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .detail-hero,
  .info-card,
  .timeline-card,
  .breakdown-section {
    padding: 24px;
  }

  .detail-hero h1 {
    font-size: 30px;
  }

  .stage-update__controls {
    display: grid;
  }

  .stage-update select,
  .stage-update button {
    width: 100%;
  }

  .detail-alert {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
