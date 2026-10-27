export interface PedidoResponseDto {
  id: number
  idCliente: number
  cliente: string
  fechaCreacion: string
  fechaEntregaPrometida: string
  totalAPagar: number
  totalPagado: number
  saldo: number
  estadoPedido: string
  estadoPago: string
}
