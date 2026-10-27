<template>
  <q-page padding>
    <q-card class="q-pa-md">
      <div class="row items-center q-gutter-sm">
        <div class="text-h6">Pagos</div>
        <q-chip
          v-if="pagoStore.pagos.length > 0"
          dense
          square
          color="positive"
          text-color="white"
          icon="payments"
        >
          Total cobrado: {{ formatoMoneda(totalCobrado) }}
        </q-chip>
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
          <q-tooltip>Registrar pago</q-tooltip>
        </q-btn>
        <q-btn
          flat
          round
          icon="refresh"
          :loading="pagoStore.loading"
          @click="recargar"
        >
          <q-tooltip>Actualizar</q-tooltip>
        </q-btn>
      </div>

      <q-card-section>
        <q-table
          v-model:pagination="paginacion"
          :rows="pagoStore.pagos"
          :columns="columns"
          row-key="id"
          :filter="filtro"
          :loading="pagoStore.loading"
          :rows-per-page-options="[10, 20, 50, 0]"
          no-data-label="No hay pagos para mostrar"
          loading-label="Cargando pagos..."
        >
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

      <q-banner v-if="pagoStore.error" class="bg-negative text-white" rounded>
        {{ pagoStore.error }}
      </q-banner>
    </q-card>

    <!-- Alta y modificacion comparten el mismo formulario -->
    <q-dialog v-model="mostrarFormulario">
      <PagoCreate :edit-id="editId" @close="cerrarFormulario" />
    </q-dialog>

    <!-- La baja siempre se confirma antes de ejecutarse -->
    <q-dialog v-model="confirmandoBaja">
      <q-card>
        <q-card-section class="row items-center">
          <q-icon name="warning" color="warning" size="sm" class="q-mr-sm" />
          <span class="text-h6">Confirmar</span>
        </q-card-section>
        <q-card-section>
          Se va a eliminar el pago. Esta accion no se puede deshacer.
          <div class="text-caption text-grey-7 q-mt-sm">
            El saldo y el estado de pago del pedido se van a recalcular.
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
import { computed, onMounted, ref } from 'vue'
import type { QTableColumn } from 'quasar'
import { usePagoStore } from '../stores/pago'
import type { PagoResponseDto } from '../models/Pago/PagoResponseDto'
import PagoCreate from '@/components/Pago/PagoCreate.vue'
import { mensajeDeError, notificarError } from '@/utils/notificar'

const pagoStore = usePagoStore()

const filtro = ref('')
const mostrarFormulario = ref(false)
const editId = ref<number | null>(null)
const confirmandoBaja = ref(false)
const idABorrar = ref<number | null>(null)

// La tabla arranca ordenada por fecha, de la mas reciente a la mas vieja
const paginacion = ref({
  sortBy: 'fechaPago',
  descending: true,
  page: 1,
  rowsPerPage: 10
})

const totalCobrado = computed(() =>
  pagoStore.pagos.reduce((suma, pago) => suma + pago.monto, 0)
)

// '2026-10-27T00:00:00' -> '27/10/2026'
function formatoFecha(iso: string) {
  return iso ? iso.substring(0, 10).split('-').reverse().join('/') : ''
}

function formatoMoneda(val: number) {
  return Number(val).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS'
  })
}

const columns: QTableColumn<PagoResponseDto>[] = [
  { name: 'id', label: 'Id', field: 'id', align: 'left', sortable: true },
  {
    name: 'fechaPago',
    label: 'Fecha',
    field: 'fechaPago',
    align: 'center',
    sortable: true,
    format: (val: string) => formatoFecha(val)
  },
  {
    name: 'idPedido',
    label: 'Pedido',
    field: 'idPedido',
    align: 'center',
    sortable: true,
    format: (val: number) => `#${val}`
  },
  {
    name: 'cliente',
    label: 'Cliente',
    field: 'cliente',
    align: 'left',
    sortable: true
  },
  {
    name: 'tipoPago',
    label: 'Tipo de pago',
    field: 'tipoPago',
    align: 'left',
    sortable: true
  },
  {
    name: 'monto',
    label: 'Monto',
    field: 'monto',
    align: 'right',
    sortable: true,
    format: (val: number) => formatoMoneda(val)
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
  void pagoStore.fetchAll()
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
      await pagoStore.borrar(idABorrar.value)
    }
  } catch (err) {
    notificarError(mensajeDeError(err, 'No se pudo eliminar el pago'))
  } finally {
    confirmandoBaja.value = false
    recargar()
  }
}

onMounted(() => {
  recargar()
})
</script>
