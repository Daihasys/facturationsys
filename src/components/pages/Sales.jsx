import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, Trash2, ShoppingCart, Plus, Minus, Package } from 'lucide-react';
import SaleSuccessModal from '../modals/SaleSuccessModal';
import ErrorModal from '../modals/ErrorModal';
import { printThermalTicket } from '../../utils/printThermalTicket';
import { useAuth } from '../../context/AuthContext';

function Sales() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const barcodeInputRef = React.useRef(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [saleData, setSaleData] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEmptyCartModalOpen, setIsEmptyCartModalOpen] = useState(false);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-auth-token': token,
  });

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/products', {
        headers: getHeaders()
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error al obtener los productos:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [cart]);

  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter' && scannedBarcode) {
      e.preventDefault();
      const product = products.find(p => p.barcode === scannedBarcode);
      if (product) {
        incrementQuantity(product);
        setScannedBarcode('');
      } else {
        setErrorMessage(`Producto con código de barras "${scannedBarcode}" no encontrado.`);
        setIsErrorModalOpen(true);
        setScannedBarcode('');
      }
    }
  };

  const handleQuantityChange = (product, quantity) => {
    const newQuantity = Math.max(0, parseInt(quantity, 10) || 0);
    const existingItem = cart.find(item => item.id === product.id);

    if (newQuantity === 0) {
      if (existingItem) {
        setCart(cart.filter(item => item.id !== product.id));
      }
    } else {
      if (existingItem) {
        setCart(cart.map(item =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        ));
      } else {
        setCart([...cart, { ...product, price: product.precio_venta, quantity: newQuantity }]);
      }
    }
  };

  const incrementQuantity = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, price: product.precio_venta, quantity: 1 }]);
    }
  };

  const decrementQuantity = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity > 1) {
        setCart(cart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item
        ));
      } else {
        setCart(cart.filter(item => item.id !== product.id));
      }
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const handleProcessSale = async () => {
    if (cart.length === 0) {
      setIsEmptyCartModalOpen(true);
      return;
    }

    const saleDataToSubmit = {
      userId: 1, // Hardcoded user ID for now
      cart: cart,
      total: total
    };

    try {
      const response = await fetch('http://localhost:4000/api/sales', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(saleDataToSubmit),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar la venta');
      }

      // Store sale data for the modal and printing
      setSaleData({
        saleId: result.saleId,
        total: total,
        message: result.message
      });
      setIsSuccessModalOpen(true);
      setCart([]);
      // Optionally, refresh products to update stock, once that's implemented
      // fetchProducts(); 
    } catch (error) {
      console.error("Error en handleProcessSale:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handlePrintTicket = async (saleId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/sales/${saleId}/ticket`, {
        headers: getHeaders()
      });
      if (!response.ok) {
        throw new Error('Error al obtener los datos del ticket.');
      }
      const ticketData = await response.json();
      printThermalTicket(ticketData);
    } catch (error) {
      console.error('Error printing ticket:', error);
      alert(`Error al imprimir el ticket: ${error.message}`);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  return (
    <div className="p-6 min-h-screen" onClick={() => barcodeInputRef.current && barcodeInputRef.current.focus()}>
      <input
        ref={barcodeInputRef}
        type="text"
        value={scannedBarcode}
        onChange={(e) => setScannedBarcode(e.target.value)}
        onKeyDown={handleBarcodeScan}
        style={{ position: 'absolute', left: '-9999px' }}
      />
      <h1 className="text-5xl font-bold text-gray-800 mb-8 ml-4">Módulo de Ventas</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Product List */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-lg flex flex-col h-[86vh] transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
          <div className="relative mb-4" onClick={(e) => e.stopPropagation()}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-havelock-blue-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o código de barras..."
              className="pl-12 pr-4 py-3 border border-havelock-blue-200 rounded-full w-full focus:outline-none focus:ring-2 focus:ring-havelock-blue-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Productos Disponibles</h2>
          </div>
          <div className="flex-grow overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const cartItem = cart.find(item => item.id === product.id);
                const cartQuantity = cartItem ? cartItem.quantity : 0;

                return (
                  <div key={product.id} className="bg-gray-50 p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col">
                    <div className="w-full h-24 bg-havelock-blue-200 rounded-lg mb-3 flex items-center justify-center">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <Package size={48} className="text-white" />
                      )}
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                    <p className="text-gray-500 text-xs mb-3">${product.precio_venta.toFixed(2)}</p>
                    <div className="mt-auto">
                      <div className="flex items-center justify-center space-x-2">
                        <button onClick={() => decrementQuantity(product)} className="bg-havelock-blue-400 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-havelock-blue-500 transition-colors">
                          <Minus size={16} />
                        </button>
                        <input
                          type="text"
                          value={cartQuantity}
                          onChange={(e) => handleQuantityChange(product, e.target.value)}
                          className="w-10 text-center bg-transparent font-semibold text-gray-700"
                        />
                        <button onClick={() => incrementQuantity(product)} className="bg-havelock-blue-400 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-havelock-blue-500 transition-colors">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Cart */}
        <div className="bg-white p-8 rounded-3xl shadow-lg flex flex-col h-[86vh] transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Carrito de Compras</h2>
          <div className="flex-grow overflow-y-auto mb-6 pr-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingCart size={48} className="mb-4" />
                <p>El carrito está vacío</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-semibold text-sm">{item.name}</h4>
                    <p className="text-xs text-gray-500">${item.price.toFixed(2)} x {item.quantity}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="mt-auto">
            {/* Subtotal e IVA comentados - se mantienen en cálculos para uso futuro */}
            {/* <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">IVA (16%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="border-t my-4"></div> */}
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button onClick={handleProcessSale} className="w-full bg-havelock-blue-400 text-white py-3 rounded-full mt-6 hover:bg-havelock-blue-500 transition-colors text-lg font-semibold">
              Procesar Venta
            </button>
          </div>
        </div>
      </div>
      <SaleSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        saleData={saleData}
        onPrintTicket={handlePrintTicket}
      />
      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        message={errorMessage}
      />
      {/* Modal de carrito vacío */}
      <ErrorModal
        isOpen={isEmptyCartModalOpen}
        onClose={() => setIsEmptyCartModalOpen(false)}
        message="El carrito está vacío. Agrega productos antes de procesar la venta."
      />
    </div>
  );
}

export default Sales;