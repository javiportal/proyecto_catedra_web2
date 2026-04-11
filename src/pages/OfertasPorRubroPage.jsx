import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchOfertasAprobadasVigentes, agruparPorRubro } from "../lib/ofertasService";

export default function OfertasPorRubroPage() {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await fetchOfertasAprobadasVigentes();
      setOfertas(data);
      setLoading(false);
    })();
  }, []);

  const agrupadas = useMemo(() => agruparPorRubro(ofertas), [ofertas]);
  const rubros = Object.keys(agrupadas);

  const calcularDescuento = (regular, oferta) =>
    Math.round(((regular - oferta) / regular) * 100);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    );
  }

  if (rubros.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏷️</div>
        <p className="empty-text">No hay ofertas vigentes en este momento.</p>
      </div>
    );
  }

  return (
    <div className="admin-page" style={{ maxWidth: 1280 }}>
      <div className="admin-header">
        <h1 className="admin-title">Ofertas por Rubro</h1>
        <span className="admin-count">{ofertas.length} ofertas activas</span>
      </div>

      {rubros.map((rubro) => (
        <div key={rubro} style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span className="coupon-tag" style={{ fontSize: '0.78rem', padding: '5px 14px' }}>
              {rubro}
            </span>
            <span className="text-muted" style={{ fontSize: '0.82rem' }}>
              {agrupadas[rubro].length} oferta{agrupadas[rubro].length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="offers-grid" style={{ padding: 0 }}>
            {agrupadas[rubro].map((oferta, i) => (
              <Link
                to={`/oferta/${oferta.id}`}
                key={oferta.id}
                className="coupon-card"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="coupon-header">
                  <p className="coupon-company">{oferta.empresas?.nombre}</p>
                  <h3 className="coupon-title">{oferta.titulo}</h3>
                  <span className="coupon-badge">
                    -{calcularDescuento(oferta.precio_regular, oferta.precio_oferta)}%
                  </span>
                </div>

                <div className="coupon-body">
                  <div className="coupon-prices">
                    <span className="coupon-price-main">
                      ${oferta.precio_oferta.toFixed(2)}
                    </span>
                    <span className="coupon-price-was">
                      ${oferta.precio_regular.toFixed(2)}
                    </span>
                  </div>

                  <p className="coupon-desc">{oferta.descripcion}</p>

                  <div className="coupon-meta">
                    <span className="coupon-validity">
                      Hasta {oferta.fecha_fin}
                    </span>
                    <span className="coupon-tag">{oferta.rubros?.nombre}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
