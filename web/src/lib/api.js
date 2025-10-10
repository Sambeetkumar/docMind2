export async function apiFetch(path, { method = 'GET', token, body, isForm = false } = {}) {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || 'Request failed');
  return res.json();
}
