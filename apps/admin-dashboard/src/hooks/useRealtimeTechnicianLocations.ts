import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export type TechnicianMapItem = {
  technicianId: number;
  userId?: number | null;
  technicianName: string;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  orderId?: number | null;
  orderStatus?: string | null;
  lat: number;
  lng: number;
  latitude: number;
  longitude: number;
  updatedAt: string;
  isOnline?: boolean;
};

type UseRealtimeTechnicianLocationsOptions = {
  apiBaseUrl?: string;
  socketBaseUrl?: string;
  pollingIntervalMs?: number;
};

type RealtimePayload = Record<string, unknown>;

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  'http://localhost:3001/api';

const DEFAULT_SOCKET_BASE_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:3001';

const SOCKET_EVENTS = [
  'technician_location_update',
  'technicianLocationUpdate',
  'location:update',
] as const;

function ensureApiBaseUrl(value?: string): string {
  const raw = (value || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, '');
  if (raw.endsWith('/api')) return raw;
  return `${raw}/api`;
}

function ensureSocketBaseUrl(value?: string): string {
  return (value || DEFAULT_SOCKET_BASE_URL).trim().replace(/\/+$/, '');
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseId(value: unknown): number | null {
  const parsed = parseNumber(value);
  if (parsed === null) return null;
  return Math.trunc(parsed);
}

function getUpdatedAt(payload: Record<string, unknown>): string {
  const candidates = [payload.updatedAt, payload.timestamp, payload.createdAt, payload.lastUpdated];

  for (const item of candidates) {
    if (typeof item === 'string' && item.trim()) {
      return item;
    }
  }

  return new Date().toISOString();
}

function getTechnicianName(payload: Record<string, unknown>, technicianId: number): string {
  const directName =
    payload.technicianName || payload.name || payload.fullName || payload.displayName;

  if (typeof directName === 'string' && directName.trim()) {
    return directName.trim();
  }

  const technicianObj =
    typeof payload.technician === 'object' && payload.technician !== null
      ? (payload.technician as Record<string, unknown>)
      : null;

  if (technicianObj) {
    const nestedName = technicianObj.name || technicianObj.fullName || technicianObj.displayName;

    if (typeof nestedName === 'string' && nestedName.trim()) {
      return nestedName.trim();
    }
  }

  return `Technician #${technicianId}`;
}

function normalizeLocationPayload(input: unknown): TechnicianMapItem | null {
  if (!input || typeof input !== 'object') return null;

  const payload = input as Record<string, unknown>;

  const technicianId =
    parseId(payload.technicianId) ??
    parseId(payload.id) ??
    parseId(
      typeof payload.technician === 'object' && payload.technician !== null
        ? (payload.technician as Record<string, unknown>).id
        : null,
    );

  if (technicianId === null) return null;

  const locationObj =
    typeof payload.location === 'object' && payload.location !== null
      ? (payload.location as Record<string, unknown>)
      : null;

  const userObj =
    typeof payload.user === 'object' && payload.user !== null
      ? (payload.user as Record<string, unknown>)
      : null;

  const technicianObj =
    typeof payload.technician === 'object' && payload.technician !== null
      ? (payload.technician as Record<string, unknown>)
      : null;

  const orderObj =
    typeof payload.order === 'object' && payload.order !== null
      ? (payload.order as Record<string, unknown>)
      : null;

  const latitude =
    parseNumber(payload.latitude) ??
    parseNumber(payload.lat) ??
    parseNumber(locationObj?.latitude) ??
    parseNumber(locationObj?.lat);

  const longitude =
    parseNumber(payload.longitude) ??
    parseNumber(payload.lng) ??
    parseNumber(payload.lon) ??
    parseNumber(locationObj?.longitude) ??
    parseNumber(locationObj?.lng) ??
    parseNumber(locationObj?.lon);

  if (latitude === null || longitude === null) return null;

  const userId = parseId(payload.userId) ?? parseId(userObj?.id);
  const orderId = parseId(payload.orderId) ?? parseId(orderObj?.id);

  const orderStatus =
    (typeof payload.orderStatus === 'string' && payload.orderStatus) ||
    (typeof orderObj?.status === 'string' ? orderObj.status : null) ||
    null;

  return {
    technicianId,
    userId,
    technicianName: getTechnicianName(payload, technicianId),
    email:
      (typeof payload.email === 'string' && payload.email) ||
      (typeof userObj?.email === 'string' ? userObj.email : null) ||
      null,
    phone:
      (typeof payload.phone === 'string' && payload.phone) ||
      (typeof technicianObj?.phone === 'string' ? technicianObj.phone : null) ||
      null,
    status:
      (typeof payload.status === 'string' && payload.status) ||
      (typeof technicianObj?.status === 'string' ? technicianObj.status : null) ||
      null,
    orderId,
    orderStatus,
    lat: latitude,
    lng: longitude,
    latitude,
    longitude,
    updatedAt: getUpdatedAt(payload),
    isOnline: typeof payload.isOnline === 'boolean' ? payload.isOnline : true,
  };
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  const keys = ['accessToken', 'access_token', 'token', 'auth_token', 'admin_access_token'];

  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value && value.trim()) return value;
  }

  return null;
}

async function fetchJson<T>(url: string, token?: string | null): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text || 'Request failed'}`);
  }

  return response.json() as Promise<T>;
}

function extractArrayResponse(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;

  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const candidates = [obj.data, obj.items, obj.results, obj.payload];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate;
    }

    if (obj.data && typeof obj.data === 'object' && obj.data !== null) {
      const nested = obj.data as Record<string, unknown>;
      const nestedCandidates = [nested.items, nested.results, nested.data];

      for (const candidate of nestedCandidates) {
        if (Array.isArray(candidate)) return candidate;
      }
    }
  }

  return [];
}

function getTimeValue(value?: string | null): number {
  if (!value) return 0;

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function useRealtimeTechnicianLocations(options?: UseRealtimeTechnicianLocationsOptions) {
  const apiBaseUrl = useMemo(() => ensureApiBaseUrl(options?.apiBaseUrl), [options?.apiBaseUrl]);

  const socketBaseUrl = useMemo(
    () => ensureSocketBaseUrl(options?.socketBaseUrl),
    [options?.socketBaseUrl],
  );

  const pollingIntervalMs = options?.pollingIntervalMs ?? 15000;

  const [technicians, setTechnicians] = useState<TechnicianMapItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastSocketEventAt, setLastSocketEventAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const socketRef = useRef<Socket | null>(null);

  const upsertTechnician = useCallback((incoming: TechnicianMapItem) => {
    setTechnicians(prev => {
      const existingIndex = prev.findIndex(item => item.technicianId === incoming.technicianId);

      if (existingIndex === -1) {
        return [...prev, incoming].sort((a, b) => a.technicianId - b.technicianId);
      }

      const current = prev[existingIndex];
      const currentTime = getTimeValue(current.updatedAt);
      const incomingTime = getTimeValue(incoming.updatedAt);

      if (incomingTime < currentTime) {
        return prev;
      }

      const next = [...prev];
      next[existingIndex] = {
        ...current,
        ...incoming,
      };

      return next;
    });
  }, []);

  const replaceAllTechnicians = useCallback((items: TechnicianMapItem[]) => {
    const deduped = new Map<number, TechnicianMapItem>();

    for (const item of items) {
      const existing = deduped.get(item.technicianId);

      if (!existing) {
        deduped.set(item.technicianId, item);
        continue;
      }

      const existingTime = getTimeValue(existing.updatedAt);
      const nextTime = getTimeValue(item.updatedAt);

      if (nextTime >= existingTime) {
        deduped.set(item.technicianId, item);
      }
    }

    setTechnicians(Array.from(deduped.values()).sort((a, b) => a.technicianId - b.technicianId));
  }, []);

  const refresh = useCallback(
    async (mode: 'initial' | 'polling' | 'manual' = 'manual') => {
      if (typeof window === 'undefined') return;

      const token = getAccessToken();

      try {
        if (mode === 'initial') {
          setIsInitialLoading(true);
        } else {
          setIsRefreshing(true);
        }

        if (mode !== 'polling') {
          setError(null);
        }

        const raw = await fetchJson<unknown>(`${apiBaseUrl}/technicians/locations`, token);

        const items = extractArrayResponse(raw)
          .map(normalizeLocationPayload)
          .filter((item): item is TechnicianMapItem => item !== null);

        if (!isMountedRef.current) return;
        replaceAllTechnicians(items);
      } catch (err) {
        if (!isMountedRef.current) return;
        const message = err instanceof Error ? err.message : 'Không tải được vị trí technician';
        setError(message);
      } finally {
        if (isMountedRef.current) {
          setIsInitialLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [apiBaseUrl, replaceAllTechnicians],
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void refresh('initial');
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const interval = window.setInterval(() => {
      void refresh('polling');
    }, pollingIntervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [pollingIntervalMs, refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = getAccessToken();

    const socket = io(socketBaseUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: token ? { token: `Bearer ${token}` } : undefined,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (!isMountedRef.current) return;
      setSocketConnected(true);
      setError(current => (current === 'Socket connect error' ? null : current));
    });

    socket.on('disconnect', () => {
      if (!isMountedRef.current) return;
      setSocketConnected(false);
    });

    socket.on('connect_error', (err: Error) => {
      if (!isMountedRef.current) return;
      setSocketConnected(false);
      setError(err.message || 'Socket connect error');
    });

    const handleRealtimeUpdate = (payload: RealtimePayload) => {
      const normalized = normalizeLocationPayload(payload);
      if (!normalized) return;

      upsertTechnician(normalized);
      setLastSocketEventAt(new Date().toISOString());
    };

    for (const eventName of SOCKET_EVENTS) {
      socket.on(eventName, handleRealtimeUpdate);
    }

    return () => {
      for (const eventName of SOCKET_EVENTS) {
        socket.off(eventName, handleRealtimeUpdate);
      }
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [socketBaseUrl, upsertTechnician]);

  return {
    technicians,
    isInitialLoading,
    isRefreshing,
    socketConnected,
    lastSocketEventAt,
    error,
    refresh,
  };
}