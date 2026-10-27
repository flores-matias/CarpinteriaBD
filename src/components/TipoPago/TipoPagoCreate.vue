<template>
  <q-card style="min-width: 420px">
    <q-card-section>
      <div class="text-h6">{{
        editId ? 'Editar tipo de pago' : 'Nuevo tipo de pago'
      }}</div>
    </q-card-section>
    <q-separator />

    <q-card-section>
      <q-form ref="formRef" greedy @submit.prevent="onSubmit">
        <q-input
          v-model="form.descripcion"
          label="Descripcion"
          outlined
          class="q-mb-sm"
          :maxlength="200"
          counter
          autofocus
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
        :loading="tipoPagoStore.loading"
        @click="onSubmit"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { QForm } from 'quasar'
import { useTipoPagoStore } from '@/stores/tipoPago'
import type { TipoPagoRequestDto } from '@/models/TipoPago/TipoPagoRequestDto'
import { mensajeDeError, notificarError } from '@/utils/notificar'

// editId null = alta; con numero = modificacion
const props = defineProps<{ editId: number | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const tipoPagoStore = useTipoPagoStore()
const formRef = ref<QForm | null>(null)

// El formulario completa el mismo DTO que viaja a la API
const form = ref<TipoPagoRequestDto>({
  descripcion: ''
})

// Si es modificacion, se traen los datos actuales del tipo de pago
onMounted(async () => {
  if (props.editId) {
    const tipoPago = await tipoPagoStore.fetchById(props.editId)
    if (tipoPago) {
      form.value = {
        descripcion: tipoPago.descripcion
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
      await tipoPagoStore.update(props.editId, form.value)
    } else {
      await tipoPagoStore.create(form.value)
    }
    emit('close')
  } catch (err) {
    notificarError(mensajeDeError(err, 'No se pudo guardar el tipo de pago'))
  }
}
</script>
