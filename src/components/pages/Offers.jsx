import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Search, Tag, Calendar, DollarSign } from 'lucide-react';
import SuccessModal from '../modals/SuccessModal';
import ErrorModal from '../modals/ErrorModal';
import Modal from '../modals/Modal';
import { useAuth } from '../../context/AuthContext';

const Offers = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [offers, setOffers] = useState([]);
    const [products, setProducts] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const { token, hasPermission } = useAuth();

    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'x-auth-token': token,
    });

    const fetchOffers = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/offers', { headers: getHeaders() });
            if (!response.ok) {
                setOffers([]);
                throw new Error('Error al obtener las ofertas.');
            }
            const data = await response.json();
            setOffers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching offers:', error);
            setOffers([]);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/products', { headers: getHeaders() });
            if (response.ok) {
                const data = await response.json();
                setProducts(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    useEffect(() => {
        if (hasPermission('offers:read')) {
            fetchOffers();
            fetchProducts();
        }
    }, [token]);

    const filteredOffers = Array.isArray(offers) ? offers.filter(offer =>
        (offer.producto_nombre && offer.producto_nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : [];

    const handleAddOffer = async (data) => {
        try {
            const response = await fetch('http://localhost:4000/api/offers', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (response.ok) {
                fetchOffers();
                setIsAddModalOpen(false);
                setSuccessMessage(result.message);
                setIsSuccessModalOpen(true);
            } else {
                throw new Error(result.error || 'Error al agregar la oferta');
            }
        } catch (error) {
            console.error('Error adding offer:', error);
            setErrorMessage(error.message);
            setIsErrorModalOpen(true);
        }
    };

    const handleEditOffer = async (data) => {
        try {
            const response = await fetch(`http://localhost:4000/api/offers/${selectedOffer.id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (response.ok) {
                fetchOffers();
                setIsEditModalOpen(false);
                setSuccessMessage(result.message);
                setIsSuccessModalOpen(true);
            } else {
                throw new Error(result.error || 'Error al editar la oferta');
            }
        } catch (error) {
            console.error('Error editing offer:', error);
            setErrorMessage(error.message);
            setIsErrorModalOpen(true);
        }
    };

    const handleDeleteOffer = async (offerId) => {
        try {
            const response = await fetch(`http://localhost:4000/api/offers/${offerId}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            const result = await response.json();
            if (response.ok) {
                fetchOffers();
                setIsDeleteModalOpen(false);
                setSuccessMessage(result.message);
                setIsSuccessModalOpen(true);
            } else {
                throw new Error(result.error || 'Error al eliminar la oferta');
            }
        } catch (error) {
            console.error('Error deleting offer:', error);
            setIsDeleteModalOpen(false);
            setErrorMessage(error.message);
            setIsErrorModalOpen(true);
        }
    };

    const openAddModal = () => {
        setSelectedOffer(null);
        setIsAddModalOpen(true);
    };

    const openEditModal = (offer) => {
        setSelectedOffer(offer);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (offer) => {
        setSelectedOffer(offer);
        setIsDeleteModalOpen(true);
    };

    const isOfferActive = (offer) => {
        const today = new Date().toISOString().split('T')[0];
        return offer.activo && today >= offer.fecha_inicio && today <= offer.fecha_fin;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-VE');
    };

    const getDiscountPercentage = (original, offer) => {
        if (!original || !offer) return 0;
        return Math.round(((original - offer) / original) * 100);
    };

    if (!hasPermission('offers:read')) {
        return (
            <div className="p-4 sm:p-6 bg-havelock-blue-50 min-h-screen flex items-center justify-center">
                <h1 className="text-3xl font-bold text-red-500">No tienes permiso para ver esta sección.</h1>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 bg-havelock-blue-50 min-h-screen">
            <h1 className="text-5xl font-bold text-gray-800 mb-8 ml-4">Módulo de Ofertas</h1>
            <div className="bg-white p-4 sm:p-8 rounded-xl shadow-xl transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
                    <h2 className="text-3xl font-bold text-havelock-blue-400 mb-4 sm:mb-0">Gestión de Ofertas</h2>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-havelock-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por producto..."
                                className="p-2 pl-10 border border-havelock-blue-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-havelock-blue-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {hasPermission('offers:create') && (
                            <button
                                onClick={openAddModal}
                                className="bg-havelock-blue-300 text-white px-4 py-2 rounded-full hover:bg-havelock-blue-400 focus:outline-none focus:ring-2 focus:ring-havelock-blue-200 focus:ring-opacity-50 w-full sm:w-auto flex items-center gap-2 justify-center"
                            >
                                <Tag size={18} />
                                Nueva Oferta
                            </button>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-havelock-blue-200">
                        <thead>
                            <tr>
                                <th className="py-3 px-4 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-xs font-semibold text-havelock-blue-600 uppercase rounded-tl-lg">
                                    Producto
                                </th>
                                <th className="py-3 px-4 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-center text-xs font-semibold text-havelock-blue-600 uppercase">
                                    Precio
                                </th>
                                <th className="py-3 px-4 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-center text-xs font-semibold text-havelock-blue-600 uppercase">
                                    Vigencia
                                </th>
                                <th className="py-3 px-4 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-center text-xs font-semibold text-havelock-blue-600 uppercase">
                                    Estado
                                </th>
                                <th className="py-3 px-4 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-center text-xs font-semibold text-havelock-blue-600 uppercase rounded-tr-lg">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOffers.map(offer => (
                                <tr key={offer.id} className="hover:bg-havelock-blue-50 transition-colors duration-200">
                                    <td className="py-2 px-4 border-b border-havelock-blue-100 text-sm text-gray-700 font-medium">
                                        {offer.producto_nombre}
                                    </td>
                                    <td className="py-2 px-4 border-b border-havelock-blue-100 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-gray-400 text-xs line-through">${offer.precio_original?.toFixed(2)}</span>
                                            <span className="text-green-600 font-bold">${offer.precio_oferta?.toFixed(2)}</span>
                                            <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-xs font-bold mt-0.5">
                                                -{getDiscountPercentage(offer.precio_original, offer.precio_oferta)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-2 px-4 border-b border-havelock-blue-100 text-center">
                                        <div className="text-xs text-gray-600">
                                            <div>{formatDate(offer.fecha_inicio)}</div>
                                            <div className="text-gray-400">al</div>
                                            <div>{formatDate(offer.fecha_fin)}</div>
                                        </div>
                                    </td>
                                    <td className="py-2 px-4 border-b border-havelock-blue-100 text-center">
                                        {isOfferActive(offer) ? (
                                            <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                                Activa
                                            </span>
                                        ) : (
                                            <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs font-bold">
                                                Inactiva
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border-b border-havelock-blue-100 text-center">
                                        {hasPermission('offers:update') && (
                                            <button
                                                onClick={() => openEditModal(offer)}
                                                className="text-havelock-blue-400 hover:text-havelock-blue-500 mr-2 transition-colors"
                                            >
                                                <Edit size={18} />
                                            </button>
                                        )}
                                        {hasPermission('offers:delete') && (
                                            <button
                                                onClick={() => openDeleteModal(offer)}
                                                className="text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredOffers.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-6 text-center text-gray-500">No se encontraron ofertas.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {hasPermission('offers:create') && (
                <OfferModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={handleAddOffer}
                    products={products}
                />
            )}

            {hasPermission('offers:update') && (
                <OfferModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleEditOffer}
                    offer={selectedOffer}
                    products={products}
                />
            )}

            {/* Delete Confirmation Modal */}
            {hasPermission('offers:delete') && isDeleteModalOpen && (
                <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Eliminar Oferta">
                    <p className="text-gray-600 mb-6">
                        ¿Estás seguro de que deseas eliminar la oferta para <strong>{selectedOffer?.producto_nombre}</strong>?
                    </p>
                    <div className="flex justify-end gap-4">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => handleDeleteOffer(selectedOffer.id)}
                            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                        >
                            Eliminar
                        </button>
                    </div>
                </Modal>
            )}

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

// Offer Modal Component
const OfferModal = ({ isOpen, onClose, onSave, offer, products }) => {
    const [formData, setFormData] = useState({
        producto_id: '',
        porcentaje_descuento: '',
        fecha_inicio: '',
        fecha_fin: '',
        activo: true
    });

    const selectedProduct = products.find(p => p.id === parseInt(formData.producto_id));

    // Calculate offer price from percentage
    const calculatedOfferPrice = selectedProduct && formData.porcentaje_descuento
        ? selectedProduct.precio_venta * (1 - parseFloat(formData.porcentaje_descuento) / 100)
        : null;

    useEffect(() => {
        if (offer && selectedProduct) {
            // Calculate percentage from existing offer price
            const percentage = ((offer.precio_original - offer.precio_oferta) / offer.precio_original) * 100;
            setFormData({
                producto_id: offer.producto_id || '',
                porcentaje_descuento: Math.round(percentage).toString(),
                fecha_inicio: offer.fecha_inicio?.split('T')[0] || '',
                fecha_fin: offer.fecha_fin?.split('T')[0] || '',
                activo: offer.activo ?? true
            });
        } else if (offer) {
            setFormData({
                producto_id: offer.producto_id || '',
                porcentaje_descuento: '',
                fecha_inicio: offer.fecha_inicio?.split('T')[0] || '',
                fecha_fin: offer.fecha_fin?.split('T')[0] || '',
                activo: offer.activo ?? true
            });
        } else {
            const today = new Date().toISOString().split('T')[0];
            const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            setFormData({
                producto_id: '',
                porcentaje_descuento: '',
                fecha_inicio: today,
                fecha_fin: nextWeek,
                activo: true
            });
        }
    }, [offer, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const percentage = parseFloat(formData.porcentaje_descuento);
        if (isNaN(percentage) || percentage <= 0 || percentage >= 100) {
            alert('El porcentaje de descuento debe ser mayor a 0 y menor a 100.');
            return;
        }

        if (!selectedProduct) {
            alert('Por favor selecciona un producto.');
            return;
        }

        // Calculate offer price from percentage
        const offerPrice = selectedProduct.precio_venta * (1 - percentage / 100);

        onSave({
            producto_id: formData.producto_id,
            precio_oferta: Math.round(offerPrice * 100) / 100, // Round to 2 decimals
            fecha_inicio: formData.fecha_inicio,
            fecha_fin: formData.fecha_fin,
            activo: formData.activo
        });
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={offer ? 'Editar Oferta' : 'Nueva Oferta'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                    <select
                        name="producto_id"
                        value={formData.producto_id}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-havelock-blue-200"
                        required
                        disabled={!!offer}
                    >
                        <option value="">Seleccionar producto...</option>
                        {products.map(product => (
                            <option key={product.id} value={product.id}>
                                {product.name} - ${product.precio_venta?.toFixed(2)}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedProduct && (
                    <div className="bg-havelock-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">
                            Precio actual: <strong className="text-gray-800">${selectedProduct.precio_venta?.toFixed(2)}</strong>
                        </p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje de Descuento (%)</label>
                    <input
                        type="number"
                        name="porcentaje_descuento"
                        value={formData.porcentaje_descuento}
                        onChange={handleChange}
                        step="1"
                        min="1"
                        max="99"
                        placeholder="Ej: 10, 20, 50..."
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-havelock-blue-200"
                        required
                    />
                </div>

                {/* Price preview */}
                {selectedProduct && calculatedOfferPrice !== null && calculatedOfferPrice > 0 && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600">
                            Precio con descuento: <strong className="text-green-600 text-lg">${calculatedOfferPrice.toFixed(2)}</strong>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Ahorro: ${(selectedProduct.precio_venta - calculatedOfferPrice).toFixed(2)}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                        <input
                            type="date"
                            name="fecha_inicio"
                            value={formData.fecha_inicio}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-havelock-blue-200"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                        <input
                            type="date"
                            name="fecha_fin"
                            value={formData.fecha_fin}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-havelock-blue-200"
                            required
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-havelock-blue-400 text-white hover:bg-havelock-blue-500"
                    >
                        {offer ? 'Guardar Cambios' : 'Crear Oferta'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default Offers;
