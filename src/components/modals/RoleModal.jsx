import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { validate, isNotEmpty, hasNoSpecialChars, minLength, maxLength } from '../../utils/validators';
import { errorMessages } from '../../utils/validationMessages';

const RoleModal = ({ isOpen, onClose, onSave, role = null }) => {
  const [formData, setFormData] = useState({
    nombre: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (role) {
        setFormData({
          nombre: role.nombre || '',
        });
      } else {
        setFormData({
          nombre: '',
        });
      }
      setErrors({});
    }
  }, [role, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validations = [
      { field: 'nombre', validator: isNotEmpty, message: errorMessages.roleRequired },
      { field: 'nombre', validator: minLength(2), message: errorMessages.roleMinLength },
      { field: 'nombre', validator: maxLength(50), message: errorMessages.roleMaxLength },
      { field: 'nombre', validator: hasNoSpecialChars, message: errorMessages.productNoSpecialChars },
    ];

    const validationErrors = validate(validations, formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    onSave(formData);
    onClose();
  };

  const getInputClass = (fieldName) => {
    const baseClass = "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm";
    const errorClass = "border-red-500 ring-red-500";
    const normalClass = "border-gray-300 focus:ring-havelock-blue-400 focus:border-havelock-blue-400";
    return `${baseClass} ${errors[fieldName] ? errorClass : normalClass}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {role ? 'Editar Rol' : 'Agregar Rol'}
      </h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre del Rol</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className={getInputClass('nombre')}
          />
          {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-havelock-blue-400 text-white hover:bg-havelock-blue-500 transition-colors font-semibold"
          >
            {role ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RoleModal;
