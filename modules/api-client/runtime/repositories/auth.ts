import type { $Fetch } from 'ofetch'
import type { LoginRequest, MeResponse, RegisterResponse } from '../types/changeable'

export class AuthRepository {
  constructor(private readonly api: $Fetch) {}

  /**
   * Login user
   * POST /api/login
   */
  async login(body: LoginRequest) {
    return await this.api<string>('/api/login', {
      method: 'POST',
      body,
    })
  }

  /**
   * Get current authenticated user
   * GET /api/me
   */
  async me() {
    return await this.api<MeResponse>('/api/me', {
      method: 'GET',
    })
  }

  async register() {
    return await this.api<RegisterResponse>('/api/register', {
      method: 'POST',
    })
  }
}
