<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppField from '@/components/ui/AppField.vue'
import { useForm } from '@/composables/useForm'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const { submitting, error, fieldErrors, submit } = useForm()

const form = reactive({ name: '', email: '', password: '', password_confirmation: '' })

async function register(): Promise<void> {
  await submit(() => auth.register(form))

  if (auth.isAuthenticated) {
    await router.push({ name: 'onboarding' })
  }
}
</script>

<template>
  <AuthLayout>
    <h1 class="mb-4 text-lg font-semibold">Create your account</h1>
    <form class="space-y-4" @submit.prevent="register">
      <AppAlert v-if="error && Object.keys(fieldErrors).length === 0" tone="error">{{ error }}</AppAlert>
      <AppField v-model="form.name" label="Name" autocomplete="name" :error="fieldErrors.name" required />
      <AppField
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="email"
        :error="fieldErrors.email"
        required
      />
      <AppField
        v-model="form.password"
        label="Password"
        type="password"
        autocomplete="new-password"
        hint="At least 8 characters."
        :error="fieldErrors.password"
        required
      />
      <AppField
        v-model="form.password_confirmation"
        label="Confirm password"
        type="password"
        autocomplete="new-password"
        required
      />
      <AppButton type="submit" class="w-full" :loading="submitting">Create account</AppButton>
    </form>
    <p class="mt-4 text-center text-sm text-slate-600">
      Already training with us?
      <RouterLink :to="{ name: 'login' }" class="font-medium text-indigo-600 hover:underline"
        >Sign in</RouterLink
      >
    </p>
  </AuthLayout>
</template>
