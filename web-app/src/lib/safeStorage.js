// Bọc localStorage an toàn: trong WebView Tauri (custom protocol) truy cập
// localStorage có thể ném lỗi SecurityError, làm React không khởi động được.

export function storageGet(key, fallback = null) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null || value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
}

export function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

export function storageRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
