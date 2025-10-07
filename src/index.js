import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Sales from './components/Sales';
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
          <Route path="sales" element={<Sales />} />
          {/* Future routes for other modules will go here */}
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
