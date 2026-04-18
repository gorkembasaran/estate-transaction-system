<script setup lang="ts">
type CardTone = 'neutral' | 'success' | 'warning' | 'accent'
type CardIcon = 'document' | 'check' | 'clock' | 'users' | 'dollar' | 'trend'
type MetricTone = 'positive' | 'negative' | 'neutral'

withDefaults(
  defineProps<{
    cornerMetric?: string
    cornerMetricTone?: MetricTone
    icon: CardIcon
    isLoading?: boolean
    label: string
    supportingLabel: string
    tone?: CardTone
    value: number | string
    valueMetric?: string
    valueMetricTone?: MetricTone
  }>(),
  {
    cornerMetric: undefined,
    cornerMetricTone: 'neutral',
    isLoading: false,
    tone: 'neutral',
    valueMetric: undefined,
    valueMetricTone: 'neutral',
  },
)
</script>

<template>
  <article class="stat-card" :class="[`stat-card--${tone}`]">
    <div class="stat-card__top">
      <div class="stat-card__icon" aria-hidden="true">
        <svg v-if="icon === 'document'" viewBox="0 0 24 24">
          <path d="M6 3.75h8l4 4v12.5H6z" />
          <path d="M14 3.75v4h4" />
          <path d="M9 12h6" />
          <path d="M9 15.5h6" />
        </svg>
        <svg v-else-if="icon === 'check'" viewBox="0 0 24 24">
          <path d="M20 11.25v.7a8 8 0 1 1-4.75-7.32" />
          <path d="m8.8 11.75 2.35 2.35 6.1-6.1" />
        </svg>
        <svg v-else-if="icon === 'clock'" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7.75V12l3 2" />
        </svg>
        <svg v-else-if="icon === 'users'" viewBox="0 0 24 24">
          <path d="M9.5 11.25a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          <path d="M4.5 19.25a5 5 0 0 1 10 0" />
          <path d="M16.5 10.25a2.5 2.5 0 1 0 0-5" />
          <path d="M17.5 14.25a4.5 4.5 0 0 1 3 4.25" />
        </svg>
        <svg v-else-if="icon === 'dollar'" viewBox="0 0 24 24">
          <path d="M12 4v16" />
          <path d="M16.5 7.5h-6a2.5 2.5 0 0 0 0 5h3a2.5 2.5 0 0 1 0 5h-6" />
        </svg>
        <svg v-else viewBox="0 0 24 24">
          <path d="m5 16 5-5 3 3 6-7" />
          <path d="M14 7h5v5" />
        </svg>
      </div>

      <span
        v-if="cornerMetric && !isLoading"
        class="stat-card__metric"
        :class="[`stat-card__metric--${cornerMetricTone}`]"
      >
        {{ cornerMetric }}
      </span>
    </div>

    <div class="stat-card__content">
      <p class="stat-card__label">
        {{ label }}
      </p>

      <div v-if="isLoading" class="stat-card__skeleton">
        <span />
        <small />
      </div>

      <template v-else>
        <div class="stat-card__value-row">
          <strong class="stat-card__value">
            {{ value }}
          </strong>
          <span
            v-if="valueMetric"
            class="stat-card__value-metric"
            :class="[`stat-card__metric--${valueMetricTone}`]"
          >
            {{ valueMetric }}
          </span>
        </div>
        <span class="stat-card__support">
          {{ supportingLabel }}
        </span>
        <slot />
      </template>
    </div>
  </article>
</template>

<style scoped>
.stat-card {
  align-items: flex-start;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgb(15 23 42 / 0.08);
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 168px;
  padding: 32px;
}

.stat-card--accent {
  background: #5748f7;
  border-color: #5748f7;
  color: #ffffff;
}

.stat-card__top {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  width: 100%;
}

.stat-card__icon {
  align-items: center;
  background: #eef2ff;
  border-radius: 8px;
  color: #4f46e5;
  display: flex;
  flex: 0 0 auto;
  height: 62px;
  justify-content: center;
  width: 62px;
}

.stat-card__icon svg {
  height: 32px;
  width: 32px;
}

.stat-card__icon svg * {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.stat-card--success .stat-card__icon {
  background: #dcfce7;
  color: #15803d;
}

.stat-card--warning .stat-card__icon {
  background: #ffedd5;
  color: #c2410c;
}

.stat-card--accent .stat-card__icon {
  background: rgb(255 255 255 / 0.18);
  color: #ffffff;
}

.stat-card__content {
  min-width: 0;
  width: 100%;
}

.stat-card__label {
  color: #6b7280;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0;
  margin: 0 0 10px;
}

.stat-card--accent .stat-card__label {
  color: rgb(255 255 255 / 0.82);
}

.stat-card__value-row {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.stat-card__value {
  color: #111827;
  display: block;
  font-size: 38px;
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.stat-card--accent .stat-card__value {
  color: #ffffff;
}

.stat-card__metric,
.stat-card__value-metric {
  display: inline-flex;
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
}

.stat-card__metric {
  margin-top: 15px;
}

.stat-card__value-metric {
  font-size: 16px;
}

.stat-card__metric--positive {
  color: #16a34a;
}

.stat-card__metric--negative {
  color: #dc2626;
}

.stat-card__metric--neutral {
  color: #6b7280;
}

.stat-card--accent .stat-card__metric--positive,
.stat-card--accent .stat-card__metric--negative,
.stat-card--accent .stat-card__metric--neutral {
  color: rgb(255 255 255 / 0.82);
}

.stat-card__support {
  color: #6b7280;
  display: block;
  font-size: 16px;
  margin-top: 10px;
}

.stat-card--accent .stat-card__support {
  color: rgb(255 255 255 / 0.78);
}

.stat-card__skeleton span,
.stat-card__skeleton small {
  animation: pulse 1.25s ease-in-out infinite;
  background: #e5e7eb;
  border-radius: 8px;
  display: block;
}

.stat-card--accent .stat-card__skeleton span,
.stat-card--accent .stat-card__skeleton small {
  background: rgb(255 255 255 / 0.22);
}

.stat-card__skeleton span {
  height: 32px;
  width: 92px;
}

.stat-card__skeleton small {
  height: 13px;
  margin-top: 10px;
  width: 140px;
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
</style>
