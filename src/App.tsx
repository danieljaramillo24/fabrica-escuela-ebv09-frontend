import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HU01RegistroDeCliente from './pages/HU01RegistroDeCliente';
import HU06RegistrarEspecialidad from './pages/HU06RegistrarEspecialidad';
import HU02InicioDeSesion from './pages/HU02InicioDeSesion';
function App() {
  return (
    <BrowserRouter>
        <Routes>
			<Route path="/" element={<HU01RegistroDeCliente />} />
			<Route path="/HU01RegistroDeCliente" element={<HU01RegistroDeCliente />} />
			<Route path="/registrar-especialidad" element={<HU06RegistrarEspecialidad />} />
			<Route path="/login" element={<HU02InicioDeSesion />} />
        </Routes>
    </BrowserRouter>
  );
}
export default App;