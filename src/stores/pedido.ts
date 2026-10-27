import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isAxiosError } from 'axios'
import { api } from '../boot/axios'
import type { PedidoResponseDto } from '../models/Pedido/PedidoResponseDto'
import type { PedidoRequestDto } from '../models/Pedido/PedidoRequestDto'
import { notificarExito } from '../utils/notificar'

export const usePedidoStore = defineStore('pedido', () => {
  const pedidos = ref<PedidoResponseDto[]>([])
  // Estados validos del pedido (los define la API en EstadosPedido)
  const estados = ref<string[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** GET api/Pedidos/All */
  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<PedidoResponseDto[]>('/Pedidos/All')
      pedidos.value = data
    } catch (err: unknown) {
      pedidos.value = []
      if (isAxiosError(err)) {
        error.value = err.response
          ? `Error ${err.response.status} al obtener los pedidos`
          : 'No se pudo conectar con la API'
      } else {
        error.value = 'Error inesperado al obtener los pedidos'
      }
    } finally {
      loading.value = false
    }
  }

  /** GET api/Pedidos/ById?Id=... Devuelve el pedido o null si no existe. */
  async function fetchById(id: number): Promise<PedidoResponseDto | null> {
    loading.value = true
    try {
      const { data } = await api.get<PedidoResponseDto>(
        `/Pedidos/ById?Id=${id}`
      )
      return data
    } catch {
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * GET api/Pedidos/Estados
   * Los estados casi nunca cambian: si ya estan cargados, no se vuelven a pedir.
   */
  async function fetchEstados() {
    if (estados.value.length > 0) {
      return
    }
    try {
      const { data } = await api.get<string[]>('/Pedidos/Estados')
      estados.value = data
    } catch {
      estados.value = []
    }
  }

  /** POST api/Pedidos */
  async function create(pedido: PedidoRequestDto) {
    loading.value = true
    try {
      await api.post('/Pedidos', pedido)
      notificarExito('Pedido creado')
    } finally {
      loading.value = false
    }
  }

  /** PUT api/Pedidos?Id=... */
  async function update(id: number, pedido: PedidoRequestDto) {
    loading.value = true
    try {
      await api.put(`/Pedidos?Id=${id}`, pedido)
      notificarExito('Pedido modificado')
    } finally {
      loading.value = false
    }
  }

  /** DELETE api/Pedidos?Id=... (se llama borrar porque delete es palabra reservada) */
  async function borrar(id: number) {
    loading.value = true
    try {
      await api.delete(`/Pedidos?Id=${id}`)
      notificarExito('Pedido eliminado')
    } finally {
      loading.value = false
    }
  }

  return {
    pedidos,
    estados,
    loading,
    error,
    fetchAll,
    fetchById,
    fetchEstados,
    create,
    update,
    borrar
  }
})
