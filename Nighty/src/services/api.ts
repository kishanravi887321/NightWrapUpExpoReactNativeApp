import * as SecureStore from 'expo-secure-store';
import { ApiEnvelope, ApiLibrary, ApiSong, MobileLoginResponse } from '../types/api';

export const API_BASE_URL = 'https://apinightwrapup.ziax.online/api';

const STORAGE_KEYS = {
  accessToken: 'nightwrapup_access_token',
  refreshToken: 'nightwrapup_refresh_token',
};

const readJson = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const logApiPayload = (label: string, value: unknown) => {
  try {
    console.log(`[NightWrapUp API] ${label}:`, JSON.stringify(value, null, 2));
  } catch {
    console.log(`[NightWrapUp API] ${label}:`, value);
  }
};

export const saveSession = async (accessToken: string, refreshToken: string) => {
  await SecureStore.setItemAsync(STORAGE_KEYS.accessToken, accessToken);
  await SecureStore.setItemAsync(STORAGE_KEYS.refreshToken, refreshToken);
};

export const clearSession = async () => {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.accessToken);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.refreshToken);
};

export const getStoredToken = async () => SecureStore.getItemAsync(STORAGE_KEYS.accessToken);
export const getStoredRefreshToken = async () => SecureStore.getItemAsync(STORAGE_KEYS.refreshToken);

export const refreshSession = async (): Promise<boolean> => {
  const refreshToken = await getStoredRefreshToken();

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/mobile-refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const payload = await readJson<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(response);

    if (response.ok && payload?.success && payload.data?.accessToken && payload.data?.refreshToken) {
      await saveSession(payload.data.accessToken, payload.data.refreshToken);
      return true;
    }

    await clearSession();
    return false;
  } catch {
    await clearSession();
    return false;
  }
};

export const requestWithAuth = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const execute = async (token?: string | null): Promise<Response> => {
    const headers = new Headers(options.headers ?? {});
    headers.set('Accept', 'application/json');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  };

  let token = await getStoredToken();
  console.log(`[NightWrapUp API] ${options.method ?? 'GET'} ${path}`);
  let response = await execute(token);

  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (!refreshed) {
      throw new Error('Your mobile session expired. Please sign in again.');
    }
    token = await getStoredToken();
    response = await execute(token);
  }

  const payload = await readJson<T | ApiEnvelope<T> | T[]>(response);
  console.log(`[NightWrapUp API] RESPONSE ${response.status} ${path}`);
  logApiPayload(`DATA ${path}`, payload);

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : 'Request failed.';
    throw new Error(message);
  }

  if (Array.isArray(payload)) {
    return payload as T;
  }

  if (payload && typeof payload === 'object' && 'success' in payload) {
    if ((payload as { success: boolean }).success === false) {
      throw new Error((payload as { message?: string }).message ?? 'Request failed.');
    }
    if ('data' in payload) {
      return (payload as ApiEnvelope<T>).data as T;
    }
  }

  return (payload as T) ?? ({} as T);
};

export const mobileLogin = async (email: string, secretKey: string): Promise<MobileLoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/mobile-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), secretKey }),
  });

  const payload = await readJson<ApiEnvelope<MobileLoginResponse>>(response);

  if (!response.ok || !payload?.success || !payload.data?.accessToken || !payload.data?.refreshToken) {
    throw new Error(payload?.message ?? 'Mobile login failed.');
  }

  await saveSession(payload.data.accessToken, payload.data.refreshToken);
  return payload.data;
};

export const fetchLibraries = async (): Promise<ApiLibrary[]> =>
  requestWithAuth<ApiLibrary[]>('/libraries');

export const fetchSongsForLibrary = async (libraryId: string): Promise<ApiSong[]> =>
  requestWithAuth<ApiSong[]>(`/libraries/${encodeURIComponent(libraryId)}/songs`);

export const markSongPlayed = async (libraryId: string, songId: string) =>
  requestWithAuth<{ success: boolean }>(`/libraries/${encodeURIComponent(libraryId)}/songs/${encodeURIComponent(songId)}/play`, {
    method: 'POST',
  });
