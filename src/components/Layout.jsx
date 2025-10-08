import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar, { SidebarItem } from './Sidebar';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  DatabaseBackup,
  LayoutGrid,
} from 'lucide-react';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-havelock-blue-50">
      <Sidebar>
        <SidebarItem
          icon={<LayoutDashboard size={20} />}
          text="Dashboard"
          to="/"
          active={isActive('/')}
          onClick={() => navigate('/')}
        />
        <SidebarItem
          icon={<Package size={20} />}
          text="Productos"
          to="/products"
          active={isActive('/products')}
          onClick={() => navigate('/products')}
        />
        <SidebarItem
          icon={<LayoutGrid size={20} />}
          text="Categorías"
          to="/categories"
          active={isActive('/categories')}
          onClick={() => navigate('/categories')}
        />
        <SidebarItem
          icon={<ShoppingCart size={20} />}
          text="Ventas"
          to="/sales"
          active={isActive('/sales')}
          onClick={() => navigate('/sales')}
        />
        <SidebarItem
          icon={<BarChart3 size={20} />}
          text="Reportes"
          to="/reports"
          active={isActive('/reports')}
          onClick={() => navigate('/reports')}
        />
        <SidebarItem
          icon={<Users size={20} />}
          text="Usuarios"
          to="/users"
          active={isActive('/users')}
          onClick={() => navigate('/users')}
        />
        <SidebarItem
          icon={<DatabaseBackup size={20} />}
          text="Backups"
          to="/backups"
          active={isActive('/backups')}
          onClick={() => navigate('/backups')}
        />
      </Sidebar>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;