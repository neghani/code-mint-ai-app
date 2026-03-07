/**
 * Client-side fetch that treats 401/403 as session expiry and redirects to login.
 * Use for API calls that require or benefit from auth.
 */
const LOGIN_PATH = "/login";

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, { credentials: "include", ...init });
  if (res.status === 401 || res.status === 403) {
    const loginUrl = typeof window !== "undefined" ? `${window.location.origin}${LOGIN_PATH}` : LOGIN_PATH;
    if (typeof window !== "undefined") {
      window.location.href = loginUrl;
    }
    throw new Error("Session expired or access denied. Redirecting to login.");
  }
  return res;
}
