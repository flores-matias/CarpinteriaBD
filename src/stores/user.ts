import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isAxiosError } from 'axios'
import { api } from '../boot/axios'
import type { UserRegistroRequestDto } from '../models/User/UserRegistroRequestDto'
import type { UserRegistroResponseDto } from '../models/User/UserRegistroResponseDto'
import { notificarExito } from '../utils/notificar'

export const useUserStore = defineStore('user', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** POST api/Auth/Register. Devuelve el usuario creado o null si fallo. */
  async function registrar(
    user: UserRegistroRequestDto
  ): Promise<UserRegistroResponseDto | null> {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.post<UserRegistroResponseDto>(
        '/Auth/Register',
        user
      )
      notificarExito(`Usuario ${data.userName} creado`)
      return data
    } catch (err: unknown) {
      if (isAxiosError<string | string[]>(err)) {
        const datos = err.response?.data
        if (Array.isArray(datos)) {
          // Identity devuelve una lista de errores (por ejemplo, reglas de contraseña)
          error.value = datos.join(' ')
        } else if (typeof datos === 'string') {
          // Mensaje simple, por ejemplo: email ya registrado
          error.value = datos
        } else if (!err.response) {
          error.value = 'No se pudo conectar con la API'
        } else {
          error.value = `Error ${err.response.status} al registrar el usuario`
        }
      } else {
        error.value = 'Error inesperado al registrar el usuario'
      }
      return null
    } finally {
      loading.value = false
    }
  }

  return { loading, error, registrar }
})
