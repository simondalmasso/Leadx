# LeadX — Signal Desk / Creative Direction V2

## WHY
LeadX existe para reducir una decisión comercial repetida: **a quién prestar atención ahora y qué tiene que pasar después**.

North star:

```text
CONTACT → SIGNAL → NEXT ACTION
```

La interfaz debe desaparecer detrás de esa lectura. Si una decisión visual no mejora contacto, señal o próxima acción, se elimina o se reduce.

## CONCEPT
**Una mesa editorial de señales comerciales.**

No es un dashboard SaaS genérico ni un CRM corporativo reducido. Es una superficie de trabajo tranquila, precisa y humana: papel cálido, tinta, reglas, una señal vermellón y jerarquía tipográfica fuerte. La personalidad viene de composición, ritmo y opinión; no de efectos.

Principios:
- significado antes que decoración;
- pocas decisiones, ejecutadas con precisión;
- belleza como parte de la utilidad;
- el producto real es el workspace, no la landing;
- próxima acción tiene más jerarquía que metadata histórica;
- desktop se lee como ledger editorial;
- mobile se recompone como registro vertical, no como desktop encogido;
- estados funcionales tienen diseño explícito;
- el signal vermellón se reserva para decisión/atención, no para pintar superficies.

## SYSTEM

### Color tokens
```text
BG/CANVAS       #F2EFE8
BG/ELEVATED     #FFFDF8
BG/INVERSE      #171714
TEXT/PRIMARY    #171714
TEXT/SECONDARY  #68645C
TEXT/TERTIARY   #817C73
BORDER/SUBTLE   #D8D2C8
BORDER/STRONG   #8B857B
SIGNAL/PRIMARY  #F04D2F
SIGNAL/HOVER    #D94125
SUCCESS         #1F7150
WARNING         #9A671D
DANGER          #A63A2E
FOCUS           #175C9E
SELECTION       #F7C5B9
```

El balance buscado es predominantemente neutral cálido; signal y colores de estado sólo codifican atención o significado.

### Typography
Se mantiene una grotesca local/system deliberadamente: evita una dependencia remota, preserva velocidad y hace que la voz dependa de proporción, peso, tracking y measure en vez de una fuente ornamental. La familia mono del sistema se usa sólo para meta, labels y señales operativas.

Escala efectiva:
- display: `clamp(56px, 8.8vw, 116px)`;
- section/H1: `clamp(46px, 5.2vw, 72px)`;
- product H2: `clamp(42px, 4.4vw, 62px)`;
- metric: `48–64px`;
- body large: `19–23px`;
- body: `14–18px` según contexto;
- label/meta: `9–10px`, mono, tracking amplio.

Párrafos principales se mantienen aproximadamente dentro de `55–68ch`.

### Spacing + grid
```text
SPACE=4/8/12/16/24/32/48/64/96/128
MAX_CONTAINER=1280px
GUTTER_WIDE=clamp(20px,4vw,56px)
GUTTER_TABLET=24–32px
GUTTER_MOBILE=16–18px
```

La estructura usa whitespace, rules y alineación antes que cards. Radio funcional: `2px` en controles y `4px` en sheets. Sombras sólo para modal/notice.

### Motion
```text
FAST=140ms
UI=210ms
ENTER=340ms
```

Sin bounce. `prefers-reduced-motion` es obligatorio.

## DETAIL / PRODUCT SURFACES

### Brand + header
- usa el `leadx-wordmark.svg` oficial como firma canónica;
- header 72px desktop / 68px tablet-mobile;
- una sola CTA dominante;
- en workspace el header baja visualmente su presencia.

### Hero
- promesa: `Tus clientes. En orden.`;
- CTA primaria: `Crear espacio gratis`;
- CTA secundaria: `Ver demo`;
- `100` funciona como dato editorial del plan Free, no como badge decorativo;
- el vermellón aparece como señal corta, no como bloque de fondo.

### Workspace / ContactDesk
Jerarquía:

```text
CONTEXT
→ METRICS
→ SEARCH / FILTER
→ CONTACT
→ STATUS
→ NEXT ACTION
→ CREATED / SECONDARY DATA
```

`Próxima acción` tiene label propio y peso superior a la fecha. Los KPI son una banda tipográfica de cuatro datos, no cuatro cards.

### Search + filters
Search ocupa la mayor superficie. Estado y orden viven como controles secundarios sobre la misma regla en desktop; en mobile se apilan con targets cómodos.

### Ledger
Desktop conserva filas continuas de 86px aprox. Mobile recompone cada fila en status → persona → próxima acción → fecha. No se usan cards individuales ni sombras por registro.

### Contact editor
Orden semántico:
1. Nombre.
2. Estado.
3. Próxima acción.
4. Contexto: empresa, fuente, email, teléfono y notas.

Eliminar usa confirmación propia dentro del sheet; no depende de `window.confirm`. Guardar es la acción primaria inequívoca.

### Auth
Registro/login conserva continuidad de marca y reduce el plan Free a tres señales: `100 clientes`, `$0 para siempre`, `Privado por usuario`.

### Pricing
Free se presenta como producto disponible hoy. Pro se presenta explícitamente como próxima capa y no simula un checkout inexistente.

### States
El sistema contempla explícitamente:
- boot;
- workspace loading;
- empty workspace;
- empty search;
- network error + retry;
- saving;
- success notice;
- Free limit reached;
- disabled;
- auth failure;
- delete confirmation;
- Pro interest success.

## ACCESSIBILITY / QA
- WCAG AA como piso;
- foco visible inequívoco;
- teclado y Escape en dialogs;
- labels reales;
- dialogs con `role=dialog` + `aria-modal`;
- targets táctiles de 44px mínimos;
- estado codificado por punto + texto, nunca sólo color;
- reduced motion;
- sin overflow horizontal.

Breakpoints de QA obligatorios:
`1440×1000`, `1024×768`, `768×1024`, `390×844`, `360×800`, `320×568`.

El CI de UI renderiza el build local con Playwright, verifica overflow, targets móviles, contenido largo, workspace vacío, 100/100, error de red, loading, auth y editor, y publica screenshots efímeros como evidencia del PR.

## NON-GOALS
No reintroducir verticales sectoriales, discovery, scraping, radar, importadores privados ni datasets legacy. No cambiar auth, API, Workers KV, aislamiento por usuario ni el límite Free por razones estéticas. No copiar ninguna obra o layout existente de HOVS, mymind, Semplice o Carbonmade.
