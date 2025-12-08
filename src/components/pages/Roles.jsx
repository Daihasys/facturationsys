import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import RoleModal from "../modals/RoleModal";
import DeleteRoleModal from "../modals/DeleteRoleModal";
import SuccessModal from "../modals/SuccessModal";
import ErrorModal from "../modals/ErrorModal";
import {
  Plus,
  Edit,
  Trash2,
  ShieldCheck,
  Loader2,
  Search,
  Lock,
} from "lucide-react";
import RolePermissionsModal from "../modals/RolePermissionsModal";

const Roles = () => {
  const { token, hasPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState(null);

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [roleToManagePermissions, setRoleToManagePermissions] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (hasPermission("roles:read")) {
      fetchRoles();
    } else {
      setLoading(false);
      setError("No tienes permiso para ver los roles.");
    }
  }, [hasPermission]);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:4000/api/roles", {
        headers: {
          "x-auth-token": token,
        },
      });
      if (!response.ok) throw new Error("Error al cargar los roles.");
      const data = await response.json();
      setRoles(data);
    } catch (err) {
      console.error("Error fetching roles:", err);
      setError("Error al cargar los roles.");
      setErrorMessage(
        "Error al cargar los roles. Por favor, inténtalo de nuevo más tarde.",
      );
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = () => {
    setEditingRole(null);
    setIsRoleModalOpen(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (formData) => {
    try {
      const url = editingRole
        ? `http://localhost:4000/api/roles/${editingRole.id}`
        : "http://localhost:4000/api/roles";
      const method = editingRole ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error al guardar el rol.");
      }

      setSuccessMessage(
        editingRole
          ? "Rol actualizado exitosamente."
          : "Rol agregado exitosamente.",
      );
      setIsSuccessModalOpen(true);
      fetchRoles();
    } catch (err) {
      console.error("Error saving role:", err);
      setErrorMessage(err.message);
      setIsErrorModalOpen(true);
    } finally {
      setIsRoleModalOpen(false);
    }
  };

  const handleDeleteRole = (role) => {
    setDeletingRole(role);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteRole = async (roleId) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/roles/${roleId}`,
        {
          method: "DELETE",
          headers: {
            "x-auth-token": token,
          },
        },
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error al eliminar el rol.");
      }

      setSuccessMessage("Rol eliminado exitosamente.");
      setIsSuccessModalOpen(true);
      fetchRoles();
    } catch (err) {
      console.error("Error deleting role:", err);
      setErrorMessage(err.message);
      setIsErrorModalOpen(true);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleManagePermissions = (role) => {
    setRoleToManagePermissions(role);
    setIsPermissionsModalOpen(true);
  };

  if (!hasPermission("roles:read")) {
    return (
      <div className="p-4 sm:p-6 bg-havelock-blue-50 min-h-screen flex justify-center items-center">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center">
          <Lock size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Acceso Denegado
          </h1>
          <p className="text-gray-600">
            No tienes permiso para ver esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-havelock-blue-50 min-h-screen">
      <h1 className="text-5xl font-bold text-gray-800 mb-8 ml-4">
        Módulo de Roles
      </h1>
      <div className="bg-white p-4 sm:p-8 rounded-xl shadow-xl transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h2 className="text-3xl font-bold text-havelock-blue-400 mb-4 sm:mb-0">
            Gestión de Roles
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-havelock-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Buscar roles..."
                className="p-2 pl-10 border border-havelock-blue-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-havelock-blue-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {hasPermission("roles:create") && (
              <button
                onClick={handleAddRole}
                className="bg-havelock-blue-300 text-white px-4 py-2 rounded-full hover:bg-havelock-blue-400 focus:outline-none focus:ring-2 focus:ring-havelock-blue-200 focus:ring-opacity-50 w-full sm:w-auto flex items-center justify-center"
              >
                <Plus size={20} className="mr-2" />
                Agregar Rol
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2
              size={48}
              className="animate-spin text-havelock-blue-500"
            />
            <p className="ml-4 text-lg text-gray-600">Cargando roles...</p>
          </div>
        )}

        {error && !isErrorModalOpen && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 shadow-sm"
            role="alert"
          >
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {!loading &&
          !error &&
          roles.filter((role) =>
            role.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
          ).length === 0 && (
            <div className="py-6 text-center text-gray-500 text-lg">
              {searchTerm
                ? `No se encontraron roles para "${searchTerm}".`
                : "No hay roles registrados."}
            </div>
          )}

        {!loading &&
          roles.filter((role) =>
            role.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
          ).length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-havelock-blue-200">
                <thead>
                  <tr>
                    <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider rounded-tl-lg">
                      ID
                    </th>
                    <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">
                      Nombre del Rol
                    </th>
                    <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-center text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider rounded-tr-lg">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roles
                    .filter((role) =>
                      role.nombre
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()),
                    )
                    .map((role) => (
                      <tr
                        key={role.id}
                        className="hover:bg-havelock-blue-50 transition-colors duration-200"
                      >
                        <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700">
                          {role.id}
                        </td>
                        <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700 font-medium">
                          {role.nombre}
                        </td>
                        <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-center">
                          <div className="flex items-center justify-center space-x-4">
                            {hasPermission("roles:update") && (
                              <button
                                onClick={() => handleEditRole(role)}
                                className="text-havelock-blue-400 hover:text-havelock-blue-500 transition-colors"
                                title="Editar Rol"
                              >
                                <Edit size={20} />
                              </button>
                            )}
                            {hasPermission("roles:delete") && (
                              <button
                                onClick={() => handleDeleteRole(role)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                title="Eliminar Rol"
                              >
                                <Trash2 size={20} />
                              </button>
                            )}
                            {hasPermission("roles:update") && (
                              <button
                                onClick={() => handleManagePermissions(role)}
                                className="text-green-500 hover:text-green-700 transition-colors"
                                title="Gestionar Permisos"
                              >
                                <ShieldCheck size={20} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {isRoleModalOpen && hasPermission("roles:create") && (
        <RoleModal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          onSave={handleSaveRole}
          role={editingRole}
        />
      )}

      {isDeleteModalOpen && hasPermission("roles:delete") && (
        <DeleteRoleModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={() => confirmDeleteRole(deletingRole.id)}
          role={deletingRole}
        />
      )}

      {isPermissionsModalOpen && hasPermission("roles:update") && (
        <RolePermissionsModal
          isOpen={isPermissionsModalOpen}
          onClose={() => setIsPermissionsModalOpen(false)}
          role={roleToManagePermissions}
        />
      )}

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
    </div>
  );
};

export default Roles;
