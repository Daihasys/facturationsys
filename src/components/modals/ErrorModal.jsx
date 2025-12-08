import React, { useEffect } from 'react';
import Modal from './Modal';
import { XCircle } from 'lucide-react';

function ErrorModal({ isOpen, onClose, message }) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // 3 segundos

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <XCircle className="text-red-500 mb-4" size={64} />
        <h2 className="text-2xl font-bold mb-2 text-gray-800">¡Error!</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition-colors font-semibold"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}

export default ErrorModal;
