import type { Order, PalletDistribution } from '../types';
import { OrderSummary } from './OrderSummary';
import { PalletCard } from './PalletCard';
import { PrintableCards } from './PrintableCards';

interface ResultsPhaseProps {
  orders: Order[];
  distribution: PalletDistribution[];
  onBack: () => void;
}

export function ResultsPhase({
  orders,
  distribution,
  onBack,
}: ResultsPhaseProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="results-phase no-print">
        <div className="results-phase-toolbar">
          <button
            type="button"
            className="btn-back"
            onClick={onBack}
            aria-label="Volver a editar pedidos"
          >
            ← Volver a editar pedidos
          </button>
          <button
            type="button"
            className="btn-print"
            onClick={handlePrint}
            aria-label="Imprimir tarjetas de pallets"
          >
            Imprimir tarjetas de pallets
          </button>
        </div>

        <div className="results-phase-layout">
          <aside className="results-phase-sidebar">
            <OrderSummary orders={orders} />
          </aside>
          <main className="results-phase-main">
            <h2 className="results-phase-title">Distribución de Pallets</h2>
            <div className="pallets-grid">
              {distribution.map((pallet) => (
                <PalletCard key={pallet.palletNumber} pallet={pallet} />
              ))}
            </div>
          </main>
        </div>
      </div>

      <PrintableCards distribution={distribution} />
    </>
  );
}
