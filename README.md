# Challenge Beilox — QA Automation

Suite de pruebas automatizadas con **Playwright + TypeScript** que cubre:

- **UI:** búsqueda de pasajes en [centraldepasajes.com.ar](https://www.centraldepasajes.com.ar).
- **API:** endpoints `/people`, `/planets` y `/films` de [swapi.tech](https://www.swapi.tech), con validación de schemas usando AJV.
- **CI:** GitHub Actions corre todo cada lunes a las 15:00 (hora de Argentina).

UI y API conviven en el mismo proyecto Playwright como dos `projects` separados.

---

## Cómo correrlo

**Requisitos:** Node 24+ y npm.

```bash
npm ci                                   # dependencias (versiones exactas del lock)
npx playwright install chromium          # navegador para la suite de UI
cp .env.example .env                     # opcional: los valores por defecto ya apuntan a los sitios públicos
```

| Comando             | Qué corre                        |
|---------------------|----------------------------------|
| `npm test`          | Todo (UI + API)                  |
| `npm run test:ui`   | Solo UI                          |
| `npm run test:api`  | Solo API (no necesita navegador) |
| `npm run typecheck` | Chequeo de tipos con `tsc`       |
| `npm run report`    | Abre el último reporte HTML      |

Otros comandos útiles mientras se desarrolla:

```bash
npx playwright test --project=ui --headed     # ver el navegador
npx playwright test --project=ui --ui         # modo UI de Playwright (time-travel, locators)
npx playwright test tests/ui/search.spec.ts -g "volver atrás"   # un test puntual
```

### Variables de entorno

| Variable | Default | Uso |
|---|---|---|
| `UI_BASE_URL` | `https://www.centraldepasajes.com.ar` | `baseURL` del project `ui` |
| `API_BASE_URL` | `https://www.swapi.tech/api/` | `baseURL` del project `api` |

El `.env` está en `.gitignore` y solo se versiona `.env.example`. Los tests no usan credenciales porque los dos sitios son públicos, pero el mecanismo ya está listo: si mañana hace falta un token, va al `.env` local y a un *secret* de GitHub en CI. (El único token del proyecto es el del MCP de GitHub, que se lee de una variable de entorno; ver [Uso del asistente de IA + MCP servers](#uso-del-asistente-de-ia--mcp-servers).)

---

## Arquitectura

```
├── .github/workflows/e2e.yml   # CI: lunes 15:00 ART + ejecución manual
├── .mcp.json                   # MCP servers usados con el asistente (Playwright, GitHub)
├── playwright.config.ts        # projects "ui" y "api", baseURL desde .env
├── fixtures/                   # test.extend: inyectan page objects / cliente API
│   ├── ui.fixture.ts
│   └── api.fixture.ts
├── pages/                      # Page Objects (selectores · acciones · aserciones)
│   ├── SearchPage.ts
│   └── ResultsPage.ts
├── helpers/
│   ├── SwapiClient.ts          # wrapper de request: status, body tipado y tiempo de respuesta
│   ├── schemaValidator.ts      # AJV compartido + aserción con errores legibles
│   ├── fileHelper.ts           # persiste el body del happy path
│   ├── dates.ts                # fechas dinámicas y los formatos que usa el sitio
│   ├── constants.ts
│   └── types.ts
├── schemas/                    # schemas AJV por recurso + partes comunes
├── test-data/
│   ├── ui/routes.ts            # rutas y terminales tipadas para la UI
│   └── happy-path/*.json       # bodies del happy path de API (se regeneran en cada corrida)
└── tests/
    ├── ui/search.spec.ts
    └── api/{people,planets,films}.spec.ts
```

La idea general es que **los tests se lean como casos de negocio** y que todo lo técnico (selectores, formatos, HTTP, schemas) viva en una capa de abajo:

```ts
await searchPage.search(ROUTES.withServices, departure);
await resultsPage.expectResultsFor(ROUTES.withServices, departure);
```

### UI: Page Object Model

- Cada Page Object tiene tres secciones explícitas: **Selectores**, **Acciones** y **Aserciones** (`expect*`).
- Los locators son `private`, así que un test no puede usarlos directamente aunque quiera. Si cambia el selector del botón "Buscar", se toca un solo archivo (`SearchPage.ts`), y eso lo garantiza el compilador.
- Los Page Objects se inyectan con fixtures (`test.extend`); ningún test hace `new SearchPage(page)`.
- No hay `waitForTimeout`. Todas las esperas son aserciones con auto-retry (`toBeVisible`, `toHaveURL`, `toHaveAttribute`).
- La fecha de ida se calcula como hoy + 7 días, para que el test no venza.

**Escenarios cubiertos**

| Escenario | Qué valida |
|---|---|
| Búsqueda válida (Retiro → Mar del Plata) | URL con origen, destino y fecha; encabezado; fecha resaltada; que **cada** servicio listado sea de esa ruta |
| Sin resultados (Mar Chiquita → Tres Lomas) | Mensaje "No encontramos opciones…" y cero servicios |
| Formulario vacío | Los tres mensajes de validación y que no navega |
| Ciudad inexistente | El autocompletado no ofrece opciones |
| Sin fecha de ida | Mensaje de validación de fecha y que no navega |
| Volver atrás desde resultados | Vuelve al buscador con origen, destino y fecha conservados |

### API

- `SwapiClient` encapsula la request y devuelve `{ status, body, elapsedMs }` con el body tipado por genérico.
- Cada endpoint tiene un happy path y dos casos 404 (id inexistente e id no numérico). En cada test se valida **status, schema AJV y tiempo de respuesta** (< 3 s).
- Los schemas comparten la estructura común (`successEnvelope` / `errorEnvelope`) y cada recurso define solo sus `properties`. AJV corre en modo `strict` y con `allErrors`, así un fallo muestra todos los errores juntos y no solo el primero.
- El happy path guarda el body en `test-data/happy-path/<recurso>.json`.

---

## Decisiones técnicas y hallazgos

Hallazgos que fueron apareciendo al explorar los sitios y que condicionaron el código:

- **El combo de origen/destino es select2.** Al elegir una opción, su nombre accesible pasa a ser el texto seleccionado, y un `getByRole('combobox', { name })` deja de encontrarlo. Se ubica por `aria-labelledby`, que no cambia. Las opciones se eligen por el código de terminal (`(BUE)`), que es único; el nombre solo matchea varias.
- **Al elegir el origen, el dropdown de destino a veces se abre solo.** No es constante: en unas corridas se abre y en otras no. El primer intento siempre hacía click en destino; cuando ya estaba abierto lo *cerraba*, y el test fallaba de forma confusa. La solución fue que `openAutocomplete()` solo clickee si `aria-expanded` no es `true`, y así cubre los dos casos sin agregar una espera fija.
- **Los destinos se filtran según el origen.** Para "sin resultados" no sirve cualquier par de ciudades: hay que buscar una ruta seleccionable pero sin servicios.
- **Hay dos calendarios en el DOM** (ida y vuelta); se acota al de ida con `#cdp-calendar-container`.
- **Uso de CSS/id en lugar de `getByRole` en varios lugares.** Playwright recomienda locators por rol, pero este sitio tiene accesibilidad que complica mantener eso: el calendario son `div`s y select2 rompe los nombres. Usé rol donde se pudo (botón Buscar, opciones del autocompletado) e ids estables en el resto.
- **CI con timezone y locale fijos.** El runner de GitHub corre en UTC y en inglés. Se fija `TZ` para Node, que calcula las fechas, y `locale`/`timezoneId` para el navegador, para que CI vea el sitio como un usuario argentino.
- **Los schemas de error reflejan la API tal como es, no como debería ser.** Los tests validan el comportamiento real (ver bugs abajo) para que sirvan de regresión: si la API corrige algo, el test falla y avisa que el contrato cambió.

### Posibles bugs encontrados

**UI — centraldepasajes.com.ar**

Reproducidos con Playwright MCP y registrados como issues con GitHub MCP:

- **Formato de fecha inconsistente** ([#1](https://github.com/kurpas/challenge-beilox/issues/1)). Al elegir la fecha, el input muestra `05-11-2026`; al volver atrás desde resultados, el sitio la restaura como `05/11/2026`. Es menor, pero es una inconsistencia real. El test acepta ambos formatos porque lo que valida es que la fecha se conserve.
- **El calendario de vuelta permite fechas inválidas después de volver atrás** ([#2](https://github.com/kurpas/challenge-beilox/issues/2)). Tras una búsqueda de solo ida y volver atrás, al cambiar a "Ida y vuelta" se puede elegir una vuelta anterior a la ida, incluso pasada. El servidor rechaza la búsqueda con un mensaje genérico, borra las fechas y el formulario queda inconsistente. En una búsqueda nueva el calendario funciona bien.

**API — swapi.tech**

- **Typo en el campo del 404 de `/planets`.** Responde `"messsage"` (con tres "s") en lugar de `"message"`. No es solo cosmético: un cliente que lea `body.message` recibe `undefined`. El schema lo refleja tal cual.
- **El body del 404 no es consistente entre recursos.** El mismo error devuelve textos distintos según el endpoint: `"not found"` en `/people`, `"Not found"` en `/planets` y `"Film not found"` en `/films`. Por eso cada schema fija su propio mensaje.
- **Un id no numérico devuelve 404 y no 400.** `/people/abc` responde 404. Esto es más discutible que un bug: muchas APIs lo resuelven así. Pero un 400 distinguiría "pediste algo mal formado" de "no existe". En lugar de forzar un caso 400 que no existe, se testea el comportamiento real y queda documentado en el nombre del test.

---

## Trade-offs y mejoras posibles

- **El escenario "sin resultados" depende de datos reales.** Usa una ruta que hoy no tiene servicios (Mar Chiquita → Tres Lomas). Si en algún momento los tiene, el test falla sin que haya un bug. Con un ambiente propio lo resolvería con datos controlados o mockeando la respuesta del buscador con `page.route`.
- **El JSON del happy path cambia en cada corrida.** SWAPI regenera `created`, `edited` y `timestamp` todos los días. Para usarlo en "futuras validaciones" (comparación contra este snapshot), esos campos se tienen que excluir. Además de quedar en el repo, CI lo sube como *artifact* de cada corrida.
- **Los tres specs de API son similares.** Se podrían generar con un loop sobre una tabla de endpoints. Preferí mantenerlos separados por legibilidad y porque cada endpoint puede crecer distinto. Con muchos más endpoints iría a la versión data-driven.
- **Umbral de 3 s para el tiempo de respuesta.** El challenge pide un tiempo "razonable" y no hay un SLA definido, así que lo tomé como margen razonable para una API pública. En un proyecto real saldría de un acuerdo con el equipo.
- **Mejora posible: ESLint con `eslint-plugin-playwright`.** Agregaría valor detectando en CI errores que TypeScript no ve: `await` olvidados (un `expect` sin `await` da verde sin validar nada), `waitForTimeout` y `test.only`. Hoy el código ya respeta esas reglas; el linter las garantizaría automáticamente.

---

## CI/CD

El workflow [`.github/workflows/e2e.yml`](.github/workflows/e2e.yml):

- Corre los **lunes 18:00 UTC = 15:00 ART**. El cron de GitHub está siempre en UTC, y Argentina no tiene horario de verano. También se puede lanzar a mano (`workflow_dispatch`).
- Pasos: `npm ci` → typecheck → instala Chromium → corre UI + API → sube el **reporte HTML** y los **JSON del happy path** como artifacts. Los artifacts se suben también cuando hay fallas.
- Usa permisos mínimos (`contents: read`), un timeout del job y `concurrency` para que dos corridas no se pisen.
- En CI, Playwright usa `retries: 2` y guarda trace en el primer retry, así un test intermitente deja evidencia para diagnosticarlo.

Detalles del cron de GitHub a tener en cuenta: puede arrancar con unos minutos de demora en horarios de carga, solo corre desde la rama por defecto y en repos públicos se desactiva después de 60 días sin actividad.

### Cómo lo escalaría si la suite crece

- **Matriz por proyecto.** UI y API en jobs separados, cada uno con su propio resultado. La API, rápida y estable, podría correr en cada PR; la UI, más lenta y dependiente de terceros, en el schedule y antes de un release.
- **Sharding.** Dividir la suite de UI en partes y correr cada una en un job distinto en paralelo, para bajar el tiempo total.
- **Tags** (`@smoke`, `@regression`) con `--grep`: smoke en cada PR y regresión completa en el schedule.
- **Secrets por ambiente.** Las credenciales irían en los secrets de GitHub, separadas por ambiente (staging, prod). El código no cambia: lee variables de entorno tanto en local (`.env`) como en CI.
- **Notificaciones** al equipo solo cuando falla, con el link al reporte, distinguiendo si falló un test o la infraestructura.
- **Seguimiento de flaky tests:** registrar qué tests pasan solo en retry, para que los retries no escondan problemas.

---

## Uso del asistente de IA + MCP servers

Usé Claude (Claude Code) como asistente, en modo pair programming; también le pedí que revisara cosas que hice. Le pedí ayuda para configurar los MCP. Y me ayudó con TypeScript, ya que había usado Java y JavaScript, pero no TypeScript.

### MCP servers utilizados

- **Playwright MCP:** le pedí ejecutar algunos flujos, por ejemplo los de los bugs que cargué, para validarlos. También para validar algún comportamiento del que tenía sospecha, como un elemento que se abre o despliega automáticamente.
- **GitHub MCP:** lo usé para crear y editar los issues [#1](https://github.com/kurpas/challenge-beilox/issues/1) y [#2](https://github.com/kurpas/challenge-beilox/issues/2). No tenía Jira disponible, así que lo usé de la misma forma para registrar los bugs.

Los servers están configurados en [`.mcp.json`](.mcp.json). El de GitHub usa un token con permisos mínimos (solo este repo y solo issues), que se lee de la variable de entorno `GITHUB_PAT` y nunca se commitea.

### Qué revisé o cambié de lo que generó la IA

- Le pedí ayuda para documentar, pero rehíce varias cosas, por ejemplo en el README, donde no reflejaba exactamente lo que estuve trabajando o complejizaba mucho algunas cosas.
- También algunos métodos donde había algún valor hardcodeado: los cambié para que sean parametrizables y escalables.

### Dónde decidí NO usar el asistente

- Para explorar la web de Central de Pasajes y entender el flujo, porque quería entenderlo como usuario antes de automatizarlo.
- Para debuguear algunos tests, revisando que el flujo esté correcto.
- Para decidir la severidad de los bugs.

### MCP server que propongo (no usado en el challenge)

- **Jira MCP:** facilitaría crear bugs completos sin necesidad de cargarlos manualmente.
- **Slack MCP:** si hay muchos mensajes, puede revisar uno o varios channels y hacerme un resumen o decirme las novedades importantes.

---

## Preguntas teóricas

**1. Escalabilidad — la suite creció a 500 tests, ¿qué cambiarías en la estructura?**

- Separar la corrida de tests en varias suites.
- Agregar `@tags` (smoke, regression) para correr solo lo necesario en cada momento.
- Mantener los tests independientes para poder paralelizar.
- Organizar tests y page objects por funcionalidad, y extraer componentes reutilizables (por ejemplo, el formulario de búsqueda, que aparece en más de una página).
- Centralizar los datos de prueba para no repetirlos en cada test.

**2. Flakiness — un test es intermitente sin cambios en el código, ¿cómo lo diagnosticás y qué considerás antes de marcarlo como skip?**

- Primero lo reproduciría: correrlo muchas veces seguidas y revisar el trace o el video de la falla.
- Busco las causas típicas, como esperas de algún elemento o timeouts.
- Revisar si se pueden mejorar los selectores.
- Ver si hay dependencia entre tests o algún dato que pueda estar pisándose o rompiéndose por otro test.
- Verlo en otro ambiente u otras versiones.
- Tener en cuenta que puede ser un bug real de la aplicación (por ejemplo, una condición de carrera), no solo del test.
- Antes de pasarlo a skip, analizaría la cobertura del caso y la importancia de ese flujo. Como alternativa, lo pondría en cuarentena (separado de la suite principal, con un ticket) hasta corregirlo.

**3. POM — si cambia el selector del botón "Buscar", ¿cuántos archivos modificás?**

- Uno solo, el del POM donde tengo ese elemento (`SearchPage.ts`). Los tests nunca usan selectores, solo métodos del Page Object; además, en este proyecto los locators son `private`, así que ningún test podría usarlos aunque quisiera.

**4. AI assistant — un test generado por IA pasa al primer intento, ¿qué chequeás antes de mergearlo? ¿Un caso donde decidiste no usarlo?**

- Que efectivamente esté testeando algo puntual, que me sume cobertura. Para confirmarlo, lo haría fallar a propósito y vería que la aserción lo detecta.
- Que no falten `await`, que no use esperas fijas (`waitForTimeout`) y que respete el POM y las convenciones del proyecto.
- Que no duplique otro test: en un caso me creó un test idéntico a otro, solo con un dato similar, y lo descarté.
- Un caso donde no lo usé: para explorar la web y entender el flujo como usuario antes de automatizarlo.

**5. Criterio del rol — ¿qué responsabilidad de un QA Senior no se puede delegar a un asistente de IA?**

- Qué probar y qué no.
- Interpretar requerimientos ambiguos.
- El testing exploratorio guiado por la experiencia de un QA, intentando encontrar una falla.
- El último visto bueno del código y de los tests.
- Mentorear perfiles de menor seniority.

**6. CI/CD — los tests fallan cada lunes 15:00 por un problema transitorio de red, ¿cómo lo manejás?**

- Los retries (ya configurados en CI) ayudan con fallas transitorias puntuales, pero si falla todos los lunes ya no es transitorio: es un patrón, y los retries lo estarían escondiendo.
- Escalar el problema con la gente a cargo o el personal idóneo.
- Se podría agregar un health check de la red antes de correr, y si falla, marcar la corrida como problema de ambiente en lugar de mostrar todos los tests en rojo.
- Alertar al equipo distinguiendo "falló el ambiente" de "falló un test", para no generar falsas alarmas.
- Verificar manualmente si corre bien en otros horarios o días y, en caso positivo, evaluar cambiar el día y hora de ejecución. Solo si la causa es conocida (por ejemplo, una ventana de mantenimiento); si no, cambiar el horario escondería el problema.
