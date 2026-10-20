<template>
  <q-page class="q-pa-md">
    <q-table
      title="Proveedores"
      :rows="proveedorStore.proveedores"
      :columns="columns"
      row-key="id"
      :loading="proveedorStore.loading"
      :rows-per-page-options="[10, 20, 50, 0]"
      no-data-label="No hay proveedores para mostrar"
      loading-label="Cargando proveedores..."
    >
      <template #top-right>
        <q-btn
          flat
          round
          icon="refresh"
          aria-label="Actualizar"
          :loading="proveedorStore.loading"
          @click="proveedorStore.fetchAll()"
        />
      </template>
    </q-table>

    <q-banner
      v-if="proveedorStore.error"
      class="bg-negative text-white q-mt-md"
      rounded
    >
      {{ proveedorStore.error }}
    </q-banner>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import type { QTableColumn } from 'quasar'
import { useProveedorStore } from '../stores/proveedor'
import type { ProveedorResponseDto } from '../models/ProveedorResponseDto'

const proveedorStore = useProveedorStore()

const columns: QTableColumn<ProveedorResponseDto>[] = [
  { name: 'id', label: 'Id', field: 'id', align: 'left', sortable: true },
  {
    name: 'razonSocial',
    label: 'RazonSocial',
    field: 'razonSocial',
    align: 'left',
    sortable: true
  },
  {
    name: 'telefono',
    label: 'Telefono',
    field: 'telefono',
    align: 'left',
    sortable: true
  },
  {
    name: 'email',
    label: 'Email',
    field: 'email',
    align: 'left',
    sortable: true
  }
]
onMounted(() => {
  void proveedorStore.fetchAll()
})
</script>
