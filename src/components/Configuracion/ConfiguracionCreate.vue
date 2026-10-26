<template>
  <q-card style="min-width: 420px">
    <q-card-section>
      <div class="text-h6">{{
        editId ? 'Editar configuracion' : 'Nueva configuracion'
      }}</div>
    </q-card-section>
    <q-separator />

    <q-card-section>
      <q-form ref="formRef" greedy @submit.prevent="onSubmit">
        <q-input
          v-model="form.clave"
          label="Clave"
          outlined
          class="q-mb-sm"
          :maxlength="50"
          counter
          lazy-rules
          :rules="[
            (v: string) => (!!v && v.trim().length > 0) || 'Ingresa la clave'
          ]"
        />
        <!-- Valor es decimal en la API: se usa v-model.number para que viaje como numero -->
        <q-input
          v-model.number="form.valor"
          label="Valor"
          type="number"
          step="any"
          outlined
          class="q-mb-sm"
          lazy-rules
          :rules="[
            (v: number | string) =>
              (v !== '' && v !== null && !isNaN(Number(v))) ||
              'Ingresa un valor numerico'
          ]"
        />
        <q-input
          v-model="form.descripcion"
          label="Descripcion"
          type="textarea"
          autogrow
          outlined
          class="q-mb-sm"
          :maxlength="200"
          counter
          lazy-rules
          :rules="[
            (v: string) =>
              (!!v && v.trim().length > 0) || 'Ingresa la descripcion'
          ]"
        />
      </q-form>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn label="Cancelar" flat @click="$emit('close')" />
      <q-btn
        :label="editId ? 'Guardar' : 'Crear'"
        color="primary"
        :loading="configuracionStore.loading"
        @click="onSubmit"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { QForm } from 'quasar'
import { useConfiguracionStore } from '@/stores/configuracion'
import type { ConfiguracionRequestDto } from '@/models/Configuracion/ConfiguracionRequestDto'
import { notificarError } from '@/utils/notificar'

// editId null = alta; con numero = modificacion
const props = defineProps<{ editId: number | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const configuracionStore = useConfiguracionStore()
const formRef = ref<QForm | null>(null)

// El formulario completa el mismo DTO que viaja a la API
const form = ref<ConfiguracionRequestDto>({
  clave: '',
  valor: 0,
  descripcion: ''
})

// Si es modificacion, se traen los datos actuales de la configuracion
onMounted(async () => {
  if (props.editId) {
    const configuracion = await configuracionStore.fetchById(props.editId)
    if (configuracion) {
      form.value = {
        clave: configuracion.clave,
        valor: configuracion.valor,
        descripcion: configuracion.descripcion
      }
    }
  }
})

async function onSubmit() {
  const valido = await formRef.value?.validate()
  if (!valido) {
    return
  }
  try {
    if (props.editId) {
      await configuracionStore.update(props.editId, form.value)
    } else {
      await configuracionStore.create(form.value)
    }
    emit('close')
  } catch {
    notificarError('No se pudo guardar la configuracion')
  }
}
</script>
