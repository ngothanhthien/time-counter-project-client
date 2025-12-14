<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-6">
            <div class="flex items-center space-x-4">
              <h1 class="text-2xl font-light text-gray-900">Time Management</h1>
              <div class="flex items-center space-x-2 text-sm text-gray-500">
                <Clock :size="16" />
                <span>{{ currentTime }}</span>
              </div>
            </div>
            <nav class="hidden md:flex space-x-6">
              <button
                class="text-todoist-red font-medium hover:text-red-600 transition-colors"
                @click="navigateTo('/')"
              >
                Dashboard
              </button>
            </nav>
          </div>
          <div class="flex items-center space-x-3">
            <button
              class="inline-flex itemlocal storages-center px-4 py-2 bg-todoist-red text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors duration-200"
              @click="showCreateProjectModal = true"
            >
              <Plus :size="16" class="mr-2" />
              New Project
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Projects Grid -->
      <div class="mb-8">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Projects</h2>

        <div v-if="isLoadingProjects" class="bg-white rounded-lg border border-gray-200 p-6 text-gray-600">
          Loading projects...
        </div>

        <div v-else-if="loadError" class="bg-red-50 border border-red-100 text-red-700 rounded-lg p-4">
          <p class="text-sm">{{ loadError }}</p>
          <button
            class="mt-2 inline-flex items-center text-sm text-todoist-red hover:underline"
            @click="loadProjects"
          >
            Retry
          </button>
        </div>

        <div v-else-if="projects.length === 0" class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <FolderOpen :size="48" class="mx-auto" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p class="text-gray-500 mb-6">Create your first project to start managing your time</p>
          <button
            class="inline-flex items-center px-4 py-2 bg-todoist-red text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors duration-200"
            @click="showCreateProjectModal = true"
          >
            <Plus :size="16" class="mr-2" />
            Create Project
          </button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="project in projects"
            :key="project.id"
            class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer group"
            @click="navigateToProject(project.id)"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div
                  :style="{ backgroundColor: project.color }"
                  class="w-3 h-3 rounded-full"
                />
                <h3 class="font-medium text-gray-900 group-hover:text-todoist-red transition-colors">
                  {{ project.name }}
                </h3>
              </div>
              <ChevronRight :size="16" class="text-gray-400 group-hover:text-todoist-red transition-colors" />
            </div>
            <div class="flex items-center justify-between text-sm text-gray-500">
              <span>{{ formatDuration(project.totalSeconds) }}</span>
              <span>{{ project.notesCount }} notes</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Create Project Modal -->
    <CreateProjectModal
      v-if="showCreateProjectModal"
      :submitting="isCreatingProject"
      @close="showCreateProjectModal = false"
      @submit="handleProjectCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { Clock, Plus, FolderOpen, ChevronRight } from 'lucide-vue-next'
import { ProjectsRepository } from '~/modules/api-client/runtime/repositories/projects'
import type { Project as ApiProject } from '~/modules/api-client/runtime/types/changeable'

// Page metadata
definePageMeta({
  title: 'Dashboard'
})

// State
const showCreateProjectModal = ref(false)
const currentTime = ref('')
const loadError = ref<string | null>(null)
const isCreatingProject = ref(false)

// API
const nuxtApp = useNuxtApp()
const projectsRepository = new ProjectsRepository(nuxtApp.$api)

// Colors (deterministic because API does not store them)
const colorPalette = [
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

let clockInterval: ReturnType<typeof setInterval> | null = null

// Types
interface Project {
  id: number
  name: string
  color: string
  totalSeconds: number
  notesCount: number
  createdAt: Date
  updatedAt: Date
}

interface TimeSnapshot {
  id: number
  projectId: number
  project: Project
  duration: number
  timestamp: Date
  note?: string
}

interface NewProjectPayload {
  name: string
  color: string
}

type ProjectsData = {
  projects: Project[]
}

// Methods
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

const navigateToProject = (projectId: number) => {
  navigateTo(`/project/${projectId}`)
}

const resolveProjectColor = (index: number, preferredColor?: string) => {
  if (preferredColor) return preferredColor
  return colorPalette[index % colorPalette.length]
}

const mapProject = (project: ApiProject, index: number): Project => {
  const totalSeconds = (project.time_entries || []).reduce((total, entry) => total + (entry.seconds_counted || 0), 0)

  return {
    id: project.id,
    name: project.name,
    color: resolveProjectColor(index),
    totalSeconds,
    notesCount: project.notes?.length || 0,
    createdAt: new Date(project.created_at),
    updatedAt: new Date(project.updated_at)
  }
}

const { data, pending, error, refresh } = await useAsyncData<ProjectsData>('projects', async () => {
  const apiProjects = await nuxtApp.runWithContext(() => projectsRepository.listProjects())
  const mapped = apiProjects.map((project, index) => mapProject(project, index))

  return {
    projects: mapped,
  }
})

const projects = computed(() => data.value?.projects || [])
const isLoadingProjects = computed(() => pending.value)

watch(error, (err) => {
  loadError.value = err ? err.message || 'Failed to load projects' : null
}, { immediate: true })

const loadProjects = async () => {
  loadError.value = null
  try {
    await refresh()
  }
  catch (refreshError: unknown) {
    const message = refreshError instanceof Error ? refreshError.message : 'Failed to load projects'
    loadError.value = message
    console.error(message, refreshError)
    return
  }

  if (error.value) {
    const message = error.value.message || 'Failed to load projects'
    loadError.value = message
    console.error(message, error.value)
  }
}

const handleProjectCreated = async (payload: NewProjectPayload) => {
  if (!payload.name.trim()) return

  isCreatingProject.value = true
  try {
    await nuxtApp.runWithContext(() => projectsRepository.createProject({
      name: payload.name.trim()
    }))

    await loadProjects()
    showCreateProjectModal.value = false
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create project'
    loadError.value = message
    console.error(message, error)
  }
  finally {
    isCreatingProject.value = false
  }
}

// Lifecycle
onMounted(() => {
  updateTime()
  clockInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (clockInterval) {
    clearInterval(clockInterval)
  }
})
</script>

<style scoped>
.todoist-red {
  background-color: #dc4c3e;
}
</style>
