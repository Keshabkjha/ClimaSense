
import React, { useEffect, useRef } from 'react';
import * as Lucide from 'lucide-react';

interface WeatherMapProps {
  location: { lat: number; lng: number } | null;
  onClose: () => void;
}

export const WeatherMap: React.FC<WeatherMapProps> = ({ location, onClose }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    const defaultLat = location?.lat || 51.505;
    const defaultLng = location?.lng || -0.09;
    
    // @ts-ignore - Leaflet is loaded via script tag
    const L = window.L;
    
    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: true
    }).setView([defaultLat, defaultLng], 10);

    // Dark Matter tiles by CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(mapRef.current);

    // Add Zoom Control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    // If we have a location, add a pulsing marker
    if (location) {
      const circle = L.circle([location.lat, location.lng], {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        radius: 2000
      }).addTo(mapRef.current);

      L.marker([location.lat, location.lng]).addTo(mapRef.current)
        .bindPopup('Your Location')
        .openPopup();
    }

    // Simulate weather data markers for demonstration
    const simulateData = () => {
      const bounds = mapRef.current.getBounds();
      const southWest = bounds.getSouthWest();
      const northEast = bounds.getNorthEast();
      const lngSpan = northEast.lng - southWest.lng;
      const latSpan = northEast.lat - southWest.lat;

      for (let i = 0; i < 5; i++) {
        const lat = southWest.lat + latSpan * Math.random();
        const lng = southWest.lng + lngSpan * Math.random();
        const temp = Math.floor(Math.random() * 15) + 15;
        
        L.circleMarker([lat, lng], {
          radius: 12,
          fillColor: temp > 25 ? '#f59e0b' : '#3b82f6',
          color: '#fff',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.6
        }).addTo(mapRef.current)
          .bindTooltip(`${temp}°`, { permanent: true, direction: 'center', className: 'weather-tooltip' });
      }
    };

    setTimeout(simulateData, 500);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [location]);

  return (
    <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col animate-in fade-in zoom-in duration-300">
      <div className="p-4 glass border-b border-slate-700/50 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <Lucide.Map className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Live Weather Map</span>
        </div>
        <button 
          onClick={onClose}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <Lucide.X className="w-4 h-4" />
        </button>
      </div>
      
      <div ref={mapContainerRef} className="flex-1 w-full relative h-full">
        {/* Custom Map Controls Layered on top */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
           <div className="glass p-2 rounded-xl flex flex-col gap-2">
              <button className="p-2 bg-blue-600 rounded-lg text-white text-[10px] font-bold shadow-lg">TEMP</button>
              <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 text-[10px] font-bold">PRECIP</button>
           </div>
        </div>
      </div>

      <style>{`
        .weather-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: white !important;
          font-weight: bold !important;
          font-size: 10px !important;
          pointer-events: none !important;
        }
      `}</style>
    </div>
  );
};
