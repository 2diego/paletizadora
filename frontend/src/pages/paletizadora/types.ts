export interface OrderItem {
  id: string;
  codigo: string;
  cantidad: number;
  filas: number;
  camadas: number;
  totalPorPallet: number;
}

export interface Order {
  id: string;
  ordenCarga: string;
  cliente: string;
  items: OrderItem[];
}

export interface PalletOrderItem {
  codigo: string;
  cantidad: number;
  porcentaje: number;
  filas: number;
  camadas: number;
}

export interface PalletOrder {
  orderId: string;
  ordenCarga: string;
  cliente: string;
  items: PalletOrderItem[];
}

export interface PalletDistribution {
  palletNumber: number;
  orders: PalletOrder[];
  porcentajeUsado: number;
}
