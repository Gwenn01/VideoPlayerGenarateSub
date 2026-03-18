// base url
const BASE_URL = "http://127.0.0.1:8000/api/";
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
// data should be passed
interface ApiOptions {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
}
// client for making api calls
export const apiClient = async <T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> => {
  const { method = "GET", body, headers = {} } = options;
  const isFormData = body instanceof FormData;
  const res = await fetch(BASE_URL + endpoint, {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });
  // parse response
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  // handle errors before return
  if (!res.ok) {
    throw new Error(data?.error || data?.message || "API Error");
  }
  return data as T;
};
