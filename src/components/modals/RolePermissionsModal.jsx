import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Modal from "./Modal";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";

const RolePermissionsModal = ({ isOpen, onClose, role }) => {
  const { token } = useAuth();
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen && role) {
      setLoading(true);
      setError(null);

      const fetchPermissions = async () => {
        try {
          const headers = { "x-auth-token": token };
          const [allPermsResponse, rolePermsResponse] = await Promise.all([
            fetch("http://localhost:4000/api/permissions", { headers }),
            fetch(`http://localhost:4000/api/roles/${role.id}/permissions`, {
              headers,
            }),
          ]);

          if (!allPermsResponse.ok || !rolePermsResponse.ok) {
            throw new Error("Error al cargar los permisos.");
          }

          const allPermsData = await allPermsResponse.json();
          const rolePermsData = await rolePermsResponse.json();

          setAllPermissions(allPermsData);
          const currentPermIds = new Set(rolePermsData.map((p) => p.id));
          setSelectedPermissionIds(currentPermIds);
        } catch (err) {
          console.error("Error fetching permissions:", err);
          setError("Error al cargar los permisos.");
          setErrorMessage(
            "Error al cargar los permisos. Por favor, inténtalo de nuevo.",
          );
          setIsErrorModalOpen(true);
        } finally {
          setLoading(false);
        }
      };

      fetchPermissions();
    }
  }, [isOpen, role, token]);

  const handlePermissionChange = (permissionId) => {
    setSelectedPermissionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const handleSavePermissions = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/roles/${role.id}/permissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({
            permissionIds: Array.from(selectedPermissionIds),
          }),
        },
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.error || "Error al guardar los permisos del rol.",
        );
      }

      setSuccessMessage("Permisos del rol actualizados exitosamente.");
      setIsSuccessModalOpen(true);
      onClose();
    } catch (err) {
      console.error("Error saving role permissions:", err);
      setErrorMessage(err.message);
      setIsErrorModalOpen(true);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Gestionar Permisos para "{role?.nombre}"
      </h2>
      {loading && (
        <p className="text-center text-gray-600">Cargando permisos...</p>
      )}
      {error && !isErrorModalOpen && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="max-h-[60vh] overflow-y-auto mb-6 p-4 border rounded-md bg-gray-50">
          {allPermissions.length === 0 ? (
            <p className="text-gray-600 text-center">
              No hay permisos disponibles.
            </p>
          ) : (
            Object.entries(
              allPermissions.reduce((acc, permission) => {
                const category = permission.name.split(":")[0];
                if (!acc[category]) acc[category] = [];
                acc[category].push(permission);
                return acc;
              }, {})
            ).map(([category, permissions]) => {
              const categoryNames = {
                users: "Usuarios",
                roles: "Roles",
                products: "Productos",
                categories: "Categorías",
                sales: "Ventas",
                reports: "Reportes",
                backups: "Respaldos",
              };
              const categoryLabel = categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);

              const allSelected = permissions.every(p => selectedPermissionIds.has(p.id));

              const handleToggleGroup = () => {
                setSelectedPermissionIds(prev => {
                  const newSet = new Set(prev);
                  if (allSelected) {
                    permissions.forEach(p => newSet.delete(p.id));
                  } else {
                    permissions.forEach(p => newSet.add(p.id));
                  }
                  return newSet;
                });
              };

              return (
                <div key={category} className="mb-6 last:mb-0">
                  <div className="flex items-center justify-between mb-3 border-b pb-1 border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {categoryLabel}
                    </h3>
                    <button
                      type="button"
                      onClick={handleToggleGroup}
                      className="text-sm text-havelock-blue-600 hover:text-havelock-blue-800 font-medium focus:outline-none"
                    >
                      {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className={`flex items-start p-3 rounded-lg border transition-colors cursor-pointer hover:bg-white ${selectedPermissionIds.has(permission.id)
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50 border-gray-200"
                          }`}
                        onClick={() => handlePermissionChange(permission.id)}
                      >
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            id={`perm-${permission.id}`}
                            checked={selectedPermissionIds.has(permission.id)}
                            onChange={() => handlePermissionChange(permission.id)}
                            className="h-4 w-4 text-havelock-blue-600 border-gray-300 rounded focus:ring-havelock-blue-500 cursor-pointer"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor={`perm-${permission.id}`}
                            className={`font-medium cursor-pointer ${selectedPermissionIds.has(permission.id)
                              ? "text-blue-700"
                              : "text-gray-700"
                              }`}
                          >
                            {permission.description}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSavePermissions}
          className="px-4 py-2 rounded-md bg-havelock-blue-400 text-white hover:bg-havelock-blue-500 transition-colors font-semibold"
          disabled={loading}
        >
          Guardar Permisos
        </button>
      </div>

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        message={successMessage}
      />

      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        message={errorMessage}
      />
    </Modal>
  );
};

export default RolePermissionsModal;
