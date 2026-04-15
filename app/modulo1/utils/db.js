// app/modulo1/utils/db.js
import supabase from "../../lib/supabase";

export const createEmpresa = async (data) => {
  const { data: newEmpresa, error } = await supabase
    .from("empresas")
    .insert([{
      nombre: data.nombre,
      rfc: data.rfc,
      fecha_creacion: data.fecha_creacion,
      sector: data.sector,
      direccion: data.direccion,
    }])
    .select();  // Agregamos `.select()` para asegurarnos de obtener los registros insertados

  if (error) {
    console.error("Error inserting company data:", error);
    return null;
  }    

  // Verificación de la respuesta
  console.log("Empresa registrada:", newEmpresa[0].empresa_id);

  // Asegurarse de que la respuesta contiene un registro válido con un `empresa_id`
  if (newEmpresa && newEmpresa[0]?.empresa_id) {
    return newEmpresa[0];  // Retornamos el primer registro insertado (suponiendo que solo insertamos uno)
  }

  return null;
};



export const createRegistroMensual = async (empresaId, data) => {
  const { data: newRegistro, error } = await supabase
    .from("registros_mensuales")
    .insert([{
      empresa_id: empresaId,  // Usar el empresa_id desde la cookie
      mes: data.mes,
      ventas: data.ventas,
      costos: data.costos,
      gastos: data.gastos,
      beneficio_neto: data.beneficio_neto
    }])
    .select();  // Asegurarse de que obtenemos el dato insertado

  if (error) {
    console.error("Error inserting monthly record:", error);
    return null;
  }

  // Depuración: Verifica qué devuelve Supabase
  console.log('Registro mensual insertado:', newRegistro);

  // Asegurarse de que la respuesta contiene el registro insertado
  return newRegistro ? newRegistro[0] : null;
};