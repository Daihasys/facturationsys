import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Search } from 'lucide-react';
import CategoryModal from './CategoryModal';
import DeleteCategoryModal from './DeleteCategoryModal';
import SuccessModal from './SuccessModal';

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(category =>
    (category.name && category.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddCategory = async (newCategoryData) => {
    try {
      const response = await fetch('http://localhost:4000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategoryData),
      });
      const result = await response.json();
      if (response.ok) {
        fetchCategories(); // Refresh the list
        setIsAddModalOpen(false);
        setSuccessMessage(result.message);
        setIsSuccessModalOpen(true);
      } else {
        throw new Error(result.error || 'Error al agregar la categoría');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleEditCategory = async (updatedCategoryData) => {
    try {
      const response = await fetch(`http://localhost:4000/api/categories/${selectedCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCategoryData),
      });
      const result = await response.json();
      if (response.ok) {
        fetchCategories(); // Refresh the list
        setIsEditModalOpen(false);
        setSuccessMessage(result.message);
        setIsSuccessModalOpen(true);
      } else {
        throw new Error(result.error || 'Error al editar la categoría');
      }
    } catch (error) {
      console.error('Error editing category:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/categories/${categoryId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (response.ok) {
        fetchCategories(); // Refresh the list
        setIsDeleteModalOpen(false);
        setSuccessMessage(result.message);
        setIsSuccessModalOpen(true);
      } else {
        throw new Error(result.error || 'Error al eliminar la categoría');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const openAddModal = () => {
    setSelectedCategory(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 bg-havelock-blue-50 min-h-screen">
      <h1 className="text-5xl font-bold text-gray-800 mb-8 ml-4">Módulo de Categorías</h1>
      <div className="bg-white p-4 sm:p-8 rounded-xl shadow-xl transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h2 className="text-3xl font-bold text-havelock-blue-400 mb-4 sm:mb-0">Gestión de Categorías</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-havelock-400" size={20} />
              <input
                type="text"
                placeholder="Buscar categorías..."
                className="p-2 pl-10 border border-havelock-blue-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-havelock-blue-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={openAddModal}
              className="bg-havelock-blue-300 text-white px-4 py-2 rounded-full hover:bg-havelock-blue-400 focus:outline-none focus:ring-2 focus:ring-havelock-blue-200 focus:ring-opacity-50 w-full sm:w-auto"
            >
              Añadir Categoría
            </button>
          </div>
        </div>  
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-havelock-blue-200">
            <thead>
              <tr>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider rounded-tl-lg">
                  ID
                </th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-center text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider rounded-tr-lg">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map(category => (
                <tr key={category.id} className="hover:bg-havelock-blue-50 transition-colors duration-200">
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700">{category.id}</td>
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700">{category.name}</td>
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700">{category.description}</td>
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-center">
                    <button 
                      onClick={() => openEditModal(category)}
                      className="text-havelock-blue-400 hover:text-havelock-blue-500 mr-4 transition-colors"
                    >
                      <Edit size={20} />
                    </button>
                    <button 
                      onClick={() => openDeleteModal(category)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-gray-500 text-lg">No se encontraron categorías.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CategoryModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddCategory}
      />

      <CategoryModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditCategory}
        category={selectedCategory}
      />

      <DeleteCategoryModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDeleteCategory}
        category={selectedCategory}
      />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        message={successMessage}
      />
    </div>
  );
};

export default Categories;
