import { afterEach, describe, expect, it } from 'vitest'
import { restablecerRegistrosMock } from '../../data/mock'
import { claveDia } from '../../domain/fechas'
import { reunirMisDatos } from './exportarDatos'

afterEach(() => restablecerRegistrosMock())

describe('Descargar mis datos', () => {
  it('reúne perfil, plan y todos los registros, sin la API key', async () => {
    const datos = await reunirMisDatos(claveDia(new Date()))
    expect(datos.perfil.plan?.metas.kcal).toBeGreaterThan(0)
    expect(datos.registros.comidas.length).toBeGreaterThan(0)
    expect(datos.registros).toHaveProperty('pesos')
    expect(JSON.stringify(datos)).not.toMatch(/apiKey|api_key/i)
  })
})
