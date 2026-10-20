import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isAxiosError } from 'axios'
import { api } from '../boot/axios'
import type { ProveedorResponseDto } from '../models/ProveedorResponseDto'
import type { ProveedorRequestDto } from '../models/ProveedorRequestDto'
import { notificarExito } from '../utils/notificar'

export const useProveedorStore = defineStore('proveedor', () => {
  const proveedores = ref<ProveedorResponseDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**GET api/Provedores/All */
  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<ProveedorResponseDto[]>('/Proveedores/All')
      proveedores.value = data
    } catch (err: unknown) {
      proveedores.value = []
      if (isAxiosError(err)) {
        error.value = err.response
          ? `Error ${err.response.status} al obtener los proveedores`
          : 'No se pudo conectar con la API'
      } else {
        error.value = 'Error inesperado al obtener los proveedores'
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: number): Promise<ProveedorResponseDto | null> {
    loading.value = true
    try {
      const { data } = await api.get<ProveedorResponseDto>(
        `/Proveedores/ById?Id=${id}`
      )
      return data
    } catch {
      return null
    } finally {
      loading.value = false
    }
  }

  /** POST api/Autores */
  async function create(proveedor: ProveedorRequestDto) {
    loading.value = true
    try {
      await api.post('/Proveedores', proveedor)
      notificarExito('Proveedor creado')
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, proveedor: ProveedorRequestDto) {
    loading.value = true
    try {
      await api.put(`/Proveedores?Id=${id}`, proveedor)
      notificarExito('Provedor modificado')
    } finally {
      loading.value = false
    }
  }

  async function borrar(id: number) {
    loading.value = true
    try {
      await api.delete(`/Proveedores?Id=${id}`)
      notificarExito('Proveedor eliminado')
    } finally {
      loading.value = false
    }
  }

  return {
    proveedores,
    loading,
    error,
    fetchAll,
    fetchById,
    create,
    update,
    borrar
  }
})
