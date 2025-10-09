import React, { useState, useEffect } from 'react';
import { Eye, Printer, XCircle, Search } from 'lucide-react';
import SaleDetailsModal from './modals/SaleDetailsModal'; // Importar el modal
import SuccessModal from './modals/SuccessModal'; // Importar el modal de éxito
import SaleTicket from './SaleTicket'; // Importar el componente del ticket
import ReactDOM from 'react-dom/client';
import { useNavigate } from 'react-router-dom';

function SalesList() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // Estado para el modal de éxito
  const [successMessage, setSuccessMessage] = useState(''); // Mensaje para el modal de éxito
  const [searchTerm, setSearchTerm] = useState(''); // Estado para el término de búsqueda
  const navigate = useNavigate();

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/sales');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setSales(data);
    } catch (error) {
      console.error("Error al obtener las ventas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const openDetailsModal = (saleId) => {
    setSelectedSaleId(saleId);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedSaleId(null);
  };

  const handleVoidSale = async (saleId) => {
    if (!window.confirm('¿Estás seguro de que deseas anular esta venta?')) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:4000/api/sales/${saleId}/void`, {
        method: 'PUT',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Error al anular la venta');
      }
      setSuccessMessage(result.message);
      setIsSuccessModalOpen(true);
      fetchSales(); // Recargar las ventas para mostrar el estado actualizado
    } catch (error) {
      console.error('Error voiding sale:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handlePrintTicket = async (saleId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/sales/${saleId}/ticket`);
      if (!response.ok) {
        throw new Error('Error al obtener los datos del ticket.');
      }
      const ticketData = await response.json();

      const printWindow = window.open('', '_blank', 'width=600,height=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Ticket de Venta</title>');
        // Inject Tailwind CSS for styling
        printWindow.document.write('<link href="/dist/main.css" rel="stylesheet">'); // Adjust path if necessary
        printWindow.document.write('</head><body><div id="print-root"></div></body></html>');
        printWindow.document.close();

        // Render the React component into the new window
        const printRoot = ReactDOM.createRoot(printWindow.document.getElementById('print-root'));
        printRoot.render(<SaleTicket ticketData={ticketData} />);
        
        // Wait for content to render, then print
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          // printWindow.close(); // Optionally close after printing
        }, 1000); // Give it a moment to render

      } else {
        alert('No se pudo abrir la ventana de impresión. Por favor, deshabilita los bloqueadores de pop-ups.');
      }

    } catch (error) {
      console.error('Error printing ticket:', error);
      alert(`Error al imprimir el ticket: ${error.message}`);
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.id.toString().includes(searchTerm.toLowerCase())
  );

  const getStatusChip = (status) => {
    const displayStatus = status || 'N/A'; // Default to 'N/A' if status is null/undefined
    switch (displayStatus) {
      case 'Completada':
        return <span className="px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">{displayStatus}</span>;
      case 'Anulada':
        return <span className="px-3 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">{displayStatus}</span>;
      case 'N/A':
        return <span className="px-3 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">{displayStatus}</span>;
      default:
        return <span className="px-3 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">{displayStatus}</span>;
    }
  };

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-5xl font-bold text-gray-800 mb-8 ml-4">Módulo de Ventas</h1>
      <div className="bg-white p-4 sm:p-8 rounded-xl shadow-xl transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h2 className="text-3xl font-bold text-havelock-blue-400 mb-4 sm:mb-0">Listado de Ventas</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-havelock-400" size={20} />
              <input
                type="text"
                placeholder="Buscar ventas..."
                className="p-2 pl-10 border border-havelock-blue-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-havelock-blue-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => navigate('/sales')}
              className="bg-havelock-blue-300 text-white px-4 py-2 rounded-full hover:bg-havelock-blue-400 focus:outline-none focus:ring-2 focus:ring-havelock-blue-200 focus:ring-opacity-50 w-full sm:w-auto"
            >
              Generar Nueva Venta
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-havelock-blue-200">
            <thead>
              <tr>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider rounded-tl-lg">ID Factura</th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">Fecha</th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">Usuario</th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">Total</th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-center text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">Estado</th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-center text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider rounded-tr-lg">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-gray-500">Cargando...</td>
                </tr>
              ) : filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-havelock-blue-50 transition-colors duration-200">
                    <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700">#{sale.id}</td>
                    <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700">{new Date(sale.fecha_factura).toLocaleString()}</td>
                    <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700">{sale.usuario_nombre}</td>
                    <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700">${sale.total_usd.toFixed(2)}</td>
                    <td className="py-3 px-6 border-b border-havelock-blue-100 text-center">{getStatusChip(sale.estado)}</td>
                    <td className="py-3 px-6 border-b border-havelock-blue-100 text-center text-sm font-medium">                                          <button onClick={() => openDetailsModal(sale.id)} className="text-indigo-600 hover:text-indigo-900 mr-3" title="Ver Detalles">
                                            <Eye size={20} />
                                          </button>
                                          <button className="text-green-600 hover:text-green-900 mr-3" title="Imprimir Ticket">
                                            <Printer size={20} />
                                          </button>
                                          {sale.estado === 'Completada' && (
                                            <button onClick={() => handleVoidSale(sale.id)} className="text-red-600 hover:text-red-900" title="Anular Venta">
                                              <XCircle size={20} />
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="6" className="py-6 text-center text-gray-500">Aún no se han agregado ventas.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                    
                          <SaleDetailsModal 
                            isOpen={isDetailsModalOpen}
                            onClose={closeDetailsModal}
                            saleId={selectedSaleId}
                          />
                    
                          <SuccessModal 
                            isOpen={isSuccessModalOpen}
                            onClose={() => setIsSuccessModalOpen(false)}
                            message={successMessage}
                          />
                        </div>
                      );
                    }
                    
                    export default SalesList;
                    