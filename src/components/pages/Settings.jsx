import React, { useState, useEffect } from 'react';
import { Lock, ShieldQuestion, HardDrive, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ChangePasswordModal from '../modals/ChangePasswordModal';
import UpdateSecurityQuestionsModal from '../modals/UpdateSecurityQuestionsModal';

function Settings() {
    const { user, token } = useAuth();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showQuestionsModal, setShowQuestionsModal] = useState(false);

    // Backup configuration state
    const [backupConfig, setBackupConfig] = useState({
        enabled: false,
        interval_value: 24,
        interval_unit: 'hours',
        last_backup: null
    });
    const [customInterval, setCustomInterval] = useState('24');
    const [customUnit, setCustomUnit] = useState('hours');
    const [saveMessage, setSaveMessage] = useState('');

    // Check if user has permission to configure backups
    const hasBackupConfigPermission = user?.permissions?.includes('backups:configure') || false;

    useEffect(() => {
        if (hasBackupConfigPermission) {
            fetchBackupConfig();
        }
    }, [hasBackupConfigPermission]);

    const fetchBackupConfig = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/settings/backup-config', {
                headers: { 'x-auth-token': token }
            });
            if (response.ok) {
                const data = await response.json();
                setBackupConfig(data);
                setCustomInterval(data.interval_value.toString());
                setCustomUnit(data.interval_unit);
            }
        } catch (error) {
            console.error('Error fetching backup config:', error);
        }
    };

    const handleSelectPreset = (value, unit) => {
        setCustomInterval(value.toString());
        setCustomUnit(unit);
    };

    const handleSaveBackupConfig = async () => {
        const interval_value = parseInt(customInterval);

        // Validation
        if (isNaN(interval_value) || interval_value < 1) {
            setSaveMessage(' El intervalo debe ser un número mayor a 0');
            setTimeout(() => setSaveMessage(''), 3000);
            return;
        }

        if (customUnit === 'minutes' && (interval_value < 8 || interval_value > 1440)) {
            setSaveMessage(' Minutos: entre 8 y 1440 (24 horas)');
            setTimeout(() => setSaveMessage(''), 3000);
            return;
        }

        if (customUnit === 'hours' && (interval_value < 1 || interval_value > 72)) {
            setSaveMessage(' Horas: entre 1 y 72 (3 días)');
            setTimeout(() => setSaveMessage(''), 3000);
            return;
        }

        try {
            const response = await fetch('http://localhost:4000/api/settings/backup-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({
                    enabled: backupConfig.enabled,
                    interval_value,
                    interval_unit: customUnit
                })
            });

            if (response.ok) {
                setSaveMessage(' Configuración guardada exitosamente');
                fetchBackupConfig();
            } else {
                const data = await response.json();
                setSaveMessage(` ${data.error || 'Error al guardar'}`);
            }
        } catch (error) {
            setSaveMessage(' Error de conexión');
            console.error('Error saving backup config:', error);
        }

        setTimeout(() => setSaveMessage(''), 3000);
    };

    const formatLastBackup = (timestamp) => {
        if (!timestamp) return 'Nunca';
        const date = new Date(timestamp);
        return date.toLocaleString('es-VE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-6 min-h-screen bg-havelock-blue-50">
            <h1 className="text-5xl font-bold text-gray-800 mb-8 ml-4">Configuraciones</h1>

            <div className="max-w-4xl mx-auto space-y-4">
                {/* Change Password Card */}
                <div className="bg-white rounded-[26px] shadow-lg p-6 transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="bg-havelock-blue-100 p-3 rounded-full">
                                <Lock className="w-6 h-6 text-havelock-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-800">Cambiar Contraseña</h2>
                                <p className="text-gray-600 text-sm mt-1">Actualiza tu contraseña de acceso</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="px-6 py-3 bg-havelock-blue-500 text-white rounded-lg font-medium hover:bg-havelock-blue-600 transition-colors duration-200 shadow-md hover:shadow-lg"
                        >
                            Cambiar
                        </button>
                    </div>
                </div>

                {/* Security Questions Card */}
                <div className="bg-white rounded-[26px] shadow-lg p-6 transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="bg-havelock-blue-100 p-3 rounded-full">
                                <ShieldQuestion className="w-6 h-6 text-havelock-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-800">Preguntas de Seguridad</h2>
                                <p className="text-gray-600 text-sm mt-1">Actualiza tus preguntas de seguridad</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowQuestionsModal(true)}
                            className="px-6 py-3 bg-havelock-blue-500 text-white rounded-lg font-medium hover:bg-havelock-blue-600 transition-colors duration-200 shadow-md hover:shadow-lg"
                        >
                            Editar
                        </button>
                    </div>
                </div>

                {/* Automatic Backups Card - Only visible if user has permission */}
                {hasBackupConfigPermission && (
                    <div className="bg-white rounded-[26px] shadow-lg p-6 transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="bg-havelock-blue-100 p-3 rounded-full">
                                <HardDrive className="w-6 h-6 text-havelock-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-800">Backups Automáticos</h2>
                                <p className="text-gray-600 text-sm mt-1">Configura el intervalo de copias de seguridad</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Enable/Disable Toggle */}
                            <div className="flex items-center space-x-3 p-3 bg-havelock-blue-50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="backupEnabled"
                                    checked={backupConfig.enabled}
                                    onChange={(e) => setBackupConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                                    className="w-5 h-5 text-havelock-blue-500 focus:ring-havelock-blue-400 rounded"
                                />
                                <label htmlFor="backupEnabled" className="text-gray-700 font-medium cursor-pointer">
                                    Habilitar backups automáticos
                                </label>
                            </div>

                            {/* Preset Options */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Opciones Rápidas</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <button
                                        onClick={() => handleSelectPreset(1, 'hours')}
                                        className="px-3 py-2 bg-gray-100 hover:bg-havelock-blue-100 rounded-md text-sm font-medium transition-colors"
                                    >
                                        1 hora
                                    </button>
                                    <button
                                        onClick={() => handleSelectPreset(6, 'hours')}
                                        className="px-3 py-2 bg-gray-100 hover:bg-havelock-blue-100 rounded-md text-sm font-medium transition-colors"
                                    >
                                        6 horas
                                    </button>
                                    <button
                                        onClick={() => handleSelectPreset(12, 'hours')}
                                        className="px-3 py-2 bg-gray-100 hover:bg-havelock-blue-100 rounded-md text-sm font-medium transition-colors"
                                    >
                                        12 horas
                                    </button>
                                    <button
                                        onClick={() => handleSelectPreset(24, 'hours')}
                                        className="px-3 py-2 bg-gray-100 hover:bg-havelock-blue-100 rounded-md text-sm font-medium transition-colors"
                                    >
                                        24 horas
                                    </button>
                                </div>
                            </div>

                            {/* Custom Interval */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="intervalValue" className="block text-sm font-medium text-gray-700 mb-1">
                                        Intervalo Personalizado
                                    </label>
                                    <input
                                        type="number"
                                        id="intervalValue"
                                        value={customInterval}
                                        onChange={(e) => setCustomInterval(e.target.value)}
                                        min="1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400"
                                        placeholder="Ej: 2"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="intervalUnit" className="block text-sm font-medium text-gray-700 mb-1">
                                        Unidad
                                    </label>
                                    <select
                                        id="intervalUnit"
                                        value={customUnit}
                                        onChange={(e) => setCustomUnit(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400"
                                    >
                                        <option value="minutes">Minutos</option>
                                        <option value="hours">Horas</option>
                                    </select>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="pt-2">
                                <button
                                    onClick={handleSaveBackupConfig}
                                    className="w-full px-6 py-3 bg-havelock-blue-500 text-white rounded-lg font-medium hover:bg-havelock-blue-600 transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>Guardar Configuración</span>
                                </button>
                                {saveMessage && (
                                    <p className={`mt-2 text-center text-sm font-medium ${saveMessage.includes('❌') ? 'text-red-500' : 'text-green-500'}`}>
                                        {saveMessage}
                                    </p>
                                )}
                            </div>

                            {/* Last Backup Info */}
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    <strong>Último backup:</strong> {formatLastBackup(backupConfig.last_backup)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showPasswordModal && (
                <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
            )}

            {showQuestionsModal && (
                <UpdateSecurityQuestionsModal onClose={() => setShowQuestionsModal(false)} />
            )}
        </div>
    );
}

export default Settings;
