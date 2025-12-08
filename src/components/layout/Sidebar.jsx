import { MoreVertical, ChevronLast, ChevronFirst, LogOut, Settings, MessageSquareWarning } from "lucide-react"
import React, { useContext, createContext, useState, useEffect, useRef } from "react"
import { NavLink } from "react-router-dom"
import boxIcon from '../../assets/box-light.svg'
import userIcon from '../../assets/user-light.svg'
import { useAuth } from '../../context/AuthContext';
import ErrorReportModal from '../modals/ErrorReportModal';
import SuccessModal from '../modals/SuccessModal';


// Contexto compartido para saber si la barra lateral está expandida
export const SidebarContext = createContext()

export default function Sidebar({ children }) {
  // Estado local para controlar si la barra lateral está abierta o colapsada
  const [expanded, setExpanded] = useState(true)
  const { user, logout } = useAuth(); // Destructure logout
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isErrorReportModalOpen, setIsErrorReportModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const openErrorReportModal = () => {
    setIsDropdownOpen(false);
    setIsErrorReportModalOpen(true);
  };

  const handleErrorReportSuccess = (message) => {
    setSuccessMessage(message);
    setIsSuccessModalOpen(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <aside className={`h-screen sticky top-0 z-10 transition-all duration-300 ease-in-out ${expanded ? "w-64" : "w-20"}`}>
        <nav className="h-full flex flex-col bg-havelock-blue-400 rounded-r-[35px] shadow-[4px_0px_5px_0px_rgba(0,_0,_0,_0.1)] text-white">
          <div className="py-2 pl-2 pr-[18px] flex justify-end items-center">
            {/* Botón para expandir o contraer la barra lateral */}
            <button
              onClick={() => setExpanded((curr) => !curr)}
              className="p-1.5 rounded-lg bg-havelock-blue-300 hover:bg-havelock-blue-200 text-white"
            >
              {expanded ? <ChevronFirst /> : <ChevronLast />}
            </button>
          </div>

          <div className="flex justify-center py-3">
            <img src={boxIcon} alt="Box Icon" className={`transition-all ${expanded ? 'w-[66px] h-[66px]' : 'w-11 h-11'}`} />
          </div>

          {/* Proveedor del contexto que comparte el estado `expanded` con los elementos hijos */}
          <SidebarContext.Provider value={{ expanded }}>
            <ul className="flex-1 px-3">{children}</ul>
          </SidebarContext.Provider>

          <div className="border-t border-havelock-blue-300 flex p-3 relative" ref={dropdownRef}>
            {/* Información del usuario que se muestra al pie de la barra */}
            <img
              src={userIcon}
              alt=""
              className="w-10 h-10 rounded-md"
            />
            <div
              className={`
              flex justify-between items-center
              overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"}
          `}
            >
              <div className="leading-4 text-white">
                <h4 className="font-semibold">{user?.name || "Guest"}</h4>
                <span className="text-xs text-havelock-blue-100">{user?.role || "No Role"}</span>
              </div>
              <button onClick={toggleDropdown} className="p-1.5 rounded-lg hover:bg-havelock-blue-300 text-havelock-blue-100 hover:text-white">
                <MoreVertical size={20} />
              </button>
            </div>
            {isDropdownOpen && (
              <div className="absolute bottom-full mb-2 w-48 bg-white rounded-md shadow-lg z-20 text-gray-800">
                <ul className="py-1">
                  <li>
                    <NavLink
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Settings size={16} className="mr-2" />
                      Configuraciones
                    </NavLink>
                  </li>
                  <li>
                    <button
                      onClick={openErrorReportModal}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <MessageSquareWarning size={16} className="mr-2" />
                      Reportar Error
                    </button>
                  </li>
                  <li className="border-t border-gray-100">
                    <button
                      onClick={() => {
                        logout();
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut size={16} className="mr-2" />
                      Cerrar Sesión
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Error Report Modal */}
      <ErrorReportModal
        isOpen={isErrorReportModalOpen}
        onClose={() => setIsErrorReportModalOpen(false)}
        userId={user?.userId}
        onSuccess={handleErrorReportSuccess}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        message={successMessage}
      />
    </>
  )
}

export function SidebarItem({ icon, text, active, alert, onClick, to, requiredPermission }) {
  // Consumimos el contexto para saber si debemos mostrar texto o solo íconos
  const { expanded } = useContext(SidebarContext)
  const { hasPermission } = useAuth(); // Use the useAuth hook

  // If a requiredPermission is specified and the user doesn't have it, don't render the item
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  return (
    <li className="relative">
      <NavLink
        to={to}
        onClick={onClick}
        className={`
          relative flex items-center py-2 my-1
          font-medium rounded-md cursor-pointer
          transition-colors group
          ${active
            ? "bg-havelock-blue-500 text-white shadow-md"
            : "hover:bg-havelock-blue-300 text-havelock-blue-50 hover:text-white"
          }
          ${expanded ? "px-3" : "justify-center"}
      `}
      >
        {/* Icono principal de la opción del menú */}
        {icon}
        <span
          className={`overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"
            }`}
        >
          {/* Texto de la opción, se oculta cuando la barra está colapsada */}
          {text}
        </span>
        {alert && (
          <div
            className={`absolute right-2 w-2 h-2 rounded bg-red-400 ${expanded ? "" : "top-2"
              }`}
          />
        )}

        {!expanded && (
          <div
            className={`
            absolute left-full rounded-md px-2 py-1 ml-6
            bg-havelock-blue-500 text-white text-sm
            invisible opacity-20 -translate-x-3 transition-all
            group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
            z-20 whitespace-nowrap
        `}
          >
            {/* Tooltip con el texto que aparece cuando la barra está colapsada */}
            {text}
          </div>
        )}
      </NavLink>
    </li>
  )
}
