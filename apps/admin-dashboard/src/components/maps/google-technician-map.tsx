import { useEffect, useMemo, useRef } from 'react';
import {
  GoogleMap,
  InfoWindow,
  Marker,
  useJsApiLoader,
} from '@react-google-maps/api';
import type { TechnicianMapItem } from '../../services/api';

type GoogleTechnicianMapProps = {
  technicians: TechnicianMapItem[];
  selectedTechnicianId: number | null;
  onSelectTechnician: (technicianId: number) => void;
  onProviderError?: (message: string) => void;
};

const defaultCenter = { lat: 10.7769, lng: 106.7009 };

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '520px',
};

function formatTime(value?: string | null) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
}

export default function GoogleTechnicianMap({
  technicians,
  selectedTechnicianId,
  onSelectTechnician,
  onProviderError,
}: GoogleTechnicianMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'technician-google-map-script',
    googleMapsApiKey: apiKey,
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!apiKey) {
      onProviderError?.('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
    }
  }, [apiKey, onProviderError]);

  useEffect(() => {
    if (loadError) {
      onProviderError?.(loadError.message || 'Failed to load Google Maps');
    }
  }, [loadError, onProviderError]);

  const selectedTechnician = useMemo(
    () =>
      technicians.find((item) => item.technicianId === selectedTechnicianId) ??
      null,
    [technicians, selectedTechnicianId],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    if (!technicians.length) {
      map.panTo(defaultCenter);
      map.setZoom(12);
      return;
    }

    if (selectedTechnician) {
      map.panTo({
        lat: selectedTechnician.lat,
        lng: selectedTechnician.lng,
      });
      map.setZoom(15);
      return;
    }

    if (technicians.length === 1) {
      map.panTo({
        lat: technicians[0].lat,
        lng: technicians[0].lng,
      });
      map.setZoom(15);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    technicians.forEach((tech) => {
      bounds.extend({ lat: tech.lat, lng: tech.lng });
    });
    map.fitBounds(bounds);
  }, [isLoaded, technicians, selectedTechnician]);

  if (!apiKey) {
    return (
      <div
        style={{
          height: 520,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          border: '1px solid #fde68a',
          background: '#fffbeb',
          color: '#92400e',
          padding: 16,
          fontSize: 14,
        }}
      >
        Google Maps key chưa được cấu hình. Hãy chuyển sang OSM hoặc thêm key thật.
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        style={{
          height: 520,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          border: '1px solid #fecaca',
          background: '#fef2f2',
          color: '#b91c1c',
          padding: 16,
          fontSize: 14,
        }}
      >
        Google Maps load lỗi: {loadError.message}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        style={{
          height: 520,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          border: '1px solid #d1d5db',
          color: '#6b7280',
          fontSize: 14,
        }}
      >
        Đang tải Google Maps...
      </div>
    );
  }

  return (
    <div
      style={{
        overflow: 'hidden',
        borderRadius: 12,
        border: '1px solid #d1d5db',
        minHeight: 520,
      }}
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        onUnmount={() => {
          mapRef.current = null;
        }}
        options={{
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
        }}
      >
        {technicians.map((tech) => (
          <Marker
            key={tech.technicianId}
            position={{ lat: tech.lat, lng: tech.lng }}
            onClick={() => onSelectTechnician(tech.technicianId)}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: tech.isOnline ? '#16a34a' : '#6b7280',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
        ))}

        {selectedTechnician ? (
          <InfoWindow
            position={{
              lat: selectedTechnician.lat,
              lng: selectedTechnician.lng,
            }}
            onCloseClick={() => onSelectTechnician(selectedTechnician.technicianId)}
          >
            <div style={{ minWidth: 220, fontSize: 14 }}>
              <div style={{ fontWeight: 700, color: '#111827' }}>
                {selectedTechnician.technicianName}
              </div>
              <div style={{ marginTop: 8, color: '#374151' }}>
                <div>Technician ID: {selectedTechnician.technicianId}</div>
                <div>Status: {selectedTechnician.status ?? '--'}</div>
                <div>Order ID: {selectedTechnician.orderId ?? '--'}</div>
                <div>Online: {selectedTechnician.isOnline ? 'Yes' : 'No'}</div>
                <div>Updated: {formatTime(selectedTechnician.updatedAt)}</div>
              </div>
            </div>
          </InfoWindow>
        ) : null}
      </GoogleMap>
    </div>
  );
}