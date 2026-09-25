<script setup lang="ts">
import { env } from '@/core/config/env'
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-gray-100 p-4">
    <div class="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
      <p class="mb-4 font-bold text-indigo-600">{{ env.appName }}</p>
      <slot />
    </div>
  </div>
</template>