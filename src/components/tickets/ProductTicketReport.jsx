// src/components/ProductTicketReport.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Download, Printer, Settings, Tag } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ProductTicket from './ProductTicket';
import Modal from '../modals/Modal'; // Assuming a generic Modal component exists

// NO MOCK DATA - All data fetched from backend

const ReportHeader = ({ title, children }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 border-b-2 border-havelock-blue-50 pb-4 no-print">
    <h2 className="text-3xl font-bold text-havelock-blue-400 mb-4 sm:mb-0">{title}</h2>
    <div className="flex gap-3">{children}</div>
  </div>
);

const ProductTicketReport = ({ showSuccessModal, showErrorModal }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todas las categorías');
  const [currency, setCurrency] = useState('USD');
  const [bolivarConversionRate, setBolivarConversionRate] = useState(35.0);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/reports/products');
        if (response.ok) {
          const data = await response.json();
          // Add selection and offer fields
          const productsWithState = data.map(p => ({
            ...p,
            price: p.precio_venta || 0,
            category: p.categoria || 'Sin categoría',
            isSelected: false,
            isOffer: false,
            offerValue: '',
            discountPercentage: ''
          }));
          setProducts(productsWithState);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        showErrorModal?.('Error al cargar productos desde el backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch real-time bolivar conversion rate from API
  useEffect(() => {
    const fetchDollarPrice = async () => {
      const primaryApiUrl = 'https://ve.dolarapi.com/v1/dolares/oficial';
      const fallbackApiUrl = 'https://api.dolarvzla.com/public/exchange-rate';

      try {
        const response = await fetch(primaryApiUrl);
        if (!response.ok) {
          throw new Error('Primary API failed');
        }
        const data = await response.json();
        if (data && data.promedio) {
          setBolivarConversionRate(data.promedio);
        } else {
          throw new Error('Price not found in primary API response');
        }
      } catch (e) {
        try {
          const fallbackResponse = await fetch(fallbackApiUrl);
          if (!fallbackResponse.ok) {
            throw new Error('Fallback API failed');
          }
          const fallbackData = await fallbackResponse.json();
          if (fallbackData && fallbackData.current && fallbackData.current.usd) {
            setBolivarConversionRate(fallbackData.current.usd);
          } else {
            console.warn('Could not fetch exchange rate, using default value');
          }
        } catch (fallbackError) {
          console.warn('Could not fetch exchange rate, using default value');
        }
      }
    };

    fetchDollarPrice();
  }, []);

  // Extract unique categories dynamically from products
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    return ['Todas las categorías', ...uniqueCategories.sort()];
  }, [products]);

  const handleProductChange = (id, field, value) => {
    setProducts(products.map(p => {
      if (p.id !== id) return p;

      let updates = { [field]: value };

      if (field === 'offerValue') {
        // Calculate percentage based on new offer price
        const offerPrice = parseFloat(value);
        if (!isNaN(offerPrice) && offerPrice < p.price) {
          const discount = ((p.price - offerPrice) / p.price) * 100;
          updates.discountPercentage = discount.toFixed(0);
        } else {
          updates.discountPercentage = '';
        }
      } else if (field === 'discountPercentage') {
        // Calculate offer price based on percentage
        const discount = parseFloat(value);
        if (!isNaN(discount) && discount > 0 && discount <= 100) {
          const offerPrice = p.price * (1 - discount / 100);
          updates.offerValue = offerPrice.toFixed(2);
        } else {
          updates.offerValue = '';
        }
      }

      return { ...p, ...updates };
    }));
  };

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'Todas las categorías') {
      return products;
    }
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const preparedTickets = useMemo(() => {
    return products
      .filter(p => p.isSelected)
      .map(p => {
        let price = p.price
        let originalPrice = null

        if (p.isOffer && p.offerValue) {
          const offerPrice = parseFloat(p.offerValue)
          if (!isNaN(offerPrice) && offerPrice < price) {
            originalPrice = price
            price = offerPrice
          }
        }

        if (currency === 'BS') {
          price = price * bolivarConversionRate
          if (originalPrice !== null) {
            originalPrice = originalPrice * bolivarConversionRate
          }
        }

        return {
          ...p,
          price: price,
          originalPrice: originalPrice,
          currencySymbol: currency === 'BS' ? 'Bs' : '$'
        }
      });
  }, [products, currency, bolivarConversionRate]);

  const handleGeneratePreview = () => {
    if (preparedTickets.length === 0) {
      showErrorModal('Por favor, seleccione al menos un producto para generar tickets.');
      return;
    }
    setPreviewModalOpen(true);
  };

  const handleSelectAll = (e) => {
    const { checked } = e.target;
    const visibleProductIds = filteredProducts.map(p => p.id);
    setProducts(products.map(p => visibleProductIds.includes(p.id) ? { ...p, isSelected: checked } : p));
  };

  const areAllFilteredSelected = useMemo(() => {
    return filteredProducts.length > 0 && filteredProducts.every(p => p.isSelected)
  }, [filteredProducts])

  return (
    <>
      <ReportHeader title="Generador de Tickets de Productos">
        <button onClick={handleGeneratePreview} className="flex items-center gap-2 bg-havelock-blue-300 text-white px-4 py-2 rounded-lg hover:bg-havelock-blue-400 transition-colors shadow-md hover:shadow-lg no-print">
          <Printer size={20} /> Generar Vista Previa
        </button>
      </ReportHeader>

      {loading ? (
        <div className="text-center p-8">Cargando productos...</div>
      ) : (
        <>
          <div className="no-print mb-6 flex flex-wrap gap-4 items-center">
            {/* Category and Currency Filters */}
            <div className="flex items-center gap-2">
              <label htmlFor="category-select" className="font-semibold text-havelock-blue-400">Categoría:</label>
              <select id="category-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="p-2 border-2 border-havelock-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-havelock-blue-200 font-semibold text-havelock-blue-400 bg-havelock-blue-50">
                {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="currency-select" className="font-semibold text-havelock-blue-400">Moneda:</label>
              <select id="currency-select" value={currency} onChange={(e) => setCurrency(e.target.value)} className="p-2 border-2 border-havelock-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-havelock-blue-200 font-semibold text-havelock-blue-400 bg-havelock-blue-50">
                <option value="USD">USD</option>
                <option value="BS">Bolívares (Bs)</option>
              </select>
            </div>
          </div>

          {/* Product Selection Table */}
          <div className="overflow-x-auto no-print">
            <table className="min-w-full divide-y-2 divide-havelock-blue-100 bg-white">
              <thead className="bg-havelock-blue-50">
                <tr>
                  <th className="py-3 px-4 text-left"><input type="checkbox" onChange={handleSelectAll} checked={areAllFilteredSelected} className="h-5 w-5 rounded" /></th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-havelock-blue-400 uppercase tracking-wider">Producto</th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-havelock-blue-400 uppercase tracking-wider">Precio Base</th>
                  <th className="py-3 px-4 text-center text-sm font-bold text-havelock-blue-400 uppercase tracking-wider">Oferta</th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-havelock-blue-400 uppercase tracking-wider">Descuento %</th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-havelock-blue-400 uppercase tracking-wider">Precio de Oferta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-havelock-blue-50">
                {filteredProducts.map(p => (
                  <tr key={p.id} className={`${p.isSelected ? 'bg-havelock-blue-50/50' : ''}`}>
                    <td className="py-3 px-4"><input type="checkbox" checked={p.isSelected} onChange={(e) => handleProductChange(p.id, 'isSelected', e.target.checked)} className="h-5 w-5 rounded" /></td>
                    <td className="py-3 px-4 font-medium text-gray-700">{p.name}</td>
                    <td className="py-3 px-4 text-gray-600">${p.price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center"><input type="checkbox" checked={p.isOffer} onChange={(e) => handleProductChange(p.id, 'isOffer', e.target.checked)} className="h-5 w-5 rounded" /></td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={p.discountPercentage}
                        onChange={(e) => handleProductChange(p.id, 'discountPercentage', e.target.value)}
                        disabled={!p.isOffer}
                        className="p-1 border-2 border-gray-200 rounded-md w-20 focus:outline-none focus:ring-2 focus:ring-havelock-blue-200 disabled:bg-gray-100"
                        placeholder="%"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={p.offerValue}
                        onChange={(e) => handleProductChange(p.id, 'offerValue', e.target.value)}
                        disabled={!p.isOffer}
                        className="p-1 border-2 border-gray-200 rounded-md w-28 focus:outline-none focus:ring-2 focus:ring-havelock-blue-200 disabled:bg-gray-100"
                        placeholder="Nuevo precio"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && <p className="text-center py-8 text-gray-500">No hay productos en esta categoría.</p>}
          </div>
        </>
      )}

      {/* Preview Modal */}
      {previewModalOpen && (
        <PreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          tickets={preparedTickets}
          showSuccessModal={showSuccessModal}
        />
      )}
    </>
  );
};

const PreviewModal = ({ isOpen, onClose, tickets, showSuccessModal }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGeneratePdf = async () => {
    setIsProcessing(true);
    showSuccessModal('Generando PDF, por favor espere...');

    const pdf = new jsPDF('landscape', 'mm', 'letter');
    const letterWidth = 279.4; // Landscape Letter: width is the longer dimension
    const letterHeight = 215.9; // Landscape Letter: height is the shorter dimension
    const margin = 10; // Standard margin for printable area
    const ticketsPerRow = 4;
    const ticketsPerCol = 4; // 4 rows of 4 columns (approx 62x46mm per ticket on Letter)
    const ticketsPerPage = ticketsPerRow * ticketsPerCol;

    const ticketWidth = (letterWidth - (margin * 2)) / ticketsPerRow;
    const ticketHeight = (letterHeight - (margin * 2)) / ticketsPerCol;

    const ticketElements = Array.from(document.querySelectorAll('.ticket-render-instance'));

    for (let i = 0; i < ticketElements.length; i++) {
      const page = Math.floor(i / ticketsPerPage);
      if (i > 0 && i % ticketsPerPage === 0) {
        pdf.addPage();
      }

      const row = Math.floor((i % ticketsPerPage) / ticketsPerRow);
      const col = (i % ticketsPerPage) % ticketsPerRow;

      const x = margin + col * ticketWidth;
      const y = margin + row * ticketHeight;

      const canvas = await html2canvas(ticketElements[i], {
        scale: 4, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');

      // Calculate dimensions to fit within the grid cell while maintaining aspect ratio
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(ticketWidth / imgWidth, ticketHeight / imgHeight);

      // Use the calculated width/height based on the grid, but ensure we don't stretch
      // Actually, for tickets we usually want them to fill the cell. 
      // The issue is likely that the rendered element in the DOM (ticket-render-instance) 
      // has a different aspect ratio than the grid cell in the PDF.
      // We should force the PDF image to match the grid cell size exactly, 
      // assuming the DOM element is rendered with similar proportions.

      pdf.addImage(imgData, 'PNG', x, y, ticketWidth, ticketHeight);
    }

    pdf.save('tickets-de-productos.pdf');
    setIsProcessing(false);
    onClose();
  };

  const handlePrint = () => {
    const printContent = document.getElementById('ticket-preview-area');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>Imprimir Tickets</title>`);
    // You MUST include your stylesheets for the print to work correctly
    Array.from(document.styleSheets).forEach(styleSheet => {
      try {
        const cssRules = Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
        printWindow.document.write(`<style>${cssRules}</style>`);
      } catch (e) {
        console.log('Could not read stylesheet rules:', e);
      }
    });
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { // Timeout required for content to load
      printWindow.print();
      printWindow.close();
    }, 500);
  }

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vista Previa de Tickets" size="4xl">
      <div id="ticket-preview-area" className="p-4 bg-gray-200 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {tickets.map(ticket => (
            <div key={ticket.id} className="w-full aspect-[65/53] ticket-render-instance break-inside-avoid shadow-sm">
              <ProductTicket product={ticket} currencySymbol={ticket.currencySymbol} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-4 p-4 border-t">
        <button onClick={onClose} disabled={isProcessing} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50">Cancelar</button>
        <button onClick={handlePrint} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50">
          <Printer size={18} /> Imprimir
        </button>
        <button onClick={handleGeneratePdf} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">
          {isProcessing ? 'Procesando...' : <><Download size={18} /> Descargar PDF</>}
        </button>
      </div>
    </Modal>
  );
}

export default ProductTicketReport;

