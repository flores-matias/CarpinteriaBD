<template>
  <q-page class="flex flex-center q-pa-md">
    <q-card class="q-pa-md text-center" style="width: 520px; max-width: 95vw">
      <q-card-section>
        <q-icon name="carpenter" size="64px" color="primary" />
        <div class="text-h5 q-mt-sm">Carpintería BA</div>
        <div class="text-caption text-grey-7">Sistema de gestión</div>
      </q-card-section>

      <!-- Con sesion: saludo y accesos rapidos. Sin sesion: el popup de login queda encima -->
      <q-card-section v-if="auth.isAuthenticated">
        <div class="text-subtitle1 q-mb-md">Hola, {{ auth.userName }} 👋</div>

        <div class="row q-col-gutter-sm">
          <div
            v-for="acceso in accesos"
            :key="acceso.link"
            class="col-6 col-sm-4"
          >
            <q-btn
              :to="acceso.link"
              :icon="acceso.icon"
              :label="acceso.title"
              color="primary"
              outline
              stack
              no-caps
              class="full-width q-py-sm"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-section v-else>
        <div class="text-subtitle1">Inicia sesión para continuar</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// Accesos rapidos a lo que mas se usa en el dia a dia
const accesos = [
  { title: 'Pedidos', icon: 'receipt_long', link: '/pedidos' },
  { title: 'Pagos', icon: 'point_of_sale', link: '/pagos' },
  { title: 'Clientes', icon: 'people', link: '/clientes' },
  { title: 'Muebles', icon: 'chair', link: '/muebles' },
  { title: 'Insumos', icon: 'inventory_2', link: '/insumos' },
  { title: 'Proveedores', icon: 'local_shipping', link: '/proveedores' }
]
</script>
