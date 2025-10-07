
# Guía Rápida de Sintaxis de Tailwind CSS v3.0

Esta guía es una referencia rápida de las clases de utilidad más comunes en Tailwind CSS.

## Conceptos Clave

### Prefijos de Estado (State Prefixes)
Se usan para aplicar estilos en diferentes estados de un elemento.

- `hover:`: Se aplica al pasar el cursor sobre el elemento.
  - `hover:bg-blue-500` (cambia el fondo al hacer hover).
- `focus:`: Se aplica cuando el elemento tiene foco (ej. un input).
  - `focus:ring-2 focus:ring-blue-500` (añade un anillo de foco).
- `active:`: Se aplica cuando el elemento está siendo presionado.
  - `active:bg-blue-700` (cambia el fondo al estar activo).
- `disabled:`: Se aplica a elementos deshabilitados.
  - `disabled:opacity-50` (reduce la opacidad si está deshabilitado).

### Prefijos Responsivos (Responsive Prefixes)
Se usan para aplicar estilos en diferentes tamaños de pantalla (breakpoints).

- `sm:`: Small screens (≥640px)
- `md:`: Medium screens (≥768px)
- `lg:`: Large screens (≥1024px)
- `xl:`: Extra large screens (≥1280px)
- `2xl:`: 2x extra large screens (≥1536px)

**Ejemplo:**
```html
<div class="w-full md:w-1/2 lg:w-1/3">
  <!-- Ancho completo en pantallas pequeñas, 50% en medianas, y 33% en grandes -->
</div>
```

---

## Clases Comunes

### Colores
- `text-{color}-{shade}`: Color del texto.
  - `text-red-500`, `text-gray-800`
- `bg-{color}-{shade}`: Color de fondo.
  - `bg-yellow-200`, `bg-havelock-blue-50`
- `border-{color}-{shade}`: Color del borde.
  - `border-gray-300`

### Espaciado (Spacing)
La unidad de espaciado por defecto es `0.25rem` (4px). `p-4` significa `padding: 1rem;` (4 * 0.25rem).

- `p-{size}`: Padding en todos los lados.
  - `p-4` (16px), `p-8` (32px)
- `px-{size}`: Padding horizontal (izquierda y derecha).
  - `px-6` (24px)
- `py-{size}`: Padding vertical (arriba y abajo).
  - `py-2` (8px)
- `pt-{size}`, `pr-{size}`, `pb-{size}`, `pl-{size}`: Padding top, right, bottom, left.

- `m-{size}`: Margin en todos los lados.
  - `m-auto` (margen automático)
- `mx-{size}`: Margin horizontal.
- `my-{size}`: Margin vertical.
- `mt-{size}`, `mr-{size}`, `mb-{size}`, `ml-{size}`: Margin top, right, bottom, left.

### Tamaño (Sizing)
- `w-{size}`: Ancho (width).
  - `w-full` (100%), `w-1/2` (50%), `w-screen` (100vw), `w-auto`
  - `w-64` (16rem, 256px)
- `h-{size}`: Alto (height).
  - `h-full` (100%), `h-screen` (100vh)
  - `h-32` (8rem, 128px)
- `max-w-{size}`: Ancho máximo.
  - `max-w-md`, `max-w-screen-lg`
- `min-h-screen`: Altura mínima del 100% del viewport.

### Tipografía (Typography)
- `text-{size}`: Tamaño de la fuente.
  - `text-sm` (small), `text-base` (default), `text-lg`, `text-xl`, `text-4xl`
- `font-{weight}`: Grosor de la fuente.
  - `font-light`, `font-normal`, `font-medium`, `font-semibold`, `font-bold`
- `text-align`: Alineación del texto.
  - `text-left`, `text-center`, `text-right`
- `leading-{size}`: Interlineado (line-height).
  - `leading-tight`, `leading-normal`, `leading-loose`
- `tracking-{size}`: Espaciado entre letras (letter-spacing).
  - `tracking-wider`

### Flexbox
- `flex`: Activa el display flex.
- `flex-row`, `flex-col`: Dirección del flex. `flex-row-reverse`, `flex-col-reverse`.
- `justify-{position}`: Alineación en el eje principal.
  - `justify-start`, `justify-center`, `justify-end`, `justify-between`
- `items-{position}`: Alineación en el eje secundario.
  - `items-start`, `items-center`, `items-end`, `items-stretch`
- `gap-{size}`: Espacio entre elementos flex/grid.
  - `gap-4` (1rem)
- `flex-wrap`, `flex-nowrap`: Manejo del desbordamiento.
- `flex-1`: Permite que un elemento flex crezca y ocupe el espacio disponible.

### Grid
- `grid`: Activa el display grid.
- `grid-cols-{number}`: Define el número de columnas.
  - `grid-cols-3` (3 columnas de igual ancho).
- `grid-rows-{number}`: Define el número de filas.
- `col-span-{number}`: Cuántas columnas ocupa un elemento.
  - `col-span-2` (ocupa 2 columnas).
- `gap-{size}`: Espacio entre celdas de la grilla.
  - `gap-6` 

### Bordes (Borders)
- `border`: Añade un borde de 1px en todos los lados.
- `border-{width}`: Grosor del borde.
  - `border-2`, `border-4`
- `border-{side}`: Borde en un lado específico.
  - `border-t-2` (borde superior de 2px).
- `rounded-{size}`: Radio del borde (border-radius).
  - `rounded`, `rounded-md`, `rounded-lg`, `rounded-full`

### Sombras (Shadows)
- `shadow-{size}`: Añade una sombra.
  - `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`

---

Esta es solo una introducción. Para una lista completa de todas las clases, la [documentación oficial de Tailwind CSS](https://tailwindcss.com/docs) es el mejor recurso.
