export type { User } from '~/types/user'

export interface LoginRequest {
  access_token: string
}

export interface LoginResponse {
  token: string
}

export interface MeResponse {
  user: User
}

export interface Setting {

}

export interface RegisterResponse {
  token: string
  access_token: string
}

export type ProjectStatus = 'idle' | 'processing' | 'completed'

export type ProjectNoteStatus = 'pending' | 'completed'

export interface ProjectTimeEntry {
  id: number
  project_id: number
  user_id: number
  seconds_counted: number
  is_counting: number
  created_at: string
  updated_at: string
}

export interface ProjectNote {
  id: number
  project_id: number
  title: string
  note: string
  status: ProjectNoteStatus
  created_at: string
  updated_at: string
}

export interface Project {
  id: number
  name: string
  status: ProjectStatus
  user_id: number
  created_at: string
  updated_at: string
  time_entries: ProjectTimeEntry[]
  notes: ProjectNote[]
}

export interface ProjectScopedRequest {
  project_id: number
}

export interface CreateProjectRequest {
  name: string
}

export interface UpdateProjectRequest {
  name: string
  status?: ProjectStatus
}

export interface CreateProjectNoteRequest extends ProjectScopedRequest {
  title: string
  note: string
}

export interface UpdateProjectNoteRequest extends ProjectScopedRequest {
  title?: string
  note?: string
  status?: ProjectNoteStatus
}
