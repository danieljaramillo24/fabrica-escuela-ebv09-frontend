import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import HU01RegistroDeCliente from './pages/HU01RegistroDeCliente';
import HU02InicioDeSesion from './pages/HU02InicioDeSesion';
import HU06RegistrarEspecialidad from './pages/HU06RegistrarEspecialidad';
import HU08ConsultarEspecialidades from './pages/HU08ConsultarEspecialidades';
import HU09DefinirHorariosDisponibles from './pages/HU09DefinirHorariosDisponibles';
import HU12SolicitarCita from './pages/HU12SolicitarCita';
import NoEncontrada from './pages/comunes/NoEncontrada';
import Inicio from './routes/Inicio';
import { RUTAS } from './routes/paths';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path={RUTAS.inicio} element={<Inicio />} />
            <Route path={RUTAS.registro} element={<HU01RegistroDeCliente />} />
            <Route path={RUTAS.login} element={<HU02InicioDeSesion />} />
            <Route path={RUTAS.especialidades} element={<HU08ConsultarEspecialidades />} />
            <Route
              path={RUTAS.registrarEspecialidad}
              element={
                <ProtectedRoute roles={['ROLE_ESPECIALISTA']}>
                  <HU06RegistrarEspecialidad />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NoEncontrada />} />
          </Route>

          {/* Pantallas que aún no usan <Layout> (HU-09 y HU-12): se migran en su propia HU */}
          <Route path={RUTAS.horarios} element={<HU09DefinirHorariosDisponibles />} />
          <Route path={RUTAS.solicitarCita} element={<HU12SolicitarCita />} />

          {/* Enlace anterior del prototipo */}
          <Route path="/HU01RegistroDeCliente" element={<Navigate to={RUTAS.registro} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
