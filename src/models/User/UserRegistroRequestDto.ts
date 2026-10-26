export interface UserRegistroRequestDto {
  nombres: string
  apellidos: string
  email: string
  password: string
  fechaNacimiento: string | null
}
