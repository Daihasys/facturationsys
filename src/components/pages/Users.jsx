import React, { useState, useEffect } from "react";
import { Edit, Trash2, Search, UserPlus, Lock } from "lucide-react";
import UserModal from "../modals/UserModal";
import DeleteUserModal from "../modals/DeleteUserModal";
import SuccessModal from "../modals/SuccessModal";
import { useAuth } from "../../context/AuthContext";

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { token, hasPermission } = useAuth();

  const getHeaders = () => ({
    "Content-Type": "application/json",
    "x-auth-token": token,
  });

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/users", {
        headers: getHeaders(),
      });
      if (!response.ok) {
        setUsers([]);
        throw new Error("No tienes permiso para ver los usuarios.");
      }
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al obtener los usuarios:", error);
      setUsers([]);
    }
  };

  useEffect(() => {
    if (hasPermission("users:read")) {
      fetchUsers();
    }
  }, [token]);

  const handleModalSave = async (userData) => {
    try {
      let response;
      let url = "http://localhost:4000/api/users";
      let method = "POST";

      if (selectedUser) {
        // Update existing user
        url = `http://localhost:4000/api/users/${selectedUser.id}`;
        method = "PUT";
      }

      response = await fetch(url, {
        method: method,
        headers: getHeaders(),
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Error al ${selectedUser ? "actualizar" : "crear"} el usuario`);
      }

      setSuccessMessage(result.message);
      setIsSuccessModalOpen(true);
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error en handleModalSave:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteUser = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al eliminar el usuario");
      }

      setSuccessMessage(result.message);
      setIsSuccessModalOpen(true);
      setIsDeleteModalOpen(false);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error en handleDeleteUser:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const openAddModal = () => {
    setSelectedUser(null); // Clear selected user for add operation
    setIsAddModalOpen(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cedula.includes(searchTerm) ||
      user.telefono.includes(searchTerm)
  );

  if (!hasPermission("users:read")) {
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
        Módulo de Usuarios
      </h1>
      <div className="bg-white p-4 sm:p-8 rounded-xl shadow-xl transition-all duration-300 hover:shadow-[0px_0px_18px_0px_#696969]">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h2 className="text-3xl font-bold text-havelock-blue-400 mb-4 sm:mb-0">
            Gestión de Usuarios
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-havelock-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Buscar por nombre, cédula o teléfono..."
                className="p-2 pl-10 border border-havelock-blue-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-havelock-blue-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {hasPermission("users:create") && (
              <button
                onClick={openAddModal}
                className="bg-havelock-blue-300 text-white px-4 py-2 rounded-full hover:bg-havelock-blue-400 focus:outline-none focus:ring-2 focus:ring-havelock-blue-200 focus:ring-opacity-50 w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <UserPlus size={20} />
                Añadir Usuario
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-havelock-blue-200">
            <thead>
              <tr>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider rounded-tl-lg">
                  Nombre
                </th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">
                  Nombre de Usuario
                </th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">
                  Cédula
                </th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-left text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider">
                  Rol
                </th>
                <th className="py-4 px-6 border-b-2 border-havelock-blue-200 bg-havelock-blue-50 text-center text-sm font-semibold text-havelock-blue-600 uppercase tracking-wider rounded-tr-lg">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-havelock-blue-50 transition-colors duration-200"
                >
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700 font-medium">
                    {user.nombre_completo}
                  </td>
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-500">
                    {user.nombre_usuario}
                  </td>
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-500">
                    {user.cedula}
                  </td>
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-500">
                    {user.telefono}
                  </td>
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-gray-700">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === "Administrador"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                        }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-6 border-b border-havelock-blue-100 text-sm text-center">
                    {hasPermission("users:update") && (
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-havelock-blue-400 hover:text-havelock-blue-500 mr-4 transition-colors"
                      >
                        <Edit size={20} />
                      </button>
                    )}
                    {hasPermission("users:delete") && (
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="py-6 text-center text-gray-500 text-lg"
                  >
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSave={(msg) => {
          setSuccessMessage(msg);
          setIsSuccessModalOpen(true);
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          fetchUsers();
        }}
        user={selectedUser}
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDeleteUser}
        user={selectedUser ? { ...selectedUser, nombre: selectedUser.nombre_completo } : null}
      />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        message={successMessage}
      />
    </div >
  );
};

export default Users;
