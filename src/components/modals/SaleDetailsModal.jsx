import React, { useState, useEffect } from 'react';
import Modal from './Modal'; // Assuming a generic Modal component exists
import { Loader, AlertTriangle } from 'lucide-react';

function SaleDetailsModal({ isOpen, onClose, saleId }) {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && saleId) {
      const fetchSaleDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`http://localhost:4000/api/sales/${saleId}`);
          if (!response.ok) {
            throw new Error('Error al cargar los detalles de la venta.');
          }
          const data = await response.json();
          setDetails(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchSaleDetails();
    }
  }, [isOpen, saleId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Detalles de la Venta #{saleId}</h2>
        {loading && (
          <div className="flex justify-center items-center p-8">
            <Loader className="animate-spin" />
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center text-red-600 p-8">
            <AlertTriangle className="mb-2" />
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {details.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{item.producto_nombre}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.producto_sku}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{item.cantidad}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${item.precio_unitario_usd.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium text-right">${item.subtotal_usd.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default SaleDetailsModal;
