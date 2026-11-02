import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../boot/axios'
import type { MuebleConfiguracionRequestDto } from '../models/MuebleConfiguracion/MuebleConfiguracionRequestDto'
import type { MuebleConfiguracionResponseDto } from '../models/MuebleConfiguracion/MuebleConfiguracionResponseDto'
import { notificarExito } from '../utils/notificar'

/**
 * Recargos opcionales de cada mueble (IVA, Servicio personalizado, etc.).
 * La pagina de la receta los muestra a partir de GET Muebles/Costos;
 * este store solo agrega y quita.
 */
export const useMuebleConfiguracionStore = defineStore(
  'muebleConfiguracion',
  () => {
    const loading = ref(false)

    /** GET api/MuebleConfiguraciones/ByMueble?IdMueble=... */
    async function fetchByMueble(
      idMueble: number
    ): Promise<MuebleConfiguracionResponseDto[]> {
      try {
        const { data } = await api.get<MuebleConfiguracionResponseDto[]>(
          `/MuebleConfiguraciones/ByMueble?IdMueble=${idMueble}`
        )
        return data
      } catch {
        return []
      }
    }

    /** POST api/MuebleConfiguraciones */
    async function agregar(recargo: MuebleConfiguracionRequestDto) {
      loading.value = true
      try {
        await api.post('/MuebleConfiguraciones', recargo)
        notificarExito('Recargo agregado')
      } finally {
        loading.value = false
      }
    }

    /** DELETE api/MuebleConfiguraciones?Id=... */
    async function quitar(id: number) {
      loading.value = true
      try {
        await api.delete(`/MuebleConfiguraciones?Id=${id}`)
        notificarExito('Recargo quitado')
      } finally {
        loading.value = false
      }
    }

    return { loading, fetchByMueble, agregar, quitar }
  }
)
