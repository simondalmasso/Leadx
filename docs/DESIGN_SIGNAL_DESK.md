# LeadX — Signal Desk

## WHY

LeadX existe para reducir una decisión comercial repetida: **a quién prestar atención ahora**.

La interfaz no debe competir con esa decisión. El usuario necesita reconocer prioridad, contexto, contacto y próxima acción sin atravesar una pared de widgets. Por eso el rediseño elimina chrome visual, no capacidades.

## CONCEPT — SIGNAL DESK

LeadX se comporta como una mesa editorial de señales comerciales, no como un dashboard SaaS.

Principios:

- el lead es el artefacto principal;
- la jerarquía sustituye a la decoración;
- las reglas y el espacio sustituyen a las tarjetas;
- un solo color de señal indica selección, acción o atención;
- los controles secundarios permanecen disponibles pero visualmente silenciosos;
- desktop y mobile comparten el mismo lenguaje, no dos interfaces distintas.

## SYSTEM

### Paleta

- `paper`: `#f2efe8`
- `surface`: `#fffdf8`
- `ink`: `#171714`
- `muted`: `#656159`
- `signal`: `#f04d2f`

El vermellón es funcional. No se usa como relleno decorativo general.

### Tipografía

No se agregó ninguna fuente ni dependencia de red.

Stack: `Helvetica Neue`, Helvetica, Arial y fallbacks de sistema. Datos temporales e índices usan monospace de sistema.

### Geometría

- tarjetas generales: eliminadas;
- radios grandes: eliminados salvo donde la semántica exige forma circular;
- separación: reglas finas + espacio;
- KPI: banda editorial de cuatro columnas;
- tabla: ledger comercial;
- mobile: registros separados por reglas, no cards flotantes;
- detalle: hoja de lectura lateral de alta jerarquía.

### Motion

Motion sólo comunica cambio de estado o profundidad:

- selección y hover: 180–220 ms;
- apertura de detalle/filtros: 220–300 ms;
- `prefers-reduced-motion` conserva el modo reducido existente.

## DETAIL

### Navegación de verticales

De segmented control a índice textual con señal inferior. La capacidad y los handlers no cambian.

### KPI

Los cuatro indicadores existentes se preservan. Se muestran como números editoriales separados por reglas, sin cuatro contenedores compitiendo con la lista.

### Búsqueda y filtros

La búsqueda se vuelve el comando primario. Filtros, orden, importación y exportación siguen disponibles con peso visual secundario. La importación privada conserva exactamente sus validaciones y endpoint existentes.

### Leads

Desktop mantiene la tabla y sus columnas. Mobile mantiene artículos accesibles y targets táctiles; cambia la presentación a un ledger vertical.

### Detalle

Mantiene `role=dialog`, datos, historial, acciones, contacto, notas y campos por vertical. Visualmente pasa de drawer-card a hoja editorial de lectura.

### Demo / real

La distinción sigue explícita. Demo deja de parecer una alerta de producto y pasa a una franja de provenance/estado; no se oculta ni se diluye.

## NON-GOALS

Este cambio NO modifica:

- autenticación;
- política de sesión;
- APIs;
- Cloudflare Worker;
- KV;
- datos reales;
- filtros o scoring;
- importación privada;
- verticales;
- lógica de negocio;
- producción.

No se agregó dependencia, fuente remota, framework visual ni paquete de motion.
