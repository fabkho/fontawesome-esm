<script setup lang="ts">
/**
 * FaLazy.vue - Zero-dependency lazy-loading FontAwesome icon component
 *
 * Copy this file into your project and configure FA_ICON_CDN_URL.
 *
 * Usage:
 *   <FaLazy icon="user" />
 *   <FaLazy icon="chevron-right" />
 *
 * Requires: Pre-built ESM icon chunks hosted on a CDN
 * See: https://github.com/fabiankirchhoff/fontawesome-chunks
 */

import { ref, watch } from 'vue'

const props = defineProps<{
  icon: string
}>()

// Configure this to point to your CDN
const FA_ICON_CDN_URL = '/icons/solid'

const loading = ref(true)
const error = ref(false)
const iconData = ref<{ width: number; height: number; path: string } | null>(null)

function toIconKey(name: string): string {
  // kebab-case to PascalCase: "chevron-right" -> "ChevronRight"
  return name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

async function loadIcon(name: string) {
  loading.value = true
  error.value = false
  iconData.value = null

  const key = toIconKey(name)
  const url = `${FA_ICON_CDN_URL}/fa${key}.js`

  try {
    const module = await import(/* @vite-ignore */ url)
    const def = module.definition || module.default?.definition

    if (def?.icon) {
      const [width, height, , , path] = def.icon
      iconData.value = { width, height, path }
    } else {
      error.value = true
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

watch(() => props.icon, (name) => loadIcon(name), { immediate: true })
</script>

<template>
  <!-- Loading spinner -->
  <svg
    v-if="loading"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    fill="currentColor"
    class="fa-lazy fa-lazy-loading"
  >
    <path
      d="M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z"
    />
  </svg>

  <!-- Error icon -->
  <svg
    v-else-if="error"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    fill="currentColor"
    class="fa-lazy fa-lazy-error"
  >
    <path
      d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24l0 112c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-112c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"
    />
  </svg>

  <!-- Loaded icon -->
  <svg
    v-else-if="iconData"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="`0 0 ${iconData.width} ${iconData.height}`"
    fill="currentColor"
    class="fa-lazy"
  >
    <path :d="iconData.path" />
  </svg>
</template>

<style scoped>
.fa-lazy {
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
}

.fa-lazy-loading {
  animation: fa-lazy-spin 1s linear infinite;
}

.fa-lazy-error {
  opacity: 0.5;
}

@keyframes fa-lazy-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
