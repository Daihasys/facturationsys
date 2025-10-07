import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock Data
const salesData = [
  { name: 'Ene', sales: 100 },
  { name: 'Feb', sales: 150 },
  { name: 'Mar', sales: 200 },
  { name: 'Abr', sales: 500 },
  { name: 'May', sales: 100 },
  { name: 'Jun', sales: 50 },
];

const bestSellersData = [
  { name: 'Mouse', sold: 10 },
  { name: 'Teclado', sold: 5 },
  { name: 'Monitor', sold: 30 },
  { name: 'Laptop', sold: 15 },
  { name: 'Webcam', sold: 20 },
];

const dolarPrice = { name: 'Dolar', priceBs: 186.5, priceUSD: 1 };

const porcentajeGanancia = { name: 'Porcentaje de ganancia', porcentaje: 60 + '%' };

const gananciaDia = { name: 'Ganancia del dia', ganancia: 100 + '$' };

// Chart Components
const MonthlySalesChart = () => (
  <div className="bg-white p-6 rounded-[26px] shadow w-full h-full">
    <h3 className="text-[20px] font-semibold text-havelock-blue-900 mb-4">Ventas Mensuales</h3>
    <ResponsiveContainer width="100%" height="85%">
      <LineChart data={salesData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fill: '#1d3552' }} />
        <YAxis tick={{ fill: '#1d3552' }} />
        <Tooltip cursor={{fill: 'rgba(160, 188, 236, 0.1)'}} contentStyle={{backgroundColor: '#ecf1fb', borderRadius: '8px', border: 'none'}}/>
        <Legend wrapperStyle={{ color: '#1d3552' }} />
        <Line type="monotone" dataKey="sales" stroke="#5287c9" activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const BestSellersChart = () => (
  <div className="bg-white p-6 rounded-[26px] shadow w-full h-full">
    <h3 className="text-[20px] font-semibold text-black mb-4">Productos Más Vendidos</h3>
    <ResponsiveContainer width="100%" height="85%">
      <BarChart data={bestSellersData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fill: '#000000' }} />
        <YAxis tick={{ fill: '#000000' }} />
        <Tooltip cursor={{fill: 'rgba(160, 188, 236, 0.4)'}} contentStyle={{backgroundColor: '#ecf1fb', borderRadius: '8px', border: 'none'}}/>
        <Legend wrapperStyle={{ color: '#1d3552' }} />
        <Bar dataKey="sold" name="Unidades Vendidas" fill="#3b6395" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

function Dashboard() {
  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-5xl font-bold text-gray-800 mb-8 ml-4">Dashboard</h1>

      {/* Top Blocks - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-6">
        <div className="min-h-[174px] bg-havelock-blue-500 rounded-[26px] shadow p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
            <h4 className="text-[20px] font-semibold text-white">Porcentaje ganancia del dia</h4>
            <p className="text-[36px] font-semibold text-white text-right">{porcentajeGanancia.porcentaje}</p>
        </div>
        <div className="min-h-[174px] bg-havelock-blue-300 rounded-[26px] shadow p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
            <h4 className="text-[20px] font-semibold text-white">Ganancia del dia</h4>
            <p className="text-[36px] font-semibold text-white text-right">{gananciaDia.ganancia}</p>
        </div>
        <div className="min-h-[174px] bg-havelock-blue-200 rounded-[26px] shadow p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
            <h4 className="text-[20px] font-semibold text-white">Precio dolar del día</h4>
            <p className="text-[36px] font-semibold text-white text-right">${dolarPrice.priceUSD} / Bs {dolarPrice.priceBs}</p>
        </div>
      </div>

      {/* Bottom Charts - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div className="lg:col-span-1 h-[350px] rounded-2xl transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
          <BestSellersChart />
        </div>
        <div className="lg:col-span-2 h-[350px] rounded-2xl transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
          <MonthlySalesChart />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
