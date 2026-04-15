// app/modulo1/pages/api/empresa.js

import { createEmpresa } from '../../../utils/db'; // Asegúrate de que la ruta al archivo db.js sea correcta

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const empresaData = req.body; // Recibir los datos del formulario
      const empresa = await createEmpresa(empresaData); // Insertar los datos en la base de datos

      if (empresa) {
        res.status(200).json({ message: 'Empresa registrada con éxito', empresa });
      } else {
        res.status(500).json({ error: 'Hubo un error al registrar la empresa' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Hubo un error al procesar la solicitud' });
    }
  } else {
    res.status(405).json({ error: 'Método no permitido' }); // En caso de que no sea un POST
  }
}