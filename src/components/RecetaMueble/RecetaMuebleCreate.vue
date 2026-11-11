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
        <!-- :rules="[(v: number | null) => !!v || 'Selecciona un insumo']" -->
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
          :display-value="form.idInsumo ? undefined : ''"
          :rules="[(v: number) => v > 0 || 'Selecciona un insumo']"
        >
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

        <q-input
          v-model.number="form.cantidadConDesperdicio"
          label="Cantidad (con desperdicio)"
          type="number"
          step="0.01"
          :suffix="insumoElegido?.unidadMedida"
          outlined
          hint="Incluir lo que se pirede al cortar (ej: 1 metro + 15% = 1,15)"
          lazy-rules
          :rules="[
            (v: number | string) =>
              (v !== '' && v !== null && !isNaN(Number(v))) ||
              'Ingresa la cantidad',
            (v: number | string) => Number(v) > 0 || 'Tiene que ser mayor a 0'
          ]"
        />

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

// type RecetaForm = Omit<RecetaMuebleRequestDto, 'idInsumo'> & {
//   idInsumo: number | null
// }

// const form = ref<RecetaForm>({
//   idMueble: props.idMueble,
//   idInsumo: null,

const form = ref<RecetaMuebleRequestDto>({
  idMueble: props.idMueble,
  idInsumo: 0,
  cantidadConDesperdicio: 1
})

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

  // const renglon: RecetaMuebleRequestDto = {
  //   ...form.value,
  //   idInsumo: form.value.idInsumo as number
  // }
  try {
    if (props.editId) {
      //await recetaMuebleStore.update(props.editId, renglon)
      await recetaMuebleStore.update(props.editId, form.value)
    } else {
      //await recetaMuebleStore.create(renglon)
      await recetaMuebleStore.create(form.value)
    }
    emit('close')
  } catch (err) {
    notificarError(
      mensajeDeError(err, 'No se pudo guardar el mueble del pedido')
    )
  }
}
</script>
