<template>
  <div class="app-shell">
    <header class="app-header">
      <NuxtLink to="/" class="brand">Estate Transactions</NuxtLink>

      <nav class="nav-links" aria-label="Primary navigation">
        <NuxtLink to="/transactions">Transactions</NuxtLink>
        <NuxtLink to="/transactions/create">Create transaction</NuxtLink>
        <NuxtLink to="/agents">Agents</NuxtLink>
        <NuxtLink to="/agents/create">Create agent</NuxtLink>
      </nav>
    </header>

    <main class="app-main">
      <slot />
    </main>
  </div>
</template>
