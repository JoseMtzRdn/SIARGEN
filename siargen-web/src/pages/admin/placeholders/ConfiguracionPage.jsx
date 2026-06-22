import React from 'react';
import ModulePlaceholder from '../../../components/ModulePlaceholder';
import { Settings } from 'lucide-react';

const ConfiguracionPage = () => (
  <ModulePlaceholder 
    title="Configuración del Sistema" 
    subtitle="Gestión de parámetros globales, límites de carga y tiempos de sesión del sistema."
    icon={Settings} 
  />
);

export default ConfiguracionPage;
