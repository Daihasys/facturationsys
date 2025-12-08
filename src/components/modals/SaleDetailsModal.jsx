import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Loader, AlertTriangle, Printer, XCircle } from 'lucide-react';
import { printThermalTicket } from '../../utils/printThermalTicket';
import { useAuth } from '../../context/AuthContext';
import ErrorModal from './ErrorModal';

function SaleDetailsModal({ isOpen, onClose, saleId, onVoidSuccess }) {
  const [saleDetails, setSaleDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { hasPermission } = useAuth();

  const fetchSaleDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch sale details with products
      const detailsResponse = await fetch(`http://localhost:4000/api/sales/${saleId}`);
      if (!detailsResponse.ok) {
        throw new Error('Error al cargar los detalles de la venta.');
      }
      const detailsData = await detailsResponse.json();

      // Fetch sale metadata (total, status, etc.)
      const salesResponse = await fetch('http://localhost:4000/api/sales');
      if (!salesResponse.ok) {
        throw new Error('Error al cargar la información de la venta.');
      }
      const salesData = await salesResponse.json();
      const saleInfo = salesData.find(sale => sale.id === saleId);

      // Combine both data
      setSaleDetails({
        products: detailsData,
        saleInfo: saleInfo || {}
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && saleId) {
      fetchSaleDetails();
    }
  }, [isOpen, saleId]);

  const handlePrintTicket = async () => {
    try {
      // VALIDAR PRIMERO usando datos ya cargados
      if (saleDetails?.saleInfo?.ticket_impreso && !hasPermission('sales:reprint')) {
        setErrorMessage('Este ticket ya fue impreso.\n\nSolo usuarios con permiso de reimpresión pueden volver a imprimirlo.');
        setIsErrorModalOpen(true);
        return;
      }

      const response = await fetch(`http://localhost:4000/api/sales/${saleId}/ticket`);
      if (!response.ok) {
        throw new Error('Error al obtener los datos del ticket.');
      }
      const ticketData = await response.json();

      // Imprimir ticket
      printThermalTicket(ticketData);

      // Marcar como impreso si es la primera vez
      if (!ticketData.ticket_impreso) {
        await fetch(`http://localhost:4000/api/sales/${saleId}/mark-printed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        // Refrescar detalles para actualizar estado
        fetchSaleDetails();
      }

    } catch (error) {
      console.error('Error printing ticket:', error);
      setErrorMessage(`Error al imprimir el ticket: ${error.message}`);
      setIsErrorModalOpen(true);
    }
  };

  const handleVoidSale = async () => {
    if (!window.confirm('¿Estás seguro de que deseas anular esta venta? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/sales/${saleId}/void`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al anular la venta');
      }

      alert(result.message || 'Venta anulada exitosamente');

      // Refresh the details to show updated status
      fetchSaleDetails();

      // Notify parent component if callback provided
      if (onVoidSuccess) {
        onVoidSuccess();
      }
    } catch (error) {
      console.error('Error voiding sale:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const displayStatus = status || 'N/A';
    switch (displayStatus) {
      case 'Completada':
        return <span className="px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">{displayStatus}</span>;
      case 'Anulada':
        return <span className="px-3 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">{displayStatus}</span>;
      default:
        return <span className="px-3 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">{displayStatus}</span>;
    }
  };

  const calculateSubtotal = () => {
    if (!saleDetails?.products) return 0;
    return saleDetails.products.reduce((sum, item) => sum + item.subtotal_usd, 0);
  };

  const calculateIVA = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.16;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Detalles de la Venta</h2>
            <p className="text-gray-500 text-sm mt-1">Factura #{saleId}</p>
          </div>
          {saleDetails?.saleInfo && (
            <div className="mt-3 sm:mt-0">
              {getStatusBadge(saleDetails.saleInfo.estado)}
            </div>
          )}
        </div>

        {/* Sale Info */}
        {saleDetails?.saleInfo && (
          <div className="bg-havelock-blue-50 rounded-lg p-4 mb-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Fecha</p>
              <p className="text-sm font-semibold text-gray-800">
                {new Date(saleDetails.saleInfo.fecha_factura).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Usuario</p>
              <p className="text-sm font-semibold text-gray-800">{saleDetails.saleInfo.usuario_nombre}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center p-8">
            <Loader className="animate-spin text-havelock-blue-400" size={32} />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center text-red-600 p-8">
            <AlertTriangle className="mb-2" size={32} />
            <p>{error}</p>
          </div>
        )}

        {/* Products Table */}
        {!loading && !error && saleDetails && (
          <>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio Unit.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {saleDetails.products.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">{item.producto_nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.producto_barcode || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">{item.cantidad}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        ${item.precio_unitario_usd.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium text-right">
                        ${item.subtotal_usd.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              {/* COMENTADO: Cliente no requiere mostrar subtotal e IVA */}
              {/* <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm font-medium text-gray-800">${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">IVA (16%):</span>
                <span className="text-sm font-medium text-gray-800">${calculateIVA().toFixed(2)}</span>
              </div> */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold text-gray-800">Total:</span>
                <span className="text-xl font-bold text-havelock-blue-600">
                  ${saleDetails.saleInfo?.total_usd?.toFixed(2) || (calculateSubtotal() + calculateIVA()).toFixed(2)}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handlePrintTicket}
            className="flex items-center justify-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-lg hover:bg-green-600 transition-colors font-medium"
            disabled={loading}
          >
            <Printer size={18} />
            Imprimir Ticket
          </button>

          {saleDetails?.saleInfo?.estado === 'Completada' && (
            <button
              onClick={handleVoidSale}
              className="flex items-center justify-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-lg hover:bg-red-600 transition-colors font-medium"
              disabled={loading}
            >
              <XCircle size={18} />
              Anular Venta
            </button>
          )}

          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-5 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>

      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        message={errorMessage}
      />
    </Modal>
  );
}

export default SaleDetailsModal;
