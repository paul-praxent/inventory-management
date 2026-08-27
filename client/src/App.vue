<template>
  <div class="app">
    <header class="top-nav">
      <div class="nav-container">
        <div class="logo">
          <h1>{{ t('nav.companyName') }}</h1>
          <span class="subtitle">{{ t('nav.subtitle') }}</span>
        </div>

        <button
          class="nav-toggle"
          type="button"
          :aria-expanded="mobileMenuOpen"
          aria-controls="primary-navigation"
          aria-label="Toggle navigation menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
          </svg>
        </button>

        <nav id="primary-navigation" class="nav-tabs" :class="{ open: mobileMenuOpen }">
          <router-link to="/" :class="{ active: $route.path === '/' }" @click="mobileMenuOpen = false">
            {{ t('nav.overview') }}
          </router-link>
          <router-link to="/inventory" :class="{ active: $route.path === '/inventory' }" @click="mobileMenuOpen = false">
            {{ t('nav.inventory') }}
          </router-link>
          <router-link to="/orders" :class="{ active: $route.path === '/orders' }" @click="mobileMenuOpen = false">
            {{ t('nav.orders') }}
          </router-link>
          <router-link to="/spending" :class="{ active: $route.path === '/spending' }" @click="mobileMenuOpen = false">
            {{ t('nav.finance') }}
          </router-link>
          <router-link to="/demand" :class="{ active: $route.path === '/demand' }" @click="mobileMenuOpen = false">
            {{ t('nav.demandForecast') }}
          </router-link>
          <router-link to="/reports" :class="{ active: $route.path === '/reports' }" @click="mobileMenuOpen = false">
            Reports
          </router-link>
        </nav>
        <LanguageSwitcher />
        <ProfileMenu
          @show-profile-details="showProfileDetails = true"
          @show-tasks="showTasks = true"
        />
      </div>
    </header>
    <FilterBar />
    <main class="main-content">
      <router-view />
    </main>

    <ProfileDetailsModal
      :is-open="showProfileDetails"
      @close="showProfileDetails = false"
    />

    <TasksModal
      :is-open="showTasks"
      :tasks="tasks"
      @close="showTasks = false"
      @add-task="addTask"
      @delete-task="deleteTask"
      @toggle-task="toggleTask"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from './api'
import { useAuth } from './composables/useAuth'
import { useI18n } from './composables/useI18n'
import FilterBar from './components/FilterBar.vue'
import ProfileMenu from './components/ProfileMenu.vue'
import ProfileDetailsModal from './components/ProfileDetailsModal.vue'
import TasksModal from './components/TasksModal.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'

export default {
  name: 'App',
  components: {
    FilterBar,
    ProfileMenu,
    ProfileDetailsModal,
    TasksModal,
    LanguageSwitcher
  },
  setup() {
    const { currentUser } = useAuth()
    const { t } = useI18n()
    const showProfileDetails = ref(false)
    const showTasks = ref(false)
    const apiTasks = ref([])
    const mobileMenuOpen = ref(false)

    // Close the mobile nav panel whenever navigation happens (covers back/
    // forward and any programmatic route changes, not just link clicks)
    const route = useRoute()
    watch(() => route.path, () => {
      mobileMenuOpen.value = false
    })

    // Merge mock tasks from currentUser with API tasks
    const tasks = computed(() => {
      return [...currentUser.value.tasks, ...apiTasks.value]
    })

    const loadTasks = async () => {
      try {
        apiTasks.value = await api.getTasks()
      } catch (err) {
        console.error('Failed to load tasks:', err)
      }
    }

    const addTask = async (taskData) => {
      try {
        const newTask = await api.createTask(taskData)
        // Add new task to the beginning of the array
        apiTasks.value.unshift(newTask)
      } catch (err) {
        console.error('Failed to add task:', err)
      }
    }

    const deleteTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const isMockTask = currentUser.value.tasks.some(t => t.id === taskId)

        if (isMockTask) {
          // Remove from mock tasks
          const index = currentUser.value.tasks.findIndex(t => t.id === taskId)
          if (index !== -1) {
            currentUser.value.tasks.splice(index, 1)
          }
        } else {
          // Remove from API tasks
          await api.deleteTask(taskId)
          apiTasks.value = apiTasks.value.filter(t => t.id !== taskId)
        }
      } catch (err) {
        console.error('Failed to delete task:', err)
      }
    }

    const toggleTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const mockTask = currentUser.value.tasks.find(t => t.id === taskId)

        if (mockTask) {
          // Toggle mock task status
          mockTask.status = mockTask.status === 'pending' ? 'completed' : 'pending'
        } else {
          // Toggle API task
          const updatedTask = await api.toggleTask(taskId)
          const index = apiTasks.value.findIndex(t => t.id === taskId)
          if (index !== -1) {
            apiTasks.value[index] = updatedTask
          }
        }
      } catch (err) {
        console.error('Failed to toggle task:', err)
      }
    }

    onMounted(loadTasks)

    return {
      t,
      showProfileDetails,
      showTasks,
      tasks,
      addTask,
      deleteTask,
      toggleTask,
      mobileMenuOpen
    }
  }
}
</script>

<style>
/*
 * Design tokens
 * Stage 1 of color-token remediation: canonical CSS custom properties for the
 * palette already in use across client/src. `:root` custom properties cascade
 * globally (they are not affected by Vue's scoped-style attribute selectors),
 * so every component's `<style scoped>` block can reference these with var()
 * without redeclaring :root locally.
 *
 * Naming: each status hue (brand/success/warning/danger) has up to 3 tiers —
 * a base "-accent" tint used for lighter/secondary emphasis (gradients, card
 * accent borders, hover-source states) and a darker primary tone used for
 * solid fills/active text, plus "-dark" for the deepest text-on-light-bg tone.
 * Where two tiers of the same hue are used together in one place (a gradient
 * stop pair, or a hover-darken transition), both tiers are preserved as
 * distinct tokens rather than merged, since collapsing them would visibly
 * change that gradient/transition. Where a hex value was a one-off near-dup
 * of an already-established token (no gradient/pairing dependency), it was
 * consolidated into that canonical token instead of kept separate.
 */
:root {
  /* Text */
  --color-text-heading: #0f172a;
  --color-text-body: #334155;
  --color-text-label: #475569;
  --color-text-muted: #64748b;
  --color-text-faint: #94a3b8;

  /* Brand (blue) */
  --color-brand: #2563eb;
  --color-brand-accent: #3b82f6;
  --color-brand-accent-light: #60a5fa;
  --color-brand-dark: #1e40af;
  --color-brand-light: #eff6ff;
  --color-brand-border: #bfdbfe;

  /* Success (green) */
  --color-success: #059669;
  --color-success-accent: #10b981;
  --color-success-dark: #065f46;
  --color-success-bg: #d1fae5;
  --color-success-surface: #f0fdf4;
  --color-success-border: #86efac;

  /* Warning (orange/amber) */
  --color-warning: #ea580c;
  --color-warning-accent: #f59e0b;
  --color-warning-strong: #d97706;
  --color-warning-dark: #92400e;
  --color-warning-bg: #fed7aa;
  --color-warning-surface: #fffbeb;
  --color-warning-border: #fcd34d;

  /* Danger (red) */
  --color-danger: #dc2626;
  --color-danger-accent: #ef4444;
  --color-danger-dark: #991b1b;
  --color-danger-bg: #fecaca;
  --color-danger-surface: #fef2f2;

  /* Info (reuses brand blue, distinct light badge surface) */
  --color-info-bg: #dbeafe;
  --color-info-text: var(--color-brand-dark);

  /* Neutral / indigo "stable" badge accent (distinct hue, no existing role) */
  --color-neutral-bg: #e0e7ff;
  --color-neutral-text: #3730a3;

  /* Violet accent (cost-breakdown "operational" category, no existing role) */
  --color-accent-violet: #8b5cf6;
  --color-accent-violet-border: #c4b5fd;
  --color-accent-violet-bg: #f5f3ff;

  /* Surface & border neutrals */
  --color-bg-page: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-border-subtle: #f1f5f9;
  --color-border-strong: #cbd5e1;

  /* Spacing scale (for later remediation stages to consume) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-7: 1.75rem;
  --space-8: 2rem;
  --space-9: 2.25rem;

  /* Border radius */
  --radius-button: 6px;
  --radius-card: 10px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: var(--color-bg-page);
  color: var(--color-text-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.top-nav {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  padding: 0 2rem;
  height: 70px;
}

.nav-container > .nav-tabs {
  margin-left: auto;
  margin-right: 1rem;
}

.nav-container > .language-switcher {
  margin-right: 1rem;
}

.logo {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.logo h1 {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text-heading);
  letter-spacing: -0.025em;
}

.subtitle {
  font-size: 0.813rem;
  color: var(--color-text-muted);
  font-weight: 400;
  padding-left: 0.75rem;
  border-left: 1px solid var(--color-border);
}

.nav-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-left: auto;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-muted);
  cursor: pointer;
}

.nav-toggle svg {
  width: 22px;
  height: 22px;
}

.nav-tabs {
  display: flex;
  gap: 0.25rem;
}

.nav-tabs a {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0.625rem 1.25rem;
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.938rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  position: relative;
}

.nav-tabs a:hover {
  color: var(--color-text-heading);
  background: var(--color-border-subtle);
}

.nav-tabs a.active {
  color: var(--color-brand);
  background: var(--color-brand-light);
}

.nav-tabs a.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-brand);
}

.main-content {
  flex: 1;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem 2rem;
}

/*
 * Mobile nav: the 6 nav-tabs links no longer fit in the non-wrapping header
 * row below 768px, so they collapse behind a hamburger toggle and reappear
 * as a slide-down panel anchored under the header. Logo + profile menu stay
 * inline since those must always remain reachable/visible.
 */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 1rem;
  }

  .subtitle {
    display: none;
  }

  .logo h1 {
    font-size: 1.125rem;
  }

  .nav-toggle {
    display: flex;
  }

  .nav-container > .nav-tabs {
    margin-left: 0;
    margin-right: 0;
  }

  .nav-tabs {
    display: none;
    flex-direction: column;
    gap: 0;
    position: absolute;
    top: 70px;
    left: 0;
    right: 0;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    padding: 0.5rem;
  }

  .nav-tabs.open {
    display: flex;
  }

  .nav-tabs a {
    padding: 0.75rem 1rem;
    border-radius: 6px;
  }

  .nav-tabs a.active::after {
    display: none;
  }
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-text-heading);
  margin-bottom: 0.375rem;
  letter-spacing: -0.025em;
}

.page-header p {
  color: var(--color-text-muted);
  font-size: 0.938rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.25rem;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.stat-label {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.625rem;
}

.stat-value {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-text-heading);
  letter-spacing: -0.025em;
}

.stat-card.warning .stat-value {
  color: var(--color-warning);
}

.stat-card.success .stat-value {
  color: var(--color-success);
}

.stat-card.danger .stat-value {
  color: var(--color-danger);
}

.stat-card.info .stat-value {
  color: var(--color-brand);
}

.card {
  background: white;
  border-radius: 10px;
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  margin-bottom: 1.25rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid var(--color-border);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-heading);
  letter-spacing: -0.025em;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: var(--color-bg-page);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  color: var(--color-text-label);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

td {
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--color-border-subtle);
  color: var(--color-text-body);
  font-size: 0.875rem;
}

tbody tr {
  transition: background-color 0.15s ease;
}

tbody tr:hover {
  background: var(--color-bg-page);
}

.badge {
  display: inline-block;
  padding: 0.313rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.badge.success {
  background: var(--color-success-bg);
  color: var(--color-success-dark);
}

.badge.warning {
  background: var(--color-warning-bg);
  color: var(--color-warning-dark);
}

.badge.danger {
  background: var(--color-danger-bg);
  color: var(--color-danger-dark);
}

.badge.info {
  background: var(--color-info-bg);
  color: var(--color-info-text);
}

.badge.increasing {
  background: var(--color-success-bg);
  color: var(--color-success-dark);
}

.badge.decreasing {
  background: var(--color-danger-bg);
  color: var(--color-danger-dark);
}

.badge.stable {
  background: var(--color-neutral-bg);
  color: var(--color-neutral-text);
}

.badge.high {
  background: var(--color-danger-bg);
  color: var(--color-danger-dark);
}

.badge.medium {
  background: var(--color-warning-bg);
  color: var(--color-warning-dark);
}

.badge.low {
  background: var(--color-info-bg);
  color: var(--color-info-text);
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-muted);
  font-size: 0.938rem;
}

.error {
  background: var(--color-danger-surface);
  border: 1px solid var(--color-danger-bg);
  color: var(--color-danger-dark);
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-size: 0.938rem;
}
</style>
