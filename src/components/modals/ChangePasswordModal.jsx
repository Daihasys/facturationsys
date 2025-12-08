import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
    validate,
    isNotEmpty,
    minLength,
    hasLetter,
    hasUpperCase,
    hasNumber,
    hasSpecialChar
} from '../../utils/validators';
import { errorMessages } from '../../utils/validationMessages';

function ChangePasswordModal({ onClose }) {
    const { user } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validations using validation system
        const validations = [
            { field: 'currentPassword', validator: isNotEmpty, message: errorMessages.currentPasswordRequired },
            { field: 'newPassword', validator: isNotEmpty, message: errorMessages.passwordRequired },
            { field: 'newPassword', validator: minLength(8), message: errorMessages.passwordMinLength },
            { field: 'newPassword', validator: hasLetter, message: errorMessages.passwordHasLetter },
            { field: 'newPassword', validator: hasUpperCase, message: errorMessages.passwordHasUpperCase },
            { field: 'newPassword', validator: hasNumber, message: errorMessages.passwordHasNumber },
            { field: 'newPassword', validator: hasSpecialChar, message: errorMessages.passwordHasSpecialChar },
            { field: 'confirmPassword', validator: isNotEmpty, message: errorMessages.passwordRequired },
        ];

        const formData = { currentPassword, newPassword, confirmPassword };
        const validationErrors = validate(validations, formData);

        if (Object.keys(validationErrors).length > 0) {
            // Show first error
            setError(Object.values(validationErrors)[0]);
            return;
        }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            setError(errorMessages.passwordMismatch);
            return;
        }

        // Check if new password is different from current
        if (currentPassword === newPassword) {
            setError(errorMessages.passwordSameAsOld);
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:4000/api/users/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.userId,
                    currentPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Contraseña actualizada exitosamente.');
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setError(data.error || 'Error al cambiar la contraseña.');
            }
        } catch (err) {
            setError('No se pudo conectar con el servidor.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">Cambiar Contraseña</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-md">
                            {success}
                        </div>
                    )}

                    {/* Current Password */}
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña Actual
                        </label>
                        <div className="relative">
                            <input
                                id="currentPassword"
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-havelock-blue-500 focus:border-transparent"
                                placeholder="Ingresa tu contraseña actual"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Nueva Contraseña
                        </label>
                        <div className="relative">
                            <input
                                id="newPassword"
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-havelock-blue-500 focus:border-transparent"
                                placeholder="Mínimo 8 caracteres (mayúscula, número, símbolo)"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmar Nueva Contraseña
                        </label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-havelock-blue-500 focus:border-transparent"
                                placeholder="Repite la nueva contraseña"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-havelock-blue-500 text-white rounded-lg hover:bg-havelock-blue-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ChangePasswordModal;
