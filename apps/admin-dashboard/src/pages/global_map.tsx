import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import dynamic from 'next/dynamic';

const GoogleTechnicianMap = dynamic(
  () => import('../components/maps/google-technician-map'),
  { ssr: false },
);

const OSMTechnicianMap = dynamic(
  () => import('../components/maps/osm-technician-map'),
  { ssr: false },
);

import {
  applyTechnicianLocationSocketUpdate,
  getTechnicianMapData,
  type TechnicianLocationSocketPayload,
  type TechnicianMapItem,
} from '../services/api';

type MapProvider = 'google' | 'osm';

function formatTime(value?: string | null) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
}

function formatCoordinate(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  return value.toFixed(6);
}

export default function GlobalMapPage() {
  const envProvider: MapProvider =
    process.env.NEXT_PUBLIC_MAP_PROVIDER === 'google' ? 'google' : 'osm';

  const [mapProvider, setMapProvider] = useState<MapProvider>(envProvider);
  const [technicians, setTechnicians] = useState<TechnicianMapItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastSocketEventAt, setLastSocketEventAt] = useState<string | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  const loadTechnicians = useCallback(
    async (mode: 'initial' | 'manual' | 'polling') => {
      try {
        if (mode === 'initial') {
          setIsInitialLoading(true);
        } else {
          setIsRefreshing(true);
        }

        setError(null);

        const data = await getTechnicianMapData();
        setTechnicians(data);

        if (data.length) {
          setSelectedTechnicianId((current) => current ?? data[0].technicianId);
        } else {
          setSelectedTechnicianId(null);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Không thể tải dữ liệu technician';
        setError(message);
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadTechnicians('initial');
  }, [loadTechnicians]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadTechnicians('polling');
    }, 30000);

    return () => window.clearInterval(interval);
  }, [loadTechnicians]);

  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      'http://localhost:3002';

    const socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('connect_error', (connectError) => {
      setSocketConnected(false);
      setError(
        connectError?.message
          ? `Lỗi tải tracking: ${connectError.message}`
          : 'Lỗi tải tracking: socket connect failed',
      );
    });

    socket.on('technician_location_update', (payload: any) => {
      console.log('RAW SOCKET PAYLOAD:', payload)

      const technicianId =
        typeof payload?.technicianId === 'number'
          ? payload.technicianId
          : typeof payload?.id === 'number'
            ? payload.id
            : null

      const lat =
        typeof payload?.lat === 'number'
          ? payload.lat
          : typeof payload?.latitude === 'number'
            ? payload.latitude
            : null

      const lng =
        typeof payload?.lng === 'number'
          ? payload.lng
          : typeof payload?.longitude === 'number'
            ? payload.longitude
            : null

      if (
        technicianId === null ||
        typeof lat !== 'number' ||
        typeof lng !== 'number'
      ) {
        console.warn('Invalid technician_location_update payload:', payload)
        return
      }

      const normalizedPayload = {
        ...payload,
        technicianId,
        id: technicianId,
        lat,
        lng,
      }

      setLastSocketEventAt(new Date().toISOString())

      setTechnicians((current) =>
        applyTechnicianLocationSocketUpdate(current, normalizedPayload)
      )
    })

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const selectedTechnician = useMemo(() => {
    if (!technicians.length) return null;

    return (
      technicians.find((item) => item.technicianId === selectedTechnicianId) ??
      technicians[0]
    );
  }, [technicians, selectedTechnicianId]);

  const effectiveProvider: MapProvider =
    mapProvider === 'google' &&
    !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      ? 'osm'
      : mapProvider;

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          border: '1px solid #d1d5db',
          background: '#ffffff',
          padding: 16,
          borderRadius: 12,
          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>
              Technician Global Map
            </h1>
            <p style={{ marginTop: 8, color: '#4b5563' }}>
              Realtime technician tracking từ API thật và socket thật
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 12,
              fontSize: 14,
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                borderRadius: 999,
                padding: '6px 12px',
                fontWeight: 600,
                background: socketConnected ? '#dcfce7' : '#fee2e2',
                color: socketConnected ? '#15803d' : '#b91c1c',
              }}
            >
              Socket: {socketConnected ? 'Connected' : 'Disconnected'}
            </span>

            <span
              style={{
                display: 'inline-flex',
                borderRadius: 999,
                padding: '6px 12px',
                fontWeight: 600,
                background: '#dbeafe',
                color: '#1d4ed8',
              }}
            >
              Technicians: {technicians.length}
            </span>

            <span style={{ color: '#6b7280' }}>
              Last event: {formatTime(lastSocketEventAt)}
            </span>

            <div
              style={{
                display: 'inline-flex',
                overflow: 'hidden',
                border: '1px solid #d1d5db',
                borderRadius: 8,
              }}
            >
              <button
                type="button"
                onClick={() => setMapProvider('osm')}
                style={{
                  padding: '8px 14px',
                  border: 'none',
                  background: effectiveProvider === 'osm' ? '#0f172a' : '#ffffff',
                  color: effectiveProvider === 'osm' ? '#ffffff' : '#111827',
                  cursor: 'pointer',
                }}
              >
                OSM
              </button>
              <button
                type="button"
                onClick={() => setMapProvider('google')}
                style={{
                  padding: '8px 14px',
                  border: 'none',
                  borderLeft: '1px solid #d1d5db',
                  background:
                    effectiveProvider === 'google' ? '#0f172a' : '#ffffff',
                  color:
                    effectiveProvider === 'google' ? '#ffffff' : '#111827',
                  cursor: 'pointer',
                }}
              >
                Google
              </button>
            </div>

            <button
              type="button"
              onClick={() => void loadTechnicians('manual')}
              disabled={isRefreshing}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: '#ffffff',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
              }}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error ? (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
            }}
          >
            {error}
          </div>
        ) : null}

        {providerError ? (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              background: '#fff7ed',
              color: '#c2410c',
              border: '1px solid #fdba74',
            }}
          >
            {providerError}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <div
          style={{
            border: '1px solid #d1d5db',
            borderRadius: 12,
            overflow: 'hidden',
            background: '#ffffff',
            minHeight: 560,
          }}
        >
          {isInitialLoading ? (
            <div style={{ padding: 24 }}>Đang tải bản đồ...</div>
          ) : effectiveProvider === 'google' ? (
            <GoogleTechnicianMap
              technicians={technicians}
              selectedTechnicianId={selectedTechnicianId}
              onSelectTechnician={setSelectedTechnicianId}
              onProviderError={setProviderError}
            />
          ) : (
            <OSMTechnicianMap
              technicians={technicians}
              selectedTechnicianId={selectedTechnicianId}
              onSelectTechnician={setSelectedTechnicianId}
            />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section
            style={{
              border: '1px solid #d1d5db',
              borderRadius: 12,
              background: '#ffffff',
              padding: 16,
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 20 }}>
              Technician Detail
            </h2>

            {!selectedTechnician ? (
              <div style={{ color: '#6b7280' }}>
                Chưa có technician location để hiển thị.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <strong>Name:</strong> {selectedTechnician.technicianName}
                </div>
                <div>
                  <strong>Technician ID:</strong> {selectedTechnician.technicianId}
                </div>
                <div>
                  <strong>Status:</strong> {selectedTechnician.status ?? '--'}
                </div>
                <div>
                  <strong>Order ID:</strong> {selectedTechnician.orderId ?? '--'}
                </div>
                <div>
                  <strong>Online:</strong> {selectedTechnician.isOnline ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Latitude:</strong> {formatCoordinate(selectedTechnician.lat)}
                </div>
                <div>
                  <strong>Longitude:</strong> {formatCoordinate(selectedTechnician.lng)}
                </div>
                <div>
                  <strong>Updated at:</strong>{' '}
                  {formatTime(selectedTechnician.updatedAt)}
                </div>
              </div>
            )}
          </section>

          <section
            style={{
              border: '1px solid #d1d5db',
              borderRadius: 12,
              background: '#ffffff',
              padding: 16,
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 20 }}>
              Technician List
            </h2>

            {!technicians.length ? (
              <div
                style={{
                  color: '#6b7280',
                  border: '1px dashed #d1d5db',
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                Chưa có technician location để hiển thị.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {technicians.map((item) => {
                  const isActive = item.technicianId === selectedTechnician?.technicianId;

                  return (
                    <button
                      key={item.technicianId}
                      type="button"
                      onClick={() => setSelectedTechnicianId(item.technicianId)}
                      style={{
                        textAlign: 'left',
                        width: '100',
                        borderRadius: 10,
                        padding: 12,
                        border: isActive ? '1px solid #2563eb' : '1px solid #e5e7eb',
                        background: isActive ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{item.technicianName}</div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                        ID: {item.technicianId} • Status: {item.status ?? '--'}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}