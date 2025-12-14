<template>
  <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-light text-gray-900">New Project</h2>
          <button
            class="text-gray-400 hover:text-gray-600 transition-colors"
            @click="$emit('close')"
          >
            <X :size="20" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="mb-4">
            <label for="projectName" class="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              id="projectName"
              v-model="form.name"
              type="text"
              required
              placeholder="Enter project name"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-todoist-red focus:border-transparent outline-none transition-all duration-200"
              @keyup.enter="handleSubmit"
            >
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-3">
              Color
            </label>
            <div class="flex items-center space-x-2">
              <button
                v-for="color in colors"
                :key="color"
                type="button"
                class="w-8 h-8 rounded-full border-2 transition-all duration-200 shrink-0"
                :class="[
                  form.color === color
                    ? 'border-gray-800 scale-110'
                    : 'border-gray-300 hover:border-gray-400'
                ]"
                :style="{ backgroundColor: color }"
                @click="form.color = color"
              />
            </div>
          </div>

          <div class="flex space-x-3">
            <button
              type="button"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              @click="$emit('close')"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!form.name.trim() || submitting"
              class="flex-1 px-4 py-2 bg-todoist-red text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {{ submitting ? 'Creating...' : 'Create Project' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

// Props
const _props = defineProps<{
  submitting?: boolean
}>()

// Emits
const emit = defineEmits<{
  close: []
  submit: [payload: { name: string; color: string }]
}>()

// State
const form = ref({
  name: '',
  color: '#dc4c3e' // Default Todoist red
})

const colors = [
  '#dc4c3e', // Todoist red
  '#e67321', // Orange
  '#f4b350', // Yellow
  '#8bc441', // Green
  '#25a559', // Teal
  '#48c9b0', // Cyan
  '#3498db', // Blue
  '#5dade2', // Light blue
  '#9b59b6', // Purple
  '#af7ac5', // Lavender
  '#e91e63', // Pink
  '#795548', // Brown
]

const handleSubmit = () => {
  if (!form.value.name.trim()) return

  emit('submit', {
    name: form.value.name.trim(),
    color: form.value.color
  })
}
</script>

<style scoped>
.todoist-red {
  background-color: #dc4c3e;
}
</style>
