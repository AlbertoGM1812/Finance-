// app/modulo1/page.tsx

import React from 'react';
import FormularioEmpresaDatos from './components/formulario/FormularioEmpresaDatos'; // Asegúrate de que la ruta sea correcta

const Page = () => {
  return (
    <div>
      <h1>Registro de Empresa</h1>
      <FormularioEmpresaDatos />
    </div>
  );
};

export default Page;

