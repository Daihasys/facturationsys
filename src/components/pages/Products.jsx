import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Search } from 'lucide-react';
import ProductModal from '../modals/ProductModal';
import DeleteProductModal from '../modals/DeleteProductModal';
import SuccessModal from '../modals/SuccessModal';
import ErrorModal from '../modals/ErrorModal';
import boxIcon from '../../assets/box.svg';
import { useAuth } from '../../context/AuthContext';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { token, hasPermission } = useAuth();

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-auth-token': token,
  });

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/products', {
        headers: getHeaders(),
      });
      if (!response.ok) {
        throw new Error('No tienes permiso para ver los productos.');
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error al obtener los productos:", error);
    }
  };

  useEffect(() => {
    if (hasPermission('products:read')) {
      fetchProducts();
    }
  }, [token]);

  const filteredProducts = products.filter(product =>
    (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddProduct = async (newProductData) => {
    try {
      const response = await fetch('http://localhost:4000/api/products', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newProductData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al agregar el producto');
      }

      setIsAddModalOpen(false);
      setSuccessMessage(result.message);
      setIsSuccessModalOpen(true);
      fetchProducts();
    } catch (error) {
      console.error("Error en handleAddProduct:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleEditProduct = async (updatedProductData) => {
    try {
      const response = await fetch(`http://localhost:4000/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updatedProductData),
      });
      const result = await response.json();
      if (response.ok) {
        fetchProducts();
        setIsEditModalOpen(false);
        setSuccessMessage(result.message);
        setIsSuccessModalOpen(true);
      } else {
        throw new Error(result.error || 'Error al editar el producto');
      }
    } catch (error) {
      console.error('Error editing product:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/products/${productId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const result = await response.json();

      if (response.ok) {
        fetchProducts();
        setIsDeleteModalOpen(false);

        // Mostrar mensaje apropiado según si tenía ventas o no
        if (result.preservedSales && result.preservedSales > 0) {
          setSuccessMessage(
            `Producto eliminado exitosamente.\n${result.preservedSales} venta(s) histórica(s) preservada(s).`
          );
        } else {
          setSuccessMessage(result.message || 'Producto eliminado exitosamente.');
        }

        setIsSuccessModalOpen(true);
      } else {
        throw new Error(result.error || 'Error al eliminar el producto');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setIsDeleteModalOpen(false);
      setErrorMessage(`Error al eliminar el producto: ${error.message}`);
      setIsErrorModalOpen(true);
    }
  };

  const openAddModal = () => {
    setSelectedProduct(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  if (!hasPermission('products:read')) {
    return (
      <div className="p-4 sm:p-6 bg-havelock-blue-50 min-h-screen flex items-center justify-center">
        <h1 className="text-3xl font-bold text-red-500">No tienes permiso para ver esta sección.</h1>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-havelock-blue-50 min-h-screen">
      <h1 className="text-5xl font-bold text-gray-800 mb-8 ml-4">Módulo de Productos</h1>
      <div className="bg-white p-4 sm:p-8 rounded-xl shadow-xl transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h2 className="text-3xl font-bold text-havelock-blue-400 mb-4 sm:mb-0">Gestión de Productos</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-havelock-400" size={20} />
              <input
                type="text"
                placeholder="Buscar productos..."
                className="p-2 pl-10 border border-havelock-blue-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-havelock-blue-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {hasPermission('products:create') && (
              <button
                onClick={openAddModal}
                className="bg-havelock-blue-300 text-white px-4 py-2 rounded-full hover:bg-havelock-blue-400 focus:outline-none focus:ring-2 focus:ring-havelock-blue-200 focus:ring-opacity-50 w-full sm:w-auto"
              >
                Añadir Producto
              </button>
            )}
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
                  Imagen
                </th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">
                  Precio Venta
                </th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-center text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider rounded-tr-lg">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-havelock-blue-50 transition-colors duration-200">
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700">{product.id}</td>
                  <td className="py-3 px-6 border-b border-havelock-blue-100">
                    <img
                      src={product.image_url || boxIcon}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-md border border-gray-200"
                      onError={(e) => { e.target.onerror = null; e.target.src = boxIcon; }}
                    />
                  </td>
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700 font-medium">{product.name}</td>
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-500 max-w-sm">{product.description || 'N/A'}</td>
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700">${(product.precio_venta || 0).toFixed(2)}</td>
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-center">
                    {hasPermission('products:update') && (
                      <button
                        onClick={() => openEditModal(product)}
                        className="text-havelock-blue-400 hover:text-havelock-blue-500 mr-4 transition-colors"
                      >
                        <Edit size={20} />
                      </button>
                    )}
                    {hasPermission('products:delete') && (
                      <button
                        onClick={() => openDeleteModal(product)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-gray-500 text-lg">No se encontraron productos.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {hasPermission('products:create') && <ProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddProduct}
      />}

      {hasPermission('products:update') && <ProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditProduct}
        product={selectedProduct}
      />}

      {hasPermission('products:delete') && <DeleteProductModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={() => handleDeleteProduct(selectedProduct.id)}
        product={selectedProduct}
      />}

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        message={successMessage}
      />

      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default Products;