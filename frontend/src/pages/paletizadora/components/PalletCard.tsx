import type { PalletDistribution } from '../types';

interface PalletCardProps {
  pallet: PalletDistribution;
  /** Si true, se usa en la zona imprimible (estilo compacto) */
  printMode?: boolean;
}

export function PalletCard({ pallet, printMode = false }: PalletCardProps) {
  return (
    <div className={printMode ? 'pallet-card pallet-card-print' : 'pallet-card'}>
      <div className="pallet-header">
        <h3>Pallet #{pallet.palletNumber}</h3>
        <span className="percentage-badge">
          {pallet.porcentajeUsado.toFixed(1)}% usado
        </span>
      </div>
      {pallet.orders.map((order, idx) => (
        <div key={idx} className="pallet-order">
          <div className="order-info">
            <strong>OC: {order.ordenCarga}</strong> — {order.cliente}
          </div>
          <div className="order-items">
            {order.items.map((item, itemIdx) => (
              <div key={itemIdx} className="pallet-item">
                <span className="item-code">{item.codigo}</span>
                <span className="item-details">
                  Cant: {item.cantidad} | {item.filas}×{item.camadas} |{' '}
                  {item.porcentaje.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
