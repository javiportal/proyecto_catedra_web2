import { useEffect, useMemo, useState } from "react";
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

  if (loading) return <div style={{ padding: 20 }}>Cargando...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Ofertas aprobadas vigentes por rubro</h2>

      {Object.entries(agrupadas).map(([rubro, lista]) => (
        <div key={rubro} style={{ marginTop: 20 }}>
          <h3>{rubro}</h3>

          {lista.map((o) => (
            <div
              key={o.id}
              style={{
                border: "1px solid #ccc",
                padding: 10,
                marginTop: 8,
                borderRadius: 8,
              }}
            >
              <strong>{o.titulo}</strong>
              <p>{o.descripcion}</p>
              <p>
                Precio oferta: ${o.precio_oferta} (antes ${o.precio_regular})
              </p>
              <p>
                Vigente hasta: {o.fecha_fin ?? "Sin fecha límite"}
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}