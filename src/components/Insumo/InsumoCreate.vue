<template>
  <q-card style="min-width: 420px">
    <q-card-section>
      <div class="text-h6">{{ editId ? 'Editar insumo' : 'Nuevo insumo' }}</div>
    </q-card-section>
    <q-separator />

    <q-card-section>
      <q-form ref="formRef" greedy @submit.prevent="onSubmit">
        <q-input
          v-model="form.nombre"
          label="Nombre"
          outlined
          class="q-mb-sm"
          :maxlength="30"
          counter
          autofocus
          lazy-rules
          :rules="[
            (v: string) => (!!v && v.trim().length > 0) || 'Ingresa el nombre'
          ]"
        />

        <!-- Relacion con Proveedor: se muestra la razon social y se guarda el id -->
        <q-select
          v-model="form.idProveedor"
          :options="proveedorStore.proveedores"
          option-value="id"
          option-label="razonSocial"
          emit-value
          map-options
          label="Proveedor"
          outlined
          class="q-mb-sm"
          :loading="proveedorStore.loading"
          lazy-rules
          :rules="[(v: number | null) => !!v || 'Selecciona un proveedor']"
        >
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">
                No hay proveedores cargados
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <!-- StockActual es decimal en la API (ej: 2.5 metros) -->
            <q-input
              v-model.number="form.stockActual"
              label="Stock actual"
              type="number"
              step="any"
              outlined
              lazy-rules
              :rules="[
                (v: number | string) =>
                  (v !== '' && v !== null && !isNaN(Number(v))) ||
                  'Ingresa el stock',
                (v: number | string) =>
                  Number(v) >= 0 || 'El stock no puede ser negativo'
              ]"
            />
          </div>
          <div class="col-6">
            <q-select
              v-model="form.unidadMedida"
              :options="unidadesMedida"
              label="Unidad de medida"
              outlined
              lazy-rules
              :rules="[(v: string) => !!v || 'Selecciona la unidad']"
            />
          </div>
        </div>

        <!-- La API exige precio mayor a 0 (ActualizarPrecioCosto lanza excepcion si no) -->
        <q-input
          v-model.number="form.precioCostoActual"
          label="Precio de costo"
          type="number"
          step="any"
          prefix="$"
          outlined
          class="q-mb-sm"
          lazy-rules
          :rules="[
            (v: number | string) =>
              (v !== '' && v !== null && !isNaN(Number(v))) ||
              'Ingresa el precio',
            (v: number | string) =>
              Number(v) > 0 || 'El precio tiene que ser mayor a 0'
          ]"
        />
      </q-form>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn label="Cancelar" flat @click="$emit('close')" />
      <q-btn
        :label="editId ? 'Guardar' : 'Crear'"
        color="primary"
        :loading="insumoStore.loading"
        @click="onSubmit"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { QForm } from 'quasar'
import { useInsumoStore } from '@/stores/insumo'
import { useProveedorStore } from '@/stores/proveedor'
import type { InsumoRequestDto } from '@/models/Insumo/InsumoRequestDto'
import { notificarError } from '@/utils/notificar'

// editId null = alta; con numero = modificacion
const props = defineProps<{ editId: number | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const insumoStore = useInsumoStore()
const proveedorStore = useProveedorStore()
const formRef = ref<QForm | null>(null)

// Opciones fijas de unidad de medida (se pueden agregar mas a la lista)
const unidadesMedida = [
  'Unidad',
  'Placa',
  'Metro',
  'Metro cuadrado',
  'Metro cubico',
  'Pie',
  'Kilo',
  'Litro',
  'Caja'
]

// Igual al DTO, pero idProveedor arranca en null para que el select aparezca vacio
type InsumoForm = Omit<InsumoRequestDto, 'idProveedor'> & {
  idProveedor: number | null
}

const form = ref<InsumoForm>({
  nombre: '',
  stockActual: 0,
  unidadMedida: '',
  precioCostoActual: 0,
  idProveedor: null
})

onMounted(async () => {
  // Se cargan los proveedores para el select (siempre, para tener la lista actualizada)
  const cargaProveedores = proveedorStore.fetchAll()

  // Si es modificacion, se traen los datos actuales del insumo
  if (props.editId) {
    const insumo = await insumoStore.fetchById(props.editId)
    if (insumo) {
      form.value = {
        nombre: insumo.nombre,
        stockActual: insumo.stockActual,
        unidadMedida: insumo.unidadMedida,
        precioCostoActual: insumo.precioCostoActual,
        idProveedor: insumo.idProveedor
      }
    }
  }

  await cargaProveedores
})

async function onSubmit() {
  const valido = await formRef.value?.validate()
  if (!valido) {
    return
  }
  // Pasada la validacion, idProveedor ya no puede ser null
  const insumo: InsumoRequestDto = {
    ...form.value,
    idProveedor: form.value.idProveedor as number
  }
  try {
    if (props.editId) {
      await insumoStore.update(props.editId, insumo)
    } else {
      await insumoStore.create(insumo)
    }
    emit('close')
  } catch {
    notificarError('No se pudo guardar el insumo')
  }
}
</script>
