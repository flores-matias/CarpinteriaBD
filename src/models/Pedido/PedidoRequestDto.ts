export interface PedidoRequestDto {
  idCliente: number
  fechaCreacion: string
  fechaEntregaPrometida: string
  totalAPagar: number
  estadoPedido: string
  estadoPago: string
}
