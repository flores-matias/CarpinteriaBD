export interface PedidoResponseDto {
  id: number
  cliente: string
  fechaCreacion: string
  fechaEntregaPrometida: string
  totalAPagar: number
  estadoPedido: string
  estadoPago: string
}
