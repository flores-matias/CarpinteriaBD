import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isAxiosError } from 'axios'
import { api } from '../boot/axios'
import type { DetallePedidoResponseDto } from '../models/DetallePedido/DetallePedidoResponseDto'
import type { DetallePedidoRequestDto } from '../models/DetallePedido/DetallePedidoRequestDto'
import { notificarExito } from '../utils/notificar'

export const useDetallePedidoStore = defineStore('detallePedido', () => {
  // Detalles del pedido que se esta viendo (no de todos los pedidos)
  const detalles = ref<DetallePedidoResponseDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** GET api/DetallePedidos/ByPedido?IdPedido=... Solo los muebles de un pedido. */
  async function fetchByPedido(idPedido: number) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<DetallePedidoResponseDto[]>(
        `/DetallePedidos/ByPedido?IdPedido=${idPedido}`
      )
      detalles.value = data
    } catch (err: unknown) {
      detalles.value = []
      if (isAxiosError(err)) {
        error.value = err.response
          ? `Error ${err.response.status} al obtener los muebles del pedido`
          : 'No se pudo conectar con la API'
      } else {
        error.value = 'Error inesperado al obtener los muebles del pedido'
      }
    } finally {
      loading.value = false
    }
  }

  /** GET api/DetallePedidos/ById?id=... Devuelve el detalle o null si no existe. */
  async function fetchById(
    id: number
  ): Promise<DetallePedidoResponseDto | null> {
    loading.value = true
    try {
      const { data } = await api.get<DetallePedidoResponseDto>(
        `/DetallePedidos/ById?id=${id}`
      )
      return data
    } catch {
      return null
    } finally {
      loading.value = false
    }
  }

  /** POST api/DetallePedidos (la API recalcula el total del pedido) */
  async function create(detalle: DetallePedidoRequestDto) {
    loading.value = true
    try {
      await api.post('/DetallePedidos', detalle)
      notificarExito('Mueble agregado al pedido')
    } finally {
      loading.value = false
    }
  }

  /** PUT api/DetallePedidos?id=... (la API recalcula el total del pedido) */
  async function update(id: number, detalle: DetallePedidoRequestDto) {
    loading.value = true
    try {
      await api.put(`/DetallePedidos?id=${id}`, detalle)
      notificarExito('Mueble del pedido modificado')
    } finally {
      loading.value = false
    }
  }

  /** DELETE api/DetallePedidos?id=... (la API recalcula el total del pedido) */
  async function borrar(id: number) {
    loading.value = true
    try {
      await api.delete(`/DetallePedidos?id=${id}`)
      notificarExito('Mueble quitado del pedido')
    } finally {
      loading.value = false
    }
  }

  return {
    detalles,
    loading,
    error,
    fetchByPedido,
    fetchById,
    create,
    update,
    borrar
  }
})
