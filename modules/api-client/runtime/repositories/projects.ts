import type { $Fetch } from 'ofetch'
import type {
  CreateProjectNoteRequest,
  CreateProjectRequest,
  Project,
  ProjectNote,
  ProjectTimeEntry,
  UpdateProjectNoteRequest,
  UpdateProjectRequest,
} from '../types/changeable'

export class ProjectsRepository {
  constructor(private readonly api: $Fetch) {}

  /**
   * List projects
   * GET /api/projects
   */
  async listProjects() {
    return await this.api<Project[]>('/api/projects', {
      method: 'GET',
    })
  }

  /**
   * Create a project
   * POST /api/projects
   */
  async createProject(body: CreateProjectRequest) {
    return await this.api<Project>('/api/projects', {
      method: 'POST',
      body,
    })
  }

  /**
   * Get a single project
   * GET /api/projects/{id}
   */
  async getProject(projectId: number) {
    return await this.api<Project>(`/api/projects/${projectId}`, {
      method: 'GET',
      query: { project_id: projectId },
    })
  }

  /**
   * Update a project
   * PUT /api/projects/{id}
   */
  async updateProject(projectId: number, body: UpdateProjectRequest) {
    return await this.api<Project>(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: { ...body, project_id: projectId },
    })
  }

  /**
   * Delete a project
   * DELETE /api/projects/{id}
   */
  async deleteProject(projectId: number) {
    return await this.api<boolean>(`/api/projects/${projectId}`, {
      method: 'DELETE',
      query: { project_id: projectId },
    })
  }

  /**
   * Create a project note
   * POST /api/projects/notes
   */
  async createProjectNote(body: CreateProjectNoteRequest) {
    return await this.api<ProjectNote>('/api/projects/notes', {
      method: 'POST',
      body,
    })
  }

  /**
   * Update a project note
   * PUT /api/projects/notes/{id}
   */
  async updateProjectNote(noteId: number, body: UpdateProjectNoteRequest) {
    return await this.api<ProjectNote>(`/api/projects/notes/${noteId}`, {
      method: 'PUT',
      body,
    })
  }

  /**
   * Delete a project note
   * DELETE /api/projects/notes/{id}
   */
  async deleteProjectNote(noteId: number, projectId: number) {
    return await this.api<boolean>(`/api/projects/notes/${noteId}`, {
      method: 'DELETE',
      query: { project_id: projectId },
    })
  }

  /**
   * Create a project time entry
   * POST /api/projects/time
   */
  async createProjectTimeEntry(projectId: number) {
    return await this.api<ProjectTimeEntry>('/api/projects/time', {
      method: 'POST',
      body: { project_id: projectId },
    })
  }

  /**
   * Update a project time entry
   * PUT /api/projects/time/{id}
   */
  async startProjectTimeEntry(timeEntryId: number, projectId: number) {
    return await this.api<ProjectTimeEntry>(`/api/projects/time/${timeEntryId}/start`, {
      method: 'PUT',
      body: { project_id: projectId },
    })
  }

  /**
   * Stop a project time entry
   * POST /api/projects/time/{id}/stop
   */
  async stopProjectTimeEntry(timeEntryId: number, projectId: number) {
    return await this.api<boolean>(`/api/projects/time/${timeEntryId}/stop`, {
      method: 'PUT',
      body: { project_id: projectId },
    })
  }

  /**
   * Delete a project time entry
   * DELETE /api/projects/time/{id}
   */
  async deleteProjectTimeEntry(timeEntryId: number, projectId: number) {
    return await this.api<boolean>(`/api/projects/time/${timeEntryId}`, {
      method: 'DELETE',
      query: { project_id: projectId },
    })
  }

  async updateProjectTimeEntry(timeEntryId: number, projectId: number, totalSeconds: number) {
    return await this.api<ProjectTimeEntry>(`/api/projects/time/${timeEntryId}/update-time`, {
      method: 'PUT',
      body: { project_id: projectId, seconds_counted: totalSeconds },
    })
  }
}
