import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { isAxiosError } from 'axios'
import { api } from '../boot/axios'
import type { LoginUserRequestDto } from '../models/Auth/LoginUserRequestDto'
import type { LoginUserResponseDto } from '../models/Auth/LoginUserResponseDto'

// Claves con las que se guarda la sesion en localStorage
const TOKEN_KEY = 'token'
const USER_KEY = 'userName'

export const useAuthStore = defineStore('auth', () => {
  // Al crear el store se lee lo guardado: asi la sesion sobrevive a un F5
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const userName = ref<string | null>(localStorage.getItem(USER_KEY))
  const loading = ref(false)
  const error = ref<string | null>(null)

  // El layout (MainLayout.vue) usa esto para mostrar el nombre de usuario arriba a la derecha
  const isAuthenticated = computed(() => !!token.value)

  /** POST api/Auth/login. Devuelve true si el login fue exitoso. */
  async function login(credenciales: LoginUserRequestDto): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.post<LoginUserResponseDto>(
        '/Auth/login',
        credenciales
      )

      if (!data.token) {
        error.value = 'La respuesta del servidor no contiene un token válido.'
        return false
      }

      token.value = data.token
      userName.value = data.userName || credenciales.email

      localStorage.setItem(TOKEN_KEY, token.value)
      localStorage.setItem(USER_KEY, userName.value)

      return true
    } catch (e) {
      if (isAxiosError<LoginUserResponseDto>(e)) {
        if (e.response?.data?.errores?.length) {
          // La API responde 400 con { login: false, errores: [...] }
          error.value = e.response.data.errores.join(' ')
        } else if (!e.response) {
          // No hubo respuesta: API apagada, puerto equivocado, certificado o CORS
          error.value = 'No se pudo conectar con la API'
        } else {
          error.value = 'Email o contraseña incorrectos'
        }
      } else {
        error.value = 'Error inesperado al iniciar sesión'
      }
      return false
    } finally {
      loading.value = false
    }
  }

  /** Borra la sesion en memoria y en localStorage. */
  function logout() {
    token.value = null
    userName.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return { token, userName, loading, error, isAuthenticated, login, logout }
})
