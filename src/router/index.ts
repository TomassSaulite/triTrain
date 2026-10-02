import { createRouter, createWebHistory, type RouteLocationRaw } from 'vue-router'
import { onUnauthorized } from '@/api'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** Only for signed-out visitors (login, register). */
    guest?: boolean
    /** Needs an athlete profile; otherwise the athlete is sent to onboarding. */
    athlete?: boolean
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guest: true },
    },
    { path: '/welcome', name: 'onboarding', component: () => import('@/views/OnboardingView.vue') },
    {
      path: '/',
      component: AppLayout,
      meta: { athlete: true },
      children: [
        { path: '', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
        { path: 'calendar', name: 'calendar', component: () => import('@/views/CalendarView.vue') },
        {
          path: 'workouts/:id',
          name: 'workout',
          component: () => import('@/views/WorkoutView.vue'),
          props: true,
        },
        { path: 'plan', name: 'plan', component: () => import('@/views/PlanView.vue') },
        { path: 'coach', name: 'coach', component: () => import('@/views/CoachView.vue') },
        { path: 'races', name: 'races', component: () => import('@/views/RacesView.vue') },
        {
          path: 'races/:id/strategy',
          name: 'race-strategy',
          component: () => import('@/views/RaceStrategyView.vue'),
          props: true,
        },
        { path: 'activities', name: 'activities', component: () => import('@/views/ActivitiesView.vue') },
        { path: 'library', name: 'library', component: () => import('@/views/LibraryView.vue') },
        {
          path: 'library/new',
          name: 'template-new',
          component: () => import('@/views/TemplateEditorView.vue'),
        },
        {
          path: 'library/:id/edit',
          name: 'template-edit',
          component: () => import('@/views/TemplateEditorView.vue'),
          props: true,
        },
        { path: 'settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to): Promise<RouteLocationRaw | true> => {
  const auth = useAuthStore()

  if (!auth.isAuthenticated) {
    return to.meta.guest
      ? true
      : { name: 'login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } }
  }

  if (to.meta.guest) {
    return { name: 'dashboard' }
  }

  try {
    await auth.ensureUser()
  } catch {
    await auth.logout(false)

    return { name: 'login' }
  }

  const needsAthlete = to.matched.some((record) => record.meta.athlete)

  if (needsAthlete && !auth.athlete) {
    return { name: 'onboarding' }
  }

  return true
})

onUnauthorized(() => {
  void useAuthStore()
    .logout(false)
    .then(() => router.push({ name: 'login' }))
})
