// app/modulo1/schema.ts
import { z } from "zod";

export const modulo1Schema = z.object({
  nombreEscenario: z
    .string()
    .min(3, "El nombre del escenario debe tener al menos 3 caracteres")
    .max(50, "El nombre del escenario no puede exceder 50 caracteres"),

  inversionInicial: z
    .number()
    .min(0, "La inversión inicial no puede ser negativa"),

  ingresosMensuales: z
    .number()
    .min(0, "Los ingresos mensuales no pueden ser negativos"),

  costosFijos: z
    .number()
    .min(0, "Los costos fijos no pueden ser negativos"),

  costosVariables: z
    .number()
    .min(0, "Los costos variables no pueden ser negativos"),

  horizonteMeses: z
    .number()
    .int("El horizonte debe ser un número entero")
    .min(1, "El horizonte debe ser de al menos 1 mes")
    .max(60, "Para el MVP, el horizonte máximo será de 60 meses"),

  tasaCrecimientoMensual: z
    .number()
    .min(-100, "La tasa no puede ser menor a -100%")
    .max(100, "La tasa no puede ser mayor a 100%"),

  porcentajeImprevistos: z
    .number()
    .min(0, "El porcentaje de imprevistos no puede ser negativo")
    .max(100, "El porcentaje de imprevistos no puede ser mayor a 100"),
});

export type Modulo1FormData = z.infer<typeof modulo1Schema>;