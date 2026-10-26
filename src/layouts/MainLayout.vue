<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title> Carpinteria-BA </q-toolbar-title>

        <!-- Con sesion: nombre de usuario y boton para salir. Sin sesion: boton para ingresar -->
        <template v-if="auth.isAuthenticated">
          <q-icon name="person" class="q-mr-xs" />
          <span class="q-mr-md">{{ auth.userName }}</span>
          <q-btn flat dense label="Salir" icon="logout" @click="onLogout" />
        </template>
        <q-btn v-else flat dense label="Ingresar" icon="login" to="/login" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Essential Links </q-item-label>

        <EssentialLink
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
        />

        <!-- Administracion: solo se muestra con sesion iniciada -->
        <template v-if="auth.isAuthenticated">
          <q-separator class="q-my-sm" />
          <q-item-label header> Administracion </q-item-label>

          <EssentialLink
            v-for="link in linksAdmin"
            :key="link.title"
            v-bind="link"
          />
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import EssentialLink, {
  type EssentialLinkProps
} from '@/components/EssentialLink.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function onLogout() {
  auth.logout()
  await router.push('/login')
}

const linksList: EssentialLinkProps[] = [
  {
    title: 'Proveedores',
    caption: 'Lista de proveedores',
    icon: 'favorite',
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
