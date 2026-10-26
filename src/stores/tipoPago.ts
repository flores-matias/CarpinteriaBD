import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isAxiosError } from 'axios'
import { api } from '../boot/axios'
import type { TipoPagoResponseDto } from '../models/TipoPago/TipoPagoResponseDto'
import type { TipoPagoRequestDto } from '../models/TipoPago/TipoPagoRequestDto'
import { notificarExito } from '../utils/notificar'

export const useTipoPagoStore = defineStore('tipoPago', () => {
  const tiposPago = ref<TipoPagoResponseDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** GET api/TipoPagos/All */
  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<TipoPagoResponseDto[]>('/TipoPagos/All')
      tiposPago.value = data
    } catch (err: unknown) {
      tiposPago.value = []
      if (isAxiosError(err)) {
        error.value = err.response
          ? `Error ${err.response.status} al obtener los tipos de pago`
          : 'No se pudo conectar con la API'
      } else {
        error.value = 'Error inesperado al obtener los tipos de pago'
      }
    } finally {
      loading.value = false
    }
  }

  /** GET api/TipoPagos/ById?Id=... Devuelve el tipo de pago o null si no existe. */
  async function fetchById(id: number): Promise<TipoPagoResponseDto | null> {
    loading.value = true
    try {
      const { data } = await api.get<TipoPagoResponseDto>(
        `/TipoPagos/ById?Id=${id}`
      )
      return data
    } catch {
      return null
    } finally {
      loading.value = false
    }
  }

  /** POST api/TipoPagos */
  async function create(tipoPago: TipoPagoRequestDto) {
    loading.value = true
    try {
      await api.post('/TipoPagos', tipoPago)
      notificarExito('Tipo de pago creado')
    } finally {
      loading.value = false
    }
  }

  /** PUT api/TipoPagos?Id=... */
  async function update(id: number, tipoPago: TipoPagoRequestDto) {
    loading.value = true
    try {
      await api.put(`/TipoPagos?Id=${id}`, tipoPago)
      notificarExito('Tipo de pago modificado')
    } finally {
      loading.value = false
    }
  }

  /** DELETE api/TipoPagos?Id=... (se llama borrar porque delete es palabra reservada) */
  async function borrar(id: number) {
    loading.value = true
    try {
      await api.delete(`/TipoPagos?Id=${id}`)
      notificarExito('Tipo de pago eliminado')
    } finally {
      loading.value = false
    }
  }

  return {
    tiposPago,
    loading,
    error,
    fetchAll,
    fetchById,
    create,
    update,
    borrar
  }
})
