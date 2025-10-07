import React, { useState } from 'react';
import { Search, PlusCircle, Trash2, ShoppingCart, Plus, Minus } from 'lucide-react';

// Mock Data
const productsData = [
  { id: 1, name: 'Mouse', price: 25.00, stock: 150 },
  { id: 2, name: 'Teclado', price: 45.00, stock: 100 },
  { id: 3, name: 'Monitor', price: 250.00, stock: 50 },
  { id: 4, name: 'Laptop', price: 1200.00, stock: 25 },
  { id: 5, name: 'Webcam', price: 50.00, stock: 75 },
  { id: 6, name: 'Auriculares', price: 75.00, stock: 80 },
  { id: 7, name: 'Impresora', price: 150.00, stock: 30 },
  { id: 8, name: 'Hub USB', price: 20.00, stock: 200 },
];

function Sales() {
  const [cart, setCart] = useState([]);
  const [quantities, setQuantities] = useState({});

  const handleQuantityChange = (productId, quantity) => {
    setQuantities(prev => ({ ...prev, [productId]: quantity }));
  };

  const incrementQuantity = (productId) => {
    setQuantities(prev => ({ ...prev, [productId]: (prev[productId] || 1) + 1 }));
  };

  const decrementQuantity = (productId) => {
    setQuantities(prev => ({ ...prev, [productId]: Math.max(1, (prev[productId] || 1) - 1) }));
  };

  const addToCart = (product) => {
    const quantity = quantities[product.id] || 1;
    // Check if item is already in cart
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity }]);
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-5xl font-bold text-gray-800 mb-8 ml-4">Modulo de Ventas</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Product List */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-lg flex flex-col h-[86vh] transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-havelock-blue-400" />
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              className="pl-12 pr-4 py-3 border border-havelock-blue-200 rounded-full w-full focus:outline-none focus:ring-2 focus:ring-havelock-blue-400"
            />
          </div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Productos Disponibles</h2>
          </div>
          <div className="flex-grow overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productsData.map((product) => (
                <div key={product.id} className="bg-gray-50 p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col">
                  <div className="w-full h-24 bg-havelock-blue-100 rounded-lg mb-3"></div>
                  <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                  <p className="text-gray-500 text-xs mb-3">${product.price.toFixed(2)}</p>
                  <div className="mt-auto">
                    <div className="flex items-center justify-center space-x-2">
                      <button onClick={() => decrementQuantity(product.id)} className="bg-havelock-blue-400 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-havelock-blue-500 transition-colors">
                        <Minus size={16} />
                      </button>
                      <input 
                        type="text" 
                        value={quantities[product.id] || 1} 
                        onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value, 10) || 1)}
                        className="w-10 text-center bg-transparent font-semibold text-gray-700" 
                      />
                      <button onClick={() => incrementQuantity(product.id)} className="bg-havelock-blue-400 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-havelock-blue-500 transition-colors">
                        <Plus size={16} />
                      </button>
                    </div>
                    <button className="w-full bg-havelock-blue-300 text-white py-2 rounded-full mt-3 hover:bg-havelock-blue-400 transition-colors text-sm" onClick={() => addToCart(product)}>
                      Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Cart */}
        <div className="bg-white p-8 rounded-3xl shadow-lg flex flex-col h-[86vh] transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Carrito de Compras</h2>
          <div className="flex-grow overflow-y-auto mb-6 pr-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingCart size={48} className="mb-4"/>
                <p>El carrito está vacío</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-semibold text-sm">{item.name}</h4>
                    <p className="text-xs text-gray-500">${item.price.toFixed(2)} x {item.quantity}</p>
                  </div>
                  <button className="text-red-500 hover:text-red-700 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="mt-auto">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">IVA (16%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="border-t my-4"></div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button className="w-full bg-havelock-blue-400 text-white py-3 rounded-full mt-6 hover:bg-havelock-blue-500 transition-colors text-lg font-semibold">
              Procesar Venta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sales;
