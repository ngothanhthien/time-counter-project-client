# API Client Module - Complete Implementation Guide

## Overview

The **api-client** module is a custom Nuxt module that provides a centralized, type-safe HTTP client for communicating with backend APIs. It handles authentication, token management, error handling, request/response interceptors, and provides composables for common operations.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Module Configuration](#module-configuration)
3. [Core Components](#core-components)
4. [Authentication System](#authentication-system)
5. [Creating Repositories](#creating-repositories)
6. [Type Definitions](#type-definitions)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)
9. [Common Patterns](#common-patterns)
10. [Testing Guidelines](#testing-guidelines)

---

## Architecture Overview

### Directory Structure

```
modules/api-client/
├── runtime/
│   ├── composables/          # Reusable state management composables
│   │   ├── useAuth.ts        # Authentication state & methods
│   │   └── useSettings.ts    # Application settings state
│   ├── plugins/              # Nuxt plugins for API setup
│   │   ├── api.ts            # Core API client configuration
│   │   └── auth-middleware.ts # Global authentication middleware
│   ├── repositories/         # API endpoint functions (examples)
│   │   ├── auth.ts          # Auth-related API calls
│   │   └── setting.ts       # Settings API calls
│   └── types/               # TypeScript type definitions
│       ├── api-client.d.ts  # API client types
│       └── changeable.d.ts  # API response/request types
└── index.ts                 # Module definition & setup
```

### Key Concepts

1. **Module**: Nuxt module that configures and registers the API client
2. **Plugins**: Initialize the API client and global middleware
3. **Composables**: Manage state and provide reactive interfaces
4. **Repositories**: Organize API endpoints by domain/resource
5. **Types**: Define contracts for requests, responses, and data models

---

## Module Configuration

### Installation in `nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  modules: [
    './modules/api-client',
    // ... other modules
  ],
  apiClient: {
    baseURL: 'http://localhost:8000/api',  // Required: Backend API base URL
    tokenKey: 'token',                      // Optional: Cookie name for auth token
    loginPath: '/login',                    // Optional: Login page path
    headerLocale: 'X-LOCALE',              // Optional: Locale header name
    retry: 1,                               // Optional: Number of retry attempts
    retryDelay: 500,                        // Optional: Delay between retries (ms)
    timeout: 10000,                         // Optional: Request timeout (ms)
    enable: true,                           // Optional: Enable/disable module
  },
})
```

### Module Options Interface

```typescript
export interface ModuleOptions {
  baseURL: string          // Backend API URL (required)
  headerLocale?: string    // Locale header name (default: 'X-LOCALE')
  enable?: boolean         // Enable module (default: true)
  tokenKey?: string        // Cookie key for token (default: 'token')
  loginPath?: string       // Login route path (default: '/login')
  retry?: number           // Retry attempts (default: 1)
  retryDelay?: number      // Retry delay in ms (default: 500)
  timeout?: number         // Request timeout in ms (default: 10000)
}
```

---

## Core Components

### 1. API Plugin (`runtime/plugins/api.ts`)

The API plugin creates a configured `$fetch` instance with interceptors.

**Features:**
- Automatic token injection from cookies
- Request/response logging (dev mode)
- Comprehensive error handling
- Retry logic with configurable delay
- Timeout management

**Usage in Code:**

```typescript
const { $api } = useNuxtApp()

// GET request
const data = await $api('/users')

// POST request with body
const result = await $api('/users', {
  method: 'POST',
  body: { name: 'John', email: 'john@example.com' }
})

// With query parameters
const filtered = await $api('/users', {
  method: 'GET',
  query: { role: 'admin', page: 1 }
})
```

**Error Responses:**

The API automatically handles HTTP errors and throws structured errors:

```typescript
try {
  await $api('/protected-route')
} catch (error) {
  // error.data contains ApiError structure:
  // {
  //   message: string,
  //   statusCode: number,
  //   data?: any,
  //   errors?: Record<string, string[]>  // Validation errors (422)
  // }
}
```

### 2. Auth Middleware (`runtime/plugins/auth-middleware.ts`)

Global route middleware that:
- Checks authentication status on every route
- Redirects unauthenticated users to login
- Loads user data and settings on first authenticated visit
- Handles public routes (via `meta.public = true`)

**Marking Routes as Public:**

```typescript
// In your page component
definePageMeta({
  public: true,  // Allow access without authentication
  layout: 'auth'
})
```

**Boot Sequence:**

1. Extract token from cookie
2. Check if route is public or requires auth
3. If authenticated and not booted yet:
   - Call `/me` endpoint to get user data
   - Call `/settings` to get app settings
   - Set `auth:booted` state to true
4. If token invalid, clear and redirect to login

---

## Authentication System

### `useAuth()` Composable

Manages authentication state and provides methods for login/logout.

**State:**

```typescript
const {
  token,        // Ref<string | null> - JWT token
  user,         // Ref<User | null> - Current user object
  permissions,  // Ref<string[]> - User permissions
  role,         // Ref<string | null> - User role
  hasInit,      // ComputedRef<boolean> - Auth initialized?
} = useAuth()
```

**Methods:**

```typescript
// Login user
await login(email: string, password: string)

// Logout user
await logout()

// Get current user data
await me()

// Initialize auth state manually
initialize({ token, user, permissions, role })

// Clear all auth state
await clear()

// Check permission
const canEdit = hasPermission('edit:posts')
```

**Example Login Flow:**

```vue
<script setup lang="ts">
const { login } = useAuth()
const router = useRouter()

const form = reactive({
  email: '',
  password: '',
  error: ''
})

async function handleLogin() {
  try {
    await login(form.email, form.password)
    router.push('/')
  } catch (error: any) {
    form.error = error.data?.message || 'Login failed'
  }
}
</script>
```

### `useSettings()` Composable

Manages application-wide settings fetched from backend.

```typescript
const {
  settings,    // Ref<Setting | null>
  hasInit,     // ComputedRef<boolean>
} = useSettings()

// Fetch settings
await fetch()

// Initialize with data
initialize(settingsData)

// Reset settings
reset()
```

---

## Creating Repositories

Repositories organize API endpoints by domain. Each repository file exports functions that make API calls.

### Repository Pattern

**Location:** `app/repositories/<domain>.ts`

**Template:**

```typescript
import type {
  ResourceResponse,
  CreateResourceRequest,
  UpdateResourceRequest,
  ListResourceParams
} from '~/types/<domain>'

/**
 * List resources with pagination and filters
 * GET /api/resources
 */
export async function listResources(params?: ListResourceParams) {
  const { $api } = useNuxtApp()

  return await $api<Pagination<Resource>>('/resources', {
    method: 'GET',
    query: params,
  })
}

/**
 * Get single resource by ID
 * GET /api/resources/{id}
 */
export async function getResource(id: number) {
  const { $api } = useNuxtApp()

  return await $api<Resource>(`/resources/${id}`, {
    method: 'GET',
  })
}

/**
 * Create new resource
 * POST /api/resources
 */
export async function createResource(body: CreateResourceRequest) {
  const { $api } = useNuxtApp()

  return await $api<ResourceResponse>('/resources', {
    method: 'POST',
    body,
  })
}

/**
 * Update existing resource
 * PUT /api/resources/{id}
 */
export async function updateResource(id: number, body: UpdateResourceRequest) {
  const { $api } = useNuxtApp()

  return await $api<ResourceResponse>(`/resources/${id}`, {
    method: 'PUT',
    body,
  })
}

/**
 * Delete resource
 * DELETE /api/resources/{id}
 */
export async function deleteResource(id: number) {
  const { $api } = useNuxtApp()

  return await $api<{ message: string }>(`/resources/${id}`, {
    method: 'DELETE',
  })
}
```

### Real-World Examples

#### Design Repository (`app/repositories/design.ts`)

```typescript
import type { Design, ListDesignsParams, UpdateDesignRequest } from '~/types/design'

export async function listDesigns(params?: ListDesignsParams) {
  const { $api } = useNuxtApp()
  return await $api<Pagination<Design>>('/designs', {
    method: 'GET',
    query: params,
  })
}

export async function updateDesign(id: number, body: UpdateDesignRequest) {
  const { $api } = useNuxtApp()
  return await $api<{ message: string; design: Design }>(`/designs/${id}`, {
    method: 'PUT',
    body,
  })
}

export async function deleteDesign(ids: number[]) {
  const { $api } = useNuxtApp()
  return await $api<{ message: string }>(`/designs`, {
    method: 'DELETE',
    body: { ids }
  })
}
```

#### Order Repository (`app/repositories/order.ts`)

```typescript
import type { Order, ListOrdersParams, UpdateOrderRequest } from '~/types/order'

export async function listOrders(params?: ListOrdersParams) {
  const { $api } = useNuxtApp()
  return await $api<Pagination<Order>>('/support/orders', {
    method: 'GET',
    query: params,
  })
}

export async function pushOrderToDesigner(id: number, body: PushOrderRequest) {
  const { $api } = useNuxtApp()
  return await $api<PushOrderResponse>(`/support/order/${id}/push`, {
    method: 'POST',
    body,
  })
}

export async function getOrderStats() {
  const { $api } = useNuxtApp()
  return await $api<OrderStats>('/orders/stats', {
    method: 'GET',
  })
}
```

### File Upload Pattern

When uploading files, use `FormData`:

```typescript
export async function importDesigns(body: ImportDesignsRequest) {
  const { $api } = useNuxtApp()

  const formData = new FormData()
  formData.append('file', body.file)

  return await $api<ImportResponse>('/support/import/designs', {
    method: 'POST',
    body: formData,  // API plugin auto-detects FormData
  })
}
```

**Important:** The API plugin automatically skips setting `Content-Type: application/json` when body is `FormData`, allowing the browser to set the correct multipart boundary.

---

## Type Definitions

### Types Location Strategy

1. **Module-level types** (`modules/api-client/runtime/types/`):
   - API client infrastructure types
   - Types shared across all domains

2. **App-level types** (`app/types/`):
   - Domain-specific request/response types
   - Business logic models

### API Error Type

```typescript
export interface ApiError {
  message: string
  statusCode: number
  data?: any
  errors?: Record<string, string[]>  // Validation errors (422 responses)
}
```

---

## Error Handling

### HTTP Status Code Handling

The API plugin automatically handles these status codes:

| Status | Error Message | Action |
|--------|---------------|--------|
| 400 | Bad request | Returns server error message |
| 401 | Authentication required | Clears token, redirects to login |
| 403 | Access forbidden | Returns error message |
| 404 | Resource not found | Returns error message |
| 422 | Validation error | Returns validation errors in `errors` field |
| 429 | Too many requests | Returns rate limit message |
| 500-504 | Server error | Returns server error message |

### Catching Errors in Components

```typescript
<script setup lang="ts">
import type { ApiError } from '#build/types/api-client'

async function handleSubmit() {
  try {
    await createResource(formData)
    // Success handling
  } catch (error: any) {
    const apiError = error.data as ApiError

    // General error message
    console.error(apiError.message)

    // Validation errors (422)
    if (apiError.statusCode === 422 && apiError.errors) {
      Object.entries(apiError.errors).forEach(([field, messages]) => {
        console.error(`${field}: ${messages.join(', ')}`)
      })
    }
  }
}
</script>
```

### Validation Error Example

Response from backend (422):
```json
{
  "message": "Validation failed",
  "errors": {
    "email": ["The email field is required.", "The email must be a valid email address."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

Accessing in code:
```typescript
if (apiError.errors) {
  const emailErrors = apiError.errors.email  // string[]
  const passwordErrors = apiError.errors.password  // string[]
}
```

---

## Best Practices

### 1. Repository Organization

- **One repository per domain/resource**
- **Use descriptive function names**: `listOrders`, `createUser`, not `get`, `post`
- **Add JSDoc comments** with HTTP method and endpoint
- **Export typed functions** with explicit return types

### 2. Type Safety

- **Always define types** for request bodies and responses
- **Use strict null checks**: `string | null`, not `string`
- **Use optional chaining** when accessing nested properties
- **Define unions** for known values: `type Status = 'active' | 'inactive'`

### 3. State Management

- **Use composables** for global state (auth, settings)
- **Use useState** for SSR-safe reactive state
- **Initialize state** in middleware or plugins
- **Clear state** on logout or errors

### 4. Error Handling

- **Always wrap API calls** in try-catch blocks
- **Provide user-friendly messages** from errors
- **Log errors** in development mode
- **Handle validation errors** separately (422)

### 5. Performance

- **Use pagination** for list endpoints
- **Implement debouncing** for search queries
- **Cache infrequently changing data** (settings)
- **Lazy load** heavy components

---

## Common Patterns

### Pattern 1: List with Filters

```typescript
<script setup lang="ts">
import { listResources } from '~/repositories/resource'

const filters = ref({
  page: 1,
  per_page: 20,
  search: '',
  sort_by: 'created_at' as const,
  sort_order: 'desc' as const,
})

const { data: resources, pending, error, refresh } = await useAsyncData(
  'resources',
  () => listResources(filters.value),
  {
    watch: [filters],  // Refetch when filters change
  }
)
</script>
```

### Pattern 2: Create with Form

```typescript
<script setup lang="ts">
import { createResource } from '~/repositories/resource'
import type { CreateResourceRequest } from '~/types/resource'

const form = reactive<CreateResourceRequest>({
  name: '',
  description: '',
})

const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  loading.value = true
  error.value = ''

  try {
    const result = await createResource(form)
    // Success: reset form, show message, navigate, etc.
    navigateTo('/resources')
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to create resource'
  } finally {
    loading.value = false
  }
}
</script>
```

### Pattern 3: Update with Optimistic UI

```typescript
<script setup lang="ts">
import { updateResource } from '~/repositories/resource'

const localData = ref({ ...props.resource })

async function handleUpdate() {
  // Optimistically update UI
  const original = { ...localData.value }
  Object.assign(localData.value, changedFields)

  try {
    await updateResource(props.resource.id, changedFields)
    // Success
  } catch (error) {
    // Rollback on error
    Object.assign(localData.value, original)
    console.error(error)
  }
}
</script>
```

### Pattern 4: Delete with Confirmation

```typescript
<script setup lang="ts">
import { deleteResource } from '~/repositories/resource'

const { confirm } = useConfirm()  // Custom composable

async function handleDelete(id: number) {
  const confirmed = await confirm({
    title: 'Delete Resource?',
    message: 'This action cannot be undone.',
  })

  if (!confirmed) return

  try {
    await deleteResource(id)
    // Remove from local list or refresh
    await refresh()
  } catch (error: any) {
    console.error('Delete failed:', error.data?.message)
  }
}
</script>
```

### Pattern 5: Bulk Operations

```typescript
<script setup lang="ts">
import { deleteResources } from '~/repositories/resource'

const selectedIds = ref<number[]>([])

async function handleBulkDelete() {
  if (selectedIds.value.length === 0) return

  try {
    await deleteResources(selectedIds.value)
    selectedIds.value = []
    await refresh()
  } catch (error: any) {
    console.error('Bulk delete failed:', error.data?.message)
  }
}
</script>
```

### Pattern 6: File Upload with Progress

```typescript
<script setup lang="ts">
import { importResources } from '~/repositories/resource'

const file = ref<File | null>(null)
const uploading = ref(false)
const result = ref<ImportResponse | null>(null)

async function handleImport() {
  if (!file.value) return

  uploading.value = true

  try {
    result.value = await importResources({ file: file.value })
    // Show success message with import stats
  } catch (error: any) {
    console.error('Import failed:', error.data?.message)
  } finally {
    uploading.value = false
  }
}
</script>
```

## API Client Checklist

When implementing a new feature with the API client:

- [ ] Define TypeScript interfaces for request/response in `app/types/<domain>.d.ts`
- [ ] Create repository functions in `app/repositories/<domain>.ts`
- [ ] Add JSDoc comments with HTTP method and endpoint
- [ ] Use `$api` from `useNuxtApp()` for all API calls
- [ ] Add proper type annotations to all functions
- [ ] Handle errors with try-catch blocks
- [ ] Test API calls in development
- [ ] Update this guideline if adding new patterns

---

## Quick Reference

### Import Patterns

```typescript
// Use API client
const { $api } = useNuxtApp()

// Use auth
const { user, token, login, logout } = useAuth()

// Use settings
const { settings, fetch } = useSettings()

// Import repository functions
import { listResources, createResource } from '~/repositories/resource'

// Import types
import type { Resource, CreateResourceRequest } from '~/types/resource'
```

### API Call Patterns

```typescript
// GET with query params
await $api('/endpoint', { method: 'GET', query: { page: 1 } })

// POST with JSON body
await $api('/endpoint', { method: 'POST', body: { name: 'value' } })

// PUT with JSON body
await $api('/endpoint/1', { method: 'PUT', body: { name: 'updated' } })

// DELETE
await $api('/endpoint/1', { method: 'DELETE' })

// POST with FormData
const formData = new FormData()
formData.append('file', file)
await $api('/endpoint', { method: 'POST', body: formData })
```

---

## Conclusion

The API client module provides a robust, type-safe foundation for communicating with backend APIs in your Nuxt application. By following this guide and established patterns, you can maintain consistency, improve developer experience, and reduce bugs across your application.

For questions or improvements to this guide, please update this document and commit your changes.

---

**Last Updated:** 2025-11-07
**Module Version:** 1.0.0
**Nuxt Compatibility:** 3.x
