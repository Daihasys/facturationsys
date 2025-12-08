import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * WeeklySalesProgress Component
 * Muestra el progreso de ventas del usuario actual durante la semana
 */
function WeeklySalesProgress() {
    const { user, token } = useAuth();
    const [weeklyData, setWeeklyData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWeeklySales();
    }, [user]);

    const fetchWeeklySales = async () => {
        try {
            const response = await fetch(`http://localhost:4000/api/sales/weekly/${user.userId}`, {
                headers: {
                    'x-auth-token': token
                }
            });

            if (response.ok) {
                const data = await response.json();
                setWeeklyData(data);
            } else {
                // Si el endpoint no existe, usar datos mock
                setWeeklyData(getMockWeeklyData());
            }
        } catch (error) {
            console.error('Error fetching weekly sales:', error);
            // Usar datos mock en caso de error
            setWeeklyData(getMockWeeklyData());
        } finally {
            setLoading(false);
        }
    };

    // Datos mock para desarrollo/demo
    const getMockWeeklyData = () => {
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const today = new Date().getDay(); // 0=Dom, 1=Lun, etc.

        return days.map((day, index) => {
            const dayIndex = (index + 1) % 7; // Ajustar para que Lun=1
            const isPast = dayIndex < today || (today === 0 && dayIndex !== 0);

            return {
                day,
                ventas: isPast ? Math.floor(Math.random() * 15) + 5 : 0,
                total: isPast ? (Math.random() * 500 + 100).toFixed(2) : 0
            };
        });
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-[26px] shadow w-full h-full flex items-center justify-center">
                <p className="text-gray-400">Cargando...</p>
            </div>
        );
    }

    const totalVentas = weeklyData.reduce((sum, day) => sum + day.ventas, 0);
    const totalMonto = weeklyData.reduce((sum, day) => sum + parseFloat(day.total || 0), 0);

    return (
        <div className="bg-white p-6 rounded-[26px] shadow w-full h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[20px] font-semibold text-havelock-blue-900">
                    Mi Progreso Semanal
                </h3>
                <TrendingUp className="w-6 h-6 text-havelock-blue-500" />
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-havelock-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Ventas Totales</p>
                    <p className="text-2xl font-bold text-havelock-blue-700">{totalVentas}</p>
                </div>
                <div className="bg-havelock-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Monto Total</p>
                    <p className="text-2xl font-bold text-havelock-blue-700">${totalMonto.toFixed(2)}</p>
                </div>
            </div>

            {/* Gráfico */}
            <ResponsiveContainer width="100%" height="60%">
                <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="day"
                        tick={{ fill: '#1d3552', fontSize: 12 }}
                    />
                    <YAxis
                        tick={{ fill: '#1d3552', fontSize: 12 }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#ecf1fb',
                            borderRadius: '8px',
                            border: 'none'
                        }}
                        formatter={(value, name) => {
                            if (name === 'ventas') return [value, 'Ventas'];
                            if (name === 'total') return [`$${parseFloat(value).toFixed(2)}`, 'Total'];
                            return value;
                        }}
                    />
                    <Bar
                        dataKey="ventas"
                        fill="#5287c9"
                        name="Ventas"
                        radius={[8, 8, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default WeeklySalesProgress;
