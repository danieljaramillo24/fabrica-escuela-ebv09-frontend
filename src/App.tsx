import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HU01RegistroDeCliente from './pages/HU01RegistroDeCliente';
import HU06RegistrarEspecialidad from './pages/HU06RegistrarEspecialidad';
function App() {
  return (
    <BrowserRouter>
        <Routes>
			<Route path="/" element={<HU01RegistroDeCliente />} />
			<Route path="/HU01RegistroDeCliente" element={<HU01RegistroDeCliente />} />
			<Route path="/registrar-especialidad" element={<HU06RegistrarEspecialidad />} />
        </Routes>
    </BrowserRouter>
  );
}
export default App;