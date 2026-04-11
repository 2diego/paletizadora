import type { Order, PalletDistribution } from './types';

type ItemInput = {
  codigo: string;
  cantidad: number;
  filas: number;
  camadas: number;
  capacidadPorPallet: number;
  orderId: string;
  ordenCarga: string;
  cliente: string;
};

type ItemWithStock = ItemInput & {
  cantidadDisponible: number;
  porcentajePorUnidad: number;
};

export type CalculateResult =
  | { ok: true; distribution: PalletDistribution[] }
  | { ok: false; message: string };

/**
 * Calcula la distribución de productos en pallets.
 * Prioriza pallets enteros (100% de un producto); el resto se mezcla respetando
 * camada (múltiplos de fila) y orden de carga.
 */
export function calculateDistribution(
  orders: Order[],
  maxPallets: number
): CalculateResult {
  if (maxPallets <= 0) {
    return { ok: false, message: 'La cantidad de pallets debe ser mayor a 0' };
  }

  const hasValidItems = orders.some((order) =>
    order.items.some(
      (item) =>
        item.codigo && item.cantidad > 0 && item.filas > 0 && item.camadas > 0
    )
  );

  if (!hasValidItems) {
    return {
      ok: false,
      message:
        'Debe ingresar al menos un item válido con código, cantidad, filas y camadas',
    };
  }

  const allItems: ItemInput[] = [];
  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (
        item.codigo &&
        item.cantidad > 0 &&
        item.filas > 0 &&
        item.camadas > 0
      ) {
        allItems.push({
          codigo: item.codigo,
          cantidad: item.cantidad,
          filas: item.filas,
          camadas: item.camadas,
          capacidadPorPallet: item.filas * item.camadas,
          orderId: order.id,
          ordenCarga: order.ordenCarga,
          cliente: order.cliente,
        });
      }
    });
  });

  const itemsPorOrdenCarga: Record<string, ItemWithStock[]> = {};
  allItems.forEach((item) => {
    const ordenCarga = item.ordenCarga || '0';
    if (!itemsPorOrdenCarga[ordenCarga]) {
      itemsPorOrdenCarga[ordenCarga] = [];
    }
    itemsPorOrdenCarga[ordenCarga].push({
      ...item,
      cantidadDisponible: item.cantidad,
      porcentajePorUnidad: 100 / item.capacidadPorPallet,
    });
  });

  const ordenesCargaOrdenadas = Object.keys(itemsPorOrdenCarga).sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  const pallets: PalletDistribution[] = [];

  // Fase 1: crear pallets enteros (100% de un mismo producto) respetando orden de carga
  for (const ordenCarga of ordenesCargaOrdenadas) {
    if (pallets.length >= maxPallets) break;
    const itemsActuales = itemsPorOrdenCarga[ordenCarga];
    for (const item of itemsActuales) {
      if (pallets.length >= maxPallets) break;
      const fullPalletsCount = Math.floor(
        item.cantidadDisponible / item.capacidadPorPallet
      );
      for (let k = 0; k < fullPalletsCount && pallets.length < maxPallets; k++) {
        const nuevoPallet: PalletDistribution = {
          palletNumber: pallets.length + 1,
          orders: [
            {
              orderId: item.orderId,
              ordenCarga: item.ordenCarga,
              cliente: item.cliente,
              items: [
                {
                  codigo: item.codigo,
                  cantidad: item.capacidadPorPallet,
                  porcentaje: 100,
                  filas: item.filas,
                  camadas: item.camadas,
                },
              ],
            },
          ],
          porcentajeUsado: 100,
        };
        pallets.push(nuevoPallet);
        item.cantidadDisponible -= item.capacidadPorPallet;
      }
    }
  }

  function agregarItemAPallet(
    pallet: PalletDistribution,
    item: ItemWithStock,
    cantidad: number
  ) {
    const porcentaje = cantidad * item.porcentajePorUnidad;
    let orderInPallet = pallet.orders.find((o) => o.orderId === item.orderId);
    if (!orderInPallet) {
      orderInPallet = {
        orderId: item.orderId,
        ordenCarga: item.ordenCarga,
        cliente: item.cliente,
        items: [],
      };
      pallet.orders.push(orderInPallet);
    }
    const existingItem = orderInPallet.items.find((i) => i.codigo === item.codigo);
    if (existingItem) {
      existingItem.cantidad += cantidad;
      existingItem.porcentaje += porcentaje;
    } else {
      orderInPallet.items.push({
        codigo: item.codigo,
        cantidad,
        porcentaje,
        filas: item.filas,
        camadas: item.camadas,
      });
    }
    pallet.porcentajeUsado += porcentaje;
  }

  function encontrarItemQueQuepa(
    espacioDisponible: number,
    itemsDisponibles: ItemWithStock[]
  ): { item: ItemWithStock; cantidad: number; porcentaje: number } | null {
    let mejorOpcion: {
      item: ItemWithStock;
      cantidad: number;
      porcentaje: number;
    } | null = null;
    let mejorPorcentaje = 0;

    for (const item of itemsDisponibles) {
      if (item.cantidadDisponible < item.camadas) continue;
      const { camadas, porcentajePorUnidad } = item;
      const maxCantidad = Math.floor(espacioDisponible / porcentajePorUnidad);
      const filasQueCaben = Math.floor(maxCantidad / camadas);
      const filasDisponibles = Math.floor(item.cantidadDisponible / camadas);
      const filasAUsar = Math.min(filasQueCaben, filasDisponibles);
      const cantidadAUsar = filasAUsar * camadas;

      if (cantidadAUsar > 0) {
        const porcentajeAUsar = cantidadAUsar * porcentajePorUnidad;
        if (porcentajeAUsar > mejorPorcentaje) {
          mejorPorcentaje = porcentajeAUsar;
          mejorOpcion = { item, cantidad: cantidadAUsar, porcentaje: porcentajeAUsar };
        }
      }
    }

    if (mejorOpcion === null && espacioDisponible > 0.1) {
      let mejorOverflow: {
        item: ItemWithStock;
        cantidad: number;
        porcentaje: number;
      } | null = null;
      let menorExceso = Infinity;
      for (const item of itemsDisponibles) {
        if (item.cantidadDisponible < item.camadas) continue;
        const porcentajeUnaFila = item.camadas * item.porcentajePorUnidad;
        const exceso = porcentajeUnaFila - espacioDisponible;
        if (exceso < menorExceso) {
          menorExceso = exceso;
          mejorOverflow = {
            item,
            cantidad: item.camadas,
            porcentaje: porcentajeUnaFila,
          };
        }
      }
      return mejorOverflow;
    }
    return mejorOpcion;
  }

  function sonConsecutivas(orden1: string, orden2: string): boolean {
    const num1 = parseFloat(orden1);
    const num2 = parseFloat(orden2);
    if (!isNaN(num1) && !isNaN(num2)) return Math.abs(num1 - num2) === 1;
    const index1 = ordenesCargaOrdenadas.indexOf(orden1);
    const index2 = ordenesCargaOrdenadas.indexOf(orden2);
    return Math.abs(index1 - index2) === 1;
  }

  // Fase 2: llenar pallets con camadas completas por orden de carga; en último/penúltimo pallet
  // de cada orden se puede mezclar con la orden consecutiva siguiente si hay espacio.
  for (let i = 0; i < ordenesCargaOrdenadas.length; i++) {
    const ordenCargaActual = ordenesCargaOrdenadas[i];
    const itemsActuales = itemsPorOrdenCarga[ordenCargaActual];
    const ordenCargaSiguiente =
      i < ordenesCargaOrdenadas.length - 1 ? ordenesCargaOrdenadas[i + 1] : null;
    const esConsecutiva =
      ordenCargaSiguiente && sonConsecutivas(ordenCargaActual, ordenCargaSiguiente);

    const espacioTotalOrden = itemsActuales.reduce(
      (sum, item) => sum + item.cantidadDisponible * item.porcentajePorUnidad,
      0
    );
    const palletsCompletosEstimados = Math.ceil(espacioTotalOrden / 100);
    let palletsCreadosParaEstaOrden = 0;

    while (itemsActuales.some((item) => item.cantidadDisponible > 0)) {
      if (pallets.length >= maxPallets) {
        const itemsRestantes = itemsActuales
          .filter((item) => item.cantidadDisponible > 0)
          .reduce((sum, item) => sum + item.cantidadDisponible, 0);
        if (itemsRestantes > 0) {
          return {
            ok: false,
            message: `Se alcanzó el límite de ${maxPallets} pallets. Quedan ${itemsRestantes} unidades sin distribuir.`,
          };
        }
        break;
      }

      const nuevoPallet: PalletDistribution = {
        palletNumber: pallets.length + 1,
        orders: [],
        porcentajeUsado: 0,
      };

      let espacioDisponible = 100;
      let itemsUsadosEnEstePallet = false;

      while (
        espacioDisponible > 0.1 &&
        itemsActuales.some((item) => item.cantidadDisponible > 0)
      ) {
        const opcion = encontrarItemQueQuepa(espacioDisponible, itemsActuales);
        if (!opcion) break;
        agregarItemAPallet(nuevoPallet, opcion.item, opcion.cantidad);
        opcion.item.cantidadDisponible -= opcion.cantidad;
        espacioDisponible -= opcion.porcentaje;
        itemsUsadosEnEstePallet = true;
      }

      const esUltimoPallet =
        palletsCreadosParaEstaOrden >= palletsCompletosEstimados - 1;
      const esPenultimoPallet =
        palletsCreadosParaEstaOrden >= palletsCompletosEstimados - 2 &&
        palletsCompletosEstimados > 1;
      const puedeMezclar = esUltimoPallet || esPenultimoPallet;

      if (
        espacioDisponible > 5 &&
        esConsecutiva &&
        ordenCargaSiguiente &&
        puedeMezclar &&
        itemsUsadosEnEstePallet
      ) {
        const itemsSiguientes = itemsPorOrdenCarga[ordenCargaSiguiente];
        if (itemsSiguientes.some((item) => item.cantidadDisponible > 0)) {
          while (
            espacioDisponible > 0.1 &&
            itemsSiguientes.some((item) => item.cantidadDisponible > 0)
          ) {
            const opcion = encontrarItemQueQuepa(
              espacioDisponible,
              itemsSiguientes
            );
            if (!opcion) break;
            agregarItemAPallet(nuevoPallet, opcion.item, opcion.cantidad);
            opcion.item.cantidadDisponible -= opcion.cantidad;
            espacioDisponible -= opcion.porcentaje;
          }
        }
      }

      if (nuevoPallet.orders.length > 0) {
        pallets.push(nuevoPallet);
        palletsCreadosParaEstaOrden++;
      } else {
        break;
      }
    }
  }

  // Fase 3: distribuir bultos sobrantes (que no completan una camada) por orden de carga.
  // Se permite mezclar pedidos consecutivos y al final se ordenan los pallets por orden de carga.
  for (const ordenCarga of ordenesCargaOrdenadas) {
    const itemsActuales = itemsPorOrdenCarga[ordenCarga];
    for (const item of itemsActuales) {
      while (item.cantidadDisponible > 0) {
        if (pallets.length >= maxPallets) {
          const sobrantes = itemsPorOrdenCarga[ordenCarga].reduce(
            (s, i) => s + i.cantidadDisponible,
            0
          );
          if (sobrantes > 0) {
            return {
              ok: false,
              message: `Se alcanzó el límite de ${maxPallets} pallets. Quedan ${sobrantes} bultos sobrantes sin distribuir (orden ${ordenCarga}).`,
            };
          }
          break;
        }

        let palletElegido: PalletDistribution | null = null;
        let espacioMax = 0;
        const palletsConEstaOrden = pallets.filter((p) =>
          p.orders.some((o) => o.orderId === item.orderId)
        );
        for (const p of palletsConEstaOrden) {
          const espacio = 100 - p.porcentajeUsado;
          if (espacio > 0.1 && espacio > espacioMax) {
            espacioMax = espacio;
            palletElegido = p;
          }
        }
        if (!palletElegido) {
          for (const p of pallets) {
            const espacio = 100 - p.porcentajeUsado;
            if (espacio > 0.1 && espacio > espacioMax) {
              espacioMax = espacio;
              palletElegido = p;
            }
          }
        }
        if (!palletElegido || espacioMax < 0.1) {
          if (pallets.length >= maxPallets) break;
          const nuevoPallet: PalletDistribution = {
            palletNumber: pallets.length + 1,
            orders: [],
            porcentajeUsado: 0,
          };
          pallets.push(nuevoPallet);
          palletElegido = nuevoPallet;
          espacioMax = 100;
        }

        const espacioDisponible = 100 - palletElegido.porcentajeUsado;
        const maxBultos = Math.floor(espacioDisponible / item.porcentajePorUnidad);
        const cantidadAUsar = Math.min(maxBultos, item.cantidadDisponible);
        if (cantidadAUsar <= 0) break;
        agregarItemAPallet(palletElegido, item, cantidadAUsar);
        item.cantidadDisponible -= cantidadAUsar;
      }
    }
  }

  const sobrantesSinDistribuir = ordenesCargaOrdenadas.reduce(
    (acc, ordenCarga) =>
      acc + itemsPorOrdenCarga[ordenCarga].reduce((s, i) => s + i.cantidadDisponible, 0),
    0
  );
  if (sobrantesSinDistribuir > 0) {
    return {
      ok: false,
      message: `Se alcanzó el límite de ${maxPallets} pallets. Quedan ${sobrantesSinDistribuir} bultos sobrantes sin distribuir.`,
    };
  }

  // Ordenar pallets por la orden de carga más temprana que contengan pedidos consecutivos.
  const indexOrdenCarga = (orden: string) => {
    const i = ordenesCargaOrdenadas.indexOf(orden);
    return i === -1 ? 999 : i;
  };
  pallets.sort((a, b) => {
    const minIdxA = Math.min(...a.orders.map((o) => indexOrdenCarga(o.ordenCarga)));
    const minIdxB = Math.min(...b.orders.map((o) => indexOrdenCarga(o.ordenCarga)));
    if (minIdxA !== minIdxB) return minIdxA - minIdxB;
    return a.palletNumber - b.palletNumber;
  });
  pallets.forEach((p, i) => {
    p.palletNumber = i + 1;
  });

  pallets.forEach((pallet) => {
    pallet.porcentajeUsado = Math.round(pallet.porcentajeUsado * 10) / 10;
    pallet.orders.forEach((order) => {
      order.items.forEach((item) => {
        item.porcentaje = Math.round(item.porcentaje * 10) / 10;
      });
    });
  });

  return { ok: true, distribution: pallets };
}
