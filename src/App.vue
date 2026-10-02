<script setup lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue'
import AppToaster from '@/components/ui/AppToaster.vue'
</script>

<template>
  <RouterView />
  <AppDialog />
  <AppToaster />
</template>
