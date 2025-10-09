import React, { useState, useContext } from 'react';
import { ChevronDown } from 'lucide-react';
import { SidebarContext } from './Sidebar'; // Assuming Sidebar.jsx exports this context

export function SidebarDropdown({ icon, text, children, active }) {
  const { expanded } = useContext(SidebarContext);
  const [isOpen, setIsOpen] = useState(active);

  return (
    <li className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative flex items-center py-2 px-3 my-1
          font-medium rounded-md cursor-pointer
          transition-colors group
          ${active ? "bg-havelock-blue-200 text-white" : "hover:bg-havelock-blue-50 text-havelock-blue-500"}
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
            bg-havelock-blue-100 text-havelock-blue-500 text-sm
            invisible opacity-20 -translate-x-3 transition-all
            group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
        `}
        >
          {text}
        </div>
      )}
    </li>
  );
}
