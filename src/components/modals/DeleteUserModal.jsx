
import React from 'react';
import Modal from './Modal';

const DeleteUserModal = ({ isOpen, onClose, onDelete, user }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Confirmar Eliminación</h2>
        <p className="text-gray-600 mb-6">
          ¿Estás seguro de que deseas eliminar al usuario <span className="font-semibold">{user?.nombre}</span>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Eliminar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteUserModal;
