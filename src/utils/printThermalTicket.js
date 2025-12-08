/**
 * Prints a thermal sales ticket - 72mm content width, left-aligned
 * @param {Object} ticketData - The sale data to print
 * @returns {Promise<void>}
 */
export const printThermalTicket = async (ticketData) => {
  try {
    const { factura_id, total_usd, fecha_factura, usuario_nombre, productos } = ticketData;

    // Fetch real-time bolivar conversion rate from API
    let bolivarConversionRate = 35.0; // Default fallback
    const primaryApiUrl = 'https://ve.dolarapi.com/v1/dolares/oficial';
    const fallbackApiUrl = 'https://api.dolarvzla.com/public/exchange-rate';

    try {
      const response = await fetch(primaryApiUrl);
      if (response.ok) {
        const data = await response.json();
        if (data && data.promedio) {
          bolivarConversionRate = data.promedio;
        }
      } else {
        throw new Error('Primary API failed');
      }
    } catch (e) {
      try {
        const fallbackResponse = await fetch(fallbackApiUrl);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData && fallbackData.current && fallbackData.current.usd) {
            bolivarConversionRate = fallbackData.current.usd;
          }
        }
      } catch (fallbackError) {
        console.warn('Could not fetch exchange rate, using default value');
      }
    }

    // Calculate subtotal and IVA
    // COMENTADO: Cliente no requiere IVA en esta versión
    // const subtotal = productos.reduce((sum, item) => sum + item.subtotal_usd, 0);
    // const iva = subtotal * 0.16;

    // Format date
    const date = new Date(fecha_factura);
    const formattedDate = date.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
    const formattedTime = date.toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create a new window for printing - 290px width, adaptive height
    const printWindow = window.open('', '_blank', 'width=290,scrollbars=yes');

    if (!printWindow) {
      alert('No se pudo abrir la ventana de impresión. Por favor, deshabilita los bloqueadores de pop-ups.');
      return;
    }

    // Generate products HTML - converted to Bolivares
    const productsHTML = productos.map(item => `
      <div class="product-row">
        <span class="product-name">${item.nombre.length > 18 ? item.nombre.substring(0, 16) + '..' : item.nombre}</span>
        <span class="product-qty">${item.cantidad}</span>
        <span class="product-price">Bs. ${(item.precio_unitario_usd * bolivarConversionRate).toFixed(2)}</span>
        <span class="product-total">Bs. ${(item.subtotal_usd * bolivarConversionRate).toFixed(2)}</span>
      </div>
    `).join('');

    // Write SIMPLE HTML - left aligned, 72mm content
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Ticket #${factura_id}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              width: 80mm;
              margin: 0;
              padding: 0 4mm 8mm 2mm;
              font-family: Arial, sans-serif;
              background: #fff;
            }
            
            .ticket {
              width: 68mm;
              margin: 0;
              padding: 0;
              font-size: 10px;
              line-height: 1.4;
              color: #000;
              font-weight: 700;
            }
            
            .header {
              text-align: center;
              margin-bottom: 5px;
              border-bottom: 2px dashed #000;
              padding-bottom: 5px;
            }
            
            .header h1 {
              font-size: 12px;
              font-weight: 900;
              margin-bottom: 2px;
            }
            
            .header p {
              font-size: 9px;
              margin: 1px 0;
              font-weight: 600;
            }
            
            .info {
              margin: 5px 0;
              font-size: 9px;
              border-bottom: 1px dashed #000;
              padding-bottom: 5px;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
            
            .info-row span:first-child {
              font-weight: 900;
            }
            
            .info-row span:last-child {
              font-weight: 700;
            }
            
            .products {
              margin: 5px 0;
              padding-bottom: 5px;
            }
            
            .product-header {
              display: grid;
              grid-template-columns: 2.5fr 0.7fr 1.1fr 1.1fr;
              gap: 2px;
              font-weight: 900;
              font-size: 8px;
              margin-bottom: 3px;
              padding-bottom: 2px;
              border-bottom: 2px solid #000;
            }
            
            .product-row {
              display: grid;
              grid-template-columns: 2.5fr 0.7fr 1.1fr 1.1fr;
              gap: 2px;
              font-size: 8px;
              margin: 2px 0;
              font-weight: 700;
            }
            
            .product-name {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            .product-qty {
              text-align: center;
            }
            
            .product-price,
            .product-total {
              text-align: right;
            }
            
            .totals {
              margin: 5px 0;
              font-size: 10px;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
              font-weight: 700;
            }
            
            .total-row.final {
              font-weight: 900;
              font-size: 12px;
              margin-top: 4px;
              padding-top: 4px;
              border-top: 2px solid #000;
            }
            
            .footer {
              text-align: center;
              margin-top: 5px;
              padding-top: 5px;
              padding-bottom: 5px;
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              font-size: 9px;
              font-weight: 700;
            }
            
            .footer p {
              margin: 2px 0;
            }
            
            .spacer {
              height: 4mm;
              width: 100%;
            }
            
            .button-container {
              margin-top: 20px;
              margin-bottom: 10px;
              display: flex;
              justify-content: center;
              gap: 10px;
            }
            
            button {
              padding: 10px 20px;
              font-size: 14px;
              font-weight: bold;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              color: white;
            }
            
            .btn-print {
              background: #1d3552;
            }
            
            .btn-print:hover {
              background: #3b6395;
            }
            
            .btn-close {
              background: #666;
            }
            
            .btn-close:hover {
              background: #888;
            }
            
            @media print {
              .button-container {
                display: none !important;
              }
              
              body {
                padding: 0 4mm 8mm 2mm;
                margin: 0;
              }
              
              .ticket {
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h1>INVERSIONES ALKAELCA C.A</h1>
              <p>RIF: J-299257400</p>
              <p>Calle Atascosa</p>
              <p>Cruce con Cardones</p>
              <p>La Pascua Edo. Guarico</p>
            </div>

            <div class="info">
              <div class="info-row">
                <span>TICKET:</span>
                <span>#${factura_id}</span>
              </div>
              <div class="info-row">
                <span>FECHA:</span>
                <span>${formattedDate} ${formattedTime}</span>
              </div>
            </div>

            <div class="products">
              <div class="product-header">
                <span>PRODUCTO</span>
                <span class="product-qty">CNT</span>
                <span class="product-price">P.U</span>
                <span class="product-total">TOTAL</span>
              </div>
              ${productsHTML}
            </div>

            <div class="totals">
              <div class="total-row final">
                <span>TOTAL:</span>
                <span>Bs. ${(total_usd * bolivarConversionRate).toFixed(2)}</span>
              </div>
            </div>

            <div class="footer">
              <p>¡GRACIAS POR SU COMPRA!</p>
            </div>
          </div>
          
          <div class="button-container">
            <button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
            <button class="btn-close" onclick="window.close()">✕ Cerrar</button>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

  } catch (error) {
    console.error('Error al imprimir el ticket:', error);
    alert(`Error al imprimir el ticket: ${error.message}`);
  }
};
