// Un renglon de recargo en el desglose (ej: IVA 21% sobre $28.600 = $6.006)
export interface RecargoCostoDto {
  // Id del registro MuebleConfiguracion (se usa para quitar el recargo)
  idMuebleConfiguracion: number
  idConfiguracion: number
  clave: string
  // Proporcion configurada (0.21 = 21%)
  proporcion: number
  // Precio acumulado sobre el que se calculo
  baseCalculo: number
  monto: number
}

// Desglose del precio:
// materiales + mano de obra + uso de maquinas = subtotal; subtotal + recargos = precio calculado
export interface MuebleCostoDto {
  idMueble: number
  mueble: string
  costoMateriales: number
  // Proporcion configurada (1.5 = 150%) y monto resultante
  proporcionManoDeObra: number
  manoDeObra: number
  proporcionUsoDeMaquinas: number
  usoDeMaquinas: number
  // Antes de los recargos
  subtotal: number
  // Recargos opcionales del mueble, en el orden en que se aplican
  recargos: RecargoCostoDto[]
  precioCalculado: number
  precioSugerido: number
  // Positivo: el sugerido esta por encima del calculado. Negativo: por debajo.
  diferencia: number
  tieneReceta: boolean
  margenesConfigurados: boolean
}
