<template>
  <q-card style="min-width: 420px">
    <q-card-section>
      <div class="text-h6">
        {{
          editId ? 'Editar insumo de la receta' : 'Agregar insumo a la receta'
        }}
      </div>
    </q-card-section>
    <q-separator />

    <q-card-section>
      <q-form ref="formRef" greedy @submit.prevent="onSubmit">
        <!-- Solo insumos que todavia no estan en la receta (la API no permite repetirlos) -->
        <q-select
          v-model="form.idInsumo"
          :options="insumosDisponibles"
          option-value="id"
          option-label="nombre"
          emit-value
          map-options
          label="Insumo"
          outlined
          class="q-mb-sm"
          :loading="insumoStore.loading"
          lazy-rules
          :rules="[(v: number | null) => !!v || 'Selecciona un insumo']"
        >
          <!-- Cada opcion muestra tambien su precio de costo y unidad -->
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.nombre }}</q-item-label>
                <q-item-label caption>
                  {{ formatoMoneda(scope.opt.precioCostoActual) }} por
                  {{ scope.opt.unidadMedida.toLowerCase() }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">
                {{
                  insumoStore.insumos.length === 0
                    ? 'No hay insumos cargados. Agregalos desde Insumos.'
                    : 'Todos los insumos ya estan en la receta'
                }}
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <!-- Cantidad con desperdicio: admite decimales (ej: 1,15 metros) -->
        <q-input
          v-model.number="form.cantidadConDesperdicio"
          label="Cantidad (con desperdicio)"
          type="number"
          step="0.01"
          :suffix="insumoElegido?.unidadMedida"
          outlined
          hint="Inclui lo que se pierde al cortar (ej: 1 metro + 15% = 1,15)"
          lazy-rules
          :rules="[
            (v: number | string) =>
              (v !== '' && v !== null && !isNaN(Number(v))) ||
              'Ingresa la cantidad',
            (v: number | string) => Number(v) > 0 || 'Tiene que ser mayor a 0'
          ]"
        />

        <!-- Costo de este insumo en el mueble, en vivo -->
        <div
          v-if="insumoElegido"
          class="row items-center justify-between q-mt-md"
        >
          <span class="text-caption text-grey-7">
            Costo: {{ form.cantidadConDesperdicio || 0 }} ×
            {{ formatoMoneda(insumoElegido.precioCostoActual) }}
          </span>
          <span class="text-h6">{{ formatoMoneda(subtotal) }}</span>
        </div>
      </q-form>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn label="Cancelar" flat @click="$emit('close')" />
      <q-btn
        :label="editId ? 'Guardar' : 'Agregar'"
        color="primary"
        :loading="recetaMuebleStore.loading"
        @click="onSubmit"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { QForm } from 'quasar'
import { useRecetaMuebleStore } from '@/stores/recetaMueble'
import { useInsumoStore } from '@/stores/insumo'
import type { RecetaMuebleRequestDto } from '@/models/RecetaMueble/RecetaMuebleRequestDto'
import type { InsumoResponseDto } from '@/models/Insumo/InsumoResponseDto'
import { mensajeDeError, notificarError } from '@/utils/notificar'

// editId null = alta; con numero = modificacion. idMueble: mueble al que pertenece la receta
const props = defineProps<{ editId: number | null; idMueble: number }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const recetaMuebleStore = useRecetaMuebleStore()
const insumoStore = useInsumoStore()
const formRef = ref<QForm | null>(null)

// Igual al DTO, pero idInsumo arranca en null para que el select aparezca vacio
type RecetaForm = Omit<RecetaMuebleRequestDto, 'idInsumo'> & {
  idInsumo: number | null
}

const form = ref<RecetaForm>({
  idMueble: props.idMueble,
  idInsumo: null,
  cantidadConDesperdicio: 1
})

/**
 * Insumos que se pueden elegir: los que no estan ya en la receta.
 * Al editar, se incluye el insumo de este mismo renglon.
 */
const insumosDisponibles = computed(() => {
  const usados = recetaMuebleStore.receta
    .filter(r => r.id !== props.editId)
    .map(r => r.idInsumo)
  return insumoStore.insumos.filter(i => !usados.includes(i.id))
})

const insumoElegido = computed<InsumoResponseDto | null>(
  () => insumoStore.insumos.find(i => i.id === form.value.idInsumo) ?? null
)

const subtotal = computed(
  () =>
    (Number(form.value.cantidadConDesperdicio) || 0) *
    (insumoElegido.value?.precioCostoActual ?? 0)
)

function formatoMoneda(val: number) {
  return Number(val).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS'
  })
}

onMounted(async () => {
  const cargaInsumos = insumoStore.fetchAll()

  // Si es modificacion, se traen los datos actuales del renglon
  if (props.editId) {
    const renglon = await recetaMuebleStore.fetchById(props.editId)
    if (renglon) {
      form.value = {
        idMueble: renglon.idMueble,
        idInsumo: renglon.idInsumo,
        cantidadConDesperdicio: renglon.cantidadConDesperdicio
      }
    }
  }

  await cargaInsumos
})

async function onSubmit() {
  const valido = await formRef.value?.validate()
  if (!valido) {
    return
  }
  // Pasada la validacion, idInsumo ya no puede ser null
  const renglon: RecetaMuebleRequestDto = {
    ...form.value,
    idInsumo: form.value.idInsumo as number
  }
  try {
    if (props.editId) {
      await recetaMuebleStore.update(props.editId, renglon)
    } else {
      await recetaMuebleStore.create(renglon)
    }
    emit('close')
  } catch (err) {
    notificarError(
      mensajeDeError(err, 'No se pudo guardar el insumo de la receta')
    )
  }
}
</script>
