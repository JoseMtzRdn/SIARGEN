import React from 'react';
import ModulePlaceholder from '../../../components/ModulePlaceholder';
import { ShieldCheck } from 'lucide-react';

const AuditoriaPage = () => (
  <ModulePlaceholder 
    title="Registro de Auditoría" 
    subtitle="Trazabilidad y control de operaciones para asegurar la integridad de la información archivística."
    icon={ShieldCheck} 
  />
);

export default AuditoriaPage;
