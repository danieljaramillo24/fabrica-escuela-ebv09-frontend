import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HU01RegistroDeCliente from './pages/HU01RegistroDeCliente';
import HU12SolicitarCita from './pages/HU12SolicitarCita';
function App() {
  return (
    <BrowserRouter>
        <Routes>
			<Route path="/" element={<HU01RegistroDeCliente />} />
			<Route path="/HU01RegistroDeCliente" element={<HU01RegistroDeCliente />} />
			<Route path="/solicitar-cita" element={<HU12SolicitarCita />} />
        </Routes>
    </BrowserRouter>
  );
}
export default App;