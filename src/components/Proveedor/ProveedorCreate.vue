<template>
  <q-card style="min-width: 420px">
    <q-card-section>
      <div class="text-h6">{{
        editId ? 'Editar proveedor' : 'Nuevo proveedor'
      }}</div>
    </q-card-section>
    <q-separator />

    <q-card-section>
      <q-form ref="formRef" greedy @submit.prevent="onSubmit">
        <q-input
          v-model="form.razonSocial"
          label="Razon Social"
          outlined
          class="q-mb-sm"
          :maxlength="30"
          counter
          lazy-rules
          :rules="[
            (v: string) =>
              (!!v && v.trim().length > 0) || 'Ingresa la Razon Social'
          ]"
        />
        <q-input
          v-model="form.telefono"
          label="Telefono"
          outlined
          class="q-mb-sm"
          :maxlength="10"
          counter
          lazy-rules
          :rules="[
            (v: string) =>
              (!!v && v.trim().length > 0) || 'Ingresa el numero de telefono'
          ]"
        />
        <q-input
          v-model="form.email"
          label="Email"
          type="email"
          outlined
          class="q-mb-sm"
          lazy-rules
          :rules="[
            (v: string) => (!!v && v.trim().length > 0) || 'Ingresa el email',
            (v: string) =>
              /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || 'Ingresa un email valido'
          ]"
        />
      </q-form>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn label="Cancelar" flat @click="$emit('close')" />
      <q-btn
        :label="editId ? 'Guardar' : 'Crear'"
        color="primary"
        :loading="proveedorStore.loading"
        @click="onSubmit"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { QForm } from 'quasar'
import { useProveedorStore } from '@/stores/proveedor'
import type { ProveedorRequestDto } from '@/models/ProveedorRequestDto'
import { notificarError } from '@/utils/notificar'

// editId null = alta; con numero = modificacion
const props = defineProps<{ editId: number | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const proveedorStore = useProveedorStore()
const formRef = ref<QForm | null>(null)

// El formulario completa el mismo DTO que viaja a la API
const form = ref<ProveedorRequestDto>({
  razonSocial: '',
  telefono: '',
  email: ''
})

// Si es modificacion, se traen los datos actuales del autor
onMounted(async () => {
  if (props.editId) {
    const proveedor = await proveedorStore.fetchById(props.editId)
    if (proveedor) {
      form.value = {
        razonSocial: proveedor.razonSocial,
        telefono: proveedor.telefono,
        email: proveedor.email
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
      await proveedorStore.update(props.editId, form.value)
    } else {
      await proveedorStore.create(form.value)
    }
    emit('close')
  } catch {
    notificarError('No se pudo guardar el autor')
  }
}
</script>
