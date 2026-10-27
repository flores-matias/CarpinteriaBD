<template>
  <q-page padding>
    <!-- Encabezado: volver + nombre del mueble -->
    <div class="row items-center q-mb-md q-gutter-sm">
      <q-btn flat round icon="arrow_back" to="/muebles">
        <q-tooltip>Volver a muebles</q-tooltip>
      </q-btn>
      <div class="text-h6">
        Receta: {{ costos ? costos.mueble : `Mueble #${idMueble}` }}
      </div>
      <q-space />
      <q-btn
        flat
        round
        icon="refresh"
        :loading="recetaMuebleStore.loading"
        @click="recargar"
      >
        <q-tooltip>Actualizar</q-tooltip>
      </q-btn>
    </div>

    <!-- Mueble inexistente -->
    <q-banner v-if="noEncontrado" class="bg-negative text-white" rounded>
      No se encontro el mueble #{{ idMueble }}.
    </q-banner>

    <template v-else-if="costos">
      <!-- Aviso si faltan los margenes en Configuracion -->
      <q-banner
        v-if="!costos.margenesConfigurados"
        class="bg-warning q-mb-md"
        rounded
      >
        <template #avatar>
          <q-icon name="warning" />
        </template>
        Faltan los margenes en Configuracion ("Mano de obra" y "Uso de
        maquinas"): el precio calculado solo incluye los materiales.
      </q-banner>

      <!-- Desglose del precio -->
      <q-card class="q-pa-md q-mb-md">
        <div class="text-subtitle1 text-weight-medium q-mb-sm"
          >Costo y precio</div
        >

        <div class="row q-col-gutter-lg">
          <!-- Columna izquierda: la cuenta -->
          <div class="col-12 col-md-6">
            <q-list dense>
              <q-item>
                <q-item-section>Materiales</q-item-section>
                <q-item-section side class="text-body1">
                  {{ formatoMoneda(costos.costoMateriales) }}
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  + Mano de obra
                  <q-item-label caption>
                    {{ formatoPorcentaje(costos.proporcionManoDeObra) }} de los
                    materiales
                  </q-item-label>
                </q-item-section>
                <q-item-section side class="text-body1">
                  {{ formatoMoneda(costos.manoDeObra) }}
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  + Uso de maquinas
                  <q-item-label caption>
                    {{ formatoPorcentaje(costos.proporcionUsoDeMaquinas) }} de
                    los materiales
                  </q-item-label>
                </q-item-section>
                <q-item-section side class="text-body1">
                  {{ formatoMoneda(costos.usoDeMaquinas) }}
                </q-item-section>
              </q-item>
              <q-separator class="q-my-xs" />
              <q-item>
                <q-item-section class="text-weight-bold"
                  >Precio calculado</q-item-section
                >
                <q-item-section side class="text-h6 text-primary">
                  {{ formatoMoneda(costos.precioCalculado) }}
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Columna derecha: comparacion con el precio sugerido -->
          <div class="col-12 col-md-6">
            <q-card flat bordered class="q-pa-md">
              <div class="text-caption text-grey-7">Precio sugerido actual</div>
              <div class="text-h5">{{
                formatoMoneda(costos.precioSugerido)
              }}</div>

              <div class="q-mt-sm">
                <q-chip
                  v-if="!costos.tieneReceta"
                  dense
                  square
                  color="grey-5"
                  text-color="white"
                  icon="info"
                >
                  Sin receta: no hay precio calculado
                </q-chip>
                <q-chip
                  v-else-if="costos.diferencia === 0"
                  dense
                  square
                  color="positive"
                  text-color="white"
                  icon="check"
                >
                  Coincide con el calculado
                </q-chip>
                <q-chip
                  v-else-if="costos.diferencia < 0"
                  dense
                  square
                  color="negative"
                  text-color="white"
                  icon="trending_down"
                >
                  {{ formatoMoneda(Math.abs(costos.diferencia)) }} por debajo
                  del calculado
                </q-chip>
                <q-chip
                  v-else
                  dense
                  square
                  color="info"
                  text-color="white"
                  icon="trending_up"
                >
                  {{ formatoMoneda(costos.diferencia) }} por encima del
                  calculado
                </q-chip>
              </div>

              <q-btn
                class="q-mt-md full-width"
                unelevated
                color="primary"
                icon="price_check"
                label="Usar precio calculado"
                :disable="!puedeUsarCalculado"
                :loading="muebleStore.loading"
                @click="usarPrecioCalculado"
              >
                <q-tooltip v-if="!puedeUsarCalculado">
                  {{
                    !costos.tieneReceta
                      ? 'Carga la receta para calcular el precio'
                      : 'El precio sugerido ya coincide'
                  }}
                </q-tooltip>
              </q-btn>
              <div class="text-caption text-grey-7 q-mt-sm">
                Para un precio distinto (ej: redondeado), edita el mueble desde
                la lista.
              </div>
            </q-card>
          </div>
        </div>
      </q-card>

      <!-- Insumos de la receta -->
      <q-card class="q-pa-md">
        <div class="row items-center q-gutter-sm">
          <div class="text-subtitle1 text-weight-medium">Insumos</div>
          <q-space />
          <q-btn
            unelevated
            color="primary"
            icon="add"
            label="Agregar insumo"
            @click="abrirAlta"
          />
        </div>

        <q-card-section>
          <q-table
            :rows="recetaMuebleStore.receta"
            :columns="columns"
            row-key="id"
            :loading="recetaMuebleStore.loading"
            :rows-per-page-options="[0]"
            hide-pagination
            no-data-label="El mueble todavia no tiene receta"
            loading-label="Cargando receta..."
          >
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
                  <q-tooltip>Quitar de la receta</q-tooltip>
                </q-btn>
              </q-td>
            </template>

            <!-- Fila final con el costo total de materiales -->
            <template v-if="recetaMuebleStore.receta.length > 0" #bottom-row>
              <q-tr>
                <q-td colspan="3" class="text-right text-weight-medium"
                  >Total materiales</q-td
                >
                <q-td class="text-right text-weight-bold">
                  {{ formatoMoneda(costos.costoMateriales) }}
                </q-td>
                <q-td />
              </q-tr>
            </template>
          </q-table>
        </q-card-section>

        <q-banner
          v-if="recetaMuebleStore.error"
          class="bg-negative text-white"
          rounded
        >
          {{ recetaMuebleStore.error }}
        </q-banner>
      </q-card>
    </template>

    <!-- Alta y modificacion comparten el mismo formulario -->
    <q-dialog v-model="mostrarFormulario">
      <RecetaMuebleCreate
        :edit-id="editId"
        :id-mueble="idMueble"
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
          Se va a quitar el insumo de la receta.
          <div class="text-caption text-grey-7 q-mt-sm">
            El precio calculado se va a actualizar. El precio sugerido no
            cambia.
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
import { useRecetaMuebleStore } from '../stores/recetaMueble'
import { useMuebleStore } from '../stores/mueble'
import type { RecetaMuebleResponseDto } from '../models/RecetaMueble/RecetaMuebleResponseDto'
import type { MuebleCostoDto } from '../models/Mueble/MuebleCostoDto'
import RecetaMuebleCreate from '@/components/RecetaMueble/RecetaMuebleCreate.vue'
import { mensajeDeError, notificarError } from '@/utils/notificar'

const route = useRoute()
const recetaMuebleStore = useRecetaMuebleStore()
const muebleStore = useMuebleStore()

// El id del mueble viene en la URL: /muebles/1/receta
const idMueble = Number(route.params.id)

const costos = ref<MuebleCostoDto | null>(null)
const noEncontrado = ref(false)

const mostrarFormulario = ref(false)
const editId = ref<number | null>(null)
const confirmandoBaja = ref(false)
const idABorrar = ref<number | null>(null)

// El boton solo tiene sentido si hay receta y el sugerido es distinto al calculado
const puedeUsarCalculado = computed(
  () =>
    !!costos.value && costos.value.tieneReceta && costos.value.diferencia !== 0
)

function formatoMoneda(val: number) {
  return Number(val).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS'
  })
}

// 1.5 -> '150%'   0.1 -> '10%'
function formatoPorcentaje(proporcion: number) {
  return `${(proporcion * 100).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`
}

// 1.15 -> '1,15'
function formatoCantidad(val: number) {
  return Number(val).toLocaleString('es-AR', { maximumFractionDigits: 2 })
}

const columns: QTableColumn<RecetaMuebleResponseDto>[] = [
  {
    name: 'insumo',
    label: 'Insumo',
    field: 'insumo',
    align: 'left',
    sortable: true
  },
  {
    name: 'cantidadConDesperdicio',
    label: 'Cantidad',
    field: 'cantidadConDesperdicio',
    align: 'center',
    sortable: true,
    // Ej: 1,15 Metro
    format: (val: number, row: RecetaMuebleResponseDto) =>
      `${formatoCantidad(val)} ${row.unidadMedida}`
  },
  {
    name: 'precioCostoActual',
    label: 'Costo unitario',
    field: 'precioCostoActual',
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

// Se recargan los dos: la receta y el desglose de costos (cambia con cada operacion)
async function recargar() {
  const [datosCostos] = await Promise.all([
    muebleStore.fetchCostos(idMueble),
    recetaMuebleStore.fetchByMueble(idMueble)
  ])
  costos.value = datosCostos
  noEncontrado.value = datosCostos === null
}

async function usarPrecioCalculado() {
  try {
    await muebleStore.usarPrecioCalculado(idMueble)
    await recargar()
  } catch (err) {
    notificarError(
      mensajeDeError(err, 'No se pudo actualizar el precio sugerido')
    )
  }
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
      await recetaMuebleStore.borrar(idABorrar.value)
    }
  } catch (err) {
    notificarError(
      mensajeDeError(err, 'No se pudo quitar el insumo de la receta')
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
