  // app/modulo1/utils/db.js

import supabase from "../../lib/supabase";

export const createEmpresa = async (data) => {
  const payload = {
    nombre: data.nombre,
    rfc: data.rfc,
    fecha_creacion: data.fecha_creacion,
    sector: data.sector,
    direccion: data.direccion,
  };

  console.log("Datos que se enviarán a Supabase:", payload);

  const { data: newEmpresa, error } = await supabase
    .from("empresas")
    .insert([payload])
    .select("empresa_id, nombre, rfc, fecha_creacion, sector, direccion")
    .single();

  if (error) {
    console.error("Error inserting company data:", error);
    throw error;
  }

  console.log("Empresa registrada en Supabase:", newEmpresa);

  if (!newEmpresa || !newEmpresa.empresa_id) {
    console.error("Supabase no devolvió empresa_id:", newEmpresa);
    return null;
  }

  return newEmpresa;
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

// Obtener registros mensuales de una empresa específica
export const getRegistrosMensualesByEmpresa = async (empresaId) => {
  const { data, error } = await supabase
    .from("registros_mensuales")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("mes", { ascending: true });

  if (error) {
    console.error("Error fetching registros mensuales:", error);
    return [];
  }

  return data;
};

// Obtener empresa por ID
export const getEmpresaById = async (empresaId) => {
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .eq("empresa_id", empresaId)
    .single();

  if (error) {
    console.error("Error fetching empresa:", error);
    return null;
  }

  return data;
};