import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar, { SidebarItem } from './Sidebar';
import { SidebarDropdown } from './SidebarDropdown';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  DatabaseBackup,
  LayoutGrid,
  Bug,
  Tag,
} from 'lucide-react';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const isSalesActive = () => location.pathname.startsWith('/sales');
  const isUsersActive = () => location.pathname.startsWith('/users') || location.pathname.startsWith('/roles');

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
          requiredPermission="products:read"
        />
        <SidebarItem
          icon={<LayoutGrid size={20} />}
          text="Categorías"
          to="/categories"
          active={isActive('/categories')}
          onClick={() => navigate('/categories')}
          requiredPermission="categories:read"
        />
        <SidebarItem
          icon={<Tag size={20} />}
          text="Ofertas"
          to="/offers"
          active={isActive('/offers')}
          onClick={() => navigate('/offers')}
          requiredPermission="offers:read"
        />
        <SidebarDropdown
          icon={<ShoppingCart size={20} />}
          text="Ventas"
          active={isSalesActive()}
          requiredPermissions={['sales:read', 'sales:create']}
        >
          <SidebarItem
            text="Listado de Ventas"
            to="/sales/list"
            active={isActive('/sales/list')}
            onClick={() => navigate('/sales/list')}
            requiredPermission="sales:read"
          />
          <SidebarItem
            text="Generar Venta"
            to="/sales"
            active={isActive('/sales')}
            onClick={() => navigate('/sales')}
            requiredPermission="sales:create"
          />

        </SidebarDropdown>
        <SidebarItem
          icon={<BarChart3 size={20} />}
          text="Reportes"
          to="/reports"
          active={isActive('/reports')}
          onClick={() => navigate('/reports')}
          requiredPermission="reports:read"
        />
        <SidebarDropdown
          icon={<Users size={20} />}
          text="Usuarios"
          active={isUsersActive()}
          requiredPermissions={['users:read', 'roles:read']}
        >
          <SidebarItem
            text="Listado de Usuarios"
            to="/users"
            active={isActive('/users')}
            onClick={() => navigate('/users')}
            requiredPermission="users:read"
          />
          <SidebarItem
            text="Gestión de Roles"
            to="/roles"
            active={isActive('/roles')}
            onClick={() => navigate('/roles')}
            requiredPermission="roles:read"
          />
        </SidebarDropdown>
        <SidebarItem
          icon={<DatabaseBackup size={20} />}
          text="Backups"
          to="/backups"
          active={isActive('/backups')}
          onClick={() => navigate('/backups')}
          requiredPermission="backups:read"
        />
        <SidebarItem
          icon={<Bug size={20} />}
          text="Log de Errores"
          to="/error-reports"
          active={isActive('/error-reports')}
          onClick={() => navigate('/error-reports')}
          requiredPermission="errors:view"
        />
      </Sidebar>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;