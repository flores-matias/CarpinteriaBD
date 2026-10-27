<template>
  <q-card style="min-width: 440px">
    <q-card-section>
      <div class="text-h6">{{ editId ? 'Editar pago' : 'Nuevo pago' }}</div>
    </q-card-section>
    <q-separator />

    <q-card-section>
      <q-form ref="formRef" greedy @submit.prevent="onSubmit">
        <!-- Relacion con Pedido. Al editar queda bloqueado: un pago no se mueve de pedido -->
        <q-select
          v-model="form.idPedido"
          :options="pedidosDisponibles"
          option-value="id"
          :option-label="etiquetaPedido"
          emit-value
          map-options
          label="Pedido"
          outlined
          class="q-mb-sm"
          :disable="!!editId"
          :loading="pedidoStore.loading"
          lazy-rules
          :rules="[(v: number | null) => !!v || 'Selecciona un pedido']"
        >
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">
                No hay pedidos con saldo pendiente
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <!-- Resumen del pedido elegido -->
        <div
          v-if="pedidoElegido"
          class="row q-col-gutter-sm text-center q-mb-md"
        >
          <div class="col-4">
            <div class="text-caption text-grey-7">Total</div>
            <div class="text-subtitle2">
              {{ formatoMoneda(pedidoElegido.totalAPagar) }}
            </div>
          </div>
          <div class="col-4">
            <div class="text-caption text-grey-7">Pagado</div>
            <div class="text-subtitle2">
              {{ formatoMoneda(pedidoElegido.totalPagado) }}
            </div>
          </div>
          <div class="col-4">
            <div class="text-caption text-grey-7">
              {{ editId ? 'Disponible' : 'Saldo' }}
            </div>
            <div class="text-subtitle2 text-negative">
              {{ formatoMoneda(disponible) }}
            </div>
          </div>
        </div>

        <q-select
          v-model="form.idTipoPago"
          :options="tipoPagoStore.tiposPago"
          option-value="id"
          option-label="descripcion"
          emit-value
          map-options
          label="Tipo de pago"
          outlined
          class="q-mb-sm"
          :loading="tipoPagoStore.loading"
          lazy-rules
          :rules="[(v: number | null) => !!v || 'Selecciona el tipo de pago']"
        />

        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <!-- Mismas reglas que la API: mayor a 0 y sin superar el saldo -->
            <q-input
              v-model.number="form.monto"
              label="Monto"
              type="number"
              step="any"
              prefix="$"
              outlined
              lazy-rules
              :rules="[
                (v: number | string) =>
                  (v !== '' && v !== null && !isNaN(Number(v))) ||
                  'Ingresa el monto',
                (v: number | string) =>
                  Number(v) > 0 || 'Tiene que ser mayor a 0',
                (v: number | string) =>
                  Number(v) <= disponible ||
                  'Supera el saldo (' + formatoMoneda(disponible) + ')'
              ]"
            >
              <!-- Atajo para pagar todo lo que falta -->
              <template v-if="disponible > 0" #append>
                <q-btn
                  flat
                  dense
                  no-caps
                  size="sm"
                  label="Saldo"
                  color="primary"
                  @click="form.monto = disponible"
                >
                  <q-tooltip>Completar con el saldo pendiente</q-tooltip>
                </q-btn>
              </template>
            </q-input>
          </div>
          <div class="col-6">
            <!-- La fecha viaja como texto ISO (yyyy-MM-dd) -->
            <q-input
              v-model="form.fechaPago"
              label="Fecha de pago"
              outlined
              mask="####-##-##"
              hint="aaaa-mm-dd"
              lazy-rules
              :rules="[
                (v: string) => (!!v && v.length === 10) || 'Ingresa la fecha',
                (v: string) => v <= hoy || 'No puede ser posterior a hoy'
              ]"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <!-- Solo deja elegir hasta hoy -->
                    <q-date
                      v-model="form.fechaPago"
                      mask="YYYY-MM-DD"
                      :options="fechaHabilitada"
                      minimal
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>
      </q-form>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn label="Cancelar" flat @click="$emit('close')" />
      <q-btn
        :label="editId ? 'Guardar' : 'Registrar pago'"
        color="primary"
        :loading="pagoStore.loading"
        @click="onSubmit"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { date, type QForm } from 'quasar'
import { usePagoStore } from '@/stores/pago'
import { usePedidoStore } from '@/stores/pedido'
import { useTipoPagoStore } from '@/stores/tipoPago'
import type { PagoRequestDto } from '@/models/Pago/PagoRequestDto'
import type { PedidoResponseDto } from '@/models/Pedido/PedidoResponseDto'
import { mensajeDeError, notificarError } from '@/utils/notificar'

// editId null = alta; con numero = modificacion
const props = defineProps<{ editId: number | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const pagoStore = usePagoStore()
const pedidoStore = usePedidoStore()
const tipoPagoStore = useTipoPagoStore()
const formRef = ref<QForm | null>(null)

const hoy = date.formatDate(Date.now(), 'YYYY-MM-DD')

// Al editar: monto que tenia el pago antes de modificarlo
const montoOriginal = ref(0)

// Igual al DTO, pero los ids arrancan en null para que los selects aparezcan vacios
type PagoForm = Omit<PagoRequestDto, 'idPedido' | 'idTipoPago'> & {
  idPedido: number | null
  idTipoPago: number | null
}

const form = ref<PagoForm>({
  idPedido: null,
  idTipoPago: null,
  monto: 0,
  fechaPago: hoy
})

/**
 * Alta: solo pedidos con saldo y que no esten cancelados.
 * Edicion: todos (el select esta bloqueado, pero tiene que encontrar el pedido para mostrarlo).
 */
const pedidosDisponibles = computed(() =>
  props.editId
    ? pedidoStore.pedidos
    : pedidoStore.pedidos.filter(
        p => p.saldo > 0 && p.estadoPedido !== 'Cancelado'
      )
)

const pedidoElegido = computed<PedidoResponseDto | null>(
  () => pedidoStore.pedidos.find(p => p.id === form.value.idPedido) ?? null
)

// Lo maximo que se puede pagar. Al editar, el monto anterior de este pago "vuelve" al saldo.
const disponible = computed(() =>
  pedidoElegido.value ? pedidoElegido.value.saldo + montoOriginal.value : 0
)

function etiquetaPedido(pedido: PedidoResponseDto) {
  return `#${pedido.id} · ${pedido.cliente} · Saldo ${formatoMoneda(pedido.saldo)}`
}

// q-date pasa las fechas como 'YYYY/MM/DD'
function fechaHabilitada(fecha: string) {
  return fecha.replaceAll('/', '-') <= hoy
}

function formatoMoneda(val: number) {
  return Number(val).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS'
  })
}

onMounted(async () => {
  // Pedidos y tipos de pago para los selects: se piden en paralelo
  const cargas = Promise.all([pedidoStore.fetchAll(), tipoPagoStore.fetchAll()])

  // Si es modificacion, se traen los datos actuales del pago
  if (props.editId) {
    const pago = await pagoStore.fetchById(props.editId)
    if (pago) {
      montoOriginal.value = pago.monto
      form.value = {
        idPedido: pago.idPedido,
        idTipoPago: pago.idTipoPago,
        monto: pago.monto,
        // La API devuelve '2026-10-27T00:00:00': el formulario usa solo 'yyyy-MM-dd'
        fechaPago: pago.fechaPago.substring(0, 10)
      }
    }
  }

  await cargas
})

async function onSubmit() {
  const valido = await formRef.value?.validate()
  if (!valido) {
    return
  }
  // Pasada la validacion, los ids ya no pueden ser null
  const pago: PagoRequestDto = {
    ...form.value,
    idPedido: form.value.idPedido as number,
    idTipoPago: form.value.idTipoPago as number
  }
  try {
    if (props.editId) {
      await pagoStore.update(props.editId, pago)
    } else {
      await pagoStore.create(pago)
    }
    emit('close')
  } catch (err) {
    notificarError(mensajeDeError(err, 'No se pudo guardar el pago'))
  }
}
</script>
