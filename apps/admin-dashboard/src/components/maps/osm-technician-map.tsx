import { useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { DivIcon, LatLngExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TechnicianMapItem } from '../../services/api';

type OSMTechnicianMapProps = {
  technicians: TechnicianMapItem[];
  selectedTechnicianId: number | null;
  onSelectTechnician: (technicianId: number) => void;
};

const defaultCenter: [number, number] = [10.7769, 106.7009];

const LeafletMapInner = dynamic(async () => {
  const ReactLeaflet = await import('react-leaflet');
  const L = await import('leaflet');

  function createTechnicianIcon(isOnline?: boolean): DivIcon {
    return L.divIcon({
      className: '',
      html: `
        <div style="
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: ${isOnline ? '#16a34a' : '#6b7280'};
          border: 3px solid white;
          box-shadow: 0 0 0 2px ${isOnline ? '#86efac' : '#d1d5db'};
        "></div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -10],
    });
  }

  function formatTime(value?: string | null) {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('vi-VN');
  }

  function FollowTechnician({
    technicians,
    selectedTechnicianId,
  }: {
    technicians: TechnicianMapItem[];
    selectedTechnicianId: number | null;
  }) {
    const map = ReactLeaflet.useMap();
    const lastPositionRef = useRef<string | null>(null);

    const selectedTechnician = useMemo(() => {
      if (!technicians.length) return null;

      return (
        technicians.find((item) => item.technicianId === selectedTechnicianId) ??
        (technicians.length === 1 ? technicians[0] : null)
      );
    }, [technicians, selectedTechnicianId]);

    useEffect(() => {
      if (!technicians.length) {
        map.setView(defaultCenter, 12, { animate: true });
        lastPositionRef.current = null;
        return;
      }

      if (selectedTechnician) {
        const nextKey = `${selectedTechnician.technicianId}:${selectedTechnician.lat}:${selectedTechnician.lng}`;

        if (lastPositionRef.current !== nextKey) {
          map.flyTo([selectedTechnician.lat, selectedTechnician.lng], 16, {
            animate: true,
            duration: 1.2,
          });
          lastPositionRef.current = nextKey;
        }

        return;
      }

      if (technicians.length === 1) {
        const only = technicians[0];
        const nextKey = `${only.technicianId}:${only.lat}:${only.lng}`;

        if (lastPositionRef.current !== nextKey) {
          map.flyTo([only.lat, only.lng], 16, {
            animate: true,
            duration: 1.2,
          });
          lastPositionRef.current = nextKey;
        }

        return;
      }

      const bounds = L.latLngBounds(
        technicians.map((item) => [item.lat, item.lng] as [number, number]),
      );

      map.fitBounds(bounds, {
        padding: [40, 40],
        animate: true,
      });
      lastPositionRef.current = null;
    }, [map, technicians, selectedTechnician]);

    return null;
  }

  return function LeafletClientMap({
    technicians,
    selectedTechnicianId,
    onSelectTechnician,
  }: OSMTechnicianMapProps) {
    const selectedTechnician =
      technicians.find((item) => item.technicianId === selectedTechnicianId) ??
      null;

    const trail: LatLngTuple[] = selectedTechnician
      ? [[selectedTechnician.lat, selectedTechnician.lng]]
      : [];

    return (
      <div
        style={{
          height: 520,
          width: '100%',
          overflow: 'hidden',
          borderRadius: 12,
          border: '1px solid #d1d5db',
        }}
      >
        <ReactLeaflet.MapContainer
          center={defaultCenter as LatLngExpression}
          zoom={12}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <ReactLeaflet.TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FollowTechnician
            technicians={technicians}
            selectedTechnicianId={selectedTechnicianId}
          />

          {trail.length > 0 && (
            <ReactLeaflet.Circle
              center={trail[0]}
              radius={45}
              pathOptions={{
                color: '#2563eb',
                weight: 2,
                fillColor: '#60a5fa',
                fillOpacity: 0.18,
              }}
            />
          )}

          {technicians.map((tech) => (
            <ReactLeaflet.Marker
              key={tech.technicianId}
              position={[tech.lat, tech.lng]}
              icon={createTechnicianIcon(tech.isOnline)}
              eventHandlers={{
                click: () => onSelectTechnician(tech.technicianId),
              }}
            >
              <ReactLeaflet.Popup>
                <div style={{ minWidth: 220, fontSize: 14 }}>
                  <div style={{ fontWeight: 700, color: '#111827' }}>
                    {tech.technicianName}
                  </div>
                  <div style={{ marginTop: 8, color: '#374151' }}>
                    <div>Technician ID: {tech.technicianId}</div>
                    <div>Status: {tech.status ?? '--'}</div>
                    <div>Order ID: {tech.orderId ?? '--'}</div>
                    <div>Online: {tech.isOnline ? 'Yes' : 'No'}</div>
                    <div>Updated: {formatTime(tech.updatedAt)}</div>
                    <div>Lat: {tech.lat.toFixed(6)}</div>
                    <div>Lng: {tech.lng.toFixed(6)}</div>
                  </div>
                </div>
              </ReactLeaflet.Popup>
            </ReactLeaflet.Marker>
          ))}
        </ReactLeaflet.MapContainer>
      </div>
    );
  };
}, { ssr: false });

export default function OSMTechnicianMap(props: OSMTechnicianMapProps) {
  return <LeafletMapInner {...props} />;
}