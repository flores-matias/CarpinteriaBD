<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated :class="{ 'fondo-bloqueado': !auth.isAuthenticated }">
      <q-toolbar>
        <q-btn
          v-if="auth.isAuthenticated"
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title> Carpinteria BA </q-toolbar-title>

        <template v-if="auth.isAuthenticated">
          <q-icon name="person" class="q-mr-xs" />
          <span class="q-mr-md">{{ auth.userName }}</span>
          <q-btn flat dense label="Salir" icon="logout" @click="onLogout" />
        </template>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-if="auth.isAuthenticated"
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label header> Essential Links </q-item-label>

        <EssentialLink
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container :class="{ 'fondo-bloqueado': !auth.isAuthenticated }">
      <router-view />
    </q-page-container>

    <LoginModal />
  </q-layout>
</template>

<style scoped>
.fondo-bloqueado {
  filter: blur(4px);
  pointer-events: none;
  user-select: none;
}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import EssentialLink, {
  type EssentialLinkProps
} from '@/components/EssentialLink.vue'
import LoginModal from '@/components/Auth/LoginModal.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function onLogout() {
  auth.logout()
  //await router.push('/login')
  await router.push('/')
}

const linksList: EssentialLinkProps[] = [
  {
    title: 'Proveedores',
    caption: 'Lista de proveedores',
    icon: 'inventory',
    link: '/proveedores'
  },
  {
    title: 'Clientes',
    caption: 'Lista de clientes',
    icon: 'people',
    link: '/clientes'
  },
  {
    title: 'Configuraciones',
    caption: 'Parametros del sistema',
    icon: 'settings',
    link: '/configuraciones'
  },
  {
    title: 'Muebles',
    caption: 'Catalogo de muebles',
    icon: 'chair',
    link: '/muebles'
  },
  {
    title: 'Tipos de pago',
    caption: 'Medios de pago aceptados',
    icon: 'payments',
    link: '/tipos-pago'
  },
  {
    title: 'Insumos',
    caption: 'Materiales y stock',
    icon: 'inventory_2',
    link: '/insumos'
  },
  {
    title: 'Pedidos',
    caption: 'Pedidos de clientes',
    icon: 'receipt_long',
    link: '/pedidos'
  },
  {
    title: 'Pagos',
    caption: 'Cobros de pedidos',
    icon: 'point_of_sale',
    link: '/pagos'
  }
]

// Links que solo ve un usuario logueado
const linksAdmin: EssentialLinkProps[] = [
  {
    title: 'Usuarios',
    caption: 'Registrar usuarios',
    icon: 'manage_accounts',
    link: '/usuarios'
  }
]

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
