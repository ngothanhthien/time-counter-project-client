<template>
  <div class="bg-white rounded-lg border border-gray-200 p-6 relative">
    <!-- Timer Display and Control -->
    <div class="flex items-center justify-between gap-4">
      <div
        class="text-4xl font-light font-mono transition-colors"
        :style="isRunning ? { color: 'var(--todoist-green)' } : { color: 'var(--todoist-red)' }"
      >
        {{ formatTime(elapsedSeconds) }}
      </div>
      <div class="flex items-center gap-2">
        <button
          :disabled="isSaving"
          class="p-2 hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity bg-transparent border-none cursor-pointer"
          :style="isRunning ? { color: 'var(--todoist-green)' } : { color: 'var(--todoist-red)' }"
          @click="toggleTimer"
        >
          <Play v-if="!isRunning" :size="24" />
          <Square v-else :size="24" />
        </button>
        <div ref="menuRef" class="relative">
          <button
            class="p-2 hover:opacity-70 transition-opacity bg-transparent border-none cursor-pointer text-gray-600 hover:text-gray-900"
            @click="showMenu = !showMenu"
          >
            <MoreVertical :size="20" />
          </button>
          <!-- Dropdown Menu -->
          <div
            v-if="showMenu"
            class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
          >
            <button
              class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              @click="openEditModal"
            >
              <Edit3 :size="16" />
              Edit
            </button>
            <button
              class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              @click="openDeleteModal"
            >
              <Trash2 :size="16" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Time Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      @click.self="closeEditModal"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-light text-gray-900">Edit Time</h2>
            <button
              class="text-gray-400 hover:text-gray-600 transition-colors"
              @click="closeEditModal"
            >
              <X :size="20" />
            </button>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Time (HH:MM:SS)
            </label>
            <div class="flex space-x-2">
              <input
                v-model.number="editHours"
                type="number"
                min="0"
                max="23"
                placeholder="HH"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-todoist-red focus:border-transparent outline-none text-center"
              >
              <span class="flex items-center text-gray-500">:</span>
              <input
                v-model.number="editMinutes"
                type="number"
                min="0"
                max="59"
                placeholder="MM"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-todoist-red focus:border-transparent outline-none text-center"
              >
              <span class="flex items-center text-gray-500">:</span>
              <input
                v-model.number="editSeconds"
                type="number"
                min="0"
                max="59"
                placeholder="SS"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-todoist-red focus:border-transparent outline-none text-center"
              >
            </div>
          </div>

          <div class="flex space-x-3">
            <button
              type="button"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              @click="closeEditModal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="flex-1 px-4 py-2 bg-todoist-red text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              @click="saveEditTime"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      @click.self="closeDeleteModal"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-light text-gray-900">Delete Timer</h2>
            <button
              class="text-gray-400 hover:text-gray-600 transition-colors"
              @click="closeDeleteModal"
            >
              <X :size="20" />
            </button>
          </div>

          <p class="text-gray-700 mb-6">
            Are you sure you want to reset the timer? This will clear all current time.
          </p>

          <div class="flex space-x-3">
            <button
              type="button"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              @click="closeDeleteModal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              @click="confirmDelete"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Play, Square, MoreVertical, Edit3, Trash2, X } from 'lucide-vue-next'
import type { Project, ProjectTimeEntry } from '~/modules/api-client/runtime/types/changeable'

// Props
interface Props {
  projectId: number
  project: Project | null
  timeEntries?: ProjectTimeEntry[]
}

const props = withDefaults(defineProps<Props>(), {
  timeEntries: () => []
})

// Emits
const emit = defineEmits<{
  'create-time-entry': []
  'start-time-entry': [timeEntryId: number]
  'stop-time-entry': [timeEntryId: number]
  'delete-time-entry': [timeEntryId: number]
  'update-time-entry': [timeEntryId: number, totalSeconds: number]
  'snapshot-created': []
}>()

// State
const isRunning = ref(false)
const elapsedSeconds = ref(0)
const timerInterval = ref<NodeJS.Timeout | null>(null)
const isSaving = ref(false)
const showMenu = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const currentTimeEntry = ref<ProjectTimeEntry | null>(null)

const editHours = ref(0)
const editMinutes = ref(0)
const editSeconds = ref(0)

const menuRef = ref<HTMLElement | null>(null)

// Methods
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const toggleTimer = () => {
  if (isRunning.value) {
    stopTimer()
  } else {
    startTimer()
  }
}

const startTimer = async () => {
  if (!isRunning.value && !isSaving.value) {
    isSaving.value = true

    try {
      if (currentTimeEntry.value) {
        emit('start-time-entry', currentTimeEntry.value.id)
      }

      isRunning.value = true
      startInterval()
    } catch (error) {
      console.error('Failed to start timer:', error)
    } finally {
      isSaving.value = false
    }
  }
}

const stopTimer = async () => {
  if (isRunning.value && !isSaving.value) {
    isSaving.value = true

    try {
      if (currentTimeEntry.value) {
        emit('stop-time-entry', currentTimeEntry.value.id)
      }

      isRunning.value = false
      stopInterval()
    } catch (error) {
      console.error('Failed to stop timer:', error)
    } finally {
      isSaving.value = false
    }
  }
}

const startInterval = () => {
  stopInterval()
  timerInterval.value = setInterval(() => {
    elapsedSeconds.value++
  }, 1000)
}

const stopInterval = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

const openEditModal = () => {
  showMenu.value = false
  editHours.value = Math.floor(elapsedSeconds.value / 3600)
  editMinutes.value = Math.floor((elapsedSeconds.value % 3600) / 60)
  editSeconds.value = elapsedSeconds.value % 60
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editHours.value = 0
  editMinutes.value = 0
  editSeconds.value = 0
}

const saveEditTime = async () => {
  if (isSaving.value) return

  const totalSeconds = editHours.value * 3600 + editMinutes.value * 60 + editSeconds.value
  if (totalSeconds >= 0) {
    isSaving.value = true
    try {
      if (currentTimeEntry.value) {
        emit('update-time-entry', currentTimeEntry.value.id, totalSeconds)
      }
      elapsedSeconds.value = totalSeconds
      closeEditModal()
    } catch (error) {
      console.error('Failed to update time entry:', error)
    } finally {
      isSaving.value = false
    }
  }
}

const openDeleteModal = () => {
  showMenu.value = false
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
}

const confirmDelete = async () => {
  if (!isSaving.value) {
    isSaving.value = true

    try {
      if (currentTimeEntry.value) {
        emit('delete-time-entry', currentTimeEntry.value.id)
        currentTimeEntry.value = null
      }

      stopTimer()
      elapsedSeconds.value = 0
      closeDeleteModal()
    } catch (error) {
      console.error('Failed to delete timer:', error)
    } finally {
      isSaving.value = false
    }
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    showMenu.value = false
  }
}

const syncWithTimeEntries = (newEntries: ProjectTimeEntry[]) => {
  if (!newEntries || newEntries.length === 0) {
    currentTimeEntry.value = null
    isRunning.value = false
    stopInterval()
    elapsedSeconds.value = 0
    return
  }

  const latestEntry = newEntries[newEntries.length - 1]

  if (latestEntry) {
    currentTimeEntry.value = latestEntry
    elapsedSeconds.value = latestEntry.seconds_counted || 0

    if (latestEntry.is_counting && !isRunning.value) {
      isRunning.value = true
      startInterval()
    } else if (!latestEntry.is_counting && isRunning.value) {
      isRunning.value = false
      stopInterval()
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  syncWithTimeEntries(props.timeEntries || [])
})

onUnmounted(() => {
  stopInterval()
  document.removeEventListener('click', handleClickOutside)
})

useHead({
  title: computed(() => formatTime(elapsedSeconds.value))
})
</script>
