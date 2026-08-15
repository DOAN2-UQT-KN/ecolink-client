import dynamic from '@/libs/dynamic';
import { MapLoadingFallback } from './_components/MapLoadingFallback';

const MapPage = dynamic(() => import('./_components/MapPage'), {
  ssr: false,
  loading: () => <MapLoadingFallback />,
});

export default function MapsPage() {
  return <MapPage />;
}
