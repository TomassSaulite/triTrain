<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppField from '@/components/ui/AppField.vue'
import { useForm } from '@/composables/useForm'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { submitting, error, fieldErrors, submit } = useForm()

const email = ref('')
const password = ref('')

async function login(): Promise<void> {
  await submit(() => auth.login(email.value, password.value))

  if (auth.isAuthenticated) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
  }
}
</script>

<template>
  <AuthLayout>
    <h1 class="mb-4 text-lg font-semibold">Sign in</h1>
    <form class="space-y-4" @submit.prevent="login">
      <AppAlert v-if="error && !fieldErrors.email" tone="error">{{ error }}</AppAlert>
      <AppField
        v-model="email"
        label="Email"
        type="email"
        autocomplete="email"
        :error="fieldErrors.email"
        required
      />
      <AppField
        v-model="password"
        label="Password"
        type="password"
        autocomplete="current-password"
        :error="fieldErrors.password"
        required
      />
      <AppButton type="submit" class="w-full" :loading="submitting">Sign in</AppButton>
    </form>
    <p class="mt-4 text-center text-sm text-slate-600">
      New here?
      <RouterLink :to="{ name: 'register' }" class="font-medium text-indigo-600 hover:underline"
        >Create an account</RouterLink
      >
    </p>
  </AuthLayout>
</template>
