<template>
  <q-page padding>
    <q-card class="q-pa-md">
      <div class="row items-center q-gutter-sm">
        <div class="text-h6">Muebles</div>
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
          <q-tooltip>Nuevo mueble</q-tooltip>
        </q-btn>
        <q-btn
          flat
          round
          icon="refresh"
          :loading="muebleStore.loading"
          @click="recargar"
        >
          <q-tooltip>Actualizar</q-tooltip>
        </q-btn>
      </div>

      <q-card-section>
        <q-table
          :rows="muebleStore.muebles"
          :columns="columns"
          row-key="id"
          :filter="filtro"
          :loading="muebleStore.loading"
          :rows-per-page-options="[10, 20, 50, 0]"
          no-data-label="No hay muebles para mostrar"
          loading-label="Cargando muebles..."
        >
          <!-- Descripcion recortada con "..." y el texto completo en un tooltip -->
          <template #body-cell-descripcion="props">
            <q-td :props="props">
              <div class="ellipsis" style="max-width: 300px">
                {{ props.value }}
              </div>
              <q-tooltip max-width="400px" class="text-body2">
                {{ props.value }}
              </q-tooltip>
            </q-td>
          </template>

          <!-- Precio calculado: guion si no tiene receta; aviso si no coincide con el sugerido -->
          <template #body-cell-precioCalculado="props">
            <q-td :props="props">
              <span v-if="props.row.costoMateriales === 0" class="text-grey-5">
                Sin receta
              </span>
              <template v-else>
                <span>{{ props.value }}</span>
                <q-icon
                  v-if="props.row.precioCalculado !== props.row.precioSugerido"
                  name="warning"
                  :color="
                    props.row.precioSugerido < props.row.precioCalculado
                      ? 'negative'
                      : 'info'
                  "
                  class="q-ml-xs"
                >
                  <q-tooltip>
                    {{
                      props.row.precioSugerido < props.row.precioCalculado
                        ? 'El precio sugerido esta por debajo del calculado'
                        : 'El precio sugerido esta por encima del calculado'
                    }}
                  </q-tooltip>
                </q-icon>
              </template>
            </q-td>
          </template>

          <!-- Columna de acciones: receta, editar y eliminar -->
          <template #body-cell-acciones="props">
            <q-td class="text-right">
              <q-btn
                dense
                flat
                color="secondary"
                icon="receipt_long"
                :to="`/muebles/${props.row.id}/receta`"
              >
                <q-tooltip>Ver receta y costos</q-tooltip>
              </q-btn>
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

      <q-banner v-if="muebleStore.error" class="bg-negative text-white" rounded>
        {{ muebleStore.error }}
      </q-banner>
    </q-card>

    <!-- Alta y modificacion comparten el mismo formulario -->
    <q-dialog v-model="mostrarFormulario">
      <MuebleCreate :edit-id="editId" @close="cerrarFormulario" />
    </q-dialog>

    <!-- La baja siempre se confirma antes de ejecutarse -->
    <q-dialog v-model="confirmandoBaja">
      <q-card>
        <q-card-section class="row items-center">
          <q-icon name="warning" color="warning" size="sm" class="q-mr-sm" />
          <span class="text-h6">Confirmar</span>
        </q-card-section>
        <q-card-section
          >Se va a eliminar el mueble. Esta accion no se puede
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
import type { QTableColumn } from 'quasar'
import { useMuebleStore } from '../stores/mueble'
import type { MuebleResponseDto } from '../models/Mueble/MuebleResponseDto'
import MuebleCreate from '@/components/Mueble/MuebleCreate.vue'
import { mensajeDeError, notificarError } from '@/utils/notificar'

const muebleStore = useMuebleStore()

const filtro = ref('')
const mostrarFormulario = ref(false)
const editId = ref<number | null>(null)
const confirmandoBaja = ref(false)
const idABorrar = ref<number | null>(null)

function formatoMoneda(val: number) {
  return Number(val).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS'
  })
}

const columns: QTableColumn<MuebleResponseDto>[] = [
  { name: 'id', label: 'Id', field: 'id', align: 'left', sortable: true },
  {
    name: 'nombre',
    label: 'Nombre',
    field: 'nombre',
    align: 'left',
    sortable: true
  },
  {
    name: 'descripcion',
    label: 'Descripcion',
    field: 'descripcion',
    align: 'left',
    sortable: true
  },
  {
    name: 'precioSugerido',
    label: 'Precio sugerido',
    field: 'precioSugerido',
    align: 'right',
    sortable: true,
    format: (val: number) => formatoMoneda(val)
  },
  {
    name: 'precioCalculado',
    label: 'Precio calculado',
    field: 'precioCalculado',
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
  void muebleStore.fetchAll()
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
      await muebleStore.borrar(idABorrar.value)
    }
  } catch (err) {
    notificarError(mensajeDeError(err, 'No se pudo eliminar el mueble'))
  } finally {
    confirmandoBaja.value = false
    recargar()
  }
}

onMounted(() => {
  recargar()
})
</script>
