import React from 'react';
import Modal from './Modal';
import { XCircle } from 'lucide-react';

const AccessDeniedModal = ({ isOpen, onClose, message = "No tiene permiso para acceder a esta pantalla." }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Acceso Denegado" size="sm">
      <div className="p-4 text-center">
        <XCircle size={48} className="mx-auto text-red-500 mb-4" />
        <p className="text-lg text-gray-700 font-semibold mb-2">{message}</p>
        <p className="text-sm text-gray-500">Por favor, contacte a su administrador si cree que esto es un error.</p>
        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-havelock-blue-500 text-white rounded-lg hover:bg-havelock-blue-600 transition-colors"
        >
          Entendido
        </button>
      </div>
    </Modal>
  );
};

export default AccessDeniedModal;
