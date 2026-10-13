/** Valor registrado frente a su meta, en la unidad propia de cada hábito. */
export interface Avance {
  valor: number
  meta: number
}

export type Habito = 'agua' | 'ejercicio' | 'sueno' | 'comidas'

export type EstadoAnillo = 'vacio' | 'parcial' | 'cumplido' | 'excedido'

/** Lo que se registró un día de la semana, para la gráfica de Inicio. */
export interface DiaDeLaSemana {
  fecha: Date
  kcal: number
  proteinaG: number
  /** Litros. */
  aguaL: number
}

export interface SiguientePaso {
  comida: string
  mensaje: string
}

/** Todo lo que la pantalla Inicio necesita para pintarse. */
export interface ResumenInicio {
  nombre: string
  fecha: Date
  /** kcal */
  calorias: Avance
  /** gramos */
  proteina: Avance
  /** litros */
  agua: Avance
  /** minutos */
  ejercicio: Avance
  /** minutos */
  sueno: Avance
  /** número de comidas registradas */
  comidas: Avance
  siguientePaso: SiguientePaso
  /** Siete días en orden cronológico; el último es hoy. */
  semana: DiaDeLaSemana[]
}
