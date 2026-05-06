import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from 'axios'

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3002/api'
).replace(/\/$/, '')

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

export type TechnicianMapItem = {
  technicianId: number
  technicianName: string
  lat: number
  lng: number
  status: string | null
  orderId: number | null
  isOnline: boolean
  updatedAt: string | null
}

export type TechnicianLocationSocketPayload = {
  id: number
  technicianId?: number
  lat: number
  lng: number
  status?: string | null
  orderId?: number | null
  isOnline?: boolean
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null

  const keys = [
    'accessToken',
    'access_token',
    'token',
    'auth_token',
    'admin_access_token',
  ]

  for (const key of keys) {
    const value = window.localStorage.getItem(key)
    if (value && value.trim()) return value.trim()
  }

  return null
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null

  const keys = ['refreshToken', 'refresh_token']

  for (const key of keys) {
    const value = window.localStorage.getItem(key)
    if (value && value.trim()) return value.trim()
  }

  return null
}

export function setAuthTokens(accessToken: string, refreshToken?: string | null) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem('accessToken', accessToken)

  if (refreshToken && refreshToken.trim()) {
    window.localStorage.setItem('refreshToken', refreshToken.trim())
  }
}

export function clearAuthTokens() {
  if (typeof window === 'undefined') return

  ;[
    'accessToken',
    'access_token',
    'token',
    'auth_token',
    'admin_access_token',
    'refreshToken',
    'refresh_token',
  ].forEach((key) => window.localStorage.removeItem(key))
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toTechnicianName(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.trim()
  return 'Unknown technician'
}

function normalizeTechnicianLocation(raw: any): TechnicianMapItem | null {
  if (!raw || typeof raw !== 'object') return null

  const technicianId =
    toNumber(raw.technicianId) ??
    toNumber(raw.id) ??
    toNumber(raw.userId)

  const lat =
    toNumber(raw.lat) ??
    toNumber(raw.latitude)

  const lng =
    toNumber(raw.lng) ??
    toNumber(raw.longitude)

  if (technicianId == null || lat == null || lng == null) {
    return null
  }

  return {
    technicianId,
    technicianName: toTechnicianName(raw.technicianName ?? raw.name),
    lat,
    lng,
    status:
      typeof raw.status === 'string' && raw.status.trim()
        ? raw.status
        : null,
    orderId: toNumber(raw.orderId),
    isOnline:
      typeof raw.isOnline === 'boolean'
        ? raw.isOnline
        : typeof raw.isAvailable === 'boolean'
          ? raw.isAvailable
          : true,
    updatedAt:
      typeof raw.updatedAt === 'string' && raw.updatedAt.trim()
        ? raw.updatedAt
        : null,
  }
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  const url = config.url ?? ''

  const isAuthLogin = url.includes('/auth/login')
  const isAuthRefresh = url.includes('/auth/refresh')

  if (token && !isAuthLogin && !isAuthRefresh) {
    const headers = AxiosHeaders.from(config.headers)
    headers.set('Authorization', `Bearer ${token}`)
    config.headers = headers
  }

  return config
})

let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    return null
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { timeout: 10000 },
    )

    const body = response.data ?? {}
    const data = body?.data ?? body

    if (body?.success === false) {
      return null
    }

    const newAccessToken: string | undefined = data?.accessToken
    const newRefreshToken: string | undefined = data?.refreshToken

    if (!newAccessToken || !newAccessToken.trim()) {
      return null
    }

    setAuthTokens(newAccessToken, newRefreshToken ?? refreshToken)
    return newAccessToken
  } catch {
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (!originalRequest) {
      return Promise.reject(error)
    }

    const status = error.response?.status
    const isRefreshCall = originalRequest.url?.includes('/auth/refresh')

    if (status !== 401 || originalRequest._retry || isRefreshCall) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false
      })
    }

    const newAccessToken = await refreshPromise
    refreshPromise = null

    if (!newAccessToken) {
      clearAuthTokens()

      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }

      return Promise.reject(error)
    }

    const headers = AxiosHeaders.from(originalRequest.headers)
    headers.set('Authorization', `Bearer ${newAccessToken}`)
    originalRequest.headers = headers

    return api(originalRequest)
  },
)

export async function login(email: string, password: string) {
  const response = await api.post('/auth/login', {
    email: email.trim(),
    password,
  })

  const body = response.data ?? {}
  const data = body?.data ?? body

  if (body?.success === false) {
    throw new Error(
      body?.error?.message ||
      body?.message ||
      'Authentication required',
    )
  }

  const accessToken: string | undefined =
    data?.accessToken ||
    data?.tokens?.accessToken

  const refreshToken: string | undefined =
    data?.refreshToken ||
    data?.tokens?.refreshToken

  if (!accessToken || !accessToken.trim()) {
    console.error('LOGIN RESPONSE INVALID:', body)
    throw new Error('Login response missing access token')
  }

  setAuthTokens(accessToken.trim(), refreshToken?.trim() ?? null)

  return data
}

export async function getTechnicianMapData(): Promise<TechnicianMapItem[]> {
  const [locationsResponse, techniciansResponse] = await Promise.allSettled([
    api.get('/technicians/locations'),
    api.get('/technicians', {
      params: { limit: 100 },
    }),
  ])

  const locationsRaw =
    locationsResponse.status === 'fulfilled'
      ? (locationsResponse.value.data?.data ??
          locationsResponse.value.data ??
          [])
      : []

  const techniciansRaw =
    techniciansResponse.status === 'fulfilled'
      ? (techniciansResponse.value.data?.data ??
          techniciansResponse.value.data ??
          [])
      : []

  const technicianMap = new Map<number, any>()

  if (Array.isArray(techniciansRaw)) {
    for (const technician of techniciansRaw) {
      const id =
        toNumber(technician?.id) ??
        toNumber(technician?.technicianId) ??
        toNumber(technician?.userId)

      if (id != null) {
        technicianMap.set(id, technician)
      }
    }
  }

  if (!Array.isArray(locationsRaw)) {
    return []
  }

  return locationsRaw
    .map((location) => {
      const normalized = normalizeTechnicianLocation(location)
      if (!normalized) return null

      const technician = technicianMap.get(normalized.technicianId)

      return {
        ...normalized,
        technicianName: technician
          ? toTechnicianName(technician.name ?? technician.technicianName)
          : normalized.technicianName,
        status:
          normalized.status ??
          (typeof technician?.status === 'string' ? technician.status : null),
        orderId:
          normalized.orderId ??
          toNumber(technician?.orderId),
        isOnline:
          typeof normalized.isOnline === 'boolean'
            ? normalized.isOnline
            : typeof technician?.isAvailable === 'boolean'
              ? technician.isAvailable
              : true,
        updatedAt:
          normalized.updatedAt ??
          (typeof technician?.updatedAt === 'string'
            ? technician.updatedAt
            : null),
      } satisfies TechnicianMapItem
    })
    .filter((item): item is TechnicianMapItem => item !== null)
}

export function applyTechnicianLocationSocketUpdate(
  current: TechnicianMapItem[],
  payload: TechnicianLocationSocketPayload,
): TechnicianMapItem[] {
  const technicianId = toNumber(payload.technicianId) ?? toNumber(payload.id)
  const lat = toNumber(payload.lat)
  const lng = toNumber(payload.lng)

  if (technicianId == null || lat == null || lng == null) {
    return current
  }

  const existing = current.find((item) => item.technicianId === technicianId)
  const updatedAt = new Date().toISOString()

  if (!existing) {
    return [
      {
        technicianId,
        technicianName: `Technician #${technicianId}`,
        lat,
        lng,
        status:
          typeof payload.status === 'string' ? payload.status : null,
        orderId: toNumber(payload.orderId),
        isOnline:
          typeof payload.isOnline === 'boolean' ? payload.isOnline : true,
        updatedAt,
      },
      ...current,
    ]
  }

  return current.map((item) =>
    item.technicianId === technicianId
      ? {
          ...item,
          lat,
          lng,
          status:
            typeof payload.status === 'string'
              ? payload.status
              : item.status,
          orderId:
            toNumber(payload.orderId) ?? item.orderId,
          isOnline:
            typeof payload.isOnline === 'boolean'
              ? payload.isOnline
              : item.isOnline,
          updatedAt,
        }
      : item,
  )
}

export default api