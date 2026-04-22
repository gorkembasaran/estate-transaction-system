<script setup lang="ts">
import { useThemeMode } from '~/composables/theme/useThemeMode'

const { themeMode, themeToggleLabel, toggleTheme } = useThemeMode()
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar" aria-label="Application navigation">
      <div class="sidebar-brand">
        <div class="sidebar-brand__top">
          <div class="sidebar-brand__copy">
            <NuxtLink to="/" class="brand">Estate Manager</NuxtLink>
            <span>Transaction System</span>
          </div>
          <button
            class="theme-toggle"
            type="button"
            :aria-label="themeToggleLabel"
            :title="themeToggleLabel"
            @click="toggleTheme"
          >
            <span class="theme-toggle__icon" aria-hidden="true">
              <svg v-if="themeMode === 'dark'" viewBox="0 0 24 24">
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
              <svg v-else class="theme-toggle__moon" viewBox="0 0 24 24">
                <path d="M12 3a6.5 6.5 0 0 0 8.9 6.05A8.5 8.5 0 1 1 12 3z" />
              </svg>
            </span>
          </button>
        </div>
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
