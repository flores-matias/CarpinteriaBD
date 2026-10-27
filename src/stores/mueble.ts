import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isAxiosError } from 'axios'
import { api } from '../boot/axios'
import type { MuebleResponseDto } from '../models/Mueble/MuebleResponseDto'
import type { MuebleRequestDto } from '../models/Mueble/MuebleRequestDto'
import type { MuebleCostoDto } from '../models/Mueble/MuebleCostoDto'
import { notificarExito } from '../utils/notificar'

export const useMuebleStore = defineStore('mueble', () => {
  const muebles = ref<MuebleResponseDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** GET api/Muebles/All (cada mueble trae costoMateriales y precioCalculado) */
  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<MuebleResponseDto[]>('/Muebles/All')
      muebles.value = data
    } catch (err: unknown) {
      muebles.value = []
      if (isAxiosError(err)) {
        error.value = err.response
          ? `Error ${err.response.status} al obtener los muebles`
          : 'No se pudo conectar con la API'
      } else {
        error.value = 'Error inesperado al obtener los muebles'
      }
    } finally {
      loading.value = false
    }
  }

  /** GET api/Muebles/ById?Id=... Devuelve el mueble o null si no existe. */
  async function fetchById(id: number): Promise<MuebleResponseDto | null> {
    loading.value = true
    try {
      const { data } = await api.get<MuebleResponseDto>(
        `/Muebles/ById?Id=${id}`
      )
      return data
    } catch {
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * GET api/Muebles/Costos?Id=...
   * Desglose del precio: materiales + mano de obra + uso de maquinas = precio calculado.
   */
  async function fetchCostos(id: number): Promise<MuebleCostoDto | null> {
    try {
      const { data } = await api.get<MuebleCostoDto>(`/Muebles/Costos?Id=${id}`)
      return data
    } catch {
      return null
    }
  }

  /** PATCH api/Muebles/UsarPrecioCalculado?Id=... Copia el precio calculado al sugerido. */
  async function usarPrecioCalculado(id: number) {
    loading.value = true
    try {
      await api.patch(`/Muebles/UsarPrecioCalculado?Id=${id}`)
      notificarExito('Precio sugerido actualizado')
    } finally {
      loading.value = false
    }
  }

  /** POST api/Muebles */
  async function create(mueble: MuebleRequestDto) {
    loading.value = true
    try {
      await api.post('/Muebles', mueble)
      notificarExito('Mueble creado')
    } finally {
      loading.value = false
    }
  }

  /** PUT api/Muebles?Id=... */
  async function update(id: number, mueble: MuebleRequestDto) {
    loading.value = true
    try {
      await api.put(`/Muebles?Id=${id}`, mueble)
      notificarExito('Mueble modificado')
    } finally {
      loading.value = false
    }
  }

  /** DELETE api/Muebles?Id=... (se llama borrar porque delete es palabra reservada) */
  async function borrar(id: number) {
    loading.value = true
    try {
      await api.delete(`/Muebles?Id=${id}`)
      notificarExito('Mueble eliminado')
    } finally {
      loading.value = false
    }
  }

  return {
    muebles,
    loading,
    error,
    fetchAll,
    fetchById,
    fetchCostos,
    usarPrecioCalculado,
    create,
    update,
    borrar
  }
})
