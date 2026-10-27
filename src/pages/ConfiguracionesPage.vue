<template>
  <q-page padding>
    <q-card class="q-pa-md">
      <div class="row items-center q-gutter-sm">
        <div class="text-h6">Configuraciones</div>
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
          <q-tooltip>Nueva configuracion</q-tooltip>
        </q-btn>
        <q-btn
          flat
          round
          icon="refresh"
          :loading="configuracionStore.loading"
          @click="recargar"
        >
          <q-tooltip>Actualizar</q-tooltip>
        </q-btn>
      </div>

      <q-card-section>
        <q-table
          :rows="configuracionStore.configuraciones"
          :columns="columns"
          row-key="id"
          :filter="filtro"
          :loading="configuracionStore.loading"
          :rows-per-page-options="[10, 20, 50, 0]"
          no-data-label="No hay configuraciones para mostrar"
          loading-label="Cargando configuraciones..."
        >
          <!-- Descripcion recortada con "..." y el texto completo en un tooltip -->
          <template #body-cell-descripcion="props">
            <q-td :props="props">
              <div class="ellipsis" style="max-width: 350px">
                {{ props.value }}
              </div>
              <q-tooltip max-width="400px" class="text-body2">
                {{ props.value }}
              </q-tooltip>
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

      <q-banner
        v-if="configuracionStore.error"
        class="bg-negative text-white"
        rounded
      >
        {{ configuracionStore.error }}
      </q-banner>
    </q-card>

    <!-- Alta y modificacion comparten el mismo formulario -->
    <q-dialog v-model="mostrarFormulario">
      <ConfiguracionCreate :edit-id="editId" @close="cerrarFormulario" />
    </q-dialog>

    <!-- La baja siempre se confirma antes de ejecutarse -->
    <q-dialog v-model="confirmandoBaja">
      <q-card>
        <q-card-section class="row items-center">
          <q-icon name="warning" color="warning" size="sm" class="q-mr-sm" />
          <span class="text-h6">Confirmar</span>
        </q-card-section>
        <q-card-section
          >Se va a eliminar la configuracion. Esta accion no se puede
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
import { useConfiguracionStore } from '../stores/configuracion'
import type { ConfiguracionResponseDto } from '../models/Configuracion/ConfiguracionResponseDto'
import ConfiguracionCreate from '@/components/Configuracion/ConfiguracionCreate.vue'
import { mensajeDeError, notificarError } from '@/utils/notificar'

const configuracionStore = useConfiguracionStore()

const filtro = ref('')
const mostrarFormulario = ref(false)
const editId = ref<number | null>(null)
const confirmandoBaja = ref(false)
const idABorrar = ref<number | null>(null)

const columns: QTableColumn<ConfiguracionResponseDto>[] = [
  { name: 'id', label: 'Id', field: 'id', align: 'left', sortable: true },
  {
    name: 'clave',
    label: 'Clave',
    field: 'clave',
    align: 'left',
    sortable: true
  },
  {
    name: 'valor',
    label: 'Valor',
    field: 'valor',
    align: 'right',
    sortable: true,
    // Se muestra con formato argentino: 1.234,56
    format: (val: number) =>
      Number(val).toLocaleString('es-AR', { maximumFractionDigits: 2 })
  },
  {
    name: 'descripcion',
    label: 'Descripcion',
    field: 'descripcion',
    align: 'left',
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
  void configuracionStore.fetchAll()
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
      await configuracionStore.borrar(idABorrar.value)
    }
  } catch (err) {
    notificarError(mensajeDeError(err, 'No se pudo eliminar la configuracion'))
  } finally {
    confirmandoBaja.value = false
    recargar()
  }
}

onMounted(() => {
  recargar()
})
</script>
