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

        <!-- Logo + nombre: al hacer clic vuelve al inicio -->
        <router-link to="/" class="row items-center no-wrap marca q-ml-sm">
          <img src="/logo.png" alt="Carpintería BA" style="height: 34px" />
          <q-toolbar-title class="q-pl-sm"> Carpintería BA </q-toolbar-title>
        </router-link>

        <q-space />

        <template v-if="auth.isAuthenticated">
          <q-icon name="person" class="q-mr-xs" />
          <span class="q-mr-md">{{ auth.userName }}</span>
          <q-btn
            flat
            dense
            no-caps
            label="Salir"
            icon="logout"
            @click="onLogout"
          />
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

        <!-- Administracion: separada para cuando haya roles -->
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

/* El logo es un link: sin subrayado y con el color del header */
.marca {
  color: inherit;
  text-decoration: none;
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
