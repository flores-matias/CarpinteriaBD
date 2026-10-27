// Desglose del precio: materiales + mano de obra + uso de maquinas = precio calculado
export interface MuebleCostoDto {
  idMueble: number
  mueble: string
  costoMateriales: number
  // Proporcion configurada (1.5 = 150%) y monto resultante
  proporcionManoDeObra: number
  manoDeObra: number
  proporcionUsoDeMaquinas: number
  usoDeMaquinas: number
  precioCalculado: number
  precioSugerido: number
  // Positivo: el sugerido esta por encima del calculado. Negativo: por debajo.
  diferencia: number
  tieneReceta: boolean
  margenesConfigurados: boolean
}
