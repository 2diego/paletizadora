import type { PalletDistribution } from '../types';
import { PalletCard } from './PalletCard';

interface PrintableCardsProps {
  distribution: PalletDistribution[];
}

/**
 * Contenedor de tarjetas de pallets para impresión: 4 tarjetas por hoja (2×2).
 * Se muestra oculto en pantalla y solo visible al imprimir.
 */
export function PrintableCards({ distribution }: PrintableCardsProps) {
  return (
    <div className="print-zone" id="print-zone-pallets" aria-hidden="true">
      <div className="print-zone-inner">
        {distribution.map((pallet) => (
          <PalletCard key={pallet.palletNumber} pallet={pallet} printMode />
        ))}
      </div>
    </div>
  );
}
