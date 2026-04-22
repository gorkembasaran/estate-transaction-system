import { computed, onMounted, ref } from 'vue'

type ThemeMode = 'light' | 'dark'

const themeStorageKey = 'estate-manager-theme'

export function useThemeMode() {
  const themeMode = ref<ThemeMode>('light')

  const themeToggleLabel = computed(() =>
    themeMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
  )

  function applyTheme(mode: ThemeMode): void {
    themeMode.value = mode
    document.documentElement.dataset.theme = mode
    document.documentElement.style.colorScheme = mode
    localStorage.setItem(themeStorageKey, mode)
  }

  function toggleTheme(): void {
    applyTheme(themeMode.value === 'dark' ? 'light' : 'dark')
  }

  function syncInitialTheme(): void {
    const currentTheme = document.documentElement.dataset.theme

    if (isThemeMode(currentTheme)) {
      themeMode.value = currentTheme
      return
    }

    const savedTheme = localStorage.getItem(themeStorageKey)

    if (isThemeMode(savedTheme)) {
      applyTheme(savedTheme)
      return
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    applyTheme(prefersDark ? 'dark' : 'light')
  }

  onMounted(syncInitialTheme)

  return {
    themeMode,
    themeToggleLabel,
    toggleTheme,
  }
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark'
}
