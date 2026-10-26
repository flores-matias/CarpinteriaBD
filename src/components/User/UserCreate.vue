<template>
  <q-card style="min-width: 420px">
    <q-card-section>
      <div class="text-h6">Nuevo usuario</div>
      <div class="text-caption text-grey-7">
        El usuario va a ingresar con su email y contraseña.
      </div>
    </q-card-section>
    <q-separator />

    <q-card-section>
      <q-form ref="formRef" greedy @submit.prevent="onSubmit">
        <q-input
          v-model="form.nombres"
          label="Nombres"
          outlined
          class="q-mb-sm"
          autofocus
          lazy-rules
          :rules="[
            (v: string) => (!!v && v.trim().length > 0) || 'Ingresa los nombres'
          ]"
        />
        <q-input
          v-model="form.apellidos"
          label="Apellidos"
          outlined
          class="q-mb-sm"
          lazy-rules
          :rules="[
            (v: string) =>
              (!!v && v.trim().length > 0) || 'Ingresa los apellidos'
          ]"
        />
        <q-input
          v-model="form.email"
          label="Email"
          type="email"
          outlined
          class="q-mb-sm"
          hint="El nombre de usuario se arma con lo que esta antes del @"
          lazy-rules
          :rules="[
            (v: string) => (!!v && v.trim().length > 0) || 'Ingresa el email',
            (v: string) =>
              /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || 'Ingresa un email valido'
          ]"
        />
        <!-- Opcional: la fecha se guarda como texto ISO (yyyy-MM-dd) -->
        <q-input
          v-model="form.fechaNacimiento"
          label="Fecha de nacimiento (opcional)"
          outlined
          class="q-mb-sm"
          mask="####-##-##"
          hint="aaaa-mm-dd"
          lazy-rules
          :rules="[
            (v: string | null) =>
              !v || v.length === 10 || 'Completa la fecha o dejala vacia'
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
                  v-model="form.fechaNacimiento"
                  mask="YYYY-MM-DD"
                  minimal
                />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>

        <!-- Reglas de contraseña por defecto de ASP.NET Identity -->
        <q-input
          v-model="form.password"
          label="Contraseña"
          :type="verPassword ? 'text' : 'password'"
          outlined
          class="q-mb-sm"
          lazy-rules
          :rules="[
            (v: string) => (!!v && v.length >= 6) || 'Minimo 6 caracteres',
            (v: string) => /[A-Z]/.test(v) || 'Debe tener una mayuscula',
            (v: string) => /[a-z]/.test(v) || 'Debe tener una minuscula',
            (v: string) => /\d/.test(v) || 'Debe tener un numero',
            (v: string) =>
              /[^a-zA-Z0-9]/.test(v) || 'Debe tener un simbolo (ej: ! . # $)'
          ]"
        >
          <template #append>
            <q-icon
              :name="verPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="verPassword = !verPassword"
            />
          </template>
        </q-input>
        <q-input
          v-model="confirmarPassword"
          label="Repetir contraseña"
          :type="verPassword ? 'text' : 'password'"
          outlined
          class="q-mb-sm"
          lazy-rules
          :rules="[
            (v: string) => v === form.password || 'Las contraseñas no coinciden'
          ]"
        />
      </q-form>

      <!-- Errores que devuelve la API (email repetido, reglas de Identity, etc.) -->
      <q-banner
        v-if="userStore.error"
        class="bg-negative text-white"
        rounded
        dense
      >
        {{ userStore.error }}
      </q-banner>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn label="Cancelar" flat @click="$emit('close')" />
      <q-btn
        label="Registrar"
        color="primary"
        :loading="userStore.loading"
        @click="onSubmit"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { QForm } from 'quasar'
import { useUserStore } from '@/stores/user'
import type { UserRegistroRequestDto } from '@/models/User/UserRegistroRequestDto'

// Solo alta: la API todavia no permite editar usuarios, por eso no hay editId
const emit = defineEmits<{ (e: 'close'): void }>()

const userStore = useUserStore()
const formRef = ref<QForm | null>(null)

const verPassword = ref(false)
const confirmarPassword = ref('')

// El formulario completa el mismo DTO que viaja a la API
const form = ref<UserRegistroRequestDto>({
  nombres: '',
  apellidos: '',
  email: '',
  password: '',
  fechaNacimiento: null
})

// Al abrir el formulario se limpia el error que haya quedado de un intento anterior
onMounted(() => {
  userStore.error = null
})

async function onSubmit() {
  const valido = await formRef.value?.validate()
  if (!valido) {
    return
  }
  // Si la fecha quedo vacia se manda null (la API la espera como DateTime?)
  const creado = await userStore.registrar({
    ...form.value,
    fechaNacimiento: form.value.fechaNacimiento || null
  })
  if (creado) {
    emit('close')
  }
}
</script>
