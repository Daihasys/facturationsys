import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Image as ImageIcon } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, onSave, product = null }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio_costo: '',
    precio_venta: '',
    sku: '',
    categoria: '',
    image_url: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        nombre: product.nombre || '',
        descripcion: product.descripcion || '',
        precio_costo: product.precio_costo || '',
        precio_venta: product.precio_venta || '',
        sku: product.sku || '',
        categoria: product.categoria || '',
        image_url: product.image_url || '',
      });
      setImagePreview(product.image_url || '');
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        precio_costo: '',
        precio_venta: '',
        sku: '',
        categoria: '',
        image_url: '',
      });
      setImageFile(null);
      setImagePreview('');
    }
  }, [product, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(product?.image_url || '');
    }
  };

  const handleSubmit = async () => {
    const dataToSave = { ...formData };

    // Validar que la URL de la imagen sea válida o esté vacía
    const urlPattern = new RegExp('^(https?:\\/\\/|data:image\\/)');
    if (dataToSave.image_url && !urlPattern.test(dataToSave.image_url)) {
      dataToSave.image_url = '';
    }

    await onSave(dataToSave, imageFile);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {product ? 'Editar Producto' : 'Agregar Producto'}
      </h2>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU</label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="precio_costo" className="block text-sm font-medium text-gray-700">Precio Costo</label>
            <input
              type="number"
              id="precio_costo"
              name="precio_costo"
              value={formData.precio_costo}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm"
              step="0.01"
              required
            />
          </div>
          <div>
            <label htmlFor="precio_venta" className="block text-sm font-medium text-gray-700">Precio Venta</label>
            <input
              type="number"
              id="precio_venta"
              name="precio_venta"
              value={formData.precio_venta}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm"
              step="0.01"
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">Categoría</label>
          <input
            type="text"
            id="categoria"
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="3"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm"
          ></textarea>
        </div>
        <div className="mb-6">
          <label htmlFor="image_upload" className="block text-sm font-medium text-gray-700 mb-2">Imagen del Producto (Opcional)</label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              id="image_upload"
              accept="image/png, image/jpeg"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-havelock-blue-50 file:text-havelock-blue-400
                hover:file:bg-havelock-blue-100"
            />
            {imagePreview && (
              <div className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-300">
                <img src={imagePreview} alt="Previsualización" className="w-full h-full object-cover" />
              </div>
            )} {!imagePreview && (
                <div className="w-20 h-20 rounded-md border border-gray-300 flex items-center justify-center text-gray-400">
                    <ImageIcon size={32} />
                </div>
            )}
          </div>
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
            {product ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductModal;
