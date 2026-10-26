import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isAxiosError } from 'axios'
import { api } from '../boot/axios'
import type { InsumoResponseDto } from '../models/Insumo/InsumoResponseDto'
import type { InsumoRequestDto } from '../models/Insumo/InsumoRequestDto'
import { notificarExito } from '../utils/notificar'

export const useInsumoStore = defineStore('insumo', () => {
  const insumos = ref<InsumoResponseDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** GET api/Insumos/All */
  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<InsumoResponseDto[]>('/Insumos/All')
      insumos.value = data
    } catch (err: unknown) {
      insumos.value = []
      if (isAxiosError(err)) {
        error.value = err.response
          ? `Error ${err.response.status} al obtener los insumos`
          : 'No se pudo conectar con la API'
      } else {
        error.value = 'Error inesperado al obtener los insumos'
      }
    } finally {
      loading.value = false
    }
  }

  /** GET api/Insumos/ById?Id=... Devuelve el insumo o null si no existe. */
  async function fetchById(id: number): Promise<InsumoResponseDto | null> {
    loading.value = true
    try {
      const { data } = await api.get<InsumoResponseDto>(
        `/Insumos/ById?Id=${id}`
      )
      return data
    } catch {
      return null
    } finally {
      loading.value = false
    }
  }

  /** POST api/Insumos */
  async function create(insumo: InsumoRequestDto) {
    loading.value = true
    try {
      await api.post('/Insumos', insumo)
      notificarExito('Insumo creado')
    } finally {
      loading.value = false
    }
  }

  /** PUT api/Insumos?Id=... */
  async function update(id: number, insumo: InsumoRequestDto) {
    loading.value = true
    try {
      await api.put(`/Insumos?Id=${id}`, insumo)
      notificarExito('Insumo modificado')
    } finally {
      loading.value = false
    }
  }

  /** PATCH api/Insumos?Id=...&precioCostoActual=... Cambia solo el precio de costo. */
  async function actualizarPrecio(id: number, precioCostoActual: number) {
    loading.value = true
    try {
      await api.patch(
        `/Insumos?Id=${id}&precioCostoActual=${precioCostoActual}`
      )
      notificarExito('Precio de costo actualizado')
    } finally {
      loading.value = false
    }
  }

  /** DELETE api/Insumos?Id=... (se llama borrar porque delete es palabra reservada) */
  async function borrar(id: number) {
    loading.value = true
    try {
      await api.delete(`/Insumos?Id=${id}`)
      notificarExito('Insumo eliminado')
    } finally {
      loading.value = false
    }
  }

  return {
    insumos,
    loading,
    error,
    fetchAll,
    fetchById,
    create,
    update,
    actualizarPrecio,
    borrar
  }
})
