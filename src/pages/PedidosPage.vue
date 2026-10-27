<template>
  <q-page padding>
    <q-card class="q-pa-md">
      <div class="row items-center q-gutter-sm">
        <div class="text-h6">Pedidos</div>
        <q-space />
        <q-input
          v-model="filtro"
          dense
          outlined
          placeholder="Buscar"
          debounce="300"
          style="width: 220px"
        >
          <template #append>
            <q-icon v-if="filtro === ''" name="search" />
            <q-icon
              v-else
              name="close"
              class="cursor-pointer"
              @click="filtro = ''"
            />
          </template>
        </q-input>
        <q-btn round unelevated color="primary" icon="add" @click="abrirAlta">
          <q-tooltip>Nuevo pedido</q-tooltip>
        </q-btn>
        <q-btn
          flat
          round
          icon="refresh"
          :loading="pedidoStore.loading"
          @click="recargar"
        >
          <q-tooltip>Actualizar</q-tooltip>
        </q-btn>
      </div>

      <q-card-section>
        <q-table
          :rows="pedidoStore.pedidos"
          :columns="columns"
          row-key="id"
          :filter="filtro"
          :loading="pedidoStore.loading"
          :rows-per-page-options="[10, 20, 50, 0]"
          no-data-label="No hay pedidos para mostrar"
          loading-label="Cargando pedidos..."
        >
          <!-- Fecha de entrega: en rojo si esta vencida y el pedido sigue abierto -->
          <template #body-cell-fechaEntregaPrometida="props">
            <q-td :props="props">
              <span
                :class="
                  estaAtrasado(props.row)
                    ? 'text-negative text-weight-bold'
                    : ''
                "
              >
                {{ props.value }}
              </span>
              <q-icon
                v-if="estaAtrasado(props.row)"
                name="schedule"
                color="negative"
                class="q-ml-xs"
              >
                <q-tooltip>Entrega atrasada</q-tooltip>
              </q-icon>
            </q-td>
          </template>

          <!-- Saldo: resaltado si falta pagar; el tooltip muestra lo pagado -->
          <template #body-cell-saldo="props">
            <q-td :props="props">
              <span
                :class="
                  props.row.saldo > 0 ? 'text-negative text-weight-medium' : ''
                "
              >
                {{ props.value }}
              </span>
              <q-tooltip>
                Pagado: {{ formatoMoneda(props.row.totalPagado) }}
              </q-tooltip>
            </q-td>
          </template>

          <!-- Estado del pedido con color -->
          <template #body-cell-estadoPedido="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                text-color="white"
                :color="colorEstadoPedido(props.value)"
              >
                {{ props.value }}
              </q-chip>
            </q-td>
          </template>

          <!-- Estado de pago con color -->
          <template #body-cell-estadoPago="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                text-color="white"
                :color="colorEstadoPago(props.value)"
              >
                {{ props.value }}
              </q-chip>
            </q-td>
          </template>

          <!-- Columna de acciones: un boton por cada operacion del ABM -->
          <template #body-cell-acciones="props">
            <q-td class="text-right">
              <q-btn
                dense
                flat
                color="primary"
                icon="edit"
                @click="abrirEdicion(props.row.id)"
              >
                <q-tooltip>Editar</q-tooltip>
              </q-btn>
              <q-btn
                dense
                flat
                color="negative"
                icon="delete"
                @click="confirmarBaja(props.row.id)"
              >
                <q-tooltip>Eliminar</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <q-banner v-if="pedidoStore.error" class="bg-negative text-white" rounded>
        {{ pedidoStore.error }}
      </q-banner>
    </q-card>

    <!-- Alta y modificacion comparten el mismo formulario -->
    <q-dialog v-model="mostrarFormulario">
      <PedidoCreate :edit-id="editId" @close="cerrarFormulario" />
    </q-dialog>

    <!-- La baja siempre se confirma antes de ejecutarse -->
    <q-dialog v-model="confirmandoBaja">
      <q-card>
        <q-card-section class="row items-center">
          <q-icon name="warning" color="warning" size="sm" class="q-mr-sm" />
          <span class="text-h6">Confirmar</span>
        </q-card-section>
        <q-card-section>
          Se va a eliminar el pedido. Esta accion no se puede deshacer.
          <div class="text-caption text-grey-7 q-mt-sm">
            Si el pedido ya tiene muebles o pagos cargados, no se va a poder
            eliminar: en ese caso, cambiale el estado a "Cancelado".
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Eliminar" color="negative" @click="eliminar" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { date, type QTableColumn } from 'quasar'
import { usePedidoStore } from '../stores/pedido'
import type { PedidoResponseDto } from '../models/Pedido/PedidoResponseDto'
import PedidoCreate from '@/components/Pedido/PedidoCreate.vue'
import { mensajeDeError, notificarError } from '@/utils/notificar'

const pedidoStore = usePedidoStore()

const filtro = ref('')
const mostrarFormulario = ref(false)
const editId = ref<number | null>(null)
const confirmandoBaja = ref(false)
const idABorrar = ref<number | null>(null)

const hoy = date.formatDate(Date.now(), 'YYYY-MM-DD')

// '2026-11-15T00:00:00' -> '15/11/2026'
function formatoFecha(iso: string) {
  return iso ? iso.substring(0, 10).split('-').reverse().join('/') : ''
}

function formatoMoneda(val: number) {
  return Number(val).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS'
  })
}

// Atrasado: la fecha de entrega ya paso y el pedido no se entrego ni se cancelo
function estaAtrasado(pedido: PedidoResponseDto) {
  const cerrado = ['Entregado', 'Cancelado'].includes(pedido.estadoPedido)
  return !cerrado && pedido.fechaEntregaPrometida.substring(0, 10) < hoy
}

function colorEstadoPedido(estado: string) {
  switch (estado) {
    case 'Pendiente':
      return 'grey-7'
    case 'En producción':
      return 'primary'
    case 'Terminado':
      return 'teal'
    case 'Entregado':
      return 'positive'
    case 'Cancelado':
      return 'negative'
    default:
      return 'grey-5'
  }
}

function colorEstadoPago(estado: string) {
  switch (estado) {
    case 'Pendiente':
      return 'negative'
    case 'Parcial':
      return 'warning'
    case 'Pagado':
      return 'positive'
    default:
      return 'grey-5'
  }
}

const columns: QTableColumn<PedidoResponseDto>[] = [
  { name: 'id', label: 'Id', field: 'id', align: 'left', sortable: true },
  {
    name: 'cliente',
    label: 'Cliente',
    field: 'cliente',
    align: 'left',
    sortable: true
  },
  {
    name: 'fechaCreacion',
    label: 'Creado',
    field: 'fechaCreacion',
    align: 'center',
    sortable: true,
    format: (val: string) => formatoFecha(val)
  },
  {
    name: 'fechaEntregaPrometida',
    label: 'Entrega',
    field: 'fechaEntregaPrometida',
    align: 'center',
    sortable: true,
    format: (val: string) => formatoFecha(val)
  },
  {
    name: 'totalAPagar',
    label: 'Total',
    field: 'totalAPagar',
    align: 'right',
    sortable: true,
    format: (val: number) => formatoMoneda(val)
  },
  {
    name: 'saldo',
    label: 'Saldo',
    field: 'saldo',
    align: 'right',
    sortable: true,
    format: (val: number) => formatoMoneda(val)
  },
  {
    name: 'estadoPedido',
    label: 'Estado',
    field: 'estadoPedido',
    align: 'center',
    sortable: true
  },
  {
    name: 'estadoPago',
    label: 'Pago',
    field: 'estadoPago',
    align: 'center',
    sortable: true
  },
  {
    name: 'acciones',
    label: 'Acciones',
    field: 'id',
    align: 'right',
    sortable: false
  }
]

function recargar() {
  void pedidoStore.fetchAll()
}

function abrirAlta() {
  editId.value = null
  mostrarFormulario.value = true
}

function abrirEdicion(id: number) {
  editId.value = id
  mostrarFormulario.value = true
}

function cerrarFormulario() {
  mostrarFormulario.value = false
  recargar()
}

function confirmarBaja(id: number) {
  idABorrar.value = id
  confirmandoBaja.value = true
}

async function eliminar() {
  try {
    if (idABorrar.value !== null) {
      await pedidoStore.borrar(idABorrar.value)
    }
  } catch (err) {
    notificarError(mensajeDeError(err, 'No se pudo eliminar el pedido'))
  } finally {
    confirmandoBaja.value = false
    recargar()
  }
}

onMounted(() => {
  recargar()
})
</script>
