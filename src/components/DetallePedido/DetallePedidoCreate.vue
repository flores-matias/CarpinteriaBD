<template>
  <q-card style="min-width: 420px">
    <q-card-section>
      <div class="text-h6">
        {{ editId ? 'Editar mueble del pedido' : 'Agregar mueble al pedido' }}
      </div>
      <div class="text-caption text-grey-7">Pedido #{{ idPedido }}</div>
    </q-card-section>
    <q-separator />

    <q-card-section>
      <q-form ref="formRef" greedy @submit.prevent="onSubmit">
        <!-- Solo muebles que todavia no estan en el pedido (la API no permite repetirlos) -->
        <q-select
          v-model="form.idMueble"
          :options="mueblesDisponibles"
          option-value="id"
          option-label="nombre"
          emit-value
          map-options
          label="Mueble"
          outlined
          class="q-mb-sm"
          :loading="muebleStore.loading"
          lazy-rules
          :rules="[(v: number | null) => !!v || 'Selecciona un mueble']"
          @update:model-value="alElegirMueble"
        >
          <!-- Cada opcion muestra tambien su precio sugerido -->
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.nombre }}</q-item-label>
                <q-item-label caption>
                  Sugerido: {{ formatoMoneda(scope.opt.precioSugerido) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">
                {{
                  muebleStore.muebles.length === 0
                    ? 'No hay muebles cargados. Agregalos desde Muebles.'
                    : 'Todos los muebles ya estan en el pedido'
                }}
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <div class="row q-col-gutter-sm">
          <div class="col-4">
            <!-- Cantidad es int en la API: solo enteros desde 1 -->
            <q-input
              v-model.number="form.cantidad"
              label="Cantidad"
              type="number"
              step="1"
              min="1"
              outlined
              lazy-rules
              :rules="[
                (v: number | string) =>
                  (Number.isInteger(Number(v)) && Number(v) >= 1) ||
                  'Minimo 1, sin decimales'
              ]"
            />
          </div>
          <div class="col-8">
            <!-- Arranca con el precio sugerido del mueble, pero se puede ajustar -->
            <q-input
              v-model.number="form.precioVentaReal"
              label="Precio de venta (unitario)"
              type="number"
              step="any"
              prefix="$"
              outlined
              lazy-rules
              :rules="[
                (v: number | string) =>
                  (v !== '' && v !== null && !isNaN(Number(v))) ||
                  'Ingresa el precio',
                (v: number | string) =>
                  Number(v) > 0 || 'Tiene que ser mayor a 0'
              ]"
            />
          </div>
        </div>

        <!-- Subtotal en vivo -->
        <div class="row items-center justify-between q-mt-sm">
          <span class="text-caption text-grey-7">Subtotal</span>
          <span class="text-h6">{{ formatoMoneda(subtotal) }}</span>
        </div>
      </q-form>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn label="Cancelar" flat @click="$emit('close')" />
      <q-btn
        :label="editId ? 'Guardar' : 'Agregar'"
        color="primary"
        :loading="detallePedidoStore.loading"
        @click="onSubmit"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { QForm } from 'quasar'
import { useDetallePedidoStore } from '@/stores/detallePedido'
import { useMuebleStore } from '@/stores/mueble'
import type { DetallePedidoRequestDto } from '@/models/DetallePedido/DetallePedidoRequestDto'
import { mensajeDeError, notificarError } from '@/utils/notificar'

// editId null = alta; con numero = modificacion. idPedido: pedido al que pertenece el detalle
const props = defineProps<{ editId: number | null; idPedido: number }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const detallePedidoStore = useDetallePedidoStore()
const muebleStore = useMuebleStore()
const formRef = ref<QForm | null>(null)

// Igual al DTO, pero idMueble arranca en null para que el select aparezca vacio
type DetalleForm = Omit<DetallePedidoRequestDto, 'idMueble'> & {
  idMueble: number | null
}

const form = ref<DetalleForm>({
  idPedido: props.idPedido,
  idMueble: null,
  cantidad: 1,
  precioVentaReal: 0
})

/**
 * Muebles que se pueden elegir: los que no estan ya en el pedido.
 * Al editar, se incluye el mueble de este mismo detalle.
 */
const mueblesDisponibles = computed(() => {
  const usados = detallePedidoStore.detalles
    .filter(d => d.id !== props.editId)
    .map(d => d.idMueble)
  return muebleStore.muebles.filter(m => !usados.includes(m.id))
})

const subtotal = computed(
  () =>
    (Number(form.value.cantidad) || 0) *
    (Number(form.value.precioVentaReal) || 0)
)

// Al elegir un mueble, se propone su precio sugerido (el usuario lo puede cambiar)
function alElegirMueble(idMueble: number | null) {
  const mueble = muebleStore.muebles.find(m => m.id === idMueble)
  if (mueble) {
    form.value.precioVentaReal = mueble.precioSugerido
  }
}

function formatoMoneda(val: number) {
  return Number(val).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS'
  })
}

onMounted(async () => {
  const cargaMuebles = muebleStore.fetchAll()

  // Si es modificacion, se traen los datos actuales del detalle
  if (props.editId) {
    const detalle = await detallePedidoStore.fetchById(props.editId)
    if (detalle) {
      form.value = {
        idPedido: detalle.idPedido,
        idMueble: detalle.idMueble,
        cantidad: detalle.cantidad,
        precioVentaReal: detalle.precioVentaReal
      }
    }
  }

  await cargaMuebles
})

async function onSubmit() {
  const valido = await formRef.value?.validate()
  if (!valido) {
    return
  }
  // Pasada la validacion, idMueble ya no puede ser null
  const detalle: DetallePedidoRequestDto = {
    ...form.value,
    idMueble: form.value.idMueble as number
  }
  try {
    if (props.editId) {
      await detallePedidoStore.update(props.editId, detalle)
    } else {
      await detallePedidoStore.create(detalle)
    }
    emit('close')
  } catch (err) {
    notificarError(
      mensajeDeError(err, 'No se pudo guardar el mueble del pedido')
    )
  }
}
</script>
