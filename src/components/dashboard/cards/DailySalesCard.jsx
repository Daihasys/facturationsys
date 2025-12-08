import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

/**
 * DailySalesCard Component
 * Muestra las ventas del día del usuario actual
 */
function DailySalesCard() {
    const { user, token } = useAuth();
    const [dailyStats, setDailyStats] = useState({
        totalVentas: 0,
        numeroTransacciones: 0,
        promedioVenta: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDailySales();
    }, [user]);

    const fetchDailySales = async () => {
        try {
            const response = await fetch(`http://localhost:4000/api/sales/daily/${user.userId}`, {
                headers: {
                    'x-auth-token': token
                }
            });

            if (response.ok) {
                const data = await response.json();
                setDailyStats(data);
            } else {
                // Si el endpoint no existe, usar datos mock
                setDailyStats(getMockDailyData());
            }
        } catch (error) {
            console.error('Error fetching daily sales:', error);
            // Usar datos mock en caso de error
            setDailyStats(getMockDailyData());
        } finally {
            setLoading(false);
        }
    };

    // Datos mock para desarrollo/demo
    const getMockDailyData = () => {
        const numTransacciones = Math.floor(Math.random() * 20) + 5;
        const totalVentas = (Math.random() * 500 + 200).toFixed(2);
        const promedioVenta = (totalVentas / numTransacciones).toFixed(2);

        return {
            totalVentas: parseFloat(totalVentas),
            numeroTransacciones: numTransacciones,
            promedioVenta: parseFloat(promedioVenta)
        };
    };

    if (loading) {
        return (
            <div className="min-h-[174px] bg-gradient-to-br from-havelock-blue-400 to-havelock-blue-500 rounded-[26px] shadow p-6 flex items-center justify-center transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
                <p className="text-white">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="h-full min-h-[174px] max-h-[174px] bg-gradient-to-br from-havelock-blue-400 to-havelock-blue-500 rounded-[26px] shadow p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
            <div className="flex items-center justify-between">
                <h4 className="text-[20px] font-semibold text-white">
                    Mis Ventas del Día
                </h4>
                <DollarSign className="w-6 h-6 text-white opacity-80" />
            </div>

            <div className="flex flex-col gap-1">
                {/* Total en grande */}
                <p className="text-[36px] font-bold text-white leading-none">
                    ${dailyStats.totalVentas.toFixed(2)}
                </p>

                {/* Detalles en línea compacta */}
                <div className="flex items-center gap-3 text-white text-xs opacity-90">
                    <div className="flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" />
                        <span>{dailyStats.numeroTransacciones} ventas</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Prom: ${dailyStats.promedioVenta.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DailySalesCard;
