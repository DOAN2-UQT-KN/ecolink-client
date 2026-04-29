'use client';
import dynamic from 'next/dynamic';

// Leaflet requires a browser environment – skip SSR entirely for this route
const MapPage = dynamic(() => import('./_components/MapPage'), {
  ssr: false,
  loading: () => (
    <div className="-mt-[92px] -mb-[92px] -mx-[20px] lg:-mx-[160px] h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <span className="h-8 w-8 rounded-full border-4 border-slate-300 border-t-emerald-500 animate-spin" />
        <span className="text-sm font-medium">Loading map…</span>
      </div>
    </div>
  ),
});

export default function MapsPage() {
  return <MapPage />;
}
