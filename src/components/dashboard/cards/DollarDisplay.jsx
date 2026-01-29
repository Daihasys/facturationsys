import React, { useState, useEffect } from 'react';
import { ArrowUpRight, RefreshCw, Search } from 'lucide-react';
import Modal from '../../modals/Modal';

const DollarDisplay = ({ compact = false }) => {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchDate, setSearchDate] = useState('');

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
          setPrice(data.promedio);
          await saveToHistory(data.promedio);
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
            setPrice(fallbackData.current.usd);
            await saveToHistory(fallbackData.current.usd);
          } else {
            throw new Error('Price not found in fallback API response');
          }
        } catch (fallbackError) {
          setError('No se pudo obtener la tasa de cambio.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDollarPrice();
    loadHistory();
  }, []);

  const saveToHistory = async (rate) => {
    try {
      const response = await fetch('http://localhost:4000/api/dollar-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rate: Number(rate) }),
      });

      if (response.ok) {
        const data = await response.json();
        // Reload history after saving
        await loadHistory();
        return {
          saved: true,
          isDuplicate: data.message.includes('mismo valor')
        };
      }
      return { saved: false };
    } catch (error) {
      console.error('Error saving to history:', error);
      return { saved: false, error };
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/dollar-history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
        return data;
      } else {
        setHistory([]);
        return [];
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
      return [];
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    setSuccessMessage(null);

    const primaryApiUrl = 'https://ve.dolarapi.com/v1/dolares/oficial';
    const fallbackApiUrl = 'https://api.dolarvzla.com/public/exchange-rate';

    try {
      const response = await fetch(primaryApiUrl);
      if (!response.ok) {
        throw new Error('Primary API failed');
      }
      const data = await response.json();
      if (data && data.promedio) {
        const newRate = data.promedio;
        setPrice(newRate);

        // Save to history
        const result = await saveToHistory(newRate);

        if (result.saved) {
          if (result.isDuplicate) {
            setSuccessMessage('La tasa no ha cambiado');
          } else {
            setSuccessMessage('Tasa actualizada exitosamente');
          }
          setTimeout(() => setSuccessMessage(null), 3000);
        }
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
          const newRate = fallbackData.current.usd;
          setPrice(newRate);

          // Save to history
          const result = await saveToHistory(newRate);

          if (result.saved) {
            if (result.isDuplicate) {
              setSuccessMessage('La tasa no ha cambiado');
            } else {
              setSuccessMessage('Tasa actualizada exitosamente');
            }
            setTimeout(() => setSuccessMessage(null), 3000);
          }
        } else {
          throw new Error('Price not found in fallback API response');
        }
      } catch (fallbackError) {
        setError('No se pudo obtener la tasa de cambio.');
      }
    } finally {
      setRefreshing(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <p className={`${compact ? 'text-sm' : 'text-[36px]'} font-semibold text-white text-right`}>Cargando...</p>;
    }
    if (error) {
      return <p className={`${compact ? 'text-sm' : 'text-[28px]'} font-semibold text-red-300 text-right`}>Error</p>;
    }
    return (
      <p className={`${compact ? 'text-lg' : 'text-[28px]'} font-semibold text-white text-right`}>
        {price ? `Bs. ${Number(price).toFixed(2)}` : 'N/A'}
      </p>
    );
  };

  const formatDate = (dateString) => {
    // Parsear la fecha como componentes locales para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(year, month - 1, day); // month es 0-indexed
    return date.toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Compact version for Sales page
  if (compact) {
    return (
      <>
        <div
          className="bg-havelock-blue-200 rounded-xl shadow p-3 flex justify-between items-center transition-all duration-300 hover:shadow-lg cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <span className="text-sm font-medium text-white">USD 1 =</span>
          {renderContent()}
          <ArrowUpRight size={16} className="text-white opacity-70" />
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSearchDate(''); }}
          title="Historial de Precios del Dólar"
        >
          {/* Date Filter */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-havelock-blue-200"
                placeholder="Buscar por fecha..."
              />
            </div>
            {searchDate && (
              <button
                onClick={() => setSearchDate('')}
                className="text-xs text-havelock-blue-500 mt-1 hover:underline"
              >
                Limpiar filtro
              </button>
            )}
          </div>

          {/* History Table */}
          <div className="max-h-[240px] overflow-y-auto border rounded-lg">
            {history.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No hay historial disponible
              </p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Tasa
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history
                    .filter(entry => !searchDate || entry.date.includes(searchDate))
                    .map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">
                          Bs. {entry.rate}
                        </td>
                      </tr>
                    ))}
                  {history.filter(entry => !searchDate || entry.date.includes(searchDate)).length === 0 && (
                    <tr>
                      <td colSpan="2" className="px-4 py-4 text-center text-gray-500 text-sm">
                        No hay registros para esta fecha
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Messages */}
          {successMessage && (
            <div className="mt-3 p-2 rounded-lg bg-green-50 text-green-700 text-xs text-center">
              {successMessage}
            </div>
          )}

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-havelock-blue-500 text-white px-4 py-2 rounded-lg hover:bg-havelock-blue-600 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualizando...' : 'Refrescar'}
            </button>

            <button
              onClick={() => { setIsModalOpen(false); setSearchDate(''); }}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      </>
    );
  }

  // Regular (non-compact) version for Dashboard
  return (
    <>
      <div
        className="min-h-[174px] bg-havelock-blue-200 rounded-[26px] shadow p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969] cursor-pointer relative"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex justify-between items-start">
          <h4 className="text-[20px] font-semibold text-white">Precio dolar del día</h4>
          <ArrowUpRight
            size={24}
            className="text-white opacity-70 hover:opacity-100 transition-opacity"
          />
        </div>
        <p className="text-[28px] font-semibold text-white text-right">
          {loading ? 'Cargando...' : error ? 'Error' : price ? `USD 1 / Bs. ${Number(price).toFixed(2)}` : 'N/A'}
        </p>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSearchDate(''); }}
        title="Historial de Precios del Dólar"
      >
        {/* Date Filter */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-havelock-blue-200"
              placeholder="Buscar por fecha..."
            />
          </div>
          {searchDate && (
            <button
              onClick={() => setSearchDate('')}
              className="text-xs text-havelock-blue-500 mt-1 hover:underline"
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {/* History Table */}
        <div className="max-h-[240px] overflow-y-auto border rounded-lg">
          {history.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No hay historial disponible
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Tasa
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history
                  .filter(entry => !searchDate || entry.date.includes(searchDate))
                  .map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">
                        Bs. {entry.rate}
                      </td>
                    </tr>
                  ))}
                {history.filter(entry => !searchDate || entry.date.includes(searchDate)).length === 0 && (
                  <tr>
                    <td colSpan="2" className="px-4 py-4 text-center text-gray-500 text-sm">
                      No hay registros para esta fecha
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mt-3 p-2 rounded-lg bg-green-50 text-green-700 text-xs text-center">
            {successMessage}
          </div>
        )}

        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-havelock-blue-500 text-white px-4 py-2 rounded-lg hover:bg-havelock-blue-600 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Refrescar'}
          </button>

          <button
            onClick={() => { setIsModalOpen(false); setSearchDate(''); }}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Cerrar
          </button>
        </div>
      </Modal>
    </>
  );
};

export default DollarDisplay;
