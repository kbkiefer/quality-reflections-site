import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/jobs': 'Job Listings',
  '/applications': 'Applications',
  '/settings': 'Settings',
};

export default function AdminLayout() {
  const location = useLocation();
  const basePath = '/' + (location.pathname.split('/')[1] || '');
  const title = PAGE_TITLES[basePath] || 'Admin';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar title={title} />
        <main className="flex-1 p-6 blueprint-grid">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
