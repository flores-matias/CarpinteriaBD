import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isAxiosError } from 'axios'
import { api } from '../boot/axios'
import type { RecetaMuebleResponseDto } from '../models/RecetaMueble/RecetaMuebleResponseDto'
import type { RecetaMuebleRequestDto } from '../models/RecetaMueble/RecetaMuebleRequestDto'
import { notificarExito } from '../utils/notificar'

export const useRecetaMuebleStore = defineStore('recetaMueble', () => {
  // Receta (insumos) del mueble que se esta viendo, no de todos
  const receta = ref<RecetaMuebleResponseDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** GET api/RecetaMuebles/ByMueble?IdMueble=... Solo los insumos de un mueble. */
  async function fetchByMueble(idMueble: number) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<RecetaMuebleResponseDto[]>(
        `/RecetaMuebles/ByMueble?IdMueble=${idMueble}`
      )
      receta.value = data
    } catch (err: unknown) {
      receta.value = []
      if (isAxiosError(err)) {
        error.value = err.response
          ? `Error ${err.response.status} al obtener la receta`
          : 'No se pudo conectar con la API'
      } else {
        error.value = 'Error inesperado al obtener la receta'
      }
    } finally {
      loading.value = false
    }
  }

  /** GET api/RecetaMuebles/ById?Id=... Devuelve el renglon o null si no existe. */
  async function fetchById(
    id: number
  ): Promise<RecetaMuebleResponseDto | null> {
    loading.value = true
    try {
      const { data } = await api.get<RecetaMuebleResponseDto>(
        `/RecetaMuebles/ById?Id=${id}`
      )
      return data
    } catch {
      return null
    } finally {
      loading.value = false
    }
  }

  /** POST api/RecetaMuebles */
  async function create(renglon: RecetaMuebleRequestDto) {
    loading.value = true
    try {
      await api.post('/RecetaMuebles', renglon)
      notificarExito('Insumo agregado a la receta')
    } finally {
      loading.value = false
    }
  }

  /** PUT api/RecetaMuebles?Id=... */
  async function update(id: number, renglon: RecetaMuebleRequestDto) {
    loading.value = true
    try {
      await api.put(`/RecetaMuebles?Id=${id}`, renglon)
      notificarExito('Insumo de la receta modificado')
    } finally {
      loading.value = false
    }
  }

  /** DELETE api/RecetaMuebles?Id=... */
  async function borrar(id: number) {
    loading.value = true
    try {
      await api.delete(`/RecetaMuebles?Id=${id}`)
      notificarExito('Insumo quitado de la receta')
    } finally {
      loading.value = false
    }
  }

  return {
    receta,
    loading,
    error,
    fetchByMueble,
    fetchById,
    create,
    update,
    borrar
  }
})
