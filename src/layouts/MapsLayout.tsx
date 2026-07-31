import { Outlet } from "react-router-dom";

export default function MapsLayout() {
  return (
    <main className="h-screen w-screen">
      <Outlet />
    </main>
  );
}
