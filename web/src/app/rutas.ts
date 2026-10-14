export const rutas = {
  inicio: '/',
  registros: '/registros',
  registrosAgua: '/registros/agua',
  registrosEjercicio: '/registros/ejercicio',
  registrosSueno: '/registros/sueno',
  registroRapido: '/registro-rapido',
  camara: '/registros/comida/foto',
  comidaManual: '/registros/comida/manual',
  analisis: '/registros/comida/analisis',
  proveedorIA: '/ajustes/ia',
  ajustesPerfil: '/ajustes/perfil',
  ajustesMedidas: '/ajustes/medidas',
  ajustesObjetivo: '/ajustes/objetivo',
  ajustesMetas: '/ajustes/metas',
  comidaEditar: '/registros/comida/:id',
  peso: '/peso',
  asistente: '/asistente',
  progreso: '/progreso',
  recordatorios: '/recordatorios',
  ajustes: '/ajustes',
  login: '/login',
  restablecer: '/restablecer',
  bienvenida: '/bienvenida',
  bienvenidaMedidas: '/bienvenida/medidas',
  bienvenidaObjetivos: '/bienvenida/objetivos',
  bienvenidaHabitos: '/bienvenida/habitos',
  bienvenidaPlan: '/bienvenida/plan',
  bienvenidaIA: '/bienvenida/ia',
  privacidad: '/privacidad',
  terminos: '/terminos',
  cookies: '/cookies',
} as const

/** Ruta para editar una comida ya registrada. */
export function rutaDeComida(id: string): string {
  return rutas.comidaEditar.replace(':id', encodeURIComponent(id))
}
