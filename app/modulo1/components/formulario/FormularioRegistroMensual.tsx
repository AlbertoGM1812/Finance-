// app/modulo1/components/registro-mes/FormularioRegistroMensual.tsx

'use client';  // Directiva para Client Component

import React, { useState } from 'react';
import Cookies from 'js-cookie';  // Para leer la cookie
import { createRegistroMensual } from '../../utils/db'; // Función para guardar el registro mensual

const FormularioRegistroMensual = () => {
  const empresaId = Cookies.get('empresa_id'); // Obtener el empresa_id desde la cookie
  const [registroData, setRegistroData] = useState({
    mes: '',
    ventas: 0,
    costos: 0,
    gastos: 0,
    beneficio_neto: 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegistroData({
      ...registroData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!empresaId) {
      alert('No se ha encontrado la empresa. Registre una empresa primero.');
      return;
    }

    const fechaCompleta = `${registroData.mes}-01`;

    try {
      // Llamar a la función para guardar el registro mensual
      const response = await createRegistroMensual(empresaId, {
        ...registroData,
        mes: fechaCompleta  // Usar la fecha con el día 01
      });

      console.log('Respuesta del servidor:', response); // Depuración de la respuesta

      if (response) {
        alert('Registro mensual guardado con éxito');
      } else {
        alert('Hubo un error al guardar el registro mensual');
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
      alert('Hubo un error al guardar el registro mensual');
    }
  };

  return (
    <div className="form-container">
      <h1 className="form-title">Registro Mensual</h1>
      <form onSubmit={handleSubmit} className="empresa-form">
        <div className="form-field">
          <label htmlFor="mes">Mes:</label>
          <input
            type="month"
            id="mes"
            name="mes"
            value={registroData.mes}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="ventas">Ventas:</label>
          <input
            type="number"
            id="ventas"
            name="ventas"
            value={registroData.ventas}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="costos">Costos:</label>
          <input
            type="number"
            id="costos"
            name="costos"
            value={registroData.costos}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="gastos">Gastos:</label>
          <input
            type="number"
            id="gastos"
            name="gastos"
            value={registroData.gastos}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="beneficio_neto">Beneficio Neto:</label>
          <input
            type="number"
            id="beneficio_neto"
            name="beneficio_neto"
            value={registroData.beneficio_neto}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="submit-button">Guardar Registro</button>
      </form>
    </div>
  );
};

export default FormularioRegistroMensual;