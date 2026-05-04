const RAW_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "/api";

function getBaseUrl(raw: string): string {
  let base = raw.replace(/\/$/, "");
  
  // If it's a remote host (has a dot) but no protocol, assume https
  if (base.includes(".") && !base.startsWith("http") && !base.startsWith("/")) {
    base = `https://${base}`;
  }

  // If it's a full URL but missing the /api prefix, add it
  if (base.startsWith("http") && !base.endsWith("/api")) {
    base = `${base}/api`;
  }
  
  return base;
}

const API_BASE = getBaseUrl(RAW_URL);

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(`GET ${path} failed: ${res.status}`, res.status, body);
  }
  return (await res.json()) as T;
}

export async function apiPostFormData<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    let payload: unknown = undefined;
    const text = await res.text().catch(() => "");
    try {
      payload = text ? JSON.parse(text) : { detail: `Error ${res.status}` };
    } catch {
      payload = { detail: text || `Error ${res.status}` };
    }
    const detail =
      typeof payload === "object" && payload !== null && "detail" in payload
        ? String((payload as { detail: unknown }).detail)
        : `POST ${path} failed: ${res.status}`;
    throw new ApiError(detail, res.status, payload);
  }
  const text = await res.text();
  if (!text) {
    throw new ApiError("Empty response from server", res.status);
  }
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new ApiError("Invalid JSON response from server", res.status, text);
  }
}
