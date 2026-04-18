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
