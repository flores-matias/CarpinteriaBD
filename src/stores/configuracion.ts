import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isAxiosError } from 'axios'
import { api } from '../boot/axios'
import type { ConfiguracionResponseDto } from '../models/Configuracion/ConfiguracionResponseDto'
import type { ConfiguracionRequestDto } from '../models/Configuracion/ConfiguracionRequestDto'
import { notificarExito } from '../utils/notificar'

export const useConfiguracionStore = defineStore('configuracion', () => {
  const configuraciones = ref<ConfiguracionResponseDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** GET api/Configuraciones/All */
  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<ConfiguracionResponseDto[]>(
        '/Configuraciones/All'
      )
      configuraciones.value = data
    } catch (err: unknown) {
      configuraciones.value = []
      if (isAxiosError(err)) {
        error.value = err.response
          ? `Error ${err.response.status} al obtener las configuraciones`
          : 'No se pudo conectar con la API'
      } else {
        error.value = 'Error inesperado al obtener las configuraciones'
      }
    } finally {
      loading.value = false
    }
  }

  /** GET api/Configuraciones/ById?Id=... Devuelve la configuracion o null si no existe. */
  async function fetchById(
    id: number
  ): Promise<ConfiguracionResponseDto | null> {
    loading.value = true
    try {
      const { data } = await api.get<ConfiguracionResponseDto>(
        `/Configuraciones/ById?Id=${id}`
      )
      return data
    } catch {
      return null
    } finally {
      loading.value = false
    }
  }

  /** POST api/Configuraciones */
  async function create(configuracion: ConfiguracionRequestDto) {
    loading.value = true
    try {
      await api.post('/Configuraciones', configuracion)
      notificarExito('Configuracion creada')
    } finally {
      loading.value = false
    }
  }

  /** PUT api/Configuraciones?Id=... */
  async function update(id: number, configuracion: ConfiguracionRequestDto) {
    loading.value = true
    try {
      await api.put(`/Configuraciones?Id=${id}`, configuracion)
      notificarExito('Configuracion modificada')
    } finally {
      loading.value = false
    }
  }

  /** DELETE api/Configuraciones?Id=... (se llama borrar porque delete es palabra reservada) */
  async function borrar(id: number) {
    loading.value = true
    try {
      await api.delete(`/Configuraciones?Id=${id}`)
      notificarExito('Configuracion eliminada')
    } finally {
      loading.value = false
    }
  }

  return {
    configuraciones,
    loading,
    error,
    fetchAll,
    fetchById,
    create,
    update,
    borrar
  }
})
