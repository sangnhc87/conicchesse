/**
 * Universal resilient JSON data loader for both Web and Tauri Desktop (custom scheme/file/localhost)
 */

const memoryCache = new Map();

export async function safeFetchJson(path) {
  if (memoryCache.has(path)) {
    return memoryCache.get(path);
  }
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  const candidates = [
    `/${cleanPath}`,
    `./${cleanPath}`,
    `${import.meta.env.BASE_URL || '/'}${cleanPath}`,
    `${window.location.origin}/${cleanPath}`
  ];

  const uniqueCandidates = Array.from(new Set(candidates));

  for (const url of uniqueCandidates) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        try {
          const json = await res.json();
          if (json && (typeof json === 'object' || Array.isArray(json))) {
            memoryCache.set(path, json);
            return json;
          }
        } catch {
          // Response wasn't valid JSON, try next candidate
        }
      }
    } catch {
      // Network error, try next candidate
    }
  }

  console.warn(`[dataLoader] Không thể tải JSON từ: ${path}`);
  return null;
}
