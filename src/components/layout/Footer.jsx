export default function Footer() {
    return (
      <footer className="bg-gray-800 text-gray-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-lg font-semibold text-white">🎟️ La Cuponera</p>
          <p className="mt-2 text-sm">Las mejores ofertas y cupones de descuento en un solo lugar.</p>
          <p className="mt-4 text-xs text-gray-500">
            &copy; {new Date().getFullYear()} La Cuponera. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    )
  }