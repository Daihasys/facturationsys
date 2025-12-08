import React, { useState, useEffect } from 'react';
import { User, Tag, ShoppingCart, FileText, Trash2, AlertCircle, Database, Settings, ArrowUpRight } from 'lucide-react';
import Modal from '../modals/Modal';

const ActivityBinnacle = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterUser, setFilterUser] = useState('');
    const [filterDate, setFilterDate] = useState('');

    useEffect(() => {
        fetchActivities();

        // Refresh every minute
        const interval = setInterval(() => fetchActivities(), 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchActivities = async (user = '', date = '') => {
        try {
            let url = 'http://localhost:4000/api/audit-log';
            const params = new URLSearchParams();
            if (user) params.append('username', user);
            if (date) params.append('date', date);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Error fetching audit log');
            }
            const data = await response.json();
            // Backend already sorts by fecha DESC (newest first), no need to re-sort
            setActivities(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching activities:', err);
            setError('No se pudo cargar la bitácora');
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchActivities(filterUser, filterDate);
    };

    const handleClear = () => {
        setFilterUser('');
        setFilterDate('');
        fetchActivities();
    };

    const getActionConfig = (action) => {
        const lowerAction = action.toLowerCase();

        if (lowerAction.includes('venta')) return { icon: <ShoppingCart size={20} className="text-white" />, color: 'bg-green-500' };
        if (lowerAction.includes('producto')) return { icon: <Tag size={20} className="text-white" />, color: 'bg-blue-500' };
        if (lowerAction.includes('usuario')) return { icon: <User size={20} className="text-white" />, color: 'bg-purple-500' };
        if (lowerAction.includes('categoría')) return { icon: <Tag size={20} className="text-white" />, color: 'bg-indigo-500' };
        if (lowerAction.includes('backup')) return { icon: <Database size={20} className="text-white" />, color: 'bg-orange-500' };
        if (lowerAction.includes('reporte')) return { icon: <FileText size={20} className="text-white" />, color: 'bg-teal-500' };
        if (lowerAction.includes('elimin')) return { icon: <Trash2 size={20} className="text-white" />, color: 'bg-red-500' };
        if (lowerAction.includes('actualiz')) return { icon: <Settings size={20} className="text-white" />, color: 'bg-yellow-500' };

        return { icon: <AlertCircle size={20} className="text-white" />, color: 'bg-gray-500' };
    };

    const formatTime = (dateString) => {
        if (!dateString) return 'Fecha desconocida';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Fecha inválida';

        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Hace un momento';
        if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} minutos`;
        if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
        return date.toLocaleDateString('es-VE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const formatFullDate = (dateString) => {
        if (!dateString) return 'Fecha desconocida';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Fecha inválida';

        return date.toLocaleString('es-VE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <>
            <div
                className="bg-white p-6 rounded-[26px] shadow w-full h-full flex flex-col cursor-pointer transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969] relative"
                onClick={() => setIsModalOpen(true)}
            >
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-[20px] font-semibold text-black">Bitácora de Actividad</h3>
                    <ArrowUpRight
                        size={24}
                        className="text-gray-400 opacity-70 hover:opacity-100 transition-opacity"
                    />
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-400">Cargando actividad...</p>
                    </div>
                ) : error ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-400">No hay actividad reciente</p>
                    </div>
                ) : (
                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {activities.slice(0, 5).map((item) => {
                            const config = getActionConfig(item.accion);
                            return (
                                <div key={item.id} className="flex items-start gap-3 animate-fade-in">
                                    <div className={`rounded-full p-2 ${config.color} shrink-0`}>
                                        {config.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-800 break-words">
                                            <span className="font-semibold">{item.user}</span>
                                            <span className="text-gray-600"> {item.accion}</span>
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">{formatTime(item.fecha)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Bitácora Completa de Actividades"
                size="4xl"
            >
                <div className="mb-6 bg-gray-50 p-4 rounded-xl flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                        <input
                            type="text"
                            placeholder="Buscar por usuario..."
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-havelock-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-havelock-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSearch}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                        >
                            Buscar
                        </button>
                        <button
                            onClick={handleClear}
                            className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden">
                    {activities.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                            No hay registros de actividad
                        </p>
                    ) : (
                        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fecha y Hora
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Usuario
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acción
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Detalles
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {activities.map((item) => {
                                        const config = getActionConfig(item.accion);
                                        let details = item.detalles;
                                        try {
                                            const parsed = JSON.parse(item.detalles);
                                            details = Object.entries(parsed)
                                                .map(([key, value]) => `${key}: ${value}`)
                                                .join(', ');
                                        } catch (e) {
                                            // Keep original string if not JSON
                                        }

                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatFullDate(item.fecha)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {item.user}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-800">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${config.color.replace('bg-', 'bg-')}`}></div>
                                                        {item.accion}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={details}>
                                                    {details || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="bg-gray-200 text-gray-800 px-5 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                        Cerrar
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default ActivityBinnacle;
