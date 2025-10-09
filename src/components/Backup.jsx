import React, { useState, useEffect } from 'react';
import { DatabaseBackup, History } from 'lucide-react';
import SuccessModal from './modals/SuccessModal';
import RestoreBackupModal from './modals/RestoreBackupModal';

const Backup = () => {
  const [backups, setBackups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState(null);

  const fetchBackups = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:4000/api/backups');
      if (!response.ok) {
        throw new Error('No se pudieron obtener los backups.');
      }
      const data = await response.json();
      setBackups(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/backups/create', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el backup.');
      }
      setSuccessMessage(result.message);
      setIsSuccessModalOpen(true);
      fetchBackups(); // Refresh the list
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const openRestoreModal = (filename) => {
    setBackupToRestore(filename);
    setIsRestoreModalOpen(true);
  };

  const confirmRestore = async () => {
    if (!backupToRestore) return;

    try {
      const response = await fetch('http://localhost:4000/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: backupToRestore }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Error al restaurar el backup.');
      }
      setIsRestoreModalOpen(false);
      setSuccessMessage(result.message);
      setIsSuccessModalOpen(true);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 sm:p-6 bg-havelock-blue-50 min-h-screen">
      <h1 className="text-5xl font-bold text-gray-800 mb-8 ml-4">Módulo de Backups</h1>
      <div className="bg-white p-4 sm:p-8 rounded-xl shadow-xl transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h2 className="text-3xl font-bold text-havelock-blue-400 mb-4 sm:mb-0">Gestión de Copias de Seguridad</h2>
          <button
            onClick={handleCreateBackup}
            className="bg-havelock-blue-300 text-white px-6 py-3 rounded-full hover:bg-havelock-blue-400 focus:outline-none focus:ring-2 focus:ring-havelock-blue-200 focus:ring-opacity-50 flex items-center justify-center gap-2 transition-transform transform hover:scale-105"
          >
            <DatabaseBackup size={20} />
            Crear Backup Manual
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-havelock-blue-200">
            <thead>
              <tr>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider rounded-tl-lg">Fecha de Creación</th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">Nombre del Archivo</th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">Tamaño</th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-center text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider rounded-tr-lg">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="4" className="py-6 text-center text-gray-500">Cargando backups...</td></tr>
              ) : error ? (
                <tr><td colSpan="4" className="py-6 text-center text-red-500">{error}</td></tr>
              ) : backups.length > 0 ? (
                backups.map(backup => (
                  <tr key={backup.filename} className="hover:bg-havelock-blue-50 transition-colors duration-200">
                    <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700 font-medium">{new Date(backup.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-500">{backup.filename}</td>
                    <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700">{formatFileSize(backup.size)}</td>
                    <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-center">
                      <button 
                        onClick={() => openRestoreModal(backup.filename)}
                        className="bg-amber-400 hover:bg-amber-500 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2 mx-auto transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      >
                        <History size={18} />
                        Restaurar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="py-6 text-center text-gray-500">No se encontraron copias de seguridad.</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      <SuccessModal 
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        message={successMessage}
      />

      <RestoreBackupModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onConfirm={confirmRestore}
        filename={backupToRestore}
      />
    </div>
  );
};

export default Backup;
