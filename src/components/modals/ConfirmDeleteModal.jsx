import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDeleteModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = '¿Confirmar eliminación?',
    message,
    itemName,
    itemType = 'elemento',
    warningText,
    confirmButtonText = 'Eliminar',
    isDestructive = true
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        {isDestructive && (
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="text-red-600" size={20} />
                            </div>
                        )}
                        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Warning Banner (if provided) */}
                    {warningText && (
                        <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                            <div className="flex items-start">
                                <AlertTriangle className="text-yellow-600 mr-2 flex-shrink-0 mt-0.5" size={18} />
                                <div>
                                    <p className="font-semibold text-yellow-800 mb-1">Advertencia</p>
                                    <p className="text-sm text-yellow-700">{warningText}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Message */}
                    <p className="text-gray-700 mb-2">
                        {message || (
                            <>
                                ¿Está seguro que desea eliminar {itemType}{' '}
                                <span className="font-semibold text-gray-900">"{itemName}"</span>?
                            </>
                        )}
                    </p>

                    {!warningText && (
                        <p className="text-sm text-gray-500 mt-2">
                            Esta acción no se puede deshacer.
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 bg-gray-50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`px-4 py-2 rounded-lg font-semibold text-white transition-colors ${isDestructive
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
