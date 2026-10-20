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
    //link: 'http://localhost:9000/#/proveedores'
  }
]

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
