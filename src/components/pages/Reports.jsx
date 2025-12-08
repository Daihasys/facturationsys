import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { Download, Printer, Calendar as CalendarIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SuccessModal from '../modals/SuccessModal';
import ErrorModal from '../modals/ErrorModal';
import ProductTicketReport from '../tickets/ProductTicketReport';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('salesHistory');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const showSuccessModal = (message) => {
    setModalMessage(message);
    setSuccessModalOpen(true);
  };

  const showErrorModal = (message) => {
    setModalMessage(message);
    setErrorModalOpen(true);
  };

  // State for real data from backend
  const [allProductsData, setAllProductsData] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/reports/products');
        if (response.ok) {
          const data = await response.json();
          setAllProductsData(data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const COLORS = ['#3b6395', '#5287c9', '#a0bcec', '#CBD9F1'];

  const renderReport = () => {
    const reportProps = { showSuccessModal, showErrorModal };
    switch (activeReport) {
      case 'salesHistory': return <SalesHistoryReport {...reportProps} />;
      case 'productLists': return <ProductListReport {...reportProps} products={allProductsData} loading={loadingProducts} />;
      case 'productTickets': return <ProductTicketReport {...reportProps} />;
      default: return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-havelock-blue-50 min-h-screen">
      <div className="no-print">
        <h1 className="text-5xl font-bold text-gray-800 mb-8 ml-4">Módulo de Reportes</h1>
        <div className="mb-8 flex flex-wrap gap-4">
          <ReportTabButton text="Historial de Ventas" isActive={activeReport === 'salesHistory'} onClick={() => setActiveReport('salesHistory')} />
          {/* <ReportTabButton text="Rendimiento por Categoría" isActive={activeReport === 'categoryPerformance'} onClick={() => setActiveReport('categoryPerformance')} /> */}
          <ReportTabButton text="Listas de Productos" isActive={activeReport === 'productLists'} onClick={() => setActiveReport('productLists')} />
          <ReportTabButton text="Tickets de Productos" isActive={activeReport === 'productTickets'} onClick={() => setActiveReport('productTickets')} />
        </div>
      </div>
      <div className="bg-white p-6 rounded-[26px] shadow-lg transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
        {renderReport()}
      </div>
      <SuccessModal isOpen={successModalOpen} onClose={() => setSuccessModalOpen(false)} message={modalMessage} />
      <ErrorModal isOpen={errorModalOpen} onClose={() => setErrorModalOpen(false)} message={modalMessage} />
    </div>
  );
};

const ReportTabButton = ({ text, isActive, onClick }) => (
  <button onClick={onClick} className={`px-5 py-2 rounded-full font-bold text-lg transition-all duration-300 shadow-md border-2 border-transparent ${isActive ? 'bg-havelock-blue-300 text-white scale-105 shadow-lg' : 'bg-white text-havelock-blue-300 hover:bg-havelock-blue-50 hover:border-havelock-blue-200'}`}>
    {text}
  </button>
);

const ReportHeader = ({ title, children }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 border-b-2 border-havelock-blue-50 pb-4 no-print">
    <h2 className="text-3xl font-bold text-havelock-blue-400 mb-4 sm:mb-0">{title}</h2>
    <div className="flex gap-3">
      {children}
    </div>
  </div>
);

const SalesHistoryReport = ({ showSuccessModal }) => {
  const [timeframe, setTimeframe] = useState('diario');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch sales data from backend
  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      try {
        // Fetch chart data
        const chartResponse = await fetch(`http://localhost:4000/api/reports/sales/chart/${timeframe}`);
        if (chartResponse.ok) {
          const chartResult = await chartResponse.json();
          setChartData(chartResult);
        }

        // Fetch table data
        let tableUrl = 'http://localhost:4000/api/reports/sales';
        if (timeframe === 'personalizado') {
          const start = startDate.toISOString().split('T')[0];
          const end = endDate.toISOString().split('T')[0];
          tableUrl += `?startDate=${start}&endDate=${end}`;
        }

        const tableResponse = await fetch(tableUrl);
        if (tableResponse.ok) {
          const tableResult = await tableResponse.json();
          setTableData(tableResult);
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [timeframe, startDate, endDate]);

  const processedData = useMemo(() => {
    return { table: tableData, chart: chartData };
  }, [tableData, chartData]);

  const getTitle = () => {
    switch (timeframe) {
      case 'diario': return 'Reporte de Ventas del Día';
      case 'semanal': return 'Reporte de Ventas de la Semana';
      case 'mensual': return 'Reporte de Ventas del Mes';
      case 'personalizado': return `Reporte de ${startDate.toLocaleDateString()} a ${endDate.toLocaleDateString()}`;
      default: return 'Reporte de Ventas';
    }
  };

  const handlePdfExport = () => {
    const doc = new jsPDF();
    const title = getTitle();
    const today = new Date();
    const date = today.toLocaleDateString();
    const time = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Helper function for European number formatting
    const formatNumber = (num) => {
      return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&.').replace('.', ',').replace(/\./g, '.').slice(0, -3) + num.toFixed(2).slice(-3).replace('.', ',');
    };

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 105, 15, { align: 'center' });

    // Date and time
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de emisión: ${date} | Hora: ${time}`, 105, 22, { align: 'center' });

    // Table headers and data
    const headers = [['ID', 'Fecha Venta', 'Monto (USD)', 'Monto (Bs.)', 'Usuario']];
    const body = processedData.table.map(item => [
      item.id,
      item.fecha,
      `$${formatNumber(item.montoUSD)}`,
      `Bs. ${formatNumber(item.montoBS)}`,
      item.usuario
    ]);

    autoTable(doc, {
      startY: 28,
      head: headers,
      body: body,
      theme: 'grid',
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2.5,
        halign: 'left'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { halign: 'center', cellWidth: 35 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 35 },
        4: { halign: 'left', cellWidth: 50 },
      }
    });

    // Calculate totals
    const totalVentasUSD = processedData.table.reduce((sum, s) => sum + s.montoUSD, 0);
    const totalVentasBS = processedData.table.reduce((sum, s) => sum + s.montoBS, 0);
    const numTransacciones = processedData.table.length;
    const ticketPromedio = numTransacciones > 0 ? totalVentasUSD / numTransacciones : 0;

    // Financial Summary Section
    let finalY = doc.lastAutoTable.finalY + 8;

    // Summary title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setDrawColor(0, 0, 0);
    doc.setTextColor(0, 0, 0);
    doc.rect(14, finalY, 182, 8);
    doc.text('RESUMEN DEL PERÍODO', 105, finalY + 5.5, { align: 'center' });

    finalY += 12;
    doc.setFontSize(9);

    // Summary data
    const summaryItems = [
      { label: 'Número de Transacciones:', value: `${numTransacciones}` },
      { label: 'Total Ventas (USD):', value: `$${formatNumber(totalVentasUSD)}` },
      { label: 'Total Ventas (Bs.):', value: `Bs. ${formatNumber(totalVentasBS)}` },
      { label: 'Ticket Promedio:', value: `$${formatNumber(ticketPromedio)}` },
    ];

    summaryItems.forEach((item) => {
      doc.setFont('helvetica', 'bold');
      doc.text(item.label, 20, finalY);
      doc.setFont('helvetica', 'normal');
      doc.text(item.value, 130, finalY);
      finalY += 6;
    });

    // Footer note
    finalY += 3;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Nota: Los montos reflejan las ventas registradas en el período seleccionado.', 105, finalY, { align: 'center' });

    doc.save(`reporte-ventas-${date.replace(/\//g, '-')}.pdf`);
    showSuccessModal('El reporte se ha exportado a PDF exitosamente.');
  };

  const handleExcelExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historial de Ventas');

    const title = getTitle();
    const today = new Date();
    const date = today.toLocaleDateString();
    const time = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Título principal
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = title;
    worksheet.getCell('A1').font = { bold: true, size: 18 };
    worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    // Fecha y hora
    worksheet.mergeCells('A2:E2');
    worksheet.getCell('A2').value = `Fecha de emisión: ${date} | Hora: ${time}`;
    worksheet.getCell('A2').font = { size: 10, italic: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    worksheet.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };

    // Fila en blanco
    worksheet.addRow([]);

    // Encabezados de columnas
    const headerRow = worksheet.addRow(['ID', 'Fecha Venta', 'Monto (USD)', 'Monto (Bs.)', 'Usuario']);

    // Estilo de encabezados
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
    headerRow.height = 25;

    // Anchos de columna
    worksheet.columns = [
      { key: 'id', width: 10 },
      { key: 'fecha', width: 22 },
      { key: 'montoUSD', width: 18 },
      { key: 'montoBS', width: 18 },
      { key: 'usuario', width: 25 },
    ];

    // Datos de ventas
    processedData.table.forEach((item) => {
      const row = worksheet.addRow({
        id: item.id,
        fecha: item.fecha,
        montoUSD: item.montoUSD,
        montoBS: item.montoBS,
        usuario: item.usuario
      });

      // Formato de números con exactamente 2 decimales
      row.getCell(3).numFmt = '_-"$"\ * #,##0.00_-;\-"$"\ * #,##0.00_-;_-"$"\ * "-"??_-;_-@_-';
      row.getCell(4).numFmt = '_-"Bs. "\ * #,##0.00_-;\-"Bs. "\ * #,##0.00_-;_-"Bs. "\ * "-"??_-;_-@_-';

      // Sin color alterno para ahorrar tinta
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
        cell.alignment = { vertical: 'middle' };
      });

      // Alinear números a la derecha
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
    });

    // Calcular totales
    const totalVentasUSD = processedData.table.reduce((sum, s) => sum + s.montoUSD, 0);
    const totalVentasBS = processedData.table.reduce((sum, s) => sum + s.montoBS, 0);
    const numTransacciones = processedData.table.length;
    const ticketPromedio = numTransacciones > 0 ? totalVentasUSD / numTransacciones : 0;

    // Filas en blanco antes de resumen
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Sección de Resumen
    const summaryStartRow = worksheet.lastRow.number + 1;
    worksheet.mergeCells(`A${summaryStartRow}:E${summaryStartRow}`);
    const summaryTitleCell = worksheet.getCell(`A${summaryStartRow}`);
    summaryTitleCell.value = '📊 RESUMEN DEL PERÍODO';
    summaryTitleCell.font = { bold: true, size: 14 };
    summaryTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
    summaryTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(summaryStartRow).height = 25;

    // Datos del resumen
    const summaryData = [
      { label: 'Número de Transacciones:', value: numTransacciones, format: '0' },
      { label: 'Total Ventas (USD):', value: totalVentasUSD, format: '_-"$"\ * #,##0.00_-;\-"$"\ * #,##0.00_-;_-"$"\ * "-"??_-;_-@_-' },
      { label: 'Total Ventas (Bs.):', value: totalVentasBS, format: '_-"Bs. "\ * #,##0.00_-;\-"Bs. "\ * #,##0.00_-;_-"Bs. "\ * "-"??_-;_-@_-' },
      { label: 'Ticket Promedio:', value: ticketPromedio, format: '_-"$"\ * #,##0.00_-;\-"$"\ * #,##0.00_-;_-"$"\ * "-"??_-;_-@_-' },
    ];

    summaryData.forEach((item) => {
      const row = worksheet.addRow(['', item.label, '', item.value, '']);

      // Estilo para etiquetas
      const labelCell = row.getCell(2);
      labelCell.font = { bold: true, size: 11 };
      labelCell.alignment = { horizontal: 'left', vertical: 'middle' };

      // Estilo para valores
      const valueCell = row.getCell(4);
      valueCell.font = { bold: true, size: 11 };
      valueCell.numFmt = item.format;
      valueCell.alignment = { horizontal: 'right', vertical: 'middle' };
    });

    // Nota final
    worksheet.addRow([]);
    const noteRow = worksheet.addRow(['', 'Nota: Los montos reflejan las ventas registradas en el período seleccionado.', '', '', '']);
    worksheet.mergeCells(`B${noteRow.number}:E${noteRow.number}`);
    noteRow.getCell(2).font = { italic: true, size: 9, color: { argb: 'FF666666' } };
    noteRow.getCell(2).alignment = { horizontal: 'left' };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-ventas-${date.replace(/\//g, '-')}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccessModal('El reporte se ha exportado a Excel exitosamente.');
  };

  return (
    <div className="printable-area">
      <ReportHeader title="Historial de Ventas">
        <button onClick={handlePdfExport} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-md hover:shadow-lg"><Download size={20} /> PDF</button>
        <button onClick={handleExcelExport} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"><Download size={20} /> Excel</button>
      </ReportHeader>
      <div className="flex justify-end items-center mb-4 no-print gap-4">
        <select onChange={(e) => setTimeframe(e.target.value)} value={timeframe} className="p-2 border-2 border-havelock-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-havelock-blue-200 font-semibold text-havelock-blue-400 bg-havelock-blue-50">
          <option value="diario">Diario</option>
          <option value="semanal">Semanal</option>
          <option value="mensual">Mensual</option>
          <option value="personalizado">Personalizado</option>
        </select>
        {timeframe === 'personalizado' && (
          <div className="flex items-center gap-2">
            <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} className="w-32 p-2 border-2 border-havelock-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-havelock-blue-200 font-semibold text-havelock-blue-400 bg-havelock-blue-50" />
            <span className="font-semibold text-gray-600">a</span>
            <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} className="w-32 p-2 border-2 border-havelock-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-havelock-blue-200 font-semibold text-havelock-blue-400 bg-havelock-blue-50" />
          </div>
        )}
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={processedData.chart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD9F1" />
            <XAxis dataKey="name" tick={{ fill: '#1d3552' }} />
            <YAxis tick={{ fill: '#1d3552' }} />
            <Tooltip cursor={{ fill: 'rgba(160, 188, 236, 0.1)' }} contentStyle={{ backgroundColor: '#ecf1fb', borderRadius: '12px', border: 'none' }} />
            <Legend wrapperStyle={{ color: '#1d3552' }} />
            <Bar dataKey="ventas" name="Ventas" fill="#3b6395" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};



const ProductListReport = ({ products, loading, showSuccessModal }) => {
  const [sortOrder, setSortOrder] = useState('all');

  if (loading) {
    return <div className="text-center p-8">Cargando productos...</div>;
  }
  const [bolivarRate, setBolivarRate] = useState(35.0); // Default fallback

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
          setBolivarRate(data.promedio);
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
            setBolivarRate(fallbackData.current.usd);
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

  const getSortedProducts = () => {
    switch (sortOrder) {
      case 'most-sold': return [...products].sort((a, b) => b.sold - a.sold);
      case 'least-sold': return [...products].sort((a, b) => a.sold - b.sold);
      case 'all':
      default: return products;
    }
  };

  const sortedProducts = getSortedProducts();

  const handlePdfExport = () => {
    const doc = new jsPDF();
    const title = "Lista de Productos";
    const today = new Date();
    const date = today.toLocaleDateString();
    const time = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Helper function for European number formatting
    const formatNumber = (num) => {
      return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&.').replace('.', ',').replace(/\./g, '.').slice(0, -3) + num.toFixed(2).slice(-3).replace('.', ',');
    };

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 105, 15, { align: 'center' });

    // Date and time
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de emisión: ${date} | Hora: ${time}`, 105, 22, { align: 'center' });

    // Table headers and data
    const headers = [['ID', 'Nombre', 'Descripción', 'Categoría', 'P. Costo', 'P. Venta', 'Vendidos']];
    const body = sortedProducts.map(item => [
      item.id,
      item.name.length > 20 ? item.name.substring(0, 18) + '..' : item.name,
      item.descripcion ? (item.descripcion.length > 30 ? item.descripcion.substring(0, 28) + '..' : item.descripcion) : 'N/A',
      item.categoria || 'N/A',
      `$${formatNumber(item.precio_costo || 0)}`,
      `$${formatNumber(item.precio_venta || item.price || 0)}`,
      item.sold
    ]);

    autoTable(doc, {
      startY: 28,
      head: headers,
      body: body,
      theme: 'grid',
      headStyles: {
        fillColor: [240, 240, 240], // Gris claro sin tinta
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8
      },
      styles: {
        font: 'helvetica',
        fontSize: 7,
        cellPadding: 2,
        halign: 'left'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 }, // ID
        1: { cellWidth: 35 }, // Nombre
        2: { cellWidth: 45 }, // Descripción
        3: { halign: 'center', cellWidth: 22 }, // Categoría
        4: { halign: 'right', cellWidth: 22 }, // P. Costo
        5: { halign: 'right', cellWidth: 22 }, // P. Venta
        6: { halign: 'center', cellWidth: 18 }, // Vendidos
      }
    });

    // Calculate totals
    const totalCostoUSD = sortedProducts.reduce((sum, p) => sum + (p.precio_costo || 0), 0);
    const totalVentaUSD = sortedProducts.reduce((sum, p) => sum + (p.precio_venta || p.price || 0), 0);
    const margenGanancia = totalVentaUSD - totalCostoUSD;
    const porcentajeMargen = totalVentaUSD > 0 ? ((margenGanancia / totalVentaUSD) * 100) : 0;

    // Financial Summary Section
    let finalY = doc.lastAutoTable.finalY + 8;

    // Summary title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setDrawColor(0, 0, 0);
    doc.setTextColor(0, 0, 0);
    doc.rect(14, finalY, 182, 8);
    doc.text('RESUMEN FINANCIERO DEL INVENTARIO', 105, finalY + 5.5, { align: 'center' });

    finalY += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);

    // Summary data
    const summaryItems = [
      { label: 'Total Precio de Costo (Todos los productos):', value: `$${formatNumber(totalCostoUSD)}` },
      { label: 'Total Precio de Venta (Todos los productos):', value: `$${formatNumber(totalVentaUSD)}` },
      { label: 'Margen de Ganancia Total:', value: `$${formatNumber(margenGanancia)}` },
      { label: 'Porcentaje de Margen (%):', value: `${porcentajeMargen.toFixed(1)}%` },
    ];

    summaryItems.forEach((item, index) => {
      doc.setFont('helvetica', 'bold');
      doc.text(item.label, 20, finalY);
      doc.setFont('helvetica', 'normal');
      doc.text(item.value, 130, finalY);
      finalY += 6;
    });

    // Bolivar conversion section
    finalY += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Conversión a Bolívares (Bs.)', 20, finalY);
    finalY += 6;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'italic');
    doc.text(`Tasa de Cambio: 1 USD = ${bolivarRate.toFixed(2)} Bs.`, 20, finalY);
    finalY += 6;

    const bolivarItems = [
      { label: 'Total en Bs. (Costo):', value: `Bs. ${formatNumber(totalCostoUSD * bolivarRate)}` },
      { label: 'Total en Bs. (Venta):', value: `Bs. ${formatNumber(totalVentaUSD * bolivarRate)}` },
      { label: 'Margen en Bs.:', value: `Bs. ${formatNumber(margenGanancia * bolivarRate)}` },
    ];

    bolivarItems.forEach((item) => {
      doc.setFont('helvetica', 'bold');
      doc.text(item.label, 20, finalY);
      doc.setFont('helvetica', 'normal');
      doc.text(item.value, 130, finalY);
      finalY += 6;
    });

    // Footer note
    finalY += 3;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Nota: Los totales representan la suma de todos los precios de productos en el sistema.', 105, finalY, { align: 'center' });

    doc.save(`reporte-productos-${date.replace(/\//g, '-')}.pdf`);
    showSuccessModal('El reporte de productos se ha exportado a PDF exitosamente.');
  };

  const handleExcelExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lista de Productos');

    const title = "Lista de Productos";
    const today = new Date();
    const date = today.toLocaleDateString();
    const time = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Título principal
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = title;
    worksheet.getCell('A1').font = { bold: true, size: 18 };
    worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    // Fecha y hora
    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').value = `Fecha de emisión: ${date} | Hora: ${time}`;
    worksheet.getCell('A2').font = { size: 10, italic: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    worksheet.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };

    // Fila en blanco
    worksheet.addRow([]);

    // Encabezados de columnas
    const headerRow = worksheet.addRow(['ID', 'Nombre', 'Descripción', 'Categoría', 'Precio Costo (USD)', 'Precio Venta (USD)', 'Vendidos']);

    // Estilo de encabezados
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
    headerRow.height = 25;

    // Anchos de columna
    worksheet.columns = [
      { key: 'id', width: 8 },
      { key: 'name', width: 30 },
      { key: 'descripcion', width: 35 },
      { key: 'categoria', width: 15 },
      { key: 'precio_costo', width: 18 },
      { key: 'precio_venta', width: 18 },
      { key: 'sold', width: 12 },
    ];

    // Datos de productos
    sortedProducts.forEach((item, index) => {
      const row = worksheet.addRow({
        id: item.id,
        name: item.name,
        descripcion: item.descripcion || 'Sin descripción',
        categoria: item.categoria || 'Sin categoría',
        precio_costo: item.precio_costo || 0,
        precio_venta: item.precio_venta || item.price || 0,
        sold: item.sold
      });

      // Formato de números con exactamente 2 decimales
      row.getCell(5).numFmt = '_-"$"\ * #,##0.00_-;\-"$"\ * #,##0.00_-;_-"$"\ * "-"??_-;_-@_-';
      row.getCell(6).numFmt = '_-"$"\ * #,##0.00_-;\-"$"\ * #,##0.00_-;_-"$"\ * "-"??_-;_-@_-';

      // Sin color de fondo alterno para ahorrar tinta
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
        cell.alignment = { vertical: 'middle' };
      });

      // Alinear números a la derecha
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Calcular totales
    const totalCostoUSD = sortedProducts.reduce((sum, p) => sum + (p.precio_costo || 0), 0);
    const totalVentaUSD = sortedProducts.reduce((sum, p) => sum + (p.precio_venta || p.price || 0), 0);
    const margenGanancia = totalVentaUSD - totalCostoUSD;
    const porcentajeMargen = totalVentaUSD > 0 ? ((margenGanancia / totalVentaUSD) * 100) : 0;

    // Filas en blanco antes de resumen
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Sección de Resumen Financiero
    const summaryStartRow = worksheet.lastRow.number + 1;
    worksheet.mergeCells(`A${summaryStartRow}:G${summaryStartRow}`);
    const summaryTitleCell = worksheet.getCell(`A${summaryStartRow}`);
    summaryTitleCell.value = '📊 RESUMEN FINANCIERO DEL INVENTARIO';
    summaryTitleCell.font = { bold: true, size: 14 };
    summaryTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
    summaryTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(summaryStartRow).height = 25;

    // Datos del resumen
    const summaryData = [
      { label: 'Total Precio de Costo (Todos los productos)', value: totalCostoUSD, format: '_-"$"\ * #,##0.00_-;\-"$"\ * #,##0.00_-;_-"$"\ * "-"??_-;_-@_-' },
      { label: 'Total Precio de Venta (Todos los productos)', value: totalVentaUSD, format: '_-"$"\ * #,##0.00_-;\-"$"\ * #,##0.00_-;_-"$"\ * "-"??_-;_-@_-' },
      { label: 'Margen de Ganancia Total', value: margenGanancia, format: '_-"$"\ * #,##0.00_-;\-"$"\ * #,##0.00_-;_-"$"\ * "-"??_-;_-@_-' },
      { label: 'Porcentaje de Margen(%)', value: porcentajeMargen, format: '0.0' },
      { label: '', value: '', format: '' },
      { label: '💱 Conversión a Bolívares (Bs.)', value: '', format: '' },
      { label: `Tasa de Cambio (1 USD = ${bolivarRate.toFixed(2)} Bs.)`, value: '', format: '' },
      { label: 'Total en Bs. (Costo)', value: totalCostoUSD * bolivarRate, format: '_-"Bs. "\ * #,##0.00_-;\-"Bs. "\ * #,##0.00_-;_-"Bs. "\ * "-"??_-;_-@_-' },
      { label: 'Total en Bs. (Venta)', value: totalVentaUSD * bolivarRate, format: '_-"Bs. "\ * #,##0.00_-;\-"Bs. "\ * #,##0.00_-;_-"Bs. "\ * "-"??_-;_-@_-' },
      { label: 'Margen en Bs.', value: margenGanancia * bolivarRate, format: '_-"Bs. "\ * #,##0.00_-;\-"Bs. "\ * #,##0.00_-;_-"Bs. "\ * "-"??_-;_-@_-' },
    ];

    summaryData.forEach((item) => {
      const row = worksheet.addRow(['', '', item.label, '', item.value, '', '']);

      // Estilo para etiquetas
      const labelCell = row.getCell(3);
      labelCell.font = { bold: true, size: 11 };
      labelCell.alignment = { horizontal: 'left', vertical: 'middle' };

      // Estilo para valores
      const valueCell = row.getCell(5);
      valueCell.font = { bold: true, size: 11 };
      valueCell.numFmt = item.format;
      valueCell.alignment = { horizontal: 'right', vertical: 'middle' };

      // Separador visual
      if (item.label === '') {
        row.height = 5;
      } else if (item.label.includes('💱')) {
        labelCell.font = { bold: true, size: 12 };
        row.height = 22;
      }
    });

    // Nota final
    worksheet.addRow([]);
    const noteRow = worksheet.addRow(['', '', 'Nota: Los totales representan la suma de todos los precios de productos en el sistema.', '', '', '', '']);
    worksheet.mergeCells(`C${noteRow.number}:G${noteRow.number}`);
    noteRow.getCell(3).font = { italic: true, size: 9, color: { argb: 'FF666666' } };
    noteRow.getCell(3).alignment = { horizontal: 'left' };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-productos-${date.replace(/\//g, '-')}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccessModal('El reporte de productos se ha exportado a Excel exitosamente.');
  };

  return (
    <div className="printable-area">
      <ReportHeader title="Generar Listas de Productos">
        <button onClick={handlePdfExport} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-md hover:shadow-lg"><Download size={20} /> PDF</button>
        <button onClick={handleExcelExport} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"><Download size={20} /> Excel</button>
      </ReportHeader>
      <div className="flex justify-end mb-4 no-print">
        <select onChange={(e) => setSortOrder(e.target.value)} value={sortOrder} className="p-2 border-2 border-havelock-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-havelock-blue-200 font-semibold text-havelock-blue-400 bg-havelock-blue-50">
          <option value="all">Lista Completa</option>
          <option value="most-sold">Más Vendidos</option>
          <option value="least-sold">Menos Vendidos</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y-2 divide-havelock-blue-100">
          <thead><tr className="bg-havelock-blue-50">
            <th className="py-2 px-2 text-left text-sm font-bold text-havelock-blue-400 uppercase tracking-wider rounded-tl-lg">ID</th>
            <th className="py-2 px-3 text-left text-sm font-bold text-havelock-blue-400 uppercase tracking-wider">Producto</th>
            <th className="py-2 px-3 text-left text-sm font-bold text-havelock-blue-400 uppercase tracking-wider hidden lg:table-cell">Descripción</th>
            <th className="py-2 px-2 text-left text-sm font-bold text-havelock-blue-400 uppercase tracking-wider">Categoría</th>
            <th className="py-2 px-3 text-left text-sm font-bold text-havelock-blue-400 uppercase tracking-wider">P. Costo</th>
            <th className="py-2 px-3 text-left text-sm font-bold text-havelock-blue-400 uppercase tracking-wider">P. Venta</th>
            <th className="py-2 px-2 text-left text-sm font-bold text-havelock-blue-400 uppercase tracking-wider rounded-tr-lg">Vendidos</th>
          </tr></thead>
          <tbody className="bg-white divide-y divide-havelock-blue-50">
            {sortedProducts.map(p => (
              <tr key={p.id} className="hover:bg-havelock-blue-50/50">
                <td className="py-2 px-2 text-gray-600 text-sm">{p.id}</td>
                <td className="py-2 px-3 font-medium text-gray-700 text-sm max-w-[150px] truncate">{p.name}</td>
                <td className="py-2 px-3 text-gray-600 text-sm hidden lg:table-cell max-w-[200px] truncate">{p.descripcion || 'Sin descripción'}</td>
                <td className="py-2 px-2 text-gray-600"><span className="px-1.5 py-0.5 bg-havelock-blue-100 text-havelock-blue-700 rounded-full text-xs font-semibold whitespace-nowrap">{p.categoria || 'Sin categoría'}</span></td>
                <td className="py-2 px-3 text-gray-600 text-sm">${(p.precio_costo || 0).toFixed(2)}</td>
                <td className="py-2 px-3 text-gray-600 font-semibold text-sm">${(p.precio_venta || p.price || 0).toFixed(2)}</td>
                <td className="py-2 px-2 text-gray-600 text-sm text-center">{p.sold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;