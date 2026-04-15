// app/modulo1/components/formulario/FormularioEmpresaDatos.tsx

'use client';  // Directiva para Client Component

import React, { useState } from 'react';
import { createEmpresa } from '../../utils/db'; // Asegúrate de que la ruta al archivo db.js sea correcta
import Cookies from 'js-cookie';  // Importar js-cookie

const FormularioEmpresaDatos = () => {
  const [empresaData, setEmpresaData] = useState({
    nombre: '',
    rfc: '',
    fecha_creacion: '',
    sector: '',
    direccion: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmpresaData({
      ...empresaData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await createEmpresa(empresaData);

      // Depuración: Verifica si la respuesta tiene empresa_id
      console.log('Respuesta de la creación de empresa:', response);

      console.log("Longitud de la respuesta:", response ? Object.keys(response).length : 'No response');

      if (response && response ? Object.keys(response).length > 0 : false) {
        const empresaId = response.empresa_id;  // Accediendo correctamente al `empresa_id`

        // Depuración: Verifica el valor de empresaId
        console.log("empresa_id obtenida:", empresaId);

        // Establecer la cookie con el empresa_id
        Cookies.set('empresa_id', empresaId, { expires: 7, path: '' });

        // Depuración: Verifica si la cookie se estableció correctamente
        const cookieValue = Cookies.get('empresa_id');
        console.log("Valor de la cookie 'empresa_id':", cookieValue);

        alert('Empresa registrada con éxito');
      } else {
        alert('Hubo un error al registrar la empresa');
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
      alert('Hubo un error al registrar la empresa');
    }
  };

  return (
    <div className="form-container">
      <h1 className="form-title">Registro de Empresa</h1>
      <form onSubmit={handleSubmit} className="empresa-form">
        <div className="form-field">
          <label htmlFor="nombre">Nombre:</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={empresaData.nombre}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="rfc">RFC:</label>
          <input
            type="text"
            id="rfc"
            name="rfc"
            value={empresaData.rfc}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="fecha_creacion">Fecha de Creación:</label>
          <input
            type="date"
            id="fecha_creacion"
            name="fecha_creacion"
            value={empresaData.fecha_creacion}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="sector">Sector:</label>
          <input
            type="text"
            id="sector"
            name="sector"
            value={empresaData.sector}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="direccion">Dirección:</label>
          <input
            type="text"
            id="direccion"
            name="direccion"
            value={empresaData.direccion}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="submit-button">Registrar Empresa</button>
      </form>
    </div>
  );
};

export default FormularioEmpresaDatos;