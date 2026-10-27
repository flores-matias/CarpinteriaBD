<template>
  <q-page padding>
    <q-card class="q-pa-md">
      <div class="row items-center q-gutter-sm">
        <div class="text-h6">Insumos</div>
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
          <q-tooltip>Nuevo insumo</q-tooltip>
        </q-btn>
        <q-btn
          flat
          round
          icon="refresh"
          :loading="insumoStore.loading"
          @click="recargar"
        >
          <q-tooltip>Actualizar</q-tooltip>
        </q-btn>
      </div>

      <q-card-section>
        <q-table
          :rows="insumoStore.insumos"
          :columns="columns"
          row-key="id"
          :filter="filtro"
          :loading="insumoStore.loading"
          :rows-per-page-options="[10, 20, 50, 0]"
          no-data-label="No hay insumos para mostrar"
          loading-label="Cargando insumos..."
        >
          <!-- Columna de acciones: editar, cambiar solo el precio y eliminar -->
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
                color="positive"
                icon="price_change"
                @click="abrirPrecio(props.row)"
              >
                <q-tooltip>Actualizar precio de costo</q-tooltip>
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

      <q-banner v-if="insumoStore.error" class="bg-negative text-white" rounded>
        {{ insumoStore.error }}
      </q-banner>
    </q-card>

    <!-- Alta y modificacion comparten el mismo formulario -->
    <q-dialog v-model="mostrarFormulario">
      <InsumoCreate :edit-id="editId" @close="cerrarFormulario" />
    </q-dialog>

    <!-- Cambio rapido de precio de costo (PATCH): no toca los demas datos -->
    <q-dialog v-model="mostrarPrecio">
      <q-card style="min-width: 340px">
        <q-card-section>
          <div class="text-h6">Actualizar precio</div>
          <div class="text-caption text-grey-7">{{ insumoPrecio?.nombre }}</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="text-body2 q-mb-sm">
            Precio actual:
            <strong>{{
              formatoMoneda(insumoPrecio?.precioCostoActual ?? 0)
            }}</strong>
          </div>
          <q-form ref="precioFormRef" greedy @submit.prevent="guardarPrecio">
            <q-input
              v-model.number="nuevoPrecio"
              label="Nuevo precio de costo"
              type="number"
              step="any"
              prefix="$"
              outlined
              autofocus
              lazy-rules
              :rules="[
                (v: number | string | null) =>
                  (v !== '' && v !== null && !isNaN(Number(v))) ||
                  'Ingresa el precio',
                (v: number | string | null) =>
                  Number(v) > 0 || 'El precio tiene que ser mayor a 0'
              ]"
            />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            label="Guardar"
            color="primary"
            :loading="insumoStore.loading"
            @click="guardarPrecio"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- La baja siempre se confirma antes de ejecutarse -->
    <q-dialog v-model="confirmandoBaja">
      <q-card>
        <q-card-section class="row items-center">
          <q-icon name="warning" color="warning" size="sm" class="q-mr-sm" />
          <span class="text-h6">Confirmar</span>
        </q-card-section>
        <q-card-section
          >Se va a eliminar el insumo. Esta accion no se puede
          deshacer.</q-card-section
        >
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
import type { QForm, QTableColumn } from 'quasar'
import { useInsumoStore } from '../stores/insumo'
import { useProveedorStore } from '../stores/proveedor'
import type { InsumoResponseDto } from '../models/Insumo/InsumoResponseDto'
import InsumoCreate from '@/components/Insumo/InsumoCreate.vue'
import { mensajeDeError, notificarError } from '@/utils/notificar'

const insumoStore = useInsumoStore()
const proveedorStore = useProveedorStore()

const filtro = ref('')
const mostrarFormulario = ref(false)
const editId = ref<number | null>(null)
const confirmandoBaja = ref(false)
const idABorrar = ref<number | null>(null)

// Dialogo de cambio de precio
const mostrarPrecio = ref(false)
const insumoPrecio = ref<InsumoResponseDto | null>(null)
const nuevoPrecio = ref<number | null>(null)
const precioFormRef = ref<QForm | null>(null)

function formatoMoneda(val: number) {
  return Number(val).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS'
  })
}

// Busca la razon social del proveedor a partir de su id
function nombreProveedor(idProveedor: number) {
  const proveedor = proveedorStore.proveedores.find(p => p.id === idProveedor)
  return proveedor ? proveedor.razonSocial : `#${idProveedor}`
}

const columns: QTableColumn<InsumoResponseDto>[] = [
  { name: 'id', label: 'Id', field: 'id', align: 'left', sortable: true },
  {
    name: 'nombre',
    label: 'Nombre',
    field: 'nombre',
    align: 'left',
    sortable: true
  },
  {
    name: 'proveedor',
    label: 'Proveedor',
    // Se muestra la razon social en lugar del id (tambien sirve para el buscador)
    field: row => nombreProveedor(row.idProveedor),
    align: 'left',
    sortable: true
  },
  {
    name: 'stockActual',
    label: 'Stock',
    field: 'stockActual',
    align: 'right',
    sortable: true,
    // Ej: 12,5 Metro
    format: (val: number, row: InsumoResponseDto) =>
      `${Number(val).toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${row.unidadMedida}`
  },
  {
    name: 'precioCostoActual',
    label: 'Precio de costo',
    field: 'precioCostoActual',
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
  void insumoStore.fetchAll()
  // Tambien se recargan los proveedores, para mostrar sus nombres en la tabla
  void proveedorStore.fetchAll()
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

function abrirPrecio(insumo: InsumoResponseDto) {
  insumoPrecio.value = insumo
  nuevoPrecio.value = insumo.precioCostoActual
  mostrarPrecio.value = true
}

async function guardarPrecio() {
  const valido = await precioFormRef.value?.validate()
  if (!valido || !insumoPrecio.value || nuevoPrecio.value === null) {
    return
  }
  try {
    await insumoStore.actualizarPrecio(insumoPrecio.value.id, nuevoPrecio.value)
    mostrarPrecio.value = false
    recargar()
  } catch (err) {
    notificarError(mensajeDeError(err, 'No se pudo actualizar el precio'))
  }
}

function confirmarBaja(id: number) {
  idABorrar.value = id
  confirmandoBaja.value = true
}

async function eliminar() {
  try {
    if (idABorrar.value !== null) {
      await insumoStore.borrar(idABorrar.value)
    }
  } catch (err) {
    notificarError(mensajeDeError(err, 'No se pudo eliminar el insumo'))
  } finally {
    confirmandoBaja.value = false
    recargar()
  }
}

onMounted(() => {
  recargar()
})
</script>
