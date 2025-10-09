import { MoreVertical, ChevronLast, ChevronFirst, Package, ShoppingCart, LayoutDashboard } from "lucide-react"
import React, { useContext, createContext, useState } from "react"
import { NavLink } from "react-router-dom"
import boxIcon from "../assets/box.svg"
import userIcon from "../assets/user.svg"


// Contexto compartido para saber si la barra lateral está expandida
export const SidebarContext = createContext()

export default function Sidebar({ children }) {
  // Estado local para controlar si la barra lateral está abierta o colapsada
  const [expanded, setExpanded] = useState(true)
  
  return (
    <aside className={`h-screen sticky top-0 z-10 ${expanded ? "w-64" : "w-20"}`}>
      <nav className="h-full flex flex-col bg-havelock-blue-80 rounded-r-[35px] shadow-[4px_0px_5px_0px_rgba(0,_0,_0,_0.1)]">
        <div className="py-2 pl-2 pr-[18px] flex justify-end items-center">
          {/* Botón para expandir o contraer la barra lateral */}
          <button
            onClick={() => setExpanded((curr) => !curr)}
            className="p-1.5 rounded-lg bg-havelock-blue-80 hover:bg-havelock-blue-200"
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

        <div className="border-t flex p-3">
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
            <div className="leading-4">
              <h4 className="font-semibold">John Doe</h4>
              <span className="text-xs text-gray-600">johndoe@gmail.com</span>
            </div>
            <MoreVertical size={20} />
          </div>
        </div>
      </nav>
    </aside>
  )
}

export function SidebarItem({ icon, text, active, alert, onClick, to }) {
  // Consumimos el contexto para saber si debemos mostrar texto o solo íconos
  const { expanded } = useContext(SidebarContext)
  
  return (
    <li className="relative">
      <NavLink
        to={to}
        onClick={onClick}
        className={`
          relative flex items-center py-2 px-3 my-1
          font-medium rounded-md cursor-pointer
          transition-colors group
          ${
            active
              ? "bg-havelock-blue-200 text-white"
              : "hover:bg-havelock-blue-50 text-havelock-blue-500"
          }
      `}
      >
        {/* Icono principal de la opción del menú */}
        {icon}
        <span
          className={`overflow-hidden transition-all ${
            expanded ? "w-52 ml-3" : "w-0"
          }`}
        >
          {/* Texto de la opción, se oculta cuando la barra está colapsada */}
          {text}
        </span>
        {alert && (
          <div
            className={`absolute right-2 w-2 h-2 rounded bg-havelock-blue-400 ${
              expanded ? "" : "top-2"
            }`}
          />
        )}

        {!expanded && (
          <div
            className={`
            absolute left-full rounded-md px-2 py-1 ml-6
            bg-havelock-blue-100 text-havelock-blue-500 text-sm
            invisible opacity-20 -translate-x-3 transition-all
            group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
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
