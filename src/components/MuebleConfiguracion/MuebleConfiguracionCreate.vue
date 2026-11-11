<template>
  <q-card style="min-width: 400px">
    <q-card-section>
      <div class="text-h6">Agregar recargo</div>
      <div class="text-caption text-grey-7">
        Se aplica como porcentaje sobre el precio acumulado
      </div>
    </q-card-section>
    <q-separator />

    <q-card-section>
      <q-form ref="formRef" greedy @submit.prevent="onSubmit">
        <!-- : v-model="idConfiguracion" :rules="[(v: number | null) => !!v || 'Selecciona un recargo']" -->
        <q-select
          v-model="form.idConfiguracion"
          :options="disponibles"
          option-value="id"
          option-label="clave"
          emit-value
          map-options
          label="Recargo"
          outlined
          autofocus
          :loading="configuracionStore.loading"
          lazy-rules
          :display-value="form.idConfiguracion ? undefined : ''"
          :rules="[(v: number) => v > 0 || 'Selecciona un recargo']"
        >
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.clave }}</q-item-label>
                <q-item-label caption>
                  {{ formatoPorcentaje(scope.opt.valor) }} ·
                  {{ scope.opt.descripcion }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">
                {{
                  hayExtras
                    ? 'El mueble ya tiene todos los recargos disponibles'
                    : 'No hay recargo creados. Agregalos en Configuraciones'
                }}
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </q-form>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn label="Cancelar" flat @click="$emit('close')" />
      <q-btn
        label="Agregar"
        color="primary"
        :loading="muebleConfiguracionStore.loading"
        @click="onSubmit"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { QForm } from 'quasar'
import { useMuebleConfiguracionStore } from '@/stores/muebleConfiguracion'
import { useConfiguracionStore } from '@/stores/configuracion'
import type { MuebleConfiguracionRequestDto } from '@/models/MuebleConfiguracion/MuebleConfiguracionRequestDto'
import { mensajeDeError, notificarError } from '@/utils/notificar'

const props = defineProps<{ idMueble: number; usados: number[] }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const muebleConfiguracionStore = useMuebleConfiguracionStore()
const configuracionStore = useConfiguracionStore()
const formRef = ref<QForm | null>(null)

// const idConfiguracion = ref<number | null>(null)

const form = ref<MuebleConfiguracionRequestDto>({
  idMueble: props.idMueble,
  idConfiguracion: 0
})

const CLAVES_FIJAS = ['Mano de obra', 'Uso de maquinas']

const extras = computed(() =>
  configuracionStore.configuraciones.filter(
    c => !CLAVES_FIJAS.includes(c.clave)
  )
)

const hayExtras = computed(() => extras.value.length > 0)

const disponibles = computed(() =>
  extras.value.filter(c => !props.usados.includes(c.id))
)

function formatoPorcentaje(proporcion: number) {
  return `${(proporcion * 100).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`
}

onMounted(() => {
  void configuracionStore.fetchAll()
})

async function onSubmit() {
  const valido = await formRef.value?.validate()
  // if (!valido || idConfiguracion.value === null) {
  if (!valido) {
    return
  }
  try {
    // await muebleConfiguracionStore.agregar({
    //   idMueble: props.idMueble,
    //   idConfiguracion: idConfiguracion.value
    // })
    await muebleConfiguracionStore.agregar(form.value)
    emit('close')
  } catch (err) {
    notificarError(mensajeDeError(err, 'No se pudo agregar el recargo'))
  }
}
</script>
