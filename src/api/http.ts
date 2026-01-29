//src/api/http.ts
import { debug as logDebug } from '../lib/log'

type Primitive = string | number | boolean | null | undefined

export interface RequestOptions {
    headers?: Record<string, string>
    params?: Record<string, Primitive | Primitive[]>
    signal?: AbortSignal
}

function buildQuery(params: RequestOptions['params']): string {
    if (!params) return ''
    const parts: string[] = []
    for (const key of Object.keys(params)) {
        const val = params[key]
        if (val === undefined) continue
        if (Array.isArray(val)) {
            for (const v of val) {
                parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
            }
        } else {
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`)
        }
    }
    return parts.length ? `?${parts.join('&')}` : ''
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
        return (await res.json()) as T
    }
    // If not JSON, try to return text as any
    const text = await res.text()
    return text as unknown as T
}

export async function request<T = any>(
    url: string,
    options: RequestOptions & { method?: string; data?: any } = {}
): Promise<T> {
    const { method = 'GET', data, params, headers, signal } = options
    const query = buildQuery(params)
    const finalUrl = `${url}${query}`

    const init: RequestInit = {
        method,
        headers: {
            Accept: 'application/json',
            ...(headers || {}),
        },
        signal,
    }

    if (data !== undefined && method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') {
        (init.headers as Record<string, string>)['Content-Type'] = 'application/json'
        init.body = JSON.stringify(data)
    }

    // Debug logging: show outgoing request method, URL and body for troubleshooting.
    try {
        // Avoid logging large bodies in production; this is temporary debugging.
        logDebug('[http] request:', method, finalUrl, init.body ? JSON.parse(String(init.body)) : undefined)
    } catch (e) {
        try { logDebug('[http] request:', method, finalUrl, init.body) } catch { /* noop */ }
    }

    const res = await fetch(finalUrl, init)

    if (!res.ok) {
        // Try to get JSON error body when available
        let errBody: any = null
        try {
            errBody = await res.json()
        } catch {
            try {
                errBody = await res.text()
            } catch {
                errBody = null
            }
        }
        const message = (errBody && (errBody.message || JSON.stringify(errBody))) || res.statusText || `HTTP ${res.status}`
        const error = new Error(message)
            ; (error as any).status = res.status
            ; (error as any).body = errBody
        throw error
    }

    if (res.status === 204) {
        return undefined as unknown as T
    }

    return await parseJsonResponse<T>(res)
}

export function get<T = any>(url: string, params?: RequestOptions['params'], options: Omit<RequestOptions, 'params'> = {}): Promise<T> {
    return request<T>(url, { ...options, method: 'GET', params })
}

export function post<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return request<T>(url, { ...options, method: 'POST', data })
}

export function put<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return request<T>(url, { ...options, method: 'PUT', data })
}

export function del<T = any>(url: string, paramsOrData?: any, options: RequestOptions = {}): Promise<T> {
    // If caller supplies an object and wants it as query params for DELETE, they can pass it as params
    // Detect if paramsOrData is a plain object and no data provided -> treat as params
    return request<T>(url, { ...options, method: 'DELETE', ...(options.params ? {} : { params: paramsOrData }) })
}
