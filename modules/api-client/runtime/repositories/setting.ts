import type { $Fetch } from 'ofetch'
import type { Setting } from '../types/changeable'

export class SettingRepository {
  constructor(private readonly api: $Fetch) {}

  async getSettings() {
    return await this.api<Setting>('/api/settings', {
      method: 'GET',
    })
  }
}
