export interface MuebleResponseDto {
  id: number
  nombre: string
  descripcion: string
  precioSugerido: number
  // Calculados por la API con la receta y los margenes de Configuracion
  costoMateriales: number
  precioCalculado: number
}
