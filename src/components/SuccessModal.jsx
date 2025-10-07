import React from 'react';
import Modal from './Modal';
import { CheckCircle } from 'lucide-react';

function SuccessModal({ isOpen, onClose, message }) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <CheckCircle className="text-green-500 mb-4" size={64} />
        <h2 className="text-2xl font-bold mb-2 text-gray-800">¡Éxito!</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="bg-havelock-blue-400 text-white px-6 py-2 rounded-full hover:bg-havelock-blue-500 transition-colors font-semibold"
        >
          Aceptar
        </button>
      </div>
    </Modal>
  );
}

export default SuccessModal;
