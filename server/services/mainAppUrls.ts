export type MainAppUrls = {
  clientUrl: string | null;
  apiUrl: string | null;
  serverUrl: string | null;
};

function trimUrl(value: string | undefined): string | null {
  const v = value?.trim().replace(/\/$/, '');
  return v ? v : null;
}

/** Löst Client-, API- und optionale Server-URLs aus ENV auf. */
export function getMainAppUrls(): MainAppUrls {
  const apiUrl = trimUrl(process.env.RABBITSTATION_API_URL) ?? trimUrl(process.env.RABBITSTATION_SERVER_URL);
  const serverUrl = trimUrl(process.env.RABBITSTATION_SERVER_URL) ?? apiUrl;
  const clientUrl = trimUrl(process.env.RABBITSTATION_CLIENT_URL) ?? apiUrl;
  return { clientUrl, apiUrl, serverUrl };
}

export function displayOrigin(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}
