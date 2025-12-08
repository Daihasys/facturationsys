import React, { useState, useEffect } from 'react';

function ThermalSaleTicket({ ticketData }) {
  const [bolivarConversionRate, setBolivarConversionRate] = useState(35.0); // Default fallback

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

  if (!ticketData) {
    return <div style={{ padding: '10px', textAlign: 'center' }}>Cargando datos del ticket...</div>;
  }

  const { factura_id, total_usd, fecha_factura, usuario_nombre, productos } = ticketData;

  // Calculate subtotal and IVA
  // COMENTADO: Cliente no requiere IVA en esta versión
  // Para reactivar el IVA, descomenta las siguientes 2 líneas y la sección de totales más abajo
  // const subtotal = productos.reduce((sum, item) => sum + item.subtotal_usd, 0);
  // const iva = subtotal * 0.16;

  return (
    <div className="thermal-ticket">
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .thermal-ticket {
            width: 72mm !important;
            padding: 4mm 4mm 6mm 4mm !important;
          }
        }
        
        .thermal-ticket {
          width: 72mm;
          max-width: 72mm;
          margin: 0 auto;
          padding: 4mm 4mm 6mm 4mm;
          font-family: 'Courier New', Courier, monospace;
          font-size: 9px;
          line-height: 1.2;
          color: #000;
          background: #fff;
          box-sizing: border-box;
        }
        
        .thermal-ticket * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .thermal-header {
          text-align: center;
          margin-bottom: 6px;
          border-bottom: 1px dashed #000;
          padding-bottom: 6px;
        }
        
        .thermal-header h1 {
          font-size: 11px;
          font-weight: bold;
          margin-bottom: 2px;
          word-wrap: break-word;
        }
        
        .thermal-header p {
          font-size: 8px;
          margin: 0.5px 0;
          word-wrap: break-word;
        }
        
        .thermal-info {
          margin: 6px 0;
          font-size: 8px;
          border-bottom: 1px dashed #000;
          padding-bottom: 6px;
        }
        
        .thermal-info-row {
          display: flex;
          justify-content: space-between;
          margin: 1px 0;
          word-wrap: break-word;
        }
        
        .thermal-info-row span:first-child {
          font-weight: bold;
        }
        
        .thermal-info-row span:last-child {
          text-align: right;
          max-width: 50%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .thermal-products {
          margin: 6px 0;
          padding-bottom: 6px;
        }
        
        .thermal-product-header {
          display: grid;
          grid-template-columns: 2.5fr 0.8fr 1.2fr 1.2fr;
          gap: 2px;
          font-weight: bold;
          font-size: 7px;
          margin-bottom: 3px;
          padding-bottom: 2px;
          border-bottom: 1px solid #000;
        }
        
        .thermal-product-row {
          display: grid;
          grid-template-columns: 2.5fr 0.8fr 1.2fr 1.2fr;
          gap: 2px;
          font-size: 7px;
          margin: 2px 0;
        }
        
        .thermal-product-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        
        .thermal-text-right {
          text-align: right;
        }
        
        .thermal-text-center {
          text-align: center;
        }
        
        .thermal-totals {
          margin: 6px 0;
          font-size: 9px;
        }
        
        .thermal-total-row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }
        
        .thermal-total-row.final {
          font-weight: bold;
          font-size: 11px;
          margin-top: 4px;
          padding-top: 4px;
          border-top: 1px solid #000;
        }
        
        .thermal-footer {
          text-align: center;
          margin-top: 6px;
          padding-top: 6px;
          padding-bottom: 6px;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          font-size: 8px;
        }
        
        .thermal-footer p {
          margin: 1px 0;
        }
        
      `}</style>

      {/* Header - Business Information */}
      <div className="thermal-header">
        <h1>INVERSIONES ALKAELCA C.A</h1>
        <p>RIF: J-299257400</p>
        <p>Calle Atascosa</p>
        <p>Cruce con Cardones</p>
        <p>La Pascua Edo. Guarico</p>
      </div>

      {/* Sale Information */}
      <div className="thermal-info">
        <div className="thermal-info-row">
          <span>TICKET:</span>
          <span>#{factura_id}</span>
        </div>
        <div className="thermal-info-row">
          <span>FECHA:</span>
          <span>{new Date(fecha_factura).toLocaleDateString('es-VE', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          })} {new Date(fecha_factura).toLocaleTimeString('es-VE', {
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      </div>

      {/* Products Table */}
      <div className="thermal-products">
        <div className="thermal-product-header">
          <span>PRODUCTO</span>
          <span className="thermal-text-center">CNT</span>
          <span className="thermal-text-right">P.U</span>
          <span className="thermal-text-right">TOT</span>
        </div>
        {productos.map((item, index) => (
          <div key={index} className="thermal-product-row">
            <span className="thermal-product-name" title={item.nombre}>
              {item.nombre.length > 15 ? item.nombre.substring(0, 13) + '..' : item.nombre}
            </span>
            <span className="thermal-text-center">{item.cantidad}</span>
            <span className="thermal-text-right">Bs. {(item.precio_unitario_usd * bolivarConversionRate).toFixed(2)}</span>
            <span className="thermal-text-right">Bs. {(item.subtotal_usd * bolivarConversionRate).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="thermal-totals">
        {/* COMENTADO: Cliente no requiere mostrar subtotal e IVA en esta versión */}
        {/* Para reactivar, descomenta las siguientes secciones */}
        {/* <div className="thermal-total-row">
          <span>SUBTOTAL:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="thermal-total-row">
          <span>IVA (16%):</span>
          <span>${iva.toFixed(2)}</span>
        </div> */}
        <div className="thermal-total-row final">
          <span>TOTAL:</span>
          <span>Bs. {(total_usd * bolivarConversionRate).toFixed(2)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="thermal-footer">
        <p>¡GRACIAS POR SU COMPRA!</p>
      </div>

    </div>
  );
}

export default ThermalSaleTicket;
