# La Cuponera

Aplicación web de cupones desarrollada con React, Vite, Tailwind CSS y Supabase.

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- npm (incluido con Node.js)

## Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/la-cuponera.git
cd la-cuponera
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Copiar el archivo de ejemplo y completar con las credenciales de Supabase:

```bash
cp .env.example .env
```

Luego abrir `.env` y reemplazar los valores con las credenciales reales del proyecto:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

> Pedir las credenciales al administrador del proyecto si no las tienes.

## Ejecución

**Modo desarrollo:**

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

**Construir para producción:**

```bash
npm run build
```

**Previsualizar build de producción:**

```bash
npm run preview
```

## Stack tecnológico

| Tecnología | Uso |
|---|---|
| [React 19](https://react.dev/) | Librería de UI |
| [Vite 7](https://vite.dev/) | Bundler y servidor de desarrollo |
| [Tailwind CSS 4](https://tailwindcss.com/) | Framework de estilos |
| [Supabase](https://supabase.com/) | Backend (auth, base de datos) |
| [React Router 7](https://reactrouter.com/) | Enrutamiento |
| [React Hot Toast](https://react-hot-toast.com/) | Notificaciones |
| [jsPDF](https://github.com/parallax/jsPDF) | Generación de PDFs |
