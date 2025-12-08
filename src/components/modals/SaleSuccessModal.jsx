import React from 'react';
import { CheckCircle, Printer, ArrowRight } from 'lucide-react';
import Modal from './Modal';

function SaleSuccessModal({ isOpen, onClose, saleData, onPrintTicket }) {
    if (!saleData) return null;

    const handlePrint = () => {
        if (onPrintTicket) {
            onPrintTicket(saleData.saleId);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-8 text-center">
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                    <div className="rounded-full bg-green-100 p-4">
                        <CheckCircle size={64} className="text-green-600" />
                    </div>
                </div>

                {/* Success Message */}
                <h2 className="text-3xl font-bold text-gray-800 mb-3">
                    ¡Venta Exitosa!
                </h2>
                <p className="text-gray-600 mb-2">
                    La venta ha sido registrada correctamente
                </p>

                {/* Sale Information */}
                <div className="bg-havelock-blue-50 rounded-xl p-4 mb-6 mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 font-medium">Factura:</span>
                        <span className="text-xl font-bold text-havelock-blue-600">#{saleData.saleId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Total:</span>
                        <span className="text-2xl font-bold text-gray-800">${saleData.total?.toFixed(2) || '0.00'}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                        onClick={handlePrint}
                        className="flex-1 flex items-center justify-center gap-2 bg-havelock-blue-400 text-white px-6 py-3 rounded-full hover:bg-havelock-blue-500 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
                    >
                        <Printer size={20} />
                        Imprimir Ticket
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-800 px-6 py-3 rounded-full hover:bg-gray-300 transition-all duration-300 font-semibold"
                    >
                        Continuar
                        <ArrowRight size={20} />
                    </button>
                </div>

                {/* Additional Info */}
                <p className="text-xs text-gray-500 mt-6">
                    Puedes imprimir el ticket ahora o más tarde desde el listado de ventas
                </p>
            </div>
        </Modal>
    );
}

export default SaleSuccessModal;
