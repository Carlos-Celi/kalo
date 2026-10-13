import type { NombreIcono } from '../../components/ui/Icon'
import type { Actividad, Alcohol, Objetivo, Restriccion, Sexo, SuenoHabitual } from '../../domain/perfil'

/** Respuestas posibles del perfil, con el texto que se muestra. Las usan el onboarding y Configuración. */
export type Opciones<T> = { valor: T; etiqueta: string }[]

export const opcionesSexo: Opciones<Sexo> = [
  { valor: 'femenino', etiqueta: 'Femenino' },
  { valor: 'masculino', etiqueta: 'Masculino' },
  { valor: 'sin-especificar', etiqueta: 'Prefiero no decir' },
]

export const opcionesObjetivo: {
  valor: Objetivo
  icono: NombreIcono
  titulo: string
  detalle: string
}[] = [
  { valor: 'bajar', icono: 'llama', titulo: 'Bajar de peso', detalle: 'Déficit calórico moderado' },
  {
    valor: 'mantener',
    icono: 'pulso',
    titulo: 'Mantener mi peso',
    detalle: 'Equilibrar lo que como y gasto',
  },
  {
    valor: 'musculo',
    icono: 'pesa',
    titulo: 'Ganar masa muscular',
    detalle: 'Más proteína y entrenamiento',
  },
  {
    valor: 'sano',
    icono: 'hoja',
    titulo: 'Comer más sano',
    detalle: 'Mejor calidad, menos azúcar y grasa',
  },
]

export const opcionesActividad: Opciones<Actividad> = [
  { valor: 'sedentario', etiqueta: 'Sedentario' },
  { valor: 'ligero', etiqueta: 'Ligero 1–2 días' },
  { valor: 'moderado', etiqueta: 'Moderado 3–4 días' },
  { valor: 'intenso', etiqueta: 'Intenso 5+ días' },
]

export const opcionesSueno: Opciones<SuenoHabitual> = [
  { valor: 'menos-5', etiqueta: 'Menos de 5 h' },
  { valor: '5-7', etiqueta: '5–7 h' },
  { valor: '7-9', etiqueta: '7–9 h' },
  { valor: 'mas-9', etiqueta: 'Más de 9 h' },
]

export const opcionesAlcohol: Opciones<Alcohol> = [
  { valor: 'nunca', etiqueta: 'Nunca' },
  { valor: 'fines-de-semana', etiqueta: 'Fines de semana' },
  { valor: 'frecuente', etiqueta: 'Varias veces por semana' },
]

export const opcionesRestriccion: Opciones<Restriccion> = [
  { valor: 'vegetariano', etiqueta: 'Vegetariano' },
  { valor: 'sin-lactosa', etiqueta: 'Sin lactosa' },
  { valor: 'sin-gluten', etiqueta: 'Sin gluten' },
  { valor: 'diabetes', etiqueta: 'Diabetes' },
  { valor: 'hipertension', etiqueta: 'Hipertensión' },
]
