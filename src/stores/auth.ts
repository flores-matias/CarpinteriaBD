import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../boot/axios'
import type { LoginUserRequestDto } from '../models/Auth/LoginUserRequestDto'

const TOKEN_KEY = 'token'
const USER_KEY = 'userName'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const userName = ref<string | null>(localStorage.getItem(USER_KEY))
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function login(credenciales: LoginUserRequestDto): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/Auth/login', credenciales)
      const data = response.data

      const tokenVal = data.token
      const userVal = data.userName

      if (!tokenVal) {
        error.value = 'La respuesta del servidor no contiene un token válido.'
        return false
      }

      token.value = tokenVal
      userName.value = userVal || credenciales.email

      localStorage.setItem(TOKEN_KEY, tokenVal)
      if (userName.value) {
        localStorage.setItem(USER_KEY, userName.value)
      }

      return true
    } catch {
      error.value = 'Email o contraseña incorrectos'
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    userName.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return { token, userName, loading, error, login, logout }
})
