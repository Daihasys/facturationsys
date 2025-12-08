// src/components/ProductTicket.jsx
import React from 'react';
import { formatPrice, formatCurrency } from '../../utils/formatters';

const ProductTicket = ({ product, currencySymbol = '$' }) => {
  const isOffer = product.originalPrice && product.originalPrice > product.price;
  const [whole, fraction] = formatPrice(product.price);

  return (
    <div className="relative flex flex-col w-full h-full bg-white border-2 border-dashed border-gray-400 break-inside-avoid overflow-hidden">

      {/* Cut corner marks */}
      <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-black"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-black"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-black"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-black"></div>

      {/* Header: Product Name */}
      <div className="h-[30%] flex items-center justify-center px-2 py-1.5 border-b-2 border-black">
        <h2 className="text-xs font-black text-black uppercase leading-tight text-center line-clamp-3">
          {product.name}
        </h2>
      </div>

      {/* Main: Price Display */}
      <div className="h-[70%] flex flex-col justify-start items-center px-2 pt-2 pb-1 relative">

        {/* Original Price + Offer Badge (same line if offer) */}
        {isOffer && (
          <div className="mb-0.5 flex items-center justify-center gap-2 w-full">
            <span className="text-[10px] font-semibold text-gray-600">
              Antes: {formatCurrency(product.originalPrice, currencySymbol)}
            </span>
            <span className="text-black font-black text-[9px] tracking-wider uppercase">
              ¡OFERTA!
            </span>
          </div>
        )}

        {/* Main Price */}
        <div className="flex items-start justify-center leading-none text-black">
          <span className="text-lg font-black mt-0.5 mr-0.5">{currencySymbol}</span>
          <span className={`${whole.length > 4 ? 'text-3xl' : whole.length > 3 ? 'text-4xl' : 'text-5xl'} font-black tracking-tighter leading-none`}>
            {whole}
          </span>
          <div className="flex flex-col justify-start mt-0.5">
            <span className="text-lg font-black leading-none ml-0.5">{fraction}</span>
          </div>
        </div>

        {/* Category - Bottom */}
        {!isOffer && (
          <div className="mt-2">
            <span className="text-black font-bold text-[9px] tracking-wide uppercase">
              {product.category || 'PRECIO REGULAR'}
            </span>
          </div>
        )}
      </div>

    </div>
  );
};

export default ProductTicket;
