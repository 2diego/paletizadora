import type { ChangeEvent } from 'react';

interface TruckConfigProps {
  maxPallets: number;
  numOrders: number;
  onMaxPalletsChange: (value: number) => void;
  onNumOrdersChange: (value: number) => void;
}

export function TruckConfig({
  maxPallets,
  numOrders,
  onMaxPalletsChange,
  onNumOrdersChange,
}: TruckConfigProps) {
  const handleNumOrdersChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    const num = Math.max(1, Math.min(value, 50));
    onNumOrdersChange(num);
  };

  return (
    <div className="config-section">
      <h2>Configuración del Camión</h2>
      <div className="config-row">
        <div className="form-group form-group-inline">
          <label htmlFor="config-max-pallets">Cant. máx. pallets</label>
          <input
            id="config-max-pallets"
            type="number"
            min={1}
            max={50}
            value={maxPallets}
            onChange={(e) => onMaxPalletsChange(Number(e.target.value))}
            placeholder="Ej: 20"
          />
        </div>
        <div className="form-group form-group-inline">
          <label htmlFor="config-num-orders">Cant. pedidos</label>
          <input
            id="config-num-orders"
            type="number"
            min={1}
            max={50}
            value={numOrders}
            onChange={handleNumOrdersChange}
            placeholder="Ej: 5"
          />
        </div>
      </div>
    </div>
  );
}
