# TP4 · Actividad 3 · Sección de Accesibilidad del informe

**Issue:** TP4-16 · **Estado:** borrador para revisión de Abril · **Fecha:** 19/11/2026

## 0. Alcance y metodología

Esta sección sintetiza las actividades 1 a 3 de accesibilidad de ExpertoYa. Se responde de forma explícita a las cuatro preguntas de la consigna y se cierra con un anexo de evidencia.

La aplicación es una **SPA de una sola página con secciones ancladas** (`#inicio`, `#mapa`, `#servicios`, `#cotizacion`, `#estados`, `#resenas`), no un conjunto de rutas: las "pantallas" de las tablas son secciones de la misma URL.

Se combinaron cinco fuentes, en este orden:

1. **Análisis de perfiles** (TP4-07): siete usuarios con capacidades diferenciadas y sus barreras.
2. **WAVE** (TP4-12): contadores, pestañas Details/Structure/Contrast en claro y oscuro, sobre nueve secciones.
3. **Lighthouse** (TP4-13): cuatro corridas (claro/oscuro × mobile/desktop) más pruebas manuales de ancho, zoom y teclado.
4. **Tecnología asistiva real** (TP4-15): Orca 46.1 en Linux Mint 22.1 con Brave 158.1.100.58, teclado, zoom 200/400 %, `forced-colors`, baja visión simulada y viewports móviles.
5. **Correcciones y su verificación** (TP4-14 y correcciones derivadas de TP4-15), incluida una segunda sesión de Orca sobre el código corregido.

El backend se mantuvo apagado en las auditorías para provocar estados de error; por eso varios mensajes son de red y no de negocio.

---

## Pregunta 1 · ¿Qué tipos de usuarios se ven afectados?

Se identificaron siete perfiles. La severidad es la inicial de TP4-07, ajustada con las pruebas posteriores.

| ID | Perfil | Barrera principal | Sección | Severidad |
|---|---|---|---|---|
| P1 | Adulto mayor con baja destreza motriz | Objetivos táctiles pequeños; scroll fino dentro del mapa | Menú móvil, mapa, cotización | Alta |
| P2 | Baja visión / sensibilidad al contraste | 13 contrastes insuficientes; el color como único indicador de estado | Modo claro, estados, mapa | **Crítica** |
| P3 | Lector de pantalla | Mapa sin alternativa textual ni estructura navegable (resuelto en TP4-14) | Mapa, profesionales, formularios | **Crítica** |
| P4 | Solo teclado | Modal sin gestión de foco; logo sin foco visible; mapa no navegable (resuelto en parte) | Modal, mapa, navegación | **Crítica** |
| P5 | Discapacidad auditiva | Videollamada sin subtítulos ni transcripción | `VideoCallRoom`, notificaciones | Alta |
| P6 | Dificultad cognitiva / baja alfabetización digital | Errores genéricos, campos que requieren interpretación, jerga de oficios | Cotización, reseñas, registro | Media |
| P7 | Contexto limitado (GPS, red, pantalla al sol, una mano) | Dependencia de tiles externos, geolocalización y `localhost:3001` | Mapa, cotización | Media |

Lectura transversal: **P2, P3 y P4 concentran los impactos críticos**, y son justamente los perfiles para los que un puntaje alto de Lighthouse resulta más engañoso. P5 queda como brecha funcional abierta: la videollamada se corrigió en foco y nombre accesible, pero sigue sin subtítulos.

---

## Pregunta 2 · ¿Qué secciones no son accesibles y por qué?

### 2.1 Lo que WAVE mide (y lo que no)

En las ocho secciones en modo claro WAVE reporta **0 "Errors"**, pero **13 errores de contraste y 7 alertas** en cada una; en modo oscuro los errores de contraste caen a **0** (AIM 9.8). Esa combinación es engañosa: los fallos que más afectan a usuarios reales —mapa sin alternativa, jerarquía de encabezados, mensajes sin rol— no aparecen como "Errors" porque WAVE no los infiere del HTML estático.

| Sección | Problema | Por qué afecta | Severidad |
|---|---|---|---|
| `#inicio` | Naranja `#FF8C00` sobre crema `#FDFCF4` (2.27:1) en logo, ítem activo e íconos | Baja visión: no se lee el nombre del sitio ni qué ítem está activo | Alta |
| Todas | Secciones como `h3` sin `h2` contenedor; `h2 → h5` en las alertas | El lector arma un índice inconsistente; saltos desorientan | Alta |
| `#mapa` | Sin encabezado ni región en Structure; marcadores sin alternativa; sin vista de lista | Un usuario de lector recorre un `div` vacío: no sabe que hay 3 profesionales | **Crítica** |
| `#mapa` | Resultados sin anuncio; `alert()` al denegar ubicación | El filtrado es silencioso y el diálogo nativo bloquea la página sin alternativa | **Crítica** |
| `#estados` | Tres `role="alert"` estáticos; contraste 2.2:1 / 1.9:1 / 3.4:1 | Se anuncian los tres al cargar y los textos son ilegibles en claro | Alta |
| `#cotizacion` | Sin `required`; error genérico debajo del botón, sin asociar al campo | El usuario descubre los faltantes recién al enviar y no sabe qué corregir | Media |
| `#resenas` | Label huérfano; cinco botones sin grupo ni estado; error en inglés | Orca lee cinco controles sin indicar qué se califica ni qué se eligió | Media |
| Registro | Al elegir "Cliente" desaparece "Oficio o Especialidad" sin aviso | Cambio de contexto imperceptible para lector de pantalla | Media |
| `#servicios` | "Ver Perfil" es un botón sin `onClick` ni `href` | Se enfoca y se activa, y no ocurre nada: control engañoso | Media |
| Modo oscuro | Tiles del mapa claros | Salto brusco de luminancia para baja visión | Media |

### 2.2 Lo que aportaron las pruebas asistivas

La sesión con Orca confirmó los problemas del mapa y las alertas, y reveló otros que ninguna herramienta automática detectó:

- **Modal de videollamada (crítico):** al abrirlo el foco seguía en el botón de fondo; `Tab` recorría la página oculta, `Escape` no cerraba y no tenía nombre accesible.
- **Foco invisible:** el logo (`outline` transparente) y, en `forced-colors`, todos los anillos que dependían de `box-shadow`.
- **Reflow y landscape:** 2 px de desborde y login recortado a 400 %; en 667×375 el mapa (`bottom=500`) tapaba la barra inferior (`top=310`).
- **Estrellas y formularios:** Orca anunciaba *"Calificar con N estrellas, push button"* sin estado; el selector de rol no anunciaba el campo condicional; cotización no marcaba obligatorios.

**Evidencia:** tablas completas en `02_auditoria_wave.md` y `05_pruebas_asistivas.md`; anexo al final de esta sección.

---

## Pregunta 3 · ¿Cómo se subsanan los problemas?

Las soluciones se priorizan por **impacto** (qué tanto desbloquea al usuario) y **esfuerzo** (cambio estimado en código y verificación). "Corregido" indica que ya está implementado y verificado en una rama con PR contra `developer`.

| Mejora | Impacto | Esfuerzo | Estado | Cómo se verifica |
|---|---|---|---|---|
| Vista de Lista equivalente + ARIA en el mapa (`role="region"`, `aria-pressed`, `aria-live`, mensaje inline en vez de `alert()`, foco en popups) | Alto | Alto | **Corregido** (TP4-14, PR #72 mergeado) | Orca: *"Lista con 3 elementos"*, *"Ver perfil de Martín Benítez"*; `Escape` devuelve el foco al marcador |
| Modal: foco al abrir, trampa `Tab`, `Escape`, retorno de foco y `aria-labelledby` | Alto | Medio | **Corregido** (PR #74) | 14/14 tabulaciones dentro del modal; foco devuelto al botón |
| Foco visible en logo y regla global `@media (forced-colors: active)` con `outline: 3px solid Highlight` | Alto | Bajo | **Corregido** (PR #74) | `outline` ámbar en logo; contorno visible en alto contraste |
| Reflow a 320 px y `z-index` de la barra inferior por encima de Leaflet | Alto | Bajo | **Corregido** (PR #74) | `scrollWidth=322 → 310`; `elementFromPoint` devuelve la barra en landscape |
| Anuncio del rol con `aria-live`; estrellas como radios en `fieldset/legend`; cotización con `required`, `aria-invalid` y `aria-describedby` | Medio | Bajo | **Corregido** (PR #75) | Orca: *"Rol actualizado a cliente…"*, *"4 de 5 estrellas, seleccionado radio button"*, *"requerido… entrada no válida"* |
| Corregir los **13 contrastes del tema claro** (naranja más oscuro para texto y tokens de alerta) | Alto | Medio | **Pendiente** | WAVE debe pasar de 13 a 0; hoy es la deuda visual más grande |
| Reemplazar "Ver Perfil" por enlace/modal real | Medio | Alto | **Pendiente** | El control debe tener acción y nombre accesible |
| Evitar que las tres alertas estáticas se lean al cargar | Medio | Bajo | **Pendiente** | Ya son `role="status"` (TP4-14), pero Orca sigue anunciándolas al inicio |
| Traducir errores de red y controles de Leaflet al español | Medio | Bajo | **Pendiente** | "Failed to fetch", "Zoom in/out" → mensajes en español |
| Tema oscuro o filtro para los tiles del mapa | Medio | Alto | **Pendiente** | Sin deslumbramiento en modo oscuro |
| Subtítulos/transcripción en la videollamada | Alto | Alto | **Pendiente** | Validar con el perfil P5 con audio silenciado |

**Criterio de prioridad:** primero lo que impide completar la tarea (mapa, modal, foco, reflow), luego lo que genera errores evitables (roles, estrellas, formularios) y al final la fricción visual e idiomática. El contraste del tema claro es la excepción: aunque no bloquea, se eleva a prioridad alta por afectar a todo el sitio y a los perfiles P2/P6.

---

## Pregunta 4 · ¿Es adaptable el diseño y cuáles son sus limitaciones?

### 4.1 Lo que funciona

No hay **desborde horizontal** en 320, 768 ni 1440 px. El zoom al 200 % recompone el contenido en una columna sin romper el header, el mapa ni los formularios. Lighthouse reporta **95–98 en Accessibility** (96 tras TP4-14), **96–98 en Best Practices** y un CLS casi nulo; el rendimiento desktop es 97–98.

Tras las correcciones, el reflow a 400 % cerró en `scrollWidth=310` y la navegación inferior volvió a ser visible en landscape.

### 4.2 La paradoja del puntaje

**Un puntaje alto de Lighthouse no garantiza accesibilidad.** Lighthouse no marcaba el mapa sin alternativa, ni la falta de anuncio del rol, ni el modal sin foco: son problemas semánticos y de interacción que solo aparecieron con WAVE (Structure) y con Orca. La accesibilidad medida (95–98) está inflada por los cero errores automáticos de estructura. Esa diferencia es una conclusión del trabajo, no un detalle metodológico.

### 4.3 Limitaciones reconocidas

1. **Contraste sin resolver:** los 13 elementos del tema claro siguen fallando. El modo oscuro cumple, pero el usuario no debería tener que cambiar de tema para leer.
2. **Cobertura de lectores:** se probó solo **Orca 46.1 en Linux**. No se validó con NVDA, JAWS ni VoiceOver; los hallazgos de semántica son transferibles, pero falta esa validación antes de cerrar la sección.
3. **Sin lector móvil:** mobile se validó de forma visual y por reflow (375×667 y 667×375), no con TalkBack ni VoiceOver iOS.
4. **Backend apagado:** no se probaron envíos exitosos ni reseñas reales; los errores observados son `ECONNREFUSED` y no deben confundirse con validaciones de negocio. Además, el endpoint apunta a `localhost:3001`, lo que limita el uso fuera del entorno local (P7).
5. **Zoom emulado:** se cambió el viewport CSS a 640 y 320 px en lugar de usar el zoom del navegador sobre un monitor físico; no se probó 200 % sobre una pantalla chica de 1366 px.
6. **Variabilidad:** una corrida de Lighthouse por configuración; la diferencia de performance mobile entre claro (72) y oscuro (60) es ruido de red/CPU y tiles de OpenStreetMap, no un efecto del tema.
7. **Dependencia externa:** sin conexión el mapa queda vacío; la lista accesible mitiga el problema, pero los tiles siguen siendo un recurso de terceros.
8. **Brechas funcionales abiertas:** "Ver Perfil" no tiene acción y la videollamada no tiene subtítulos.
9. **Sin prueba con usuarios reales:** los siete perfiles son analíticos; P1, P5 y P6 no fueron validados con personas.
10. **Revisión pendiente:** el formato de esta sección debe ser revisado por Abril, y los PR #73, #74 y #75 deben mergearse para que la evidencia referenciada quede en `developer`.

---

## Anexo A · Evidencia

Toda la evidencia está bajo `docs/TP4/accesibilidad/`.

| Carpeta | Contenido | Documento de referencia |
|---|---|---|
| `img/wave/` | 21 capturas: contadores, Details, Structure y Contrast de 9 secciones, claro y oscuro; incluye mapa con ARIA, vista de Lista y geolocalización denegada | `02_auditoria_wave.md`, `04_implementacion_aria_mapa.md` |
| `img/lighthouse/` | 4 reportes `.html` + capturas, 3 anchos, 2 de zoom, 2 de landscape | `03_lighthouse_adaptabilidad.md` |
| `img/asistivas/` | 19 capturas de la sesión original (foco, zoom, alto contraste, baja visión, modal, landscape) + `orca-extracto.txt` | `05_pruebas_asistivas.md` |
| `img/asistivas/19`–`23` | Antes/después de las correcciones críticas | `06_correcciones_tp4-15_criticas.md` |
| `img/asistivas/24`–`26` + `orca-extracto-medios.txt` | Antes/después de rol, estrellas y cotización, con transcripción literal de Orca | `07_correcciones_tp4-15_hallazgos_medios.md` |

### Extracto representativo de la segunda sesión de Orca

```text
Rol actualizado a cliente. Ya no se requiere el oficio o especialidad.
4 de 5 estrellas. seleccionado radio button
Nombre completo entry Ej: Juan Pérez requerido. entrada no válida.
No se pudo enviar. Revisá los campos marcados o intentá de nuevo más tarde.
Ingresá tu nombre completo.
```

### Tabla-resumen de hallazgos y cierre

| Hallazgo | Severidad inicial | Estado |
|---|---|---|
| Mapa sin alternativa, vista de lista y anuncio de resultados | Crítica | Corregido (PR #72) |
| `alert()` de geolocalización | Crítica | Corregido (PR #72) |
| Modal sin foco, trampa, `Escape` ni nombre | Crítica | Corregido (PR #74) |
| Foco invisible en logo y `forced-colors` | Alta | Corregido (PR #74) |
| Reflow 320 px y solapamiento en landscape | Media / Alta | Corregido (PR #74) |
| Rol, estrellas y validación de cotización | Media | Corregido (PR #75) |
| 13 contrastes del tema claro | Alta | **Pendiente** |
| "Ver Perfil" sin acción; videollamada sin subtítulos | Media / Alta | **Pendiente** |
| Alertas estáticas leídas al cargar; errores en inglés; tiles claros | Media / Baja | **Pendiente** |

---

## Conclusión

La accesibilidad de ExpertoYa pasó de un bloqueo real en el flujo central —el mapa era incomprensible para lector de pantalla y teclado— a un flujo operable y verificado con tecnología asistiva. El mayor riesgo remanente no es de ARIA sino de **contraste en el tema claro**, seguido por dos brechas funcionales (perfil y subtítulos) y por la falta de validación con lectores distintos de Orca. La sección cierra con esas limitaciones declaradas en lugar de presentar el puntaje de Lighthouse como prueba de accesibilidad.
