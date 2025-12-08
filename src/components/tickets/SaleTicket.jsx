import React from 'react';

function SaleTicket({ ticketData }) {
  if (!ticketData) {
    return <div className="p-4 text-center">Cargando datos del ticket...</div>;
  }

  const { factura_id, total_usd, fecha_factura, usuario_nombre, productos } = ticketData;

  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow-lg rounded-lg my-8 print:shadow-none print:my-0 print:p-0">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-1">Ticket de Venta</h2>
        <p className="text-sm text-gray-600">Factura ID: #{factura_id}</p>
        <p className="text-sm text-gray-600">Fecha: {new Date(fecha_factura).toLocaleString()}</p>
        <p className="text-sm text-gray-600">Atendido por: {usuario_nombre}</p>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-2">Productos:</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-1">Producto</th>
              <th className="text-right py-1">Cant.</th>
              <th className="text-right py-1">Precio Unit.</th>
              <th className="text-right py-1">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((item, index) => (
              <tr key={index} className="border-t border-gray-200">
                <td className="py-1">{item.nombre}</td>
                <td className="text-right py-1">{item.cantidad}</td>
                <td className="text-right py-1">${item.precio_unitario_usd.toFixed(2)}</td>
                <td className="text-right py-1">${item.subtotal_usd.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-right text-lg font-bold">
        <p>Total: ${total_usd.toFixed(2)}</p>
      </div>

      <div className="text-center mt-8 text-gray-500 text-xs">
        <p>¡Gracias por su compra!</p>
        <p>Sistema de Facturación</p>
      </div>
    </div>
  );
}

export default SaleTicket;
