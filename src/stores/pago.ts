import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isAxiosError } from 'axios'
import { api } from '../boot/axios'
import type { PagoResponseDto } from '../models/Pago/PagoResponseDto'
import type { PagoRequestDto } from '../models/Pago/PagoRequestDto'
import { notificarExito } from '../utils/notificar'

export const usePagoStore = defineStore('pago', () => {
  const pagos = ref<PagoResponseDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** GET api/Pagos/All */
  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<PagoResponseDto[]>('/Pagos/All')
      pagos.value = data
    } catch (err: unknown) {
      pagos.value = []
      if (isAxiosError(err)) {
        error.value = err.response
          ? `Error ${err.response.status} al obtener los pagos`
          : 'No se pudo conectar con la API'
      } else {
        error.value = 'Error inesperado al obtener los pagos'
      }
    } finally {
      loading.value = false
    }
  }

  /** GET api/Pagos/ById?Id=... Devuelve el pago o null si no existe. */
  async function fetchById(id: number): Promise<PagoResponseDto | null> {
    loading.value = true
    try {
      const { data } = await api.get<PagoResponseDto>(`/Pagos/ById?Id=${id}`)
      return data
    } catch {
      return null
    } finally {
      loading.value = false
    }
  }

  /** POST api/Pagos (la API recalcula el estado de pago del pedido) */
  async function create(pago: PagoRequestDto) {
    loading.value = true
    try {
      await api.post('/Pagos', pago)
      notificarExito('Pago registrado')
    } finally {
      loading.value = false
    }
  }

  /** PUT api/Pagos?Id=... (la API recalcula el estado de pago del pedido) */
  async function update(id: number, pago: PagoRequestDto) {
    loading.value = true
    try {
      await api.put(`/Pagos?Id=${id}`, pago)
      notificarExito('Pago modificado')
    } finally {
      loading.value = false
    }
  }

  /** DELETE api/Pagos?Id=... (el pedido puede volver a Parcial o Pendiente) */
  async function borrar(id: number) {
    loading.value = true
    try {
      await api.delete(`/Pagos?Id=${id}`)
      notificarExito('Pago eliminado')
    } finally {
      loading.value = false
    }
  }

  return {
    pagos,
    loading,
    error,
    fetchAll,
    fetchById,
    create,
    update,
    borrar
  }
})
