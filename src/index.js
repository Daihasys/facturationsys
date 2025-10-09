import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Sales from './components/Sales';
import SalesList from './components/SalesList'; // Importar el nuevo componente
import Categories from './components/Categories';
import Backup from './components/Backup'; // Importar el nuevo componente
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
console.log('Aplicación React intentando renderizar...');
root.render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="sales" element={<Sales />} />
          <Route path="sales/list" element={<SalesList />} /> {/* Añadir la nueva ruta */}
          <Route path="backups" element={<Backup />} /> {/* Añadir la nueva ruta */}
          {/* Future routes for other modules will go here */}
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
