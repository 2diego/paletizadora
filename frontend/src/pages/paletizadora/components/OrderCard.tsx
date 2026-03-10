import type { Product } from '../../../api/products';
import type { Order, OrderItem } from '../types';

interface OrderCardProps {
  order: Order;
  orderIndex: number;
  products: Product[] | null;
  onOrderChange: (
    orderId: string,
    field: 'ordenCarga' | 'cliente',
    value: string
  ) => void;
  onAddItem: (orderId: string) => void;
  onItemChange: (
    orderId: string,
    itemId: string,
    field: keyof OrderItem,
    value: string | number
  ) => void;
  onRemoveItem: (orderId: string, itemId: string) => void;
  onCodigoBlur: (orderId: string, itemId: string, codigo: string) => void;
}

export function OrderCard({
  order,
  orderIndex,
  products,
  onOrderChange,
  onAddItem,
  onItemChange,
  onRemoveItem,
  onCodigoBlur,
}: OrderCardProps) {
  return (
    <div className="order-card">
      <div className="order-header">
        <h3>Pedido {orderIndex + 1}</h3>
      </div>
      <div className="form-row form-row-compact">
        <div className="form-group">
          <label htmlFor={`order-${order.id}-ordenCarga`}>Orden de Carga</label>
          <input
            id={`order-${order.id}-ordenCarga`}
            type="text"
            value={order.ordenCarga}
            onChange={(e) => onOrderChange(order.id, 'ordenCarga', e.target.value)}
            placeholder="Ej: OC-001"
          />
        </div>
        <div className="form-group">
          <label htmlFor={`order-${order.id}-cliente`}>Cliente</label>
          <input
            id={`order-${order.id}-cliente`}
            type="text"
            value={order.cliente}
            onChange={(e) => onOrderChange(order.id, 'cliente', e.target.value)}
            placeholder="Nombre del cliente"
          />
        </div>
      </div>

      <div className="items-section">
        <div className="items-header">
          <h4>Items del Pedido</h4>
          <button
            type="button"
            className="btn-add-item"
            onClick={() => onAddItem(order.id)}
            aria-label="Agregar item al pedido"
          >
            + Agregar Item
          </button>
        </div>

        {order.items.map((item) => {
          const codigoTrim = String(item.codigo || '').trim();
          const productMatch = codigoTrim
            ? products?.find(
                (p) =>
                  p.codigo.trim().toLowerCase() === codigoTrim.toLowerCase()
              )
            : null;
          return (
            <div key={item.id} className="item-row item-row-simple">
              <div className="form-group">
                <label htmlFor={`item-${item.id}-codigo`}>Código</label>
                <input
                  id={`item-${item.id}-codigo`}
                  type="text"
                  value={item.codigo}
                  onChange={(e) =>
                    onItemChange(order.id, item.id, 'codigo', e.target.value)
                  }
                  onBlur={(e) =>
                    onCodigoBlur(order.id, item.id, e.target.value)
                  }
                  placeholder="Cód. producto"
                />
                {codigoTrim && !productMatch && (
                  <small className="item-codigo-error">
                    Código no encontrado. Cargalo en Productos.
                  </small>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={`item-${item.id}-cantidad`}>Cantidad</label>
                <input
                  id={`item-${item.id}-cantidad`}
                  type="number"
                  min={0}
                  value={item.cantidad || ''}
                  onChange={(e) =>
                    onItemChange(
                      order.id,
                      item.id,
                      'cantidad',
                      Number(e.target.value)
                    )
                  }
                  placeholder="0"
                />
              </div>
              <button
                type="button"
                className="btn-remove"
                onClick={() => onRemoveItem(order.id, item.id)}
                aria-label="Quitar item"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
