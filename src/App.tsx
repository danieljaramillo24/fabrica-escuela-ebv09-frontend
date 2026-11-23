import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import HU01RegistroDeCliente from './pages/HU01RegistroDeCliente';
import HU02InicioDeSesion from './pages/HU02InicioDeSesion';
import HU03GestionDePerfil from './pages/HU03GestionDePerfil';
import HU04RegistroDeEspecialistas from './pages/HU04RegistroDeEspecialistas';
import HU05RecuperarContrasena from './pages/HU05RecuperarContrasena';
import HU05RestablecerContrasena from './pages/HU05RecuperarContrasena/Restablecer';
import HU06RegistrarEspecialidad from './pages/HU06RegistrarEspecialidad';
import HU07EditarEspecialidad from './pages/HU07EditarEspecialidad';
import HU08ConsultarEspecialidades from './pages/HU08ConsultarEspecialidades';
import HU08DetalleEspecialidad from './pages/HU08ConsultarEspecialidades/Detalle';
import HU09DefinirHorariosDisponibles from './pages/HU09DefinirHorariosDisponibles';
import HU10ConsultarDisponibilidad from './pages/HU10ConsultarDisponibilidad';
import HU11BloquearHorario from './pages/HU11BloquearHorario';
import HU12SolicitarCita from './pages/HU12SolicitarCita';
import HU13ConsultarCitas from './pages/HU13ConsultarCitas';
import HU15ReprogramarCita from './pages/HU15ReprogramarCita';
import HU19InformeGeneral from './pages/HU19InformeGeneral';
import HU20ConsultarEspecialistas from './pages/HU20ConsultarEspecialistas';
import HU20DetalleEspecialista from './pages/HU20ConsultarEspecialistas/Detalle';
import HU21EditarEspecialista from './pages/HU21EditarEspecialista';
import HU22ModificarHorario from './pages/HU22ModificarHorario';
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
            <Route
              path={RUTAS.horarios}
              element={
                <ProtectedRoute roles={['ROLE_ESPECIALISTA']}>
                  <HU09DefinirHorariosDisponibles />
                </ProtectedRoute>
              }
            />
            <Route
              path={RUTAS.solicitarCita}
              element={
                <ProtectedRoute roles={['ROLE_USUARIO']}>
                  <HU12SolicitarCita />
                </ProtectedRoute>
              }
            />
            <Route
              path={RUTAS.perfil}
              element={
                <ProtectedRoute>
                  <HU03GestionDePerfil />
                </ProtectedRoute>
              }
            />
            <Route
              path={RUTAS.registrarEspecialista}
              element={
                <ProtectedRoute roles={['ROLE_ADMIN']}>
                  <HU04RegistroDeEspecialistas />
                </ProtectedRoute>
              }
            />
            <Route
              path={RUTAS.editarEspecialidad}
              element={
                <ProtectedRoute roles={['ROLE_ESPECIALISTA']}>
                  <HU07EditarEspecialidad />
                </ProtectedRoute>
              }
            />
            <Route
              path={RUTAS.gestionAgenda}
              element={
                <ProtectedRoute roles={['ROLE_ESPECIALISTA']}>
                  <HU11BloquearHorario />
                </ProtectedRoute>
              }
            />
            <Route
              path={RUTAS.disponibilidad}
              element={
                <ProtectedRoute roles={['ROLE_USUARIO']}>
                  <HU10ConsultarDisponibilidad />
                </ProtectedRoute>
              }
            />
            <Route
              path={RUTAS.misCitas}
              element={
                <ProtectedRoute roles={['ROLE_USUARIO']}>
                  <HU13ConsultarCitas />
                </ProtectedRoute>
              }
            />
            <Route
              path={RUTAS.reprogramarCita}
              element={
                <ProtectedRoute roles={['ROLE_USUARIO']}>
                  <HU15ReprogramarCita />
                </ProtectedRoute>
              }
            />

            {/* Sprint 3 */}
            <Route path={RUTAS.recuperarContrasena} element={<HU05RecuperarContrasena />} />
            <Route path={RUTAS.restablecerContrasena} element={<HU05RestablecerContrasena />} />
            <Route path={RUTAS.detalleEspecialidad} element={<HU08DetalleEspecialidad />} />
            <Route
              path={RUTAS.especialistas}
              element={
                <ProtectedRoute roles={['ROLE_USUARIO']}>
                  <HU20ConsultarEspecialistas />
                </ProtectedRoute>
              }
            />
            <Route
              path={RUTAS.detalleEspecialista}
              element={
                <ProtectedRoute roles={['ROLE_USUARIO']}>
                  <HU20DetalleEspecialista />
                </ProtectedRoute>
              }
            />
            <Route
              path={RUTAS.editarEspecialista}
              element={
                <ProtectedRoute roles={['ROLE_ADMIN']}>
                  <HU21EditarEspecialista />
                </ProtectedRoute>
              }
            />
            <Route
              path={RUTAS.modificarHorario}
              element={
                <ProtectedRoute roles={['ROLE_ESPECIALISTA']}>
                  <HU22ModificarHorario />
                </ProtectedRoute>
              }
            />
            <Route
              path={RUTAS.informeGeneral}
              element={
                <ProtectedRoute roles={['ROLE_ADMIN']}>
                  <HU19InformeGeneral />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NoEncontrada />} />
          </Route>

          {/* Enlace anterior del prototipo */}
          <Route path="/HU01RegistroDeCliente" element={<Navigate to={RUTAS.registro} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
