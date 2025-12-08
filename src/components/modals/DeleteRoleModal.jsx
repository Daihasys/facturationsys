import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const DeleteRoleModal = ({ isOpen, onClose, onDelete, role }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <AlertTriangle className="text-red-500 mb-4" size={64} />
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Confirmar Eliminación de Rol</h2>
        <p className="text-gray-600 mb-6">
          ¿Estás seguro de que deseas eliminar el rol <span className="font-semibold">{role?.nombre}</span>?
          Esta acción no se puede deshacer y afectará a los usuarios asignados a este rol.
        </p>
        <div className="flex justify-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onDelete(role.id)}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold"
          >
            Eliminar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteRoleModal;
