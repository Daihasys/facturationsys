import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { validate, isNotEmpty, hasNoSpecialChars, minLength, maxLength } from '../../utils/validators';
import { errorMessages } from '../../utils/validationMessages';

const CategoryModal = ({ isOpen, onClose, onSave, category = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) { // Only reset when modal opens
      if (category) {
        setFormData({
          name: category.name || '',
          description: category.description || '',
        });
      } else {
        setFormData({
          name: '',
          description: '',
        });
      }
      setErrors({}); // Clear errors when modal opens or category changes
    }
  }, [category, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) { // Clear error for this field if user starts typing
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission

    const validations = [
      { field: 'name', validator: isNotEmpty, message: errorMessages.categoryRequired },
      { field: 'name', validator: minLength(2), message: errorMessages.categoryMinLength },
      { field: 'name', validator: maxLength(100), message: errorMessages.categoryMaxLength },
      { field: 'name', validator: hasNoSpecialChars, message: errorMessages.productNoSpecialChars },
    ];

    // Validate description length if provided
    if (formData.description && formData.description.trim()) {
      validations.push(
        { field: 'description', validator: maxLength(150), message: errorMessages.descriptionMaxLength }
      );
    }

    const validationErrors = validate(validations, formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({}); // Clear all errors if validation passes
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
        {category ? 'Editar Categoría' : 'Agregar Categoría'}
      </h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ej: Electrónica"
            className={getInputClass('name')}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción (Opcional)</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="Descripción de la categoría (máximo 150 caracteres)"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm"
          ></textarea>
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
            {category ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryModal;
