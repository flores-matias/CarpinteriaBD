<template>
  <q-page padding>
    <q-card class="q-pa-md">
      <div class="row items-center q-gutter-sm">
        <div class="text-h6">Usuarios</div>
        <q-space />
        <q-btn round unelevated color="primary" icon="add" @click="abrirAlta">
          <q-tooltip>Nuevo usuario</q-tooltip>
        </q-btn>
      </div>

      <!-- La API todavia no permite listar usuarios: cuando lo permita, aca va el q-table -->
      <q-card-section>
        <div class="column items-center q-pa-lg text-center">
          <q-icon name="manage_accounts" size="64px" color="grey-5" />
          <div class="text-subtitle1 q-mt-md">Registrar usuarios</div>
          <div class="text-body2 text-grey-7 q-mb-md" style="max-width: 420px">
            Desde aca podes dar de alta a las personas que van a usar el
            sistema. Cada usuario ingresa con su email y su contraseña.
          </div>
          <q-btn
            unelevated
            color="primary"
            icon="person_add"
            label="Nuevo usuario"
            @click="abrirAlta"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Formulario de alta en un dialogo, igual que en las otras entidades -->
    <q-dialog v-model="mostrarFormulario">
      <UserCreate @close="cerrarFormulario" />
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UserCreate from '@/components/User/UserCreate.vue'

const mostrarFormulario = ref(false)

function abrirAlta() {
  mostrarFormulario.value = true
}

function cerrarFormulario() {
  mostrarFormulario.value = false
}
</script>
