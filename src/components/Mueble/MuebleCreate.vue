<template>
  <q-card style="min-width: 420px">
    <q-card-section>
      <div class="text-h6">{{ editId ? 'Editar mueble' : 'Nuevo mueble' }}</div>
    </q-card-section>
    <q-separator />

    <q-card-section>
      <q-form ref="formRef" greedy @submit.prevent="onSubmit">
        <q-input
          v-model="form.nombre"
          label="Nombre"
          outlined
          class="q-mb-sm"
          :maxlength="30"
          counter
          lazy-rules
          :rules="[
            (v: string) => (!!v && v.trim().length > 0) || 'Ingresa el nombre'
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
        <!-- PrecioSugerido es decimal en la API: se usa v-model.number para que viaje como numero -->
        <q-input
          v-model.number="form.precioSugerido"
          label="Precio sugerido"
          type="number"
          step="any"
          prefix="$"
          outlined
          class="q-mb-sm"
          lazy-rules
          :rules="[
            (v: number | string) =>
              (v !== '' && v !== null && !isNaN(Number(v))) ||
              'Ingresa el precio',
            (v: number | string) =>
              Number(v) >= 0 || 'El precio no puede ser negativo'
          ]"
        />
      </q-form>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn label="Cancelar" flat @click="$emit('close')" />
      <q-btn
        :label="editId ? 'Guardar' : 'Crear'"
        color="primary"
        :loading="muebleStore.loading"
        @click="onSubmit"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { QForm } from 'quasar'
import { useMuebleStore } from '@/stores/mueble'
import type { MuebleRequestDto } from '@/models/Mueble/MuebleRequestDto'
import { mensajeDeError, notificarError } from '@/utils/notificar'

// editId null = alta; con numero = modificacion
const props = defineProps<{ editId: number | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const muebleStore = useMuebleStore()
const formRef = ref<QForm | null>(null)

// El formulario completa el mismo DTO que viaja a la API
const form = ref<MuebleRequestDto>({
  nombre: '',
  descripcion: '',
  precioSugerido: 0
})

// Si es modificacion, se traen los datos actuales del mueble
onMounted(async () => {
  if (props.editId) {
    const mueble = await muebleStore.fetchById(props.editId)
    if (mueble) {
      form.value = {
        nombre: mueble.nombre,
        descripcion: mueble.descripcion,
        precioSugerido: mueble.precioSugerido
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
      await muebleStore.update(props.editId, form.value)
    } else {
      await muebleStore.create(form.value)
    }
    emit('close')
  } catch (err) {
    notificarError(mensajeDeError(err, 'No se pudo guardar el mueble'))
  }
}
</script>
