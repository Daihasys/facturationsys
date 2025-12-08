import React, { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, Clock, AlertCircle, Filter, Lock } from 'lucide-react';
import Modal from '../modals/Modal';
import SuccessModal from '../modals/SuccessModal';
import { useAuth } from '../../context/AuthContext';

const ESTADOS = {
    pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    en_revision: { label: 'En Revisión', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    resuelto: { label: 'Resuelto', color: 'bg-green-100 text-green-800', icon: CheckCircle }
};

const TIPOS = {
    manual: { label: 'Manual', color: 'bg-purple-100 text-purple-800' },
    automatico: { label: 'Automático', color: 'bg-orange-100 text-orange-800' }
};

const MODULOS = [
    'Dashboard', 'Productos', 'Categorías', 'Ventas',
    'Historial de Ventas', 'Reportes', 'Usuarios',
    'Roles', 'Backups', 'Configuraciones', 'Otro'
];

const ErrorReports = () => {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterModulo, setFilterModulo] = useState('');
    const [filterTipo, setFilterTipo] = useState('');
    const [selectedReport, setSelectedReport] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [notasResolucion, setNotasResolucion] = useState('');
    const { hasPermission } = useAuth();

    const fetchReports = async () => {
        try {
            setIsLoading(true);
            let url = 'http://localhost:4000/api/error-reports?';
            if (filterEstado) url += `estado=${filterEstado}&`;
            if (filterModulo) url += `modulo=${filterModulo}&`;
            if (filterTipo) url += `tipo=${filterTipo}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al obtener reportes');
            const data = await response.json();
            setReports(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (hasPermission('errors:view')) {
            fetchReports();
        }
    }, [filterEstado, filterModulo, filterTipo]);

    const handleStatusChange = async (reportId, newStatus, notas = '') => {
        try {
            const response = await fetch(`http://localhost:4000/api/error-reports/${reportId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: newStatus, notas_resolucion: notas })
            });

            if (!response.ok) throw new Error('Error al actualizar estado');

            setSuccessMessage('Estado actualizado exitosamente');
            setIsSuccessModalOpen(true);
            setIsDetailModalOpen(false);
            fetchReports();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    const openDetailModal = (report) => {
        setSelectedReport(report);
        setIsDetailModalOpen(true);
    };

    const filteredReports = reports.filter(report => {
        const searchLower = searchTerm.toLowerCase();
        return (
            report.nombre_usuario?.toLowerCase().includes(searchLower) ||
            report.modulo?.toLowerCase().includes(searchLower) ||
            report.accion?.toLowerCase().includes(searchLower) ||
            report.descripcion?.toLowerCase().includes(searchLower)
        );
    });

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        // SQLite stores in UTC, append Z if not present to tell JS it's UTC
        const utcDate = dateStr.includes('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
        return new Date(utcDate).toLocaleString('es-VE', {
            timeZone: 'America/Caracas',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!hasPermission('errors:view')) {
        return (
            <div className="p-4 sm:p-6 bg-havelock-blue-50 min-h-screen flex justify-center items-center">
                <div className="bg-white p-8 rounded-xl shadow-xl text-center">
                    <Lock size={48} className="mx-auto text-red-500 mb-4" />
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Acceso Denegado</h1>
                    <p className="text-gray-600">No tienes permiso para ver esta página.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 bg-havelock-blue-50 min-h-screen">
            <h1 className="text-5xl font-bold text-gray-800 mb-8 ml-4">Reportes de Errores</h1>

            <div className="bg-white p-4 sm:p-8 rounded-xl shadow-xl transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
                    <h2 className="text-3xl font-bold text-havelock-blue-400 mb-4 sm:mb-0">
                        Panel de Errores Reportados
                    </h2>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        {/* Search */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-havelock-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="p-2 pl-10 border border-havelock-blue-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-havelock-blue-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>



                        {/* Filter Modulo */}
                        <select
                            value={filterModulo}
                            onChange={(e) => setFilterModulo(e.target.value)}
                            className="p-2 border border-havelock-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-havelock-blue-200"
                        >
                            <option value="">Todos los módulos</option>
                            {MODULOS.map(mod => (
                                <option key={mod} value={mod}>{mod}</option>
                            ))}
                        </select>

                        {/* Filter Tipo */}
                        <select
                            value={filterTipo}
                            onChange={(e) => setFilterTipo(e.target.value)}
                            className="p-2 border border-havelock-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-havelock-blue-200"
                        >
                            <option value="">Todos los tipos</option>
                            <option value="manual">Manual</option>
                            <option value="automatico">Automático</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-havelock-blue-200">
                        <thead>
                            <tr>
                                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider rounded-tl-lg">
                                    Fecha
                                </th>
                                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">
                                    Usuario
                                </th>
                                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">
                                    Módulo
                                </th>
                                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">
                                    Tipo
                                </th>

                                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-center text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider rounded-tr-lg">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="py-6 text-center text-gray-500">
                                        Cargando reportes...
                                    </td>
                                </tr>
                            ) : filteredReports.length > 0 ? (
                                filteredReports.map((report) => {
                                    const estadoInfo = ESTADOS[report.estado] || ESTADOS.pendiente;
                                    const EstadoIcon = estadoInfo.icon;
                                    const tipoInfo = TIPOS[report.tipo] || TIPOS.manual;

                                    return (
                                        <tr key={report.id} className="hover:bg-havelock-blue-50 transition-colors duration-200">
                                            <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700 font-medium">
                                                {formatDate(report.fecha_reporte)}
                                            </td>
                                            <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-500">
                                                {report.nombre_usuario || 'Desconocido'}
                                            </td>
                                            <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700">
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-havelock-blue-100 text-havelock-blue-800">
                                                    {report.modulo}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tipoInfo.color}`}>
                                                    {tipoInfo.label}
                                                </span>
                                            </td>

                                            <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-center">
                                                <button
                                                    onClick={() => openDetailModal(report)}
                                                    className="text-havelock-blue-400 hover:text-havelock-blue-500 transition-colors"
                                                    title="Ver detalles"
                                                >
                                                    <Eye size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-6 text-center text-gray-500 text-lg">
                                        No se encontraron reportes de errores.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)}>
                {selectedReport && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Detalle del Reporte #{selectedReport.id}
                        </h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Usuario</label>
                                    <p className="text-gray-800 font-medium">{selectedReport.nombre_completo || selectedReport.nombre_usuario}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Fecha</label>
                                    <p className="text-gray-800">{formatDate(selectedReport.fecha_reporte)}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500">Módulo</label>
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-havelock-blue-100 text-havelock-blue-800">
                                    {selectedReport.modulo}
                                </span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500">¿Qué estaba haciendo?</label>
                                <p className="text-gray-800 bg-gray-50 p-3 rounded-md">{selectedReport.accion}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500">Descripción del error</label>
                                <p className="text-gray-800 bg-gray-50 p-3 rounded-md">{selectedReport.descripcion}</p>
                            </div>

                            {selectedReport.notas_resolucion && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Notas de resolución</label>
                                    <p className="text-gray-800 bg-green-50 p-3 rounded-md">{selectedReport.notas_resolucion}</p>
                                </div>
                            )}
                            {/* Status change functionality removed for simplicity */}
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <SuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                message={successMessage}
            />
        </div>
    );
};

export default ErrorReports;
