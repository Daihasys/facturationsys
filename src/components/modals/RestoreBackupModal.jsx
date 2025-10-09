import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const RestoreBackupModal = ({ isOpen, onClose, onConfirm, filename }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <AlertTriangle className="text-amber-500 mb-4" size={64} />
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Confirmar Restauración</h2>
        <p className="text-gray-600 mb-2">
          ¿Estás seguro de que deseas restaurar la base de datos usando la copia de seguridad:
        </p>
        <p className="text-gray-800 font-semibold mb-4 bg-amber-100 px-2 py-1 rounded">
          {filename}
        </p>
        <p className="text-red-600 font-bold mb-6">
          ¡ADVERTENCIA! Esta acción reemplazará todos los datos actuales de forma permanente.
        </p>
        <div className="flex justify-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-6 py-2 rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors font-semibold"
          >
            Sí, Restaurar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RestoreBackupModal;
