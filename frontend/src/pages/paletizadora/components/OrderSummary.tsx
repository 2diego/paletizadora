import type { Order } from '../types';

interface OrderSummaryProps {
  orders: Order[];
}

// Resumen de pedidos: Orden de carga, Cliente, Código, Cantidad pedida
export function OrderSummary({ orders }: OrderSummaryProps) {
  return (
    <div className="order-summary">
      <h3 className="order-summary-title">Resumen de pedidos</h3>
      <div className="order-summary-list">
        {orders.map((order) => (
          <div key={order.id} className="order-summary-card">
            <div className="order-summary-header">
              <span className="order-summary-oc">
                <strong>OC: {order.ordenCarga || '—'}</strong>
              </span>
              <span className="order-summary-cliente">{order.cliente || '—'}</span>
            </div>
            <ul className="order-summary-items">
              {order.items.map((item) => (
                <li key={item.id} className="order-summary-item">
                  <span className="order-summary-codigo">{item.codigo || '—'}</span>
                  <span className="order-summary-cantidad">{item.cantidad} u</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
