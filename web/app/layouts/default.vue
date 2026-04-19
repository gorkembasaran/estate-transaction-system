<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type ThemeMode = 'light' | 'dark'

const themeMode = ref<ThemeMode>('light')

const themeToggleLabel = computed(() =>
  themeMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
)

const themeToggleText = computed(() =>
  themeMode.value === 'dark' ? 'Light mode' : 'Dark mode',
)

function applyTheme(mode: ThemeMode): void {
  themeMode.value = mode
  document.documentElement.dataset.theme = mode
  document.documentElement.style.colorScheme = mode
  localStorage.setItem('estate-manager-theme', mode)
}

function toggleTheme(): void {
  applyTheme(themeMode.value === 'dark' ? 'light' : 'dark')
}

onMounted(() => {
  const savedTheme = localStorage.getItem('estate-manager-theme')

  if (savedTheme === 'light' || savedTheme === 'dark') {
    applyTheme(savedTheme)
    return
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  applyTheme(prefersDark ? 'dark' : 'light')
})
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar" aria-label="Application navigation">
      <div class="sidebar-brand">
        <NuxtLink to="/" class="brand">Estate Manager</NuxtLink>
        <span>Transaction System</span>
      </div>

      <nav class="nav-links" aria-label="Primary navigation">
        <NuxtLink to="/">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="4" width="6" height="6" rx="1.5" />
            <rect x="14" y="4" width="6" height="6" rx="1.5" />
            <rect x="4" y="14" width="6" height="6" rx="1.5" />
            <rect x="14" y="14" width="6" height="6" rx="1.5" />
          </svg>
          <span>Dashboard</span>
        </NuxtLink>
        <NuxtLink to="/transactions">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 3.75h8l4 4v12.5H6z" />
            <path d="M14 3.75v4h4" />
            <path d="M9 12h6" />
            <path d="M9 15.5h6" />
          </svg>
          <span>Transactions</span>
        </NuxtLink>
        <NuxtLink to="/agents">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9.5 11.25a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            <path d="M4.5 19.25a5 5 0 0 1 10 0" />
            <path d="M16.5 10.25a2.5 2.5 0 1 0 0-5" />
            <path d="M17.5 14.25a4.5 4.5 0 0 1 3 4.25" />
          </svg>
          <span>Agents</span>
        </NuxtLink>
      </nav>

      <button
        class="theme-toggle"
        type="button"
        :aria-label="themeToggleLabel"
        @click="toggleTheme"
      >
        <span class="theme-toggle__icon" aria-hidden="true">
          <svg v-if="themeMode === 'dark'" viewBox="0 0 24 24">
            <path d="M5.75 12a6.25 6.25 0 0 0 9.9 5.08 7.25 7.25 0 0 1-8.73-8.73A6.23 6.23 0 0 0 5.75 12z" />
          </svg>
          <svg v-else viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.75v2" />
            <path d="M12 19.25v2" />
            <path d="m4.22 4.22 1.42 1.42" />
            <path d="m18.36 18.36 1.42 1.42" />
            <path d="M2.75 12h2" />
            <path d="M19.25 12h2" />
            <path d="m4.22 19.78 1.42-1.42" />
            <path d="m18.36 5.64 1.42-1.42" />
          </svg>
        </span>
        <span>{{ themeToggleText }}</span>
      </button>

      <div class="sidebar-user">
        <div class="sidebar-user__avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 12a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5z" />
            <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
          </svg>
        </div>
        <div>
          <strong>Admin User</strong>
          <span>admin@estate.com</span>
        </div>
      </div>
    </aside>

    <main class="app-main">
      <slot />
    </main>
  </div>
</template>
