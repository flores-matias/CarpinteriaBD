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

        <q-toolbar-title> Carpintería BA </q-toolbar-title>

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
        <q-item-label header> Menú </q-item-label>

        <EssentialLink
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
        />

        <!-- Administracion: el drawer ya solo se ve con sesion, pero queda separado para cuando haya roles -->
        <q-separator class="q-my-sm" />
        <q-item-label header> Administración </q-item-label>

        <EssentialLink
          v-for="link in linksAdmin"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container :class="{ 'fondo-bloqueado': !auth.isAuthenticated }">
      <router-view />
    </q-page-container>

    <!-- Popup de login: se abre solo cuando no hay sesion -->
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
  await router.push('/')
}

const linksList: EssentialLinkProps[] = [
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
  },
  {
    title: 'Clientes',
    caption: 'Lista de clientes',
    icon: 'people',
    link: '/clientes'
  },
  {
    title: 'Muebles',
    caption: 'Catalogo, recetas y costos',
    icon: 'chair',
    link: '/muebles'
  },
  {
    title: 'Insumos',
    caption: 'Materiales y stock',
    icon: 'inventory_2',
    link: '/insumos'
  },
  {
    title: 'Proveedores',
    caption: 'Lista de proveedores',
    icon: 'local_shipping',
    link: '/proveedores'
  },
  {
    title: 'Tipos de pago',
    caption: 'Medios de pago aceptados',
    icon: 'payments',
    link: '/tipos-pago'
  }
]

// Seccion Administracion (cuando haya roles, se mostrara solo al Admin)
const linksAdmin: EssentialLinkProps[] = [
  {
    title: 'Configuraciones',
    caption: 'Margenes y parametros',
    icon: 'settings',
    link: '/configuraciones'
  },
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
