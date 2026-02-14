import API_BASE_URL from '@/config/api'

/**
 * Wrapper around fetch that:
 * 1. Always prefixes API_BASE_URL
 * 2. Adds Authorization header
 * 3. Adds gardenId to query params (GET) or body (POST/PUT)
 */
export async function apiFetch(
  path: string,
  options: {
    method?: string
    token?: string | null
    gardenId?: string | null
    body?: any
    headers?: Record<string, string>
  } = {}
): Promise<Response> {
  const { method = 'GET', token, gardenId, body, headers = {} } = options

  // Build URL with gardenId as query param
  let url = `${API_BASE_URL}${path}`
  
  if (gardenId) {
    const separator = url.includes('?') ? '&' : '?'
    url += `${separator}gardenId=${gardenId}`
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      ...headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  }

  if (body && method !== 'GET' && method !== 'HEAD') {
    const bodyData = gardenId ? { ...body, gardenId } : body
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'Content-Type': 'application/json',
    }
    fetchOptions.body = JSON.stringify(bodyData)
  }

  return fetch(url, fetchOptions)
}

export default apiFetch
