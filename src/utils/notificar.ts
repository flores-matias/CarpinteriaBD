import { Notify } from 'quasar'
import { isAxiosError } from 'axios'

export function notificarExito(mensaje: string) {
  Notify.create({
    type: 'positive',
    message: mensaje,
    position: 'top',
    timeout: 3000
  })
}

export function notificarError(mensaje: string) {
  Notify.create({
    type: 'negative',
    message: mensaje,
    position: 'top',
    timeout: 4000
  })
}

/**
 * Devuelve el mensaje de error que manda la API, o el mensaje por defecto si no hay uno.
 */
export function mensajeDeError(err: unknown, porDefecto: string): string {
  if (isAxiosError(err)) {
    const datos: unknown = err.response?.data

    if (typeof datos === 'string' && datos.trim().length > 0) {
      return datos
    }
    if (Array.isArray(datos)) {
      return datos.join(' ')
    }
    if (datos && typeof datos === 'object' && 'errors' in datos) {
      const errores = Object.values(
        (datos as { errors: Record<string, string[]> }).errors
      ).flat()
      if (errores.length > 0) {
        return errores.join(' ')
      }
    }
    if (!err.response) {
      return 'No se pudo conectar con la API'
    }
  }
  return porDefecto
}
