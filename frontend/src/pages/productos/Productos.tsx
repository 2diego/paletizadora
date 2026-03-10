import { useCallback, useEffect, useState } from 'react';
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
  type Product,
  type CreateProductBody,
} from '../../api/products';
import { useUi } from '../../contexts/UiContext';
import './productos.css';

export default function Productos() {
  const { showConfirm } = useUi();
  const [list, setList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateProductBody & { id?: number }>({
    codigo: '',
    filas: 0,
    camadas: 0,
    detalle: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts(false);
      setList(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { id, codigo, filas, camadas, detalle } = form;
    if (!codigo.trim()) {
      setError('El código es obligatorio');
      return;
    }
    try {
      if (id != null) {
        await updateProduct(id, { codigo: codigo.trim(), filas, camadas, detalle: detalle || null });
      } else {
        await createProduct({ codigo: codigo.trim(), filas, camadas, detalle: detalle || null });
      }
      setForm({ codigo: '', filas: 0, camadas: 0, detalle: '' });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    }
  };

  const handleEdit = (p: Product) => {
    setForm({
      id: p.id,
      codigo: p.codigo,
      filas: p.filas,
      camadas: p.camadas,
      detalle: p.detalle ?? '',
    });
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Eliminar producto',
      message: '¿Eliminar este producto?',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
    });
    if (!confirmed) return;
    setError(null);
    try {
      await deleteProduct(id);
      if (form.id === id) setForm({ codigo: '', filas: 0, camadas: 0, detalle: '' });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  return (
    <div className="app-page productos-page">
      <header className="page-header">
        <h1>Productos</h1>
        <p>Cargar y editar productos (código, filas, camadas, detalle)</p>
      </header>

      {error && (
        <div className="message message-error" role="alert">
          {error}
        </div>
      )}

      <section className="productos-form-section">
        <h2>{form.id != null ? 'Editar producto' : 'Nuevo producto'}</h2>
        <form onSubmit={handleSubmit} className="productos-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="producto-codigo">Código</label>
              <input
                id="producto-codigo"
                type="text"
                value={form.codigo}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                placeholder="Ej: ART-001"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="producto-filas">Filas</label>
              <input
                id="producto-filas"
                type="number"
                min={0}
                value={form.filas}
                onChange={(e) => setForm((f) => ({ ...f, filas: Number(e.target.value) }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="producto-camadas">Camadas</label>
              <input
                id="producto-camadas"
                type="number"
                min={0}
                value={form.camadas}
                onChange={(e) => setForm((f) => ({ ...f, camadas: Number(e.target.value) }))}
              />
            </div>
            <div className="form-group form-group-total">
              <label id="producto-total-label">Total bultos por pallet</label>
              <span className="total-bultos" aria-labelledby="producto-total-label">
                {form.filas * form.camadas}
              </span>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="producto-detalle">Detalle</label>
            <input
              id="producto-detalle"
              type="text"
              value={form.detalle ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, detalle: e.target.value }))}
              placeholder="Descripción opcional"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {form.id != null ? 'Guardar cambios' : 'Agregar producto'}
            </button>
            {form.id != null && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setForm({ codigo: '', filas: 0, camadas: 0, detalle: '' })}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="productos-list-section">
        <h2>Listado</h2>
        {loading ? (
          <p className="loading">Cargando...</p>
        ) : list.length === 0 ? (
          <p className="empty">No hay productos. Agregá uno arriba.</p>
        ) : (
          <div className="productos-table-wrap">
            <table className="productos-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Filas</th>
                  <th>Camadas</th>
                  <th>Detalle</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id}>
                    <td>{p.codigo}</td>
                    <td>{p.filas}</td>
                    <td>{p.camadas}</td>
                    <td>{p.detalle ?? '—'}</td>
                    <td className="actions">
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() => handleEdit(p)}
                        aria-label={`Editar producto ${p.codigo}`}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-small btn-danger"
                        onClick={() => handleDelete(p.id)}
                        aria-label={`Eliminar producto ${p.codigo}`}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
