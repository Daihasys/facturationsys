import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import FlippableCard from "./cards/FlippableCard";
import DollarDisplay from "./cards/DollarDisplay";
import DailySalesCard from "./cards/DailySalesCard";
import WeeklySalesProgress from "./cards/WeeklySalesProgress";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ActivityBinnacle from "./ActivityBinnacle";

// Chart Components with real data
const MonthlySalesChart = ({ data }) => (
  <div className="bg-white p-6 rounded-[26px] shadow w-full h-full">
    <h3 className="text-[20px] font-semibold text-havelock-blue-900 mb-4">
      Ventas Mensuales
    </h3>
    <ResponsiveContainer width="100%" height="85%">
      <LineChart
        data={data}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fill: "#1d3552" }} />
        <YAxis tick={{ fill: "#1d3552" }} />
        <Tooltip
          cursor={{ fill: "rgba(160, 188, 236, 0.1)" }}
          contentStyle={{
            backgroundColor: "#ecf1fb",
            borderRadius: "8px",
            border: "none",
          }}
        />
        <Legend wrapperStyle={{ color: "#1d3552" }} />
        <Line
          type="monotone"
          dataKey="ventas"
          stroke="#5287c9"
          activeDot={{ r: 8 }}
          name="Ventas"
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const BestSellersChart = ({ data }) => (
  <div className="bg-white p-6 rounded-[26px] shadow w-full h-full">
    <h3 className="text-[20px] font-semibold text-black mb-4">
      Productos Más Vendidos
    </h3>
    <ResponsiveContainer width="100%" height="85%">
      <BarChart
        data={data}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fill: "#000000" }} />
        <YAxis tick={{ fill: "#000000" }} />
        <Tooltip
          cursor={{ fill: "rgba(160, 188, 236, 0.4)" }}
          contentStyle={{
            backgroundColor: "#ecf1fb",
            borderRadius: "8px",
            border: "none",
          }}
        />
        <Legend wrapperStyle={{ color: "#1d3552" }} />
        <Bar dataKey="sold" name="Unidades Vendidas" fill="#3b6395" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const SalesByUserChart = ({ data }) => {
  // Custom label muestra el valor en dólares
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '14px', fontWeight: 'bold' }}
      >
        {`$${value.toFixed(2)}`}
      </text>
    );
  };

  return (
    <div className="bg-white p-6 rounded-[26px] shadow w-full h-full">
      <h3 className="text-[20px] font-semibold text-black mb-4">Top 5 Usuarios (Ventas del Día)</h3>
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={renderCustomizedLabel}
              labelLine={false}
            >
              {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#ecf1fb",
                borderRadius: "8px",
                border: "none",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[85%] text-gray-400">
          <p className="text-lg">No se han realizado ventas hoy</p>
        </div>
      )}
    </div>
  );
};


function Dashboard() {
  const { hasPermission, user } = useAuth();

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    monthlySales: [],
    bestSellers: [],
    salesByUser: [],
    dailyProfit: { ganancia: 0 },
    monthlyTotal: { total: "0.00" },
    loading: true
  });

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          monthlySalesRes,
          bestSellersRes,
          salesByUserRes,
          dailyProfitRes,
          monthlyTotalRes
        ] = await Promise.all([
          fetch('http://localhost:4000/api/dashboard/monthly-sales'),
          fetch('http://localhost:4000/api/dashboard/best-sellers'),
          fetch('http://localhost:4000/api/dashboard/sales-by-user?period=day'),
          fetch('http://localhost:4000/api/dashboard/daily-profit'),
          fetch('http://localhost:4000/api/dashboard/monthly-total')
        ]);

        const [monthlySales, bestSellers, salesByUser, dailyProfit, monthlyTotal] = await Promise.all([
          monthlySalesRes.json(),
          bestSellersRes.json(),
          salesByUserRes.json(),
          dailyProfitRes.json(),
          monthlyTotalRes.json()
        ]);

        setDashboardData({
          monthlySales,
          bestSellers,
          salesByUser,
          dailyProfit,
          monthlyTotal,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardData();
  }, []);

  // Verificar si el usuario tiene al menos un permiso de dashboard
  const dashboardPermissions = [
    'dashboard:view_total_facturado',
    'dashboard:view_ganancia_dia',
    'dashboard:view_mis_ventas',
    'dashboard:view_precio_dolar',
    'dashboard:view_ventas_mensuales',
    'dashboard:view_productos_vendidos',
    'dashboard:view_progreso_semanal',
    'dashboard:view_ventas_usuario',
    'dashboard:view_bitacora'
  ];

  const hasAnyDashboardPermission = dashboardPermissions.some(permission => hasPermission(permission));

  // --- Widget Configurations ---

  // 1. Top Widgets (KPIs)
  const topWidgetsConfig = [
    {
      id: 'total_facturado',
      permission: 'dashboard:view_total_facturado',
      component: (
        <div className="min-h-[174px] bg-havelock-blue-500 rounded-[26px] shadow p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969] h-full">
          <h4 className="text-[20px] font-semibold text-white">
            Total Facturado (Mes)
          </h4>
          <p className="text-[36px] font-semibold text-white text-right">
            ${dashboardData.monthlyTotal.total}
          </p>
        </div>
      )
    },
    {
      id: 'ganancia_mis_ventas',
      // Special case: visible if EITHER permission exists
      isVisible: hasPermission('dashboard:view_ganancia_dia') || hasPermission('dashboard:view_mis_ventas'),
      component: (() => {
        const hasGanancia = hasPermission('dashboard:view_ganancia_dia');
        const hasMisVentas = hasPermission('dashboard:view_mis_ventas');

        // If both permissions exist, use FlippableCard
        if (hasGanancia && hasMisVentas) {
          return (
            <FlippableCard
              frontContent={
                <div className="min-h-[174px] bg-havelock-blue-300 rounded-[26px] shadow p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969] h-full">
                  <h4 className="text-[20px] font-semibold text-white">
                    Ganancia del dia
                  </h4>
                  <p className="text-[36px] font-semibold text-white text-right">
                    ${dashboardData.dailyProfit.ganancia.toFixed(2)}
                  </p>
                </div>
              }
              backContent={<DailySalesCard />}
            />
          );
        }

        // If only one permission exists, show that content directly
        if (hasGanancia) {
          return (
            <div className="min-h-[174px] bg-havelock-blue-300 rounded-[26px] shadow p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969] h-full">
              <h4 className="text-[20px] font-semibold text-white">
                Ganancia del dia
              </h4>
              <p className="text-[36px] font-semibold text-white text-right">
                ${dashboardData.dailyProfit.ganancia.toFixed(2)}
              </p>
            </div>
          );
        }

        if (hasMisVentas) {
          return <DailySalesCard />;
        }

        return null;
      })()
    },
    {
      id: 'precio_dolar',
      permission: 'dashboard:view_precio_dolar',
      component: <DollarDisplay />
    }
  ];

  // 2. Bottom Widgets (Charts)
  const bottomWidgetsConfig = [
    {
      id: 'ventas_mensuales_usuario',
      // Special case: visible if EITHER permission exists
      isVisible: hasPermission('dashboard:view_ventas_mensuales') || hasPermission('dashboard:view_ventas_usuario'),
      component: (() => {
        const hasMensuales = hasPermission('dashboard:view_ventas_mensuales');
        const hasUsuario = hasPermission('dashboard:view_ventas_usuario');

        // If both permissions exist, use FlippableCard
        if (hasMensuales && hasUsuario) {
          return (
            <FlippableCard
              frontContent={
                <div className="h-[350px] rounded-2xl transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
                  <MonthlySalesChart data={dashboardData.monthlySales} />
                </div>
              }
              backContent={
                <div className="h-[350px] rounded-2xl transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
                  <SalesByUserChart data={dashboardData.salesByUser} />
                </div>
              }
            />
          );
        }

        // If only one permission exists, show that content directly
        if (hasMensuales) {
          return (
            <div className="h-[350px] rounded-2xl transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
              <MonthlySalesChart data={dashboardData.monthlySales} />
            </div>
          );
        }

        if (hasUsuario) {
          return (
            <div className="h-[350px] rounded-2xl transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
              <SalesByUserChart data={dashboardData.salesByUser} />
            </div>
          );
        }

        return null;
      })()
    },
    {
      id: 'productos_vendidos',
      permission: 'dashboard:view_productos_vendidos',
      component: (
        <div className="h-[350px] rounded-2xl transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
          <BestSellersChart data={dashboardData.bestSellers} />
        </div>
      )
    },
    {
      id: 'progreso_semanal',
      permission: 'dashboard:view_progreso_semanal',
      component: (
        <div className="h-[350px] rounded-2xl transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
          <WeeklySalesProgress />
        </div>
      )
    },
    {
      id: 'bitacora',
      permission: 'dashboard:view_bitacora',
      component: (
        <div className="h-[350px] rounded-2xl transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
          <ActivityBinnacle />
        </div>
      )
    }
  ];

  // Filter widgets based on permissions
  const visibleTopWidgets = topWidgetsConfig.filter(widget =>
    widget.isVisible !== undefined ? widget.isVisible : hasPermission(widget.permission)
  );

  const visibleBottomWidgets = bottomWidgetsConfig.filter(widget =>
    widget.isVisible !== undefined ? widget.isVisible : hasPermission(widget.permission)
  );

  return (
    <div className="p-6 min-h-screen bg-havelock-blue-50">
      <h1 className="text-5xl font-bold text-gray-800 mb-8 ml-4">Dashboard</h1>

      {/* Mensaje para usuarios sin permisos */}
      {!hasAnyDashboardPermission && (
        <div className="max-w-2xl mx-auto mt-20">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-4">
              <svg className="w-20 h-20 mx-auto text-havelock-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Restringido</h2>
            <p className="text-gray-600 mb-6">
              No tienes permisos para visualizar los elementos del Dashboard.
            </p>
            <div className="bg-havelock-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Por favor, contacta a un administrador</strong> para que habilite las funcionalidades de esta pantalla.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Blocks - Dynamic Grid */}
      <div className={`grid gap-6 w-full mb-6 ${visibleTopWidgets.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
        visibleTopWidgets.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
          'grid-cols-1 max-w-md mx-auto'
        }`}>
        {visibleTopWidgets.map((widget, index) => (
          <React.Fragment key={index}>
            {widget.component}
          </React.Fragment>
        ))}
      </div>

      {/* Bottom Charts - Dynamic Grid */}
      <div className={`grid gap-6 w-full ${visibleBottomWidgets.length >= 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        }`}>
        {visibleBottomWidgets.map((widget, index) => {
          // Logic to make the last item span full width if there's an odd number of items (e.g., 3 items)
          const isLastItem = index === visibleBottomWidgets.length - 1;
          const isOddCount = visibleBottomWidgets.length % 2 !== 0;
          const shouldSpanFull = isLastItem && isOddCount && visibleBottomWidgets.length > 1;

          return (
            <div key={index} className={`${shouldSpanFull ? 'lg:col-span-2' : ''}`}>
              {widget.component}
            </div>
          );
        })}
      </div>
    </div >
  );
}

export default Dashboard;
