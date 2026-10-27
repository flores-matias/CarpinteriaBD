<template>
  <q-dialog
    v-model="mostrar"
    persistent
    no-esc-dismiss
    no-backdrop-dismiss
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="q-pa-md" style="width: 360px; max-width: 90vw">
      <q-card-section class="text-center q-pb-none">
        <q-icon name="menu_book" size="48px" color="primary" />
        <div class="text-h6 q-mt-sm">Iniciar sesion</div>
      </q-card-section>

      <q-card-section>
        <q-form ref="formRef" greedy @submit.prevent="onSubmit">
          <q-input
            v-model="credenciales.email"
            label="Email"
            type="email"
            outlined
            autofocus
            :rules="[(v: string) => !!v || 'Ingresa el email']"
          />
          <q-input
            v-model="credenciales.password"
            label="Contrasena"
            :type="verPassword ? 'text' : 'password'"
            outlined
            class="q-mt-sm"
            :rules="[(v: string) => !!v || 'Ingresa la contrasena']"
          >
            <template #append>
              <q-icon
                :name="verPassword ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                @click="verPassword = !verPassword"
              />
            </template>
          </q-input>

          <q-banner
            v-if="auth.error"
            class="bg-negative text-white q-mt-sm"
            rounded
            dense
          >
            {{ auth.error }}
          </q-banner>

          <q-btn
            label="Ingresar"
            type="submit"
            color="primary"
            class="full-width q-mt-md"
            :loading="auth.loading"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { QForm } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import type { LoginUserRequestDto } from '@/models/Auth/LoginUserRequestDto'

const auth = useAuthStore()
const formRef = ref<QForm | null>(null)

const mostrar = ref(!auth.isAuthenticated)
watch(
  () => auth.isAuthenticated,
  logueado => {
    mostrar.value = !logueado
  }
)

const credenciales = ref<LoginUserRequestDto>({ email: '', password: '' })
const verPassword = ref(false)

async function onSubmit() {
  const valido = await formRef.value?.validate()
  if (!valido) {
    return
  }
  const ok = await auth.login(credenciales.value)
  if (ok) {
    credenciales.value = { email: '', password: '' }
  }
}
</script>
