declare global {
  interface Window {
    __API_BASE_URL__?: string;
  }
}

declare const __API_BASE_URL__: string | undefined;

function getConfiguredBaseUrl() {
  if (typeof __API_BASE_URL__ !== "undefined" && __API_BASE_URL__) {
    return __API_BASE_URL__;
  }

  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (typeof window !== "undefined" && window.__API_BASE_URL__) {
    return window.__API_BASE_URL__;
  }

  if (typeof process !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.VITE_API_BASE_URL ||
      ""
    );
  }

  return "";
}

export function getApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = getConfiguredBaseUrl().trim().replace(/\/+$/, "");

  if (!baseUrl) {
    return normalizedPath;
  }

  return `${baseUrl}${normalizedPath}`;
}
