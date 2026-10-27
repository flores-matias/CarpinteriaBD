<!-- <template>
  <q-page class="flex flex-center">
    <div class="column items-center">
      <img
        alt="Quasar logo"
        src="~@/assets/quasar-logo-vertical.svg"
        style="width: 200px; height: 200px"
      />
    </div>
  </q-page>
</template>

<script setup>
//
</script> -->
//comentado con ctrl+k y ctrl+c

<template>
  <q-page class="flex flex-center">
    <q-card class="q-pa-md text-center" style="width: 420px; max-width: 90vw">
      <q-card-section>
        <q-icon name="menu_book" size="64px" color="primary" />
        <div class="text-h5 q-mt-sm">Biblioteca</div>
      </q-card-section>

      <!-- Con sesion: saludo y acceso a la grilla. Sin sesion: invitacion a ingresar -->
      <q-card-section v-if="auth.isAuthenticated">
        <div class="text-subtitle1">Hola, {{ auth.userName }}</div>
        <!-- <q-btn
          label="Ver autores"
          icon="people"
          color="primary"
          class="q-mt-md"
          to="/autores"
        /> -->
      </q-card-section>

      <q-card-section v-else>
        <div class="text-subtitle1">Inicia sesion para ver el catalogo</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>
