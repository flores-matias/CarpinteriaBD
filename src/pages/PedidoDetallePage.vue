<template>
  <q-page padding>
    <!-- Encabezado: volver + datos del pedido -->
    <div class="row items-center q-mb-md q-gutter-sm">
      <q-btn flat round icon="arrow_back" to="/pedidos">
        <q-tooltip>Volver a pedidos</q-tooltip>
      </q-btn>
      <div class="text-h6">Pedido #{{ idPedido }}</div>
      <template v-if="pedido">
        <q-chip
          dense
          square
          text-color="white"
          :color="colorEstadoPedido(pedido.estadoPedido)"
        >
          {{ pedido.estadoPedido }}
        </q-chip>
        <q-chip
          dense
          square
          text-color="white"
          :color="colorEstadoPago(pedido.estadoPago)"
        >
          Pago: {{ pedido.estadoPago }}
        </q-chip>
      </template>
      <q-space />
      <q-btn
        flat
        round
        icon="refresh"
        :loading="detallePedidoStore.loading"
        @click="recargar"
      >
        <q-tooltip>Actualizar</q-tooltip>
      </q-btn>
    </div>

    <!-- Pedido inexistente -->
    <q-banner v-if="noEncontrado" class="bg-negative text-white" rounded>
      No se encontro el pedido #{{ idPedido }}.
    </q-banner>

    <template v-else-if="pedido">
      <!-- Resumen -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="q-pa-sm">
            <div class="text-caption text-grey-7">Cliente</div>
            <div class="text-subtitle1">{{ pedido.cliente }}</div>
            <div class="text-caption text-grey-7">
              Entrega: {{ formatoFecha(pedido.fechaEntregaPrometida) }}
            </div>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="q-pa-sm">
            <div class="text-caption text-grey-7">Total</div>
            <div class="text-h6">{{ formatoMoneda(pedido.totalAPagar) }}</div>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="q-pa-sm">
            <div class="text-caption text-grey-7">Pagado</div>
            <div class="text-h6 text-positive">{{
              formatoMoneda(pedido.totalPagado)
            }}</div>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="q-pa-sm">
            <div class="text-caption text-grey-7">Saldo</div>
            <div
              class="text-h6"
              :class="pedido.saldo > 0 ? 'text-negative' : ''"
            >
              {{ formatoMoneda(pedido.saldo) }}
            </div>
          </q-card>
        </div>
      </div>

      <!-- Aviso si el pedido esta cerrado: no se pueden cambiar sus muebles -->
      <q-banner v-if="estaCerrado" class="bg-grey-3 q-mb-md" rounded>
        <template #avatar>
          <q-icon name="lock" color="grey-7" />
        </template>
        El pedido esta {{ pedido.estadoPedido.toLowerCase() }}: sus muebles ya
        no se pueden modificar.
      </q-banner>

      <!-- Muebles del pedido -->
      <q-card class="q-pa-md">
        <div class="row items-center q-gutter-sm">
          <div class="text-subtitle1 text-weight-medium">Muebles</div>
          <q-space />
          <q-btn
            v-if="!estaCerrado"
            unelevated
            color="primary"
            icon="add"
            label="Agregar mueble"
            @click="abrirAlta"
          />
        </div>

        <q-card-section>
          <q-table
            :rows="detallePedidoStore.detalles"
            :columns="columns"
            row-key="id"
            :loading="detallePedidoStore.loading"
            :rows-per-page-options="[0]"
            hide-pagination
            no-data-label="El pedido todavia no tiene muebles"
            loading-label="Cargando muebles..."
          >
            <!-- Columna de acciones (oculta si el pedido esta cerrado) -->
            <template #body-cell-acciones="props">
              <q-td class="text-right">
                <template v-if="!estaCerrado">
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
                    <q-tooltip>Quitar del pedido</q-tooltip>
                  </q-btn>
                </template>
              </q-td>
            </template>

            <!-- Fila final con el total de los muebles -->
            <template v-if="detallePedidoStore.detalles.length > 0" #bottom-row>
              <q-tr>
                <q-td colspan="3" class="text-right text-weight-medium"
                  >Total</q-td
                >
                <q-td class="text-right text-weight-bold">
                  {{ formatoMoneda(totalDetalles) }}
                </q-td>
                <q-td />
              </q-tr>
            </template>
          </q-table>
        </q-card-section>

        <q-banner
          v-if="detallePedidoStore.error"
          class="bg-negative text-white"
          rounded
        >
          {{ detallePedidoStore.error }}
        </q-banner>
      </q-card>
    </template>

    <!-- Alta y modificacion comparten el mismo formulario -->
    <q-dialog v-model="mostrarFormulario">
      <DetallePedidoCreate
        :edit-id="editId"
        :id-pedido="idPedido"
        @close="cerrarFormulario"
      />
    </q-dialog>

    <!-- La baja siempre se confirma antes de ejecutarse -->
    <q-dialog v-model="confirmandoBaja">
      <q-card>
        <q-card-section class="row items-center">
          <q-icon name="warning" color="warning" size="sm" class="q-mr-sm" />
          <span class="text-h6">Confirmar</span>
        </q-card-section>
        <q-card-section>
          Se va a quitar el mueble del pedido.
          <div class="text-caption text-grey-7 q-mt-sm">
            El total del pedido se va a recalcular.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Quitar" color="negative" @click="eliminar" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { QTableColumn } from 'quasar'
import { useDetallePedidoStore } from '../stores/detallePedido'
import { usePedidoStore } from '../stores/pedido'
import type { DetallePedidoResponseDto } from '../models/DetallePedido/DetallePedidoResponseDto'
import type { PedidoResponseDto } from '../models/Pedido/PedidoResponseDto'
import DetallePedidoCreate from '@/components/DetallePedido/DetallePedidoCreate.vue'
import { mensajeDeError, notificarError } from '@/utils/notificar'

const route = useRoute()
const detallePedidoStore = useDetallePedidoStore()
const pedidoStore = usePedidoStore()

// El id del pedido viene en la URL: /pedidos/4/detalle
const idPedido = Number(route.params.id)

const pedido = ref<PedidoResponseDto | null>(null)
const noEncontrado = ref(false)

const mostrarFormulario = ref(false)
const editId = ref<number | null>(null)
const confirmandoBaja = ref(false)
const idABorrar = ref<number | null>(null)

// Entregado o Cancelado: misma regla que Pedido.EstaCerrado en la API
const estaCerrado = computed(
  () =>
    !!pedido.value &&
    ['Entregado', 'Cancelado'].includes(pedido.value.estadoPedido)
)

const totalDetalles = computed(() =>
  detallePedidoStore.detalles.reduce((suma, d) => suma + d.subtotal, 0)
)

function formatoMoneda(val: number) {
  return Number(val).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS'
  })
}

// '2026-11-15T00:00:00' -> '15/11/2026'
function formatoFecha(iso: string) {
  return iso ? iso.substring(0, 10).split('-').reverse().join('/') : ''
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

const columns: QTableColumn<DetallePedidoResponseDto>[] = [
  {
    name: 'mueble',
    label: 'Mueble',
    field: 'mueble',
    align: 'left',
    sortable: true
  },
  {
    name: 'cantidad',
    label: 'Cantidad',
    field: 'cantidad',
    align: 'center',
    sortable: true
  },
  {
    name: 'precioVentaReal',
    label: 'Precio unitario',
    field: 'precioVentaReal',
    align: 'right',
    sortable: true,
    format: (val: number) => formatoMoneda(val)
  },
  {
    name: 'subtotal',
    label: 'Subtotal',
    field: 'subtotal',
    align: 'right',
    sortable: true,
    format: (val: number) => formatoMoneda(val)
  },
  { name: 'acciones', label: '', field: 'id', align: 'right', sortable: false }
]

// Se recargan los dos: los muebles y el pedido (su total y saldo cambian con cada operacion)
async function recargar() {
  const [datosPedido] = await Promise.all([
    pedidoStore.fetchById(idPedido),
    detallePedidoStore.fetchByPedido(idPedido)
  ])
  pedido.value = datosPedido
  noEncontrado.value = datosPedido === null
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
  void recargar()
}

function confirmarBaja(id: number) {
  idABorrar.value = id
  confirmandoBaja.value = true
}

async function eliminar() {
  try {
    if (idABorrar.value !== null) {
      await detallePedidoStore.borrar(idABorrar.value)
    }
  } catch (err) {
    notificarError(
      mensajeDeError(err, 'No se pudo quitar el mueble del pedido')
    )
  } finally {
    confirmandoBaja.value = false
    void recargar()
  }
}

onMounted(() => {
  void recargar()
})
</script>
