import { useEffect } from 'react';
import { getProducts } from '../../api/products';
import { usePaletizadora } from '../../contexts/PaletizadoraContext';
import { useUi } from '../../contexts/UiContext';
import { calculateDistribution } from './calculateDistribution';
import type { OrderItem } from './types';
import { OrderCard, ResultsPhase, TruckConfig } from './components';
import { generateId } from '../../utils/id';
import './paletizadora.css';

export default function Palletizadora() {
  const {
    phase,
    setPhase,
    maxPallets,
    setMaxPallets,
    numOrders,
    setNumOrders,
    orders,
    setOrders,
    distribution,
    setDistribution,
    products,
    productsLoadError,
    setProducts,
    setProductsLoadError,
  } = usePaletizadora();
  const { showToast } = useUi();

  // Refrescar lista de productos al entrar a esta sección
  useEffect(() => {
    setProductsLoadError(null);
    getProducts()
      .then((data) => {
        setProducts(data);
        setProductsLoadError(null);
      })
      .catch((e) => {
        setProducts([]);
        setProductsLoadError(
          e instanceof Error ? e.message : 'No se pudieron cargar los productos.'
        );
      });
  }, [setProducts, setProductsLoadError]);

  const handleNumOrdersChange = (value: number) => {
    const num = Math.max(1, Math.min(value, 50));
    setNumOrders(num);
    setOrders((prev) => {
      if (num > prev.length) {
        const next = [...prev];
        for (let i = prev.length; i < num; i++) {
          next.push({
            id: generateId(),
            ordenCarga: '',
            cliente: '',
            items: [],
          });
        }
        return next;
      }
      if (num < prev.length) return prev.slice(0, num);
      return prev;
    });
  };

  const handleOrderChange = (
    orderId: string,
    field: 'ordenCarga' | 'cliente',
    value: string
  ) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, [field]: value } : order
      )
    );
  };

  const handleAddItem = (orderId: string) => {
    const newItem: OrderItem = {
      id: generateId(),
      codigo: '',
      cantidad: 0,
      filas: 0,
      camadas: 0,
      totalPorPallet: 0,
    };
    setOrders(
      orders.map((order) =>
        order.id === orderId
          ? { ...order, items: [...order.items, newItem] }
          : order
      )
    );
  };

  const handleItemChange = (
    orderId: string,
    itemId: string,
    field: keyof OrderItem,
    value: string | number
  ) => {
    setOrders(
      orders.map((order) => {
        if (order.id !== orderId) return order;
        const updatedItems = order.items.map((item) => {
          if (item.id !== itemId) return item;
          const updated = { ...item, [field]: value };
          if (field === 'filas' || field === 'camadas') {
            updated.totalPorPallet = updated.filas * updated.camadas;
          }
          return updated;
        });
        return { ...order, items: updatedItems };
      })
    );
  };

  const handleRemoveItem = (orderId: string, itemId: string) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId
          ? { ...order, items: order.items.filter((i) => i.id !== itemId) }
          : order
      )
    );
  };

  const handleCodigoBlur = (orderId: string, itemId: string, codigo: string) => {
    const trimmed = codigo.trim();
    if (!trimmed) return;
    const product = products?.find(
      (p) => p.codigo.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (!product) return;
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          items: order.items.map((item) => {
            if (item.id !== itemId) return item;
            const filas = product.filas;
            const camadas = product.camadas;
            return {
              ...item,
              filas,
              camadas,
              totalPorPallet: filas * camadas,
            };
          }),
        };
      })
    );
  };

  const handleCalculate = () => {
    const result = calculateDistribution(orders, maxPallets);
    if (!result.ok) {
      showToast(result.message);
      return;
    }
    setDistribution(result.distribution);
    setPhase('results');
  };

  const handleBack = () => {
    setPhase('form');
  };

  if (phase === 'results') {
    return (
      <div className="palletizadora-container">
        <div className="palletizadora-header palletizadora-header-compact no-print">
          <h1>Palletizadora</h1>
        </div>
        <ResultsPhase
          orders={orders}
          distribution={distribution}
          onBack={handleBack}
        />
      </div>
    );
  }

  return (
    <div className="palletizadora-container">
      <div className="palletizadora-header">
        <h1>Palletizadora</h1>
        <p>Calcula la distribución de productos en pallets de forma porcentual</p>
      </div>

      {productsLoadError && (
        <div className="message message-warning" role="alert">
          {productsLoadError}
        </div>
      )}

      <div className="palletizadora-form">
        <TruckConfig
          maxPallets={maxPallets}
          numOrders={numOrders}
          onMaxPalletsChange={setMaxPallets}
          onNumOrdersChange={handleNumOrdersChange}
        />

        <div className="orders-section">
          <h2>Datos de los Pedidos</h2>
          <div className="orders-grid">
            {orders.map((order, orderIndex) => (
              <OrderCard
                key={order.id}
                order={order}
                orderIndex={orderIndex}
                products={products}
                onOrderChange={handleOrderChange}
                onAddItem={handleAddItem}
                onItemChange={handleItemChange}
                onRemoveItem={handleRemoveItem}
                onCodigoBlur={handleCodigoBlur}
              />
            ))}
          </div>
        </div>

        <div className="calculate-section">
          <button
            type="button"
            className="btn-calculate"
            onClick={handleCalculate}
            aria-label="Calcular distribución de pallets según pedidos cargados"
          >
            Calcular Distribución de Pallets
          </button>
        </div>
      </div>
    </div>
  );
}
