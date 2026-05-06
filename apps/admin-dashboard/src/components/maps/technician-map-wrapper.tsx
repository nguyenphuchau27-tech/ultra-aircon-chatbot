import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import type { TechnicianMapItem } from '../../services/api';

type MapProvider = 'google' | 'osm';

const OSMTechnicianMap = dynamic(() => import('./osm-technician-map'), {
  ssr: false,
});

const GoogleTechnicianMap = dynamic(() => import('./google-technician-map'), {
  ssr: false,
});

type TechnicianMapWrapperProps = {
  technicians: TechnicianMapItem[];
  selectedTechnicianId: number | null;
  onSelectTechnician: (technicianId: number) => void;
};

function getConfiguredProvider(): MapProvider {
  const value = (process.env.NEXT_PUBLIC_MAP_PROVIDER || 'osm').toLowerCase();

  if (value === 'google') return 'google';
  return 'osm';
}

export default function TechnicianMapWrapper({
  technicians,
  selectedTechnicianId,
  onSelectTechnician,
}: TechnicianMapWrapperProps) {
  const preferredProvider = useMemo(getConfiguredProvider, []);
  const [activeProvider, setActiveProvider] =
    useState<MapProvider>(preferredProvider);
  const [providerMessage, setProviderMessage] = useState<string | null>(null);

  useEffect(() => {
    setActiveProvider(preferredProvider);
  }, [preferredProvider]);

  const handleGoogleError = (message: string) => {
    setProviderMessage(`Google Maps lỗi, fallback sang OSM: ${message}`);
    setActiveProvider('osm');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Map provider:</span>
          <span
            className={`rounded-full px-3 py-1 font-medium ${
              activeProvider === 'google'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {activeProvider.toUpperCase()}
          </span>
        </div>

        {preferredProvider !== activeProvider ? (
          <span className="text-xs text-gray-500">
            Preferred: {preferredProvider.toUpperCase()}
          </span>
        ) : null}
      </div>

      {providerMessage ? (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {providerMessage}
        </div>
      ) : null}

      {activeProvider === 'google' ? (
        <GoogleTechnicianMap
          technicians={technicians}
          selectedTechnicianId={selectedTechnicianId}
          onSelectTechnician={onSelectTechnician}
          onProviderError={handleGoogleError}
        />
      ) : (
        <OSMTechnicianMap
          technicians={technicians}
          selectedTechnicianId={selectedTechnicianId}
          onSelectTechnician={onSelectTechnician}
        />
      )}
    </div>
  );
}