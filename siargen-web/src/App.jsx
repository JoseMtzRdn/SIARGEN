import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from './store/authSlice';


import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';


const FondosPage = lazy(() => import('./pages/admin/FondosPage'));
const SeccionesPage = lazy(() => import('./pages/admin/SeccionesPage'));
const SeriesPage = lazy(() => import('./pages/admin/SeriesPage'));
const SubseriesPage = lazy(() => import('./pages/admin/SubseriesPage'));
const UnidadesAdmPage = lazy(() => import('./pages/admin/UnidadesAdmPage'));
const UsuariosPage = lazy(() => import('./pages/admin/UsuariosPage'));
const RevisionTransferenciasPage = lazy(() => import('./pages/admin/RevisionTransferenciasPage'));

const CorrespondenciaPage = lazy(() => import('./pages/correspondencia/CorrespondenciaPage'));
const ExpedientesPage = lazy(() => import('./pages/tramite/ExpedientesPage'));
const TransferenciasPage = lazy(() => import('./pages/tramite/TransferenciasPage'));
const PrestamosTramitePage = lazy(() => import('./pages/tramite/PrestamosTramitePage'));
const AutorizacionTuaPage = lazy(() => import('./pages/tramite/AutorizacionTuaPage'));

const InventarioPage = lazy(() => import('./pages/concentracion/InventarioPage'));
const CustodiaPage = lazy(() => import('./pages/concentracion/CustodiaPage'));
const PrestamosPage = lazy(() => import('./pages/concentracion/PrestamosPage'));
const AcervoPage = lazy(() => import('./pages/historico/AcervoPage'));
const ConsultasPage = lazy(() => import('./pages/consultas/ConsultasPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const AuditoriaPage = lazy(() => import('./pages/admin/placeholders/AuditoriaPage'));
const ConfiguracionPage = lazy(() => import('./pages/admin/placeholders/ConfiguracionPage'));


const ProtectedRoute = ({ children }) => {
  const { token, user, loading } = useSelector((state) => state.auth);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8a2036] mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Verificando Credenciales...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};


const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useSelector((state) => state.auth);
  
  if (!user) return <ProtectedRoute>{children}</ProtectedRoute>;

  const userRole = user?.role?.slug || '';

  // Restringe el acceso directo del Administrador de TI según perfiles de visualización.
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(checkAuth());
    }
  }, [token, dispatch]);

  return (
    <Router>
      <Suspense fallback={
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8a2036] mb-4"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Cargando Sistema...</p>
        </div>
      }>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          {}
          <Route path="/archivistica/fondos" element={
            <RoleProtectedRoute allowedRoles={['coord_archivos']}>
              <FondosPage />
            </RoleProtectedRoute>
          } />
          <Route path="/archivistica/secciones" element={
            <RoleProtectedRoute allowedRoles={['coord_archivos']}>
              <SeccionesPage />
            </RoleProtectedRoute>
          } />
          <Route path="/archivistica/series" element={
            <RoleProtectedRoute allowedRoles={['coord_archivos']}>
              <SeriesPage />
            </RoleProtectedRoute>
          } />
          <Route path="/archivistica/subseries" element={
            <RoleProtectedRoute allowedRoles={['coord_archivos']}>
              <SubseriesPage />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/unidades" element={
            <RoleProtectedRoute allowedRoles={['admin_ti']}>
              <UnidadesAdmPage />
            </RoleProtectedRoute>
          } />

          <Route path="/coordinador/revision-transferencias" element={
            <RoleProtectedRoute allowedRoles={['coord_archivos']}>
              <RevisionTransferenciasPage />
            </RoleProtectedRoute>
          } />

          {/* { usuarios (ruta general accesible para tua) } */}
          <Route path="/usuarios" element={
            <RoleProtectedRoute allowedRoles={['admin_ti', 'tua']}>
              <UsuariosPage />
            </RoleProtectedRoute>
          } />

          {/* { correspondencia } */}
          <Route path="/correspondencia" element={
            <RoleProtectedRoute allowedRoles={['correspondencia', 'rat']}>
              <CorrespondenciaPage />
            </RoleProtectedRoute>
          } />

          <Route path="/tramite/expedientes" element={
            <RoleProtectedRoute allowedRoles={['rat', 'tua', 'coord_archivos', 'correspondencia']}>
              <ExpedientesPage />
            </RoleProtectedRoute>
          } />

          <Route path="/tramite/transferencias" element={
            <RoleProtectedRoute allowedRoles={['rat', 'tua', 'coord_archivos']}>
              <TransferenciasPage />
            </RoleProtectedRoute>
          } />

          <Route path="/tramite/prestamos" element={
            <RoleProtectedRoute allowedRoles={['rat', 'tua', 'coord_archivos']}>
              <PrestamosTramitePage />
            </RoleProtectedRoute>
          } />

          <Route path="/autorizaciones-tua" element={
            <RoleProtectedRoute allowedRoles={['tua']}>
              <AutorizacionTuaPage />
            </RoleProtectedRoute>
          } />

          <Route path="/concentracion/custodia" element={
            <RoleProtectedRoute allowedRoles={['rac', 'tua', 'coord_archivos']}>
              <CustodiaPage />
            </RoleProtectedRoute>
          } />

          <Route path="/concentracion/recepciones" element={
            <RoleProtectedRoute allowedRoles={['rac']}>
              <InventarioPage />
            </RoleProtectedRoute>
          } />

          <Route path="/concentracion/prestamos" element={
            <RoleProtectedRoute allowedRoles={['rac', 'rat', 'tua', 'coord_archivos']}>
              <PrestamosPage />
            </RoleProtectedRoute>
          } />

          <Route path="/historico/acervo" element={
            <RoleProtectedRoute allowedRoles={['rah', 'tua', 'coord_archivos']}>
              <AcervoPage />
            </RoleProtectedRoute>
          } />

          <Route path="/consultas" element={
            <RoleProtectedRoute allowedRoles={['consulta', 'rah']}>
              <ConsultasPage />
            </RoleProtectedRoute>
          } />

          <Route path="/admin/auditoria" element={
            <RoleProtectedRoute allowedRoles={['admin_ti']}>
              <AuditoriaPage />
            </RoleProtectedRoute>
          } />

          <Route path="/admin/configuracion" element={
            <RoleProtectedRoute allowedRoles={['admin_ti']}>
              <ConfiguracionPage />
            </RoleProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } />

          {}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
