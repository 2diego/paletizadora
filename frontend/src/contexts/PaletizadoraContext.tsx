import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getProducts } from '../api/products';
import type { Product } from '../api/products';
import { generateId } from '../utils/id';
import type { Order, PalletDistribution } from '../pages/paletizadora/types';

export type Phase = 'form' | 'results';

const createInitialOrder = (): Order => ({
  id: generateId(),
  ordenCarga: '',
  cliente: '',
  items: [],
});

interface PaletizadoraState {
  phase: Phase;
  maxPallets: number;
  numOrders: number;
  orders: Order[];
  distribution: PalletDistribution[];
  products: Product[] | null;
  productsLoadError: string | null;
}

interface PaletizadoraContextValue extends PaletizadoraState {
  setPhase: (p: Phase) => void;
  setMaxPallets: (n: number) => void;
  setNumOrders: (n: number) => void;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setDistribution: React.Dispatch<React.SetStateAction<PalletDistribution[]>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[] | null>>;
  setProductsLoadError: React.Dispatch<React.SetStateAction<string | null>>;
}

const PaletizadoraContext = createContext<PaletizadoraContextValue | null>(null);

export function PaletizadoraProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('form');
  const [maxPallets, setMaxPallets] = useState(1);
  const [numOrders, setNumOrders] = useState(1);
  const [orders, setOrders] = useState<Order[]>(() => [createInitialOrder()]);
  const [distribution, setDistribution] = useState<PalletDistribution[]>([]);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [productsLoadError, setProductsLoadError] = useState<string | null>(null);

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
  }, []);

  const value: PaletizadoraContextValue = {
    phase,
    maxPallets,
    numOrders,
    orders,
    distribution,
    products,
    productsLoadError,
    setPhase,
    setMaxPallets,
    setNumOrders,
    setOrders,
    setDistribution,
    setProducts,
    setProductsLoadError,
  };

  return (
    <PaletizadoraContext.Provider value={value}>
      {children}
    </PaletizadoraContext.Provider>
  );
}

export function usePaletizadora() {
  const ctx = useContext(PaletizadoraContext);
  if (!ctx) throw new Error('usePaletizadora must be used within PaletizadoraProvider');
  return ctx;
}
