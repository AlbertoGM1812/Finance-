// app/modulo1/components/formulario/FormularioEmpresaDatos.tsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEmpresa } from '../../utils/db';
import Cookies from 'js-cookie';

const FormularioEmpresaDatos = () => {
  const router = useRouter();

  const [empresaData, setEmpresaData] = useState({
    nombre: '',
    rfc: '',
    fecha_creacion: '',
    sector: '',
    direccion: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setEmpresaData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log('SE EJECUTÓ EL SUBMIT DE REACT');
    console.log('Datos enviados:', empresaData);

    try {
      setIsSubmitting(true);

      const response = await createEmpresa(empresaData);

      console.log('Respuesta de la creación de empresa:', response);

      if (!response || !response.empresa_id) {
        console.error('Respuesta inválida al crear empresa:', response);
        alert('Hubo un error al registrar la empresa');
        return;
      }

      const empresaId = response.empresa_id;

      Cookies.set('empresa_id', String(empresaId), {
        expires: 7,
        path: '/',
      });

      Cookies.set('empresa_nombre', response.nombre, {
        expires: 7,
        path: '/',
      });

      console.log("Cookie empresa_id:", Cookies.get('empresa_id'));
      console.log("Cookie empresa_nombre:", Cookies.get('empresa_nombre'));

      alert('Empresa registrada con éxito');

      router.push('/modulo1/dashboard');
    } catch (error) {
      console.error('Error en la solicitud:', error);
      alert('Hubo un error al registrar la empresa');
    } finally {
      setIsSubmitting(false);
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

        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {isSubmitting ? 'Registrando...' : 'Registrar Empresa'}
        </button>
      </form>
    </div>
  );
};

export default FormularioEmpresaDatos;