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
        <!-- Solo configuraciones extra que el mueble todavia no tiene -->
        <q-select
          v-model="idConfiguracion"
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
          :rules="[(v: number | null) => !!v || 'Selecciona un recargo']"
        >
          <!-- Cada opcion muestra tambien su porcentaje -->
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
                    : 'No hay recargos creados. Agregalos en Configuraciones (ej: IVA = 0.21).'
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
import { mensajeDeError, notificarError } from '@/utils/notificar'

// idMueble: mueble al que se le agrega el recargo. usados: ids de configuraciones que ya tiene
const props = defineProps<{ idMueble: number; usados: number[] }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const muebleConfiguracionStore = useMuebleConfiguracionStore()
const configuracionStore = useConfiguracionStore()
const formRef = ref<QForm | null>(null)

const idConfiguracion = ref<number | null>(null)

// Se aplican siempre a todos los muebles: no se ofrecen como recargo (igual que ClavesConfiguracion en la API)
const CLAVES_FIJAS = ['Mano de obra', 'Uso de maquinas']

// Configuraciones que pueden usarse como recargo (todas menos las fijas)
const extras = computed(() =>
  configuracionStore.configuraciones.filter(
    c => !CLAVES_FIJAS.includes(c.clave)
  )
)

const hayExtras = computed(() => extras.value.length > 0)

// Las que el mueble todavia no tiene
const disponibles = computed(() =>
  extras.value.filter(c => !props.usados.includes(c.id))
)

// 0.21 -> '21%'
function formatoPorcentaje(proporcion: number) {
  return `${(proporcion * 100).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`
}

onMounted(() => {
  void configuracionStore.fetchAll()
})

async function onSubmit() {
  const valido = await formRef.value?.validate()
  if (!valido || idConfiguracion.value === null) {
    return
  }
  try {
    await muebleConfiguracionStore.agregar({
      idMueble: props.idMueble,
      idConfiguracion: idConfiguracion.value
    })
    emit('close')
  } catch (err) {
    notificarError(mensajeDeError(err, 'No se pudo agregar el recargo'))
  }
}
</script>
