import React, { useState, useEffect } from 'react';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import Modal from '../../modals/Modal';

const DollarDisplay = () => {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

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
      return <p className="text-[36px] font-semibold text-white text-right">Cargando...</p>;
    }
    if (error) {
      return <p className="text-[28px] font-semibold text-red-300 text-right">Error</p>;
    }
    return (
      <p className="text-[28px] font-semibold text-white text-right">
        {price ? `USD 1 / Bs. ${Number(price).toFixed(2)}` : 'N/A'}
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
        {renderContent()}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Historial de Precios del Dólar"
        size="lg"
      >
        <div className="overflow-hidden">
          {history.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No hay historial disponible
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tasa de Cambio
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((entry, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        Bs. {entry.rate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mt-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm text-center">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-50 text-yellow-700 text-sm text-center">
            ℹ {error}
          </div>
        )}

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-havelock-blue-500 text-white px-5 py-2.5 rounded-lg hover:bg-havelock-blue-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Refrescar Tasa'}
          </button>

          <button
            onClick={() => setIsModalOpen(false)}
            className="bg-gray-200 text-gray-800 px-5 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </Modal>
    </>
  );
};

export default DollarDisplay;
