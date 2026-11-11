<template>
  <q-card style="min-width: 440px">
    <q-card-section>
      <div class="text-h6">{{ editId ? 'Editar pedido' : 'Nuevo pedido' }}</div>
    </q-card-section>
    <q-separator />

    <q-card-section v-if="pedidoActual" class="q-pb-none">
      <div class="row q-col-gutter-sm text-center">
        <div class="col-4">
          <div class="text-caption text-grey-7">Total</div>
          <div class="text-subtitle2">
            {{ formatoMoneda(pedidoActual.totalAPagar) }}
          </div>
        </div>
        <div class="col-4">
          <div class="text-caption text-grey-7">Pagado</div>
          <div class="text-subtitle2">
            {{ formatoMoneda(pedidoActual.totalPagado) }}
          </div>
        </div>
        <div class="col-4">
          <div class="text-caption text-grey-7">Saldo</div>
          <div class="text-subtitle2">
            {{ formatoMoneda(pedidoActual.saldo) }}
          </div>
        </div>
      </div>
    </q-card-section>
    <!-- :rules="[(v: number | null) => !!v || 'Selecciona un cliente']" -->
    <q-card-section>
      <q-form ref="formRef" greedy @submit.prevent="onSubmit">
        <q-select
          v-model="form.idCliente"
          :options="clienteStore.clientes"
          option-value="id"
          :option-label="etiquetaCliente"
          emit-value
          map-options
          label="Cliente"
          outlined
          class="q-mb-sm"
          :loading="clienteStore.loading"
          lazy-rules
          :display-value="form.idCliente ? undefined : ''"
          :rules="[(v: number) => v > 0 || 'Selecciona un cliente']"
        >
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">
                No hay clientes cargados
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <q-input
          v-model="form.fechaEntregaPrometida"
          label="Fecha de entrega prometida"
          outlined
          class="q-mb-sm"
          mask="####-##-##"
          hint="aaaa-mm-dd"
          lazy-rules
          :rules="[
            (v: string) => (!!v && v.length === 10) || 'Ingresa la fecha',
            (v: string) =>
              v >= fechaMinima ||
              'No puede ser anterior a ' + formatoFecha(fechaMinima)
          ]"
        >
          <template #append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <q-date
                  v-model="form.fechaEntregaPrometida"
                  mask="YYYY-MM-DD"
                  :options="fechaHabilitada"
                  minimal
                />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>

        <q-select
          v-model="form.estadoPedido"
          :options="pedidoStore.estados"
          label="Estado del pedido"
          outlined
          class="q-mb-sm"
          lazy-rules
          :rules="[(v: string) => !!v || 'Selecciona el estado']"
        />

        <div v-if="!editId" class="text-caption text-grey-7">
          El total se calcula a partir de los muebles que agregues al pedido.
        </div>
      </q-form>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn label="Cancelar" flat @click="$emit('close')" />
      <q-btn
        :label="editId ? 'Guardar' : 'Crear'"
        color="primary"
        :loading="pedidoStore.loading"
        @click="onSubmit"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { date, type QForm } from 'quasar'
import { usePedidoStore } from '@/stores/pedido'
import { useClienteStore } from '@/stores/cliente'
import type { PedidoRequestDto } from '@/models/Pedido/PedidoRequestDto'
import type { PedidoResponseDto } from '@/models/Pedido/PedidoResponseDto'
import type { ClienteResponseDto } from '@/models/Cliente/ClienteResponseDto'
import { mensajeDeError, notificarError } from '@/utils/notificar'

const props = defineProps<{ editId: number | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const pedidoStore = usePedidoStore()
const clienteStore = useClienteStore()
const formRef = ref<QForm | null>(null)

const pedidoActual = ref<PedidoResponseDto | null>(null)

// type PedidoForm = Omit<PedidoRequestDto, 'idCliente'> & {
//   idCliente: number | null
// }

// const form = ref<PedidoForm>({
//   idCliente: null,

const form = ref<PedidoRequestDto>({
  idCliente: 0,
  fechaEntregaPrometida: '',
  estadoPedido: ''
})

const hoy = date.formatDate(Date.now(), 'YYYY-MM-DD')

const fechaMinima = computed(() =>
  pedidoActual.value ? pedidoActual.value.fechaCreacion.substring(0, 10) : hoy
)

function fechaHabilitada(fecha: string) {
  return fecha.replaceAll('/', '-') >= fechaMinima.value
}

function etiquetaCliente(cliente: ClienteResponseDto) {
  return `${cliente.apellido}, ${cliente.nombre}`
}

function formatoFecha(iso: string) {
  return iso.split('-').reverse().join('/')
}

function formatoMoneda(val: number) {
  return Number(val).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS'
  })
}

onMounted(async () => {
  const cargas = Promise.all([
    clienteStore.fetchAll(),
    pedidoStore.fetchEstados()
  ])

  if (props.editId) {
    const pedido = await pedidoStore.fetchById(props.editId)
    if (pedido) {
      pedidoActual.value = pedido
      form.value = {
        idCliente: pedido.idCliente,

        fechaEntregaPrometida: pedido.fechaEntregaPrometida.substring(0, 10),
        estadoPedido: pedido.estadoPedido
      }
    }
    await cargas
  } else {
    await cargas

    form.value.estadoPedido = pedidoStore.estados[0] ?? ''
  }
})

async function onSubmit() {
  const valido = await formRef.value?.validate()
  if (!valido) {
    return
  }

  // const pedido: PedidoRequestDto = {
  //   ...form.value,
  //   idCliente: form.value.idCliente as number
  // }
  try {
    if (props.editId) {
      // await pedidoStore.update(props.editId, pedido)
      await pedidoStore.update(props.editId, form.value)
    } else {
      // await pedidoStore.create(pedido)
      await pedidoStore.create(form.value)
    }
    emit('close')
  } catch (err) {
    notificarError(mensajeDeError(err, 'No se pudo guardar el pedido'))
  }
}
</script>
