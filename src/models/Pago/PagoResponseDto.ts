export interface PagoResponseDto {
  id: number
  idPedido: number
  cliente: string
  idTipoPago: number
  tipoPago: string
  monto: number
  fechaPago: string
}
