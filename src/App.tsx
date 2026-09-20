import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HU01RegistroDeCliente from './pages/HU01RegistroDeCliente';
import HU09DefinirHorariosDisponibles from './pages/HU09DefinirHorariosDisponibles';
function App() {
  return (
    <BrowserRouter>
        <Routes>
			<Route path="/" element={<HU01RegistroDeCliente />} />
			<Route path="/HU01RegistroDeCliente" element={<HU01RegistroDeCliente />} />
			<Route path="/horarios" element={<HU09DefinirHorariosDisponibles />} />
        </Routes>
    </BrowserRouter>
  );
}
export default App;