const apiBaseUrl = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000')).replace(/\/$/, '')
const API_BASE = apiBaseUrl;

// Hybrid API client supporting both fetch-style calls and Axios-style requests
async function api(path, options = {}) {
  // Normalize path (ensure it starts with /api)
  let cleanPath = path;
  if (!cleanPath.startsWith('/api') && !cleanPath.startsWith('http')) {
    cleanPath = `/api/${cleanPath.replace(/^\//, '')}`;
  }

  const token = localStorage.getItem('rportal_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  // Stringify the body if it is an object
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE}${cleanPath}`, config);

  if (!response.ok) {
    let errorDetail = `Request failed: ${response.status}`;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || errorDetail;
    } catch {
      const errorText = await response.text();
      if (errorText) errorDetail = errorText;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) return null;
  return response.json();
}

// Axios compatibility adapters returning { data: jsonBody }
api.get = async (path, options = {}) => {
  const data = await api(path, { ...options, method: 'GET' });
  return { data };
};

api.post = async (path, body = {}, options = {}) => {
  const data = await api(path, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
  return { data };
};

api.put = async (path, body = {}, options = {}) => {
  const data = await api(path, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return { data };
};

api.delete = async (path, options = {}) => {
  const data = await api(path, { ...options, method: 'DELETE' });
  return { data };
};

export default api;
