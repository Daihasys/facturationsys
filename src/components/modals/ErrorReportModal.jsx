import React, { useState } from 'react';
import Modal from './Modal';
import { MessageSquareWarning, Send } from 'lucide-react';

const MODULOS = [
    'Dashboard',
    'Productos',
    'Categorías',
    'Ventas',
    'Historial de Ventas',
    'Reportes',
    'Usuarios',
    'Roles',
    'Backups',
    'Configuraciones',
    'Otro'
];

const ErrorReportModal = ({ isOpen, onClose, userId, onSuccess }) => {
    const [formData, setFormData] = useState({
        modulo: '',
        accion: '',
        descripcion: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.modulo) newErrors.modulo = 'Selecciona un módulo';
        if (!formData.accion.trim()) newErrors.accion = 'Describe qué estabas haciendo';
        if (!formData.descripcion.trim()) newErrors.descripcion = 'Describe el error';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Validate userId
        if (!userId) {
            alert('Error: No se pudo identificar el usuario. Por favor, cierra sesión e inicia de nuevo.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('http://localhost:4000/api/error-reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    modulo: formData.modulo,
                    accion: formData.accion,
                    descripcion: formData.descripcion
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al enviar el reporte');
            }

            // Reset form
            setFormData({ modulo: '', accion: '', descripcion: '' });
            setErrors({});

            if (onSuccess) {
                onSuccess(result.message);
            }
            onClose();
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({ modulo: '', accion: '', descripcion: '' });
        setErrors({});
        onClose();
    };

    const getInputClass = (fieldName) => {
        const baseClass = "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm";
        const errorClass = "border-red-500 ring-red-500";
        const normalClass = "border-gray-300 focus:ring-havelock-blue-400 focus:border-havelock-blue-400";
        return `${baseClass} ${errors[fieldName] ? errorClass : normalClass}`;
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div className="flex items-center justify-center mb-4">
                <div className="bg-havelock-blue-100 p-3 rounded-full">
                    <MessageSquareWarning size={32} className="text-havelock-blue-500" />
                </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Reportar un Error
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">
                Ayúdanos a mejorar reportando cualquier problema que encuentres
            </p>

            <form onSubmit={handleSubmit} noValidate>
                {/* Módulo */}
                <div className="mb-4">
                    <label htmlFor="modulo" className="block text-sm font-medium text-gray-700">
                        ¿En qué módulo ocurrió el error?
                    </label>
                    <select
                        id="modulo"
                        name="modulo"
                        value={formData.modulo}
                        onChange={handleChange}
                        className={getInputClass('modulo')}
                    >
                        <option value="">Selecciona un módulo</option>
                        {MODULOS.map(mod => (
                            <option key={mod} value={mod}>{mod}</option>
                        ))}
                    </select>
                    {errors.modulo && <p className="text-red-500 text-xs mt-1">{errors.modulo}</p>}
                </div>

                {/* Acción */}
                <div className="mb-4">
                    <label htmlFor="accion" className="block text-sm font-medium text-gray-700">
                        ¿Qué estabas haciendo cuando ocurrió?
                    </label>
                    <textarea
                        id="accion"
                        name="accion"
                        value={formData.accion}
                        onChange={handleChange}
                        rows="2"
                        placeholder="Ej: Estaba intentando agregar un nuevo producto..."
                        className={getInputClass('accion')}
                    />
                    {errors.accion && <p className="text-red-500 text-xs mt-1">{errors.accion}</p>}
                </div>

                {/* Descripción */}
                <div className="mb-6">
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                        Describe el error
                    </label>
                    <textarea
                        id="descripcion"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Ej: La pantalla se quedó en blanco y no me dejó continuar..."
                        className={getInputClass('descripcion')}
                    />
                    {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion}</p>}
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-md bg-havelock-blue-400 text-white hover:bg-havelock-blue-500 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                        <Send size={18} />
                        {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ErrorReportModal;
