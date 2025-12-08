import React, { useState, useContext } from 'react';
import { ChevronDown } from 'lucide-react';
import { SidebarContext } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export function SidebarDropdown({ icon, text, children, active, requiredPermissions }) {
  const { expanded } = useContext(SidebarContext);
  const [isOpen, setIsOpen] = useState(active);
  const { hasPermission } = useAuth();

  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requiredPermissions.some(permission => hasPermission(permission));
    if (!hasAccess) {
      return null;
    }
  }

  return (
    <li className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative flex items-center py-2 my-1
          font-medium rounded-md cursor-pointer
          transition-colors group
          ${active ? "bg-havelock-blue-500 text-white shadow-md" : "hover:bg-havelock-blue-300 text-havelock-blue-50 hover:text-white"}
          ${expanded ? "px-3" : "justify-center"}
        `}
      >
        {icon}
        <span className={`overflow-hidden transition-all ${expanded ? "w-48 ml-3" : "w-0"}`}>
          {text}
        </span>
        {expanded && (
          <ChevronDown
            size={20}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        )}
      </div>

      {isOpen && expanded && (
        <ul className="pl-7 pr-3 pb-2">
          {children}
        </ul>
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
          {text}
        </div>
      )}
    </li>
  );
}
