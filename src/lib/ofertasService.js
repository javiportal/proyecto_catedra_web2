import { supabase } from "./supabase";

// Ofertas APROBADAS y VIGENTES agrupables por rubro
export async function fetchOfertasAprobadasVigentes() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data, error } = await supabase
    .from("ofertas")
    .select(`
      id,
      titulo,
      descripcion,
      precio_regular,
      precio_oferta,
      fecha_inicio,
      fecha_fin,
      rubros:rubros ( id, nombre )
    `)
    .eq("estado", "APROBADA")
    .or(`fecha_fin.is.null,fecha_fin.gte.${today}`)
    .order("rubro_id", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export function agruparPorRubro(ofertas) {
  const grouped = {};
  for (const o of ofertas) {
    const rubro = o?.rubros?.nombre ?? "Sin rubro";
    if (!grouped[rubro]) grouped[rubro] = [];
    grouped[rubro].push(o);
  }
  return grouped;
}