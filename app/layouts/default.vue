<template>
  <div class="min-h-screen bg-gray-50">
    <slot />
  </div>
</template>

<script setup lang="ts">
useHead({
  titleTemplate: '%s - Time Management',
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'Minimalist Time Management Application inspired by Todoist' }
  ],
  bodyAttrs: {
    class: 'bg-gray-50'
  }
})
</script>
