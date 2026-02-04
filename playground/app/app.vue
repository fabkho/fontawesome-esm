<script setup lang="ts">
const search = ref('')
const currentIcon = ref('user')

function loadIcon() {
  const name = search.value.trim()
  if (name) {
    currentIcon.value = name
  }
}
</script>

<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div class="w-full max-w-sm space-y-6">
        <h1 class="text-xl font-semibold text-center text-white">FontAwesome ESM</h1>

        <form @submit.prevent="loadIcon" class="flex gap-2">
          <UInput
            v-model="search"
            placeholder="e.g. user, arrow-down, heart"
            size="lg"
            class="flex-1"
          />
          <UButton type="submit" size="lg">
            Load
          </UButton>
        </form>

        <div class="flex flex-col items-center gap-4 p-8 bg-gray-900 rounded-lg">
          <FaLazy
            :icon="currentIcon"
            class="w-24 h-24 text-blue-500"
          />
          <div class="text-sm text-gray-400">
            {{ currentIcon }}
          </div>
        </div>

        <p class="text-xs text-center text-gray-600">
          Try: user, house, gear, heart, star, check, xmark, envelope
        </p>
      </div>
    </div>
  </UApp>
</template>
