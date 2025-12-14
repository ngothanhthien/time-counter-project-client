<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-4">
            <button
              class="text-gray-500 hover:text-gray-700 transition-colors"
              @click="navigateTo('/')"
            >
              <ArrowLeft :size="20" />
            </button>
            <div class="flex items-center space-x-3">
              <div
                :style="{ backgroundColor: project?.color }"
                class="w-3 h-3 rounded-full"
              />
              <div v-if="!isEditingName" class="flex items-center space-x-2">
                <h1
                  class="text-2xl font-light text-gray-900 cursor-pointer hover:text-todoist-red transition-colors"
                  @click="startEditingName"
                >
                  {{ project?.name || 'Loading...' }}
                </h1>
                <button
                  v-if="project"
                  class="text-gray-400 hover:text-todoist-red transition-colors"
                  @click="startEditingName"
                >
                  <Edit3 :size="16" />
                </button>
              </div>
              <div v-else class="flex items-center space-x-2">
                <input
                  ref="nameInput"
                  v-model="editingName"
                  type="text"
                  class="px-2 py-1 text-2xl font-light border-b border-todoist-red outline-none"
                  :disabled="isSavingName"
                  @keyup.enter="saveName"
                  @keyup.esc="cancelEditingName"
                  @blur="saveName"
                >
                <button
                  class="text-green-600 hover:text-green-700"
                  :disabled="isSavingName"
                  @click="saveName"
                >
                  <Check :size="16" />
                </button>
                <button
                  class="text-red-600 hover:text-red-700"
                  :disabled="isSavingName"
                  @click="cancelEditingName"
                >
                  <X :size="16" />
                </button>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-500">
              Total: {{ formatTotalTime() }}
            </div>
            <button
              class="text-gray-400 hover:text-red-600 transition-colors"
              :disabled="isDeleting || !project"
              @click="deleteProject"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="isLoading" class="bg-white border border-gray-200 rounded-lg p-6 text-gray-600">
        Loading project...
      </div>

      <div v-else-if="loadError" class="bg-red-50 border border-red-100 text-red-700 rounded-lg p-4 space-y-2">
        <p class="text-sm">{{ loadError }}</p>
        <button
          class="inline-flex items-center text-sm text-todoist-red hover:underline"
          @click="loadProject"
        >
          Retry
        </button>
      </div>

      <div v-else-if="!project" class="bg-white border border-gray-200 rounded-lg p-6 text-gray-600">
        Project not found.
        <button
          class="ml-2 text-todoist-red hover:underline"
          @click="navigateTo('/')"
        >
          Back to dashboard
        </button>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Notes -->
        <div class="lg:col-span-2">
          <!-- Add Note -->
          <div class="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div class="flex space-x-3">
              <input
                v-model="newNoteContent"
                placeholder="Add a new note..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-todoist-red focus:border-transparent outline-none transition-all duration-200"
                :disabled="isAddingNote"
                @keyup.enter="addNote"
              >
              <button
                :disabled="!newNoteContent.trim() || isAddingNote"
                class="px-4 py-2 bg-todoist-red text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                @click="addNote"
              >
                <Plus :size="16" />
              </button>
            </div>
            <p v-if="noteError" class="text-sm text-red-600 mt-2">{{ noteError }}</p>
          </div>

          <!-- Notes List -->
          <div class="space-y-3">
            <div
              v-for="note in notes"
              :key="note.id"
              class="bg-white rounded-lg border border-gray-200 p-4 transition-all duration-200"
              :class="{ 'opacity-75': note.completed }"
            >
              <div class="flex items-start space-x-3">
                <button
                  class="mt-1 shrink-0"
                  :disabled="activeNoteAction === note.id"
                  @click="toggleNote(note.id)"
                >
                  <div
                    class="w-5 h-5 rounded border-2 transition-all duration-200"
                    :class="[
                      note.completed
                        ? 'bg-todoist-red border-todoist-red'
                        : 'border-gray-300 hover:border-todoist-red'
                    ]"
                  >
                    <Check v-if="note.completed" :size="16" class="text-white" />
                  </div>
                </button>
                <div class="flex-1">
                  <div
                    v-if="!note.editing"
                    class="cursor-pointer"
                    @click="startEditingNote(note)"
                  >
                    <h3
                      class="text-gray-900 font-medium text-base mb-1 hover:text-todoist-red transition-colors"
                      :class="{ 'line-through text-gray-500': note.completed }"
                    >
                      {{ note.title }}
                    </h3>
                    <p
                      v-if="note.content && note.content !== note.title"
                      class="text-gray-700 text-sm"
                      :class="{ 'line-through text-gray-500': note.completed }"
                    >
                      {{ note.content }}
                    </p>
                  </div>
                  <div v-else :ref="(el) => setEditContainerRef(note.id, el as HTMLElement)" class="space-y-2">
                    <input
                      v-model="note.editingTitle"
                      type="text"
                      placeholder="Title"
                      class="w-full px-2 py-1 border-b border-todoist-red outline-none font-medium"
                      :disabled="activeNoteAction === note.id"
                      @keyup.enter="saveNote(note)"
                      @keyup.esc="cancelEditingNote(note)"
                    >
                    <input
                      v-model="note.editingContent"
                      type="text"
                      placeholder="Description"
                      class="w-full px-2 py-1 border-b border-gray-300 outline-none text-sm"
                      :disabled="activeNoteAction === note.id"
                      @keyup.enter="saveNote(note)"
                      @keyup.esc="cancelEditingNote(note)"
                    >
                  </div>
                  <div class="flex items-center justify-between mt-2">
                    <p class="text-xs text-gray-500">
                      {{ formatDate(note.createdAt) }}
                    </p>
                    <div class="flex space-x-2">
                      <button
                        v-if="!note.editing"
                        class="text-gray-400 hover:text-todoist-red transition-colors"
                        @click="startEditingNote(note)"
                      >
                        <Edit3 :size="14" />
                      </button>
                      <button
                        class="text-gray-400 hover:text-red-600 transition-colors"
                        :disabled="activeNoteAction === note.id"
                        @click="deleteNote(note.id)"
                      >
                        <Trash2 :size="14" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Timer -->
        <div class="lg:col-span-1">
          <div class="space-y-4">
            <!-- Add Timer Button -->
            <button
              class="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5 py-1.5 px-1"
              @click="addNewTimer"
            >
              <Plus :size="12" />
              <span>Add timer</span>
            </button>

            <!-- Timers List -->
            <div v-for="timerId in timerIds" :key="timerId" class="space-y-4">
              <Timer
                :project-id="projectId"
                :project="project"
                :time-entries="timeEntries"
                @create-time-entry="createTimeEntry"
                @start-time-entry="startTimeEntry"
                @stop-time-entry="stopTimeEntry"
                @delete-time-entry="deleteTimeEntry"
                @update-time-entry="updateTimeEntry"
                @snapshot-created="handleSnapshotCreated"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Edit3, Check, X, Plus, Trash2 } from 'lucide-vue-next'
import { onClickOutside } from '@vueuse/core'
import { ProjectsRepository } from '~/modules/api-client/runtime/repositories/projects'
import type { Project as ApiProject, ProjectNote, ProjectTimeEntry, ProjectNoteStatus } from '~/modules/api-client/runtime/types/changeable'

// Route params
const route = useRoute()
const projectId = Number(route.params.id)

if (Number.isNaN(projectId)) {
  await navigateTo('/')
}

// Page metadata
definePageMeta({
  title: 'Project Details'
})

// State
const project = ref<Project | null>(null)
const notes = ref<Note[]>([])
const timeEntries = ref<ProjectTimeEntry[]>([])
const isEditingName = ref(false)
const editingName = ref('')
const newNoteContent = ref('')
const loadError = ref<string | null>(null)
const isSavingName = ref(false)
const isDeleting = ref(false)
const isAddingNote = ref(false)
const noteError = ref<string | null>(null)
const activeNoteAction = ref<number | null>(null)
const timerIds = ref<number[]>([Date.now()]) // Start with one timer
let timerIdCounter = Date.now()

// onClickOutside refs for note editing
const editContainerRefs = ref<Map<number, HTMLElement>>(new Map())
const onClickOutsideCleanup = ref<Map<number, (() => void) | null>>(new Map())

const setEditContainerRef = (noteId: number, el: HTMLElement | null) => {
  if (el) {
    editContainerRefs.value.set(noteId, el)
  } else {
    editContainerRefs.value.delete(noteId)
  }
}

const nuxtApp = useNuxtApp()
const projectsRepository = new ProjectsRepository(nuxtApp.$api)

const colorPalette: string[] = [
  '#dc4c3e',
  '#e67321',
  '#f4b350',
  '#8bc441',
  '#25a559',
  '#48c9b0',
  '#3498db',
  '#5dade2',
  '#9b59b6',
  '#af7ac5',
  '#e91e63',
  '#795548'
]

// Types
interface Project {
  id: number
  name: string
  color: string
  status: ApiProject['status']
  totalSeconds: number
  createdAt: Date
  updatedAt: Date
  timeEntries: ProjectTimeEntry[]
  user_id?: number
  created_at?: string
  updated_at?: string
  notes?: ProjectNote[]
  time_entries?: ProjectTimeEntry[]
}

interface Note {
  id: number
  title: string
  content: string
  status: ProjectNoteStatus
  completed: boolean
  editing?: boolean
  editingTitle?: string
  editingContent?: string
  createdAt: Date
  updatedAt: Date
}

type ProjectData = {
  project: Project | null
  notes: Note[]
  timeEntries: ProjectTimeEntry[]
}

// Helpers
const resolveProjectColor = (projectIdToResolve: number, preferredColor?: string): string => {
  if (preferredColor) return preferredColor

  const paletteIndex = projectIdToResolve % colorPalette.length
  const color = colorPalette[paletteIndex]
  return color || '#dc4c3e' // Fallback to first color
}

const mapNote = (note: ProjectNote): Note => ({
  id: note.id,
  title: note.title || '',
  content: note.note || '',
  status: note.status,
  completed: note.status === 'completed',
  createdAt: new Date(note.created_at),
  updatedAt: new Date(note.updated_at),
  editing: false,
  editingTitle: note.title || '',
  editingContent: note.note || ''
})

const mapProject = (apiProject: ApiProject, preferredColor?: string): Project => {
  const totalSeconds = (apiProject.time_entries || []).reduce((total, entry) => total + (entry.seconds_counted || 0), 0)

  return {
    id: apiProject.id,
    name: apiProject.name,
    color: resolveProjectColor(apiProject.id, preferredColor),
    status: apiProject.status,
    totalSeconds,
    createdAt: new Date(apiProject.created_at),
    updatedAt: new Date(apiProject.updated_at),
    timeEntries: apiProject.time_entries || []
  }
}

const { data, pending, error, refresh } = await useAsyncData<ProjectData>(`project-${projectId}`, async () => {
  const apiProject = await nuxtApp.runWithContext(() => projectsRepository.getProject(projectId))
  const mappedProject = mapProject(apiProject)

  return {
    project: mappedProject,
    notes: (apiProject.notes || []).map(mapNote),
    timeEntries: apiProject.time_entries || []
  }
})

watch(data, (value) => {
  if (!value) return
  project.value = value.project
  notes.value = value.notes
  timeEntries.value = value.timeEntries
}, { immediate: true })

const isLoading = computed(() => pending.value)

watch(error, (err) => {
  loadError.value = err ? err.message || 'Failed to load project' : null
}, { immediate: true })

const loadProject = async () => {
  loadError.value = null
  noteError.value = null

  try {
    await refresh()
  }
  catch (refreshError: unknown) {
    const message = refreshError instanceof Error ? refreshError.message : 'Failed to load project'
    loadError.value = message
    console.error(message, refreshError)
    return
  }

  if (error.value) {
    const message = error.value.message || 'Failed to load project'
    loadError.value = message
    console.error(message, error.value)
  }
}

// Name editing
const startEditingName = () => {
  if (!project.value) return
  isEditingName.value = true
  editingName.value = project.value.name
}

const saveName = async () => {
  if (!project.value || !editingName.value.trim()) return
  if (project.value.name === editingName.value.trim()) {
    isEditingName.value = false
    return
  }

  isSavingName.value = true
  try {
    const updated = await nuxtApp.runWithContext(() => projectsRepository.updateProject(project.value!.id, {
      name: editingName.value.trim()
    }))

    project.value = mapProject(updated, project.value.color)
    isEditingName.value = false
  }
  catch (error: unknown) {
    console.error('Failed to update project name', error)
  }
  finally {
    isSavingName.value = false
  }
}

const cancelEditingName = () => {
  isEditingName.value = false
  editingName.value = ''
}

// Notes management
const addNote = async () => {
  if (!newNoteContent.value.trim() || !project.value) return

  isAddingNote.value = true
  noteError.value = null
  try {
    const created = await nuxtApp.runWithContext(() => projectsRepository.createProjectNote({
      project_id: project.value!.id,
      title: newNoteContent.value.trim(),
      note: newNoteContent.value.trim()
    }))

    const mapped = mapNote(created)
    notes.value.unshift(mapped)
    newNoteContent.value = ''
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add note'
    noteError.value = message
    console.error(message, error)
  }
  finally {
    isAddingNote.value = false
  }
}

const toggleNote = async (noteId: number) => {
  const note = notes.value.find(n => n.id === noteId)
  if (!note || !project.value) return

  const nextStatus: ProjectNoteStatus = note.completed ? 'pending' : 'completed'
  activeNoteAction.value = noteId
  noteError.value = null

  try {
    const updated = await nuxtApp.runWithContext(() => projectsRepository.updateProjectNote(noteId, {
      project_id: project.value!.id,
      status: nextStatus
    }))

    Object.assign(note, mapNote(updated), { editing: false })
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update note'
    noteError.value = message
    console.error(message, error)
  }
  finally {
    activeNoteAction.value = null
  }
}

const startEditingNote = (note: Note) => {
  note.editing = true
  note.editingTitle = note.title
  note.editingContent = note.content

  // Clean up previous watcher if exists
  const previousCleanup = onClickOutsideCleanup.value.get(note.id)
  if (previousCleanup) {
    previousCleanup()
  }

  // Set up onClickOutside watcher
  nextTick(() => {
    const editContainer = editContainerRefs.value.get(note.id)
    if (editContainer) {
      const cleanup = onClickOutside(editContainer, () => {
        if (note.editing) {
          saveNote(note)
        }
      }, {
        ignore: ['input', 'textarea']
      })
      onClickOutsideCleanup.value.set(note.id, cleanup)
    }
  })
}

const saveNote = async (note: Note) => {
  if (!note.editingTitle?.trim() || !project.value) {
    // Clean up onClickOutside watcher before canceling
    const cleanup = onClickOutsideCleanup.value.get(note.id)
    if (cleanup) {
      cleanup()
      onClickOutsideCleanup.value.delete(note.id)
    }
    note.editing = false
    note.editingTitle = undefined
    note.editingContent = undefined
    return
  }

  // Check if content actually changed
  const newTitle = note.editingTitle?.trim() || ''
  const newContent = note.editingContent?.trim() || ''
  const hasChanges = newTitle !== note.title || newContent !== note.content

  if (!hasChanges) {
    // No changes detected, just exit edit mode
    note.editing = false
    note.editingTitle = undefined
    note.editingContent = undefined

    // Clean up onClickOutside watcher
    const cleanup = onClickOutsideCleanup.value.get(note.id)
    if (cleanup) {
      cleanup()
      onClickOutsideCleanup.value.delete(note.id)
    }
    return
  }

  activeNoteAction.value = note.id
  noteError.value = null
  try {
    const updated = await nuxtApp.runWithContext(() => projectsRepository.updateProjectNote(note.id, {
      project_id: project.value!.id,
      title: newTitle,
      note: newContent
    }))

    Object.assign(note, mapNote(updated), { editing: false })

    // Clean up onClickOutside watcher after successful save
    const cleanup = onClickOutsideCleanup.value.get(note.id)
    if (cleanup) {
      cleanup()
      onClickOutsideCleanup.value.delete(note.id)
    }
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save note'
    noteError.value = message
    console.error(message, error)
  }
  finally {
    activeNoteAction.value = null
  }
}

const cancelEditingNote = (note: Note) => {
  note.editing = false
  note.editingTitle = undefined
  note.editingContent = undefined

  // Clean up onClickOutside watcher
  const cleanup = onClickOutsideCleanup.value.get(note.id)
  if (cleanup) {
    cleanup()
    onClickOutsideCleanup.value.delete(note.id)
  }
}

const deleteNote = async (noteId: number) => {
  if (!project.value) return

  activeNoteAction.value = noteId
  noteError.value = null
  try {
    await nuxtApp.runWithContext(() => projectsRepository.deleteProjectNote(noteId, project.value!.id))
    notes.value = notes.value.filter(n => n.id !== noteId)
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete note'
    noteError.value = message
    console.error(message, error)
  }
  finally {
    activeNoteAction.value = null
  }
}

const deleteProject = async () => {
  if (!project.value || !confirm(`Are you sure you want to delete "${project.value.name}"?`)) return

  isDeleting.value = true
  try {
    await nuxtApp.runWithContext(() => projectsRepository.deleteProject(project.value!.id))
    navigateTo('/')
  }
  catch (error: unknown) {
    console.error('Failed to delete project', error)
  }
  finally {
    isDeleting.value = false
  }
}

// Time entry management
const createTimeEntry = async () => {
  if (!project.value) return

  try {
    const newEntry = await nuxtApp.runWithContext(() => projectsRepository.createProjectTimeEntry(project.value!.id))
    timeEntries.value.push(newEntry)
    return newEntry
  }
  catch (error: unknown) {
    console.error('Failed to create time entry', error)
    throw error
  }
}

const startTimeEntry = async (timeEntryId: number) => {
  if (!project.value) return

  try {
    const updatedEntry = await nuxtApp.runWithContext(() => projectsRepository.startProjectTimeEntry(timeEntryId, project.value!.id))
    const index = timeEntries.value.findIndex(entry => entry.id === timeEntryId)
    if (index !== -1) {
      timeEntries.value[index] = updatedEntry
    }
  }
  catch (error: unknown) {
    console.error('Failed to start time entry', error)
  }
}

const stopTimeEntry = async (timeEntryId: number) => {
  if (!project.value) return

  try {
    await nuxtApp.runWithContext(() => projectsRepository.stopProjectTimeEntry(timeEntryId, project.value!.id))
    const index = timeEntries.value.findIndex(entry => entry.id === timeEntryId)
    if (index !== -1) {
      timeEntries.value[index].is_counting = false
    }
  }
  catch (error: unknown) {
    console.error('Failed to stop time entry', error)
  }
}

const deleteTimeEntry = async (timeEntryId: number) => {
  if (!project.value) return

  try {
    await nuxtApp.runWithContext(() => projectsRepository.deleteProjectTimeEntry(timeEntryId, project.value!.id))
    timeEntries.value = timeEntries.value.filter(entry => entry.id !== timeEntryId)
  }
  catch (error: unknown) {
    console.error('Failed to delete time entry', error)
  }
}

const updateTimeEntry = async (timeEntryId: number, totalSeconds: number) => {
  if (!project.value) return

  try {
    const updatedEntry = await nuxtApp.runWithContext(() => projectsRepository.updateProjectTimeEntry(timeEntryId, project.value!.id, totalSeconds))
    const index = timeEntries.value.findIndex(entry => entry.id === timeEntryId)
    if (index !== -1) {
      timeEntries.value[index] = updatedEntry
    }
  }
  catch (error: unknown) {
    console.error('Failed to update time entry', error)
  }
}

const addNewTimer = () => {
  timerIdCounter++
  timerIds.value.unshift(timerIdCounter) // Add new timer at the beginning
}

const handleSnapshotCreated = async () => {
  await loadProject()
}

// Formatting helpers
const formatTotalTime = () => {
  return formatDuration(project.value?.totalSeconds || 0)
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  })
}
</script>
