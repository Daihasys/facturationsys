import React, { useState } from 'react';
import { Edit, Trash2, Search } from 'lucide-react';
import ProductModal from './ProductModal';
import DeleteProductModal from './DeleteProductModal';

// Mock Data for products
const mockProducts = [
  { id: 1, name: 'Laptop Gamer XYZ', price_costo: 1000.00, price: 1200.00, stock: 15, sku: 'LPTGMR001', categoria: 'Electrónica', description: 'Potente laptop para juegos de última generación.', image_url: '' },
  { id: 2, name: 'Mouse Inalámbrico Pro', price_costo: 20.00, price: 25.00, stock: 50, sku: 'MSINLMB002', categoria: 'Periféricos', description: 'Mouse ergonómico con alta precisión.', image_url: '' },
  { id: 3, name: 'Teclado Mecánico RGB', price_costo: 60.00, price: 80.00, stock: 30, sku: 'TCLDRGB003', categoria: 'Periféricos', description: 'Teclado con switches mecánicos y retroiluminación RGB.', image_url: '' },
  { id: 4, name: 'Monitor Curvo 27 pulgadas', price_costo: 250.00, price: 300.00, stock: 20, sku: 'MNTRCRV004', categoria: 'Monitores', description: 'Monitor con panel curvo para una experiencia inmersiva.', image_url: '' },
  { id: 5, name: 'Webcam Full HD', price_costo: 35.00, price: 45.00, stock: 70, sku: 'WBCMHD005', categoria: 'Periféricos', description: 'Cámara web de alta definición para videollamadas.', image_url: '' },
  { id: 6, name: 'Auriculares Gaming', price_costo: 45.00, price: 60.00, stock: 40, sku: 'ADFGMG006', categoria: 'Audio', description: 'Auriculares con sonido envolvente y micrófono retráctil.', image_url: '' },
  { id: 7, name: 'Disco Duro Externo 1TB', price_costo: 55.00, price: 70.00, stock: 60, sku: 'DDEXT1TB007', categoria: 'Almacenamiento', description: 'Almacenamiento portátil de alta velocidad.', image_url: '' },
  { id: 8, name: 'Router Wi-Fi 6', price_costo: 70.00, price: 90.00, stock: 25, sku: 'RTWIFI6008', categoria: 'Redes', description: 'Router de última generación con tecnología Wi-Fi 6.', image_url: '' },
  
];

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState(mockProducts);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = (newProductData, imageFile) => {
    console.log('Agregar Producto:', newProductData, imageFile);
    // Lógica para agregar el producto (por ahora solo mock)
    const newId = Math.max(...products.map(p => p.id)) + 1;
    setProducts(prev => [...prev, { id: newId, ...newProductData, image_url: imageFile ? URL.createObjectURL(imageFile) : '' }]);
  };

  const handleEditProduct = (updatedProductData, imageFile) => {
    console.log('Editar Producto:', selectedProduct.id, updatedProductData, imageFile);
    // Lógica para editar el producto (por ahora solo mock)
    setProducts(prev => prev.map(p => 
      p.id === selectedProduct.id 
        ? { ...p, ...updatedProductData, image_url: imageFile ? URL.createObjectURL(imageFile) : updatedProductData.image_url } 
        : p
    ));
  };

  const handleDeleteProduct = (productId) => {
    console.log('Eliminar Producto:', productId);
    // Lógica para eliminar el producto (por ahora solo mock)
    setProducts(prev => prev.filter(p => p.id !== productId));
    setIsDeleteModalOpen(false);
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

  return (
    <div className="p-4 sm:p-6 bg-havelock-blue-50 min-h-screen">
      <h1 className="text-5xl font-bold text-gray-800 mb-8 ml-4">Modulo de Productos</h1>
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
          <button
            onClick={openAddModal}
            className="bg-havelock-blue-300 text-white px-4 py-2 rounded-full hover:bg-havelock-blue-400 focus:outline-none focus:ring-2 focus:ring-havelock-blue-200 focus:ring-opacity-50 w-full sm:w-auto"
          >
            Añadir Producto
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
                  Precio Venta
                </th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">
                  Stock
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
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700">{product.name}</td>
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700">${product.price.toFixed(2)}</td>
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700">{product.stock}</td>
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-center">
                    <button 
                      onClick={() => openEditModal(product)}
                      className="text-havelock-blue-400 hover:text-havelock-blue-500 mr-4 transition-colors"
                    >
                      <Edit size={20} />
                    </button>
                    <button 
                      onClick={() => openDeleteModal(product)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-gray-500 text-lg">No se encontraron productos.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddProduct}
      />

      <ProductModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditProduct}
        product={selectedProduct}
      />

      <DeleteProductModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDeleteProduct}
        product={selectedProduct}
      />
    </div>
  );
};

export default Products;