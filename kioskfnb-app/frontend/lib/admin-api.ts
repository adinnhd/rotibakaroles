export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"

const API_BASE_URL = API_URL.replace(/\/api\/?$/, "")

export interface ApiResponse<T> {
  message: string
  data: T
}

export interface AdminUser {
  id: number
  name: string
  email: string
  role: "admin" | "user" | string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function readApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const text = await response.text()

  try {
    return JSON.parse(text) as ApiResponse<T>
  } catch {
    return {
      message: text
        ? text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
        : "Server returned an invalid response",
      data: null as T,
    }
  }
}

export async function getCurrentAdmin() {
  return apiRequest<{ user: AdminUser }>("/auth/me", {
    cache: "no-store",
  })
}

export async function loginAdmin(email: string, password: string) {
  await ensureCsrfCookie()

  return apiRequest<{ user: AdminUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function logoutAdmin() {
  return apiRequest<null>("/auth/logout", {
    method: "POST",
  })
}

export async function apiRequest<T>(path: string, options?: RequestInit) {
  const method = options?.method?.toUpperCase() ?? "GET"
  const headers = new Headers(options?.headers)

  headers.set("Accept", "application/json")

  if (requiresCsrf(method)) {
    await ensureCsrfCookie()
    const xsrfToken = getCookie("XSRF-TOKEN")

    if (xsrfToken) {
      headers.set("X-XSRF-TOKEN", xsrfToken)
    }
  }

  if (options?.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  })
  const json = await readApiResponse<T>(response)

  if (!response.ok) {
    throw new ApiError(json.message || "Request failed", response.status)
  }

  return json
}

async function ensureCsrfCookie() {
  await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
    credentials: "include",
  })
}

function requiresCsrf(method: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(method)
}

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return ""
  }

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1]

  return cookie ? decodeURIComponent(cookie) : ""
}
