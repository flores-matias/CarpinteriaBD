import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isAxiosError } from 'axios'
import { api } from '../boot/axios'
import { ProveedorResponseDto } from '../models/ProveedorResponseDto'

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

  return { proveedores, loading, error, fetchAll }
})
