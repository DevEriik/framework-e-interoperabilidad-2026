# TP4 · Actividad 3 · Perfiles de usuarios con capacidades diferenciadas

## 1. Objetivo

Identificar los perfiles de usuarios que pueden encontrar barreras en ExpertoYa, describir las barreras concretas, la sección afectada, su severidad y el método con el que se verifica cada una. Este documento es la base de las auditorías WAVE y Lighthouse de TP4-12 y TP4-13.

## 2. Alcance

Se analizan las siguientes secciones del sistema, según el código actual:

| Sección | Elemento |
|---|---|
| `#inicio` | Portada y navegación principal de escritorio |
| `#mapa` | Mapa interactivo de profesionales (Leaflet / OpenStreetMap) |
| `#servicios` / `#profesionales` | Listado de profesionales y oficios |
| `#cotizacion` | Formulario de solicitud de cotización |
| `#estados` | Mensajes de estado de la cotización (éxito / error) |
| `#resenas` | Listado y formulario de reseñas |
| Modal de login | Diálogo de inicio de sesión (`role="dialog"`) |
| Menú inferior móvil | Navegación principal en mobile |
| Modo oscuro | Alternancia de tema claro/oscuro |
| Videollamada (TP3) | Componente `VideoCallRoom` con Daily.co |

## 3. Metodología

1. Revisión del código y de la interfaz en desktop y mobile.
2. Clasificación de severidad:
   - **Crítica:** impide completar la tarea.
   - **Alta:** la dificulta seriamente o requiere ayuda de terceros.
   - **Media:** genera fricción o errores evitables.
   - **Baja:** molestia menor.
3. Cada perfil se valida con un método concreto (WAVE, Lighthouse, lector de pantalla, teclado, zoom, simulación de color).

## 4. Perfiles

### P1 · Persona adulta mayor con baja destreza motriz

- **Descripción:** usuario con temblor o precisión reducida que navega principalmente desde el celular.
- **Barreras esperadas:** íconos del menú inferior pequeños; marcadores del mapa difíciles de tocar; campos del formulario con poca separación; scroll fino dentro del mapa.
- **Secciones afectadas:** menú inferior móvil, `#mapa`, `#cotizacion`.
- **Severidad:** Alta.
- **Verificación:** tamaño de objetivo táctil (mínimo 44×44 px), prueba con ratón y touch, Lighthouse "tap targets".

### P2 · Usuario con baja visión o sensibilidad al contraste

- **Descripción:** persona con visión reducida que usa modo oscuro, zoom o alto contraste.
- **Barreras esperadas:** contrastes insuficientes en textos secundarios; estados de cotización diferenciados solo por color; foco poco visible; mapa con mosaicos claros y marcadores de bajo contraste.
- **Secciones afectadas:** modo oscuro, `#estados`, `#mapa`, navegación.
- **Severidad:** Crítica.
- **Verificación:** WAVE (contraste), Lighthouse Accessibility, zoom al 200 %, simulación de deuteranopia/protanopia.

### P3 · Usuario de lector de pantalla

- **Descripción:** persona con discapacidad visual total que usa NVDA, JAWS o VoiceOver.
- **Barreras esperadas:** el mapa Leaflet no expone `aria-label` ni estructura navegable; los marcadores no tienen texto alternativo; los resultados de "Buscar profesionales cercanos" no se anuncian; el error de geolocalización usa `alert()`; el modal de login no declara `aria-labelledby`.
- **Secciones afectadas:** `#mapa`, `#profesionales`, modal de login, `#cotizacion`.
- **Severidad:** Crítica.
- **Verificación:** recorrido completo con NVDA o VoiceOver, inspección del árbol de accesibilidad, WAVE.

### P4 · Usuario que navega solo con teclado

- **Descripción:** persona que no puede usar ratón ni touch y se mueve con Tab, Shift+Tab, Enter y Escape.
- **Barreras esperadas:** el mapa no es navegable por teclado; los popups de los marcadores no se pueden abrir; posible foco atrapado o escapado en el modal; no hay enlace "saltar al contenido"; orden de tabulación no siempre lógico.
- **Secciones afectadas:** `#mapa`, modal de login, navegación principal.
- **Severidad:** Crítica.
- **Verificación:** recorrido completo con teclado, foco visible en cada elemento, cierre del modal con Escape.

### P5 · Usuario con discapacidad auditiva

- **Descripción:** persona sorda o con hipoacusia que usa la videollamada y las notificaciones.
- **Barreras esperadas:** la videollamada de TP3 no ofrece subtítulos ni transcripción; las alertas o avisos podrían depender solo de sonido; contenido multimedia sin subtítulos.
- **Secciones afectadas:** videollamada (`VideoCallRoom`), notificaciones, `#estados`.
- **Severidad:** Alta.
- **Verificación:** revisión de la videollamada con audio silenciado, búsqueda de alternativas textuales, revisión de mensajes de estado.

### P6 · Usuario con dificultad cognitiva o baja alfabetización digital

- **Descripción:** persona que necesita textos simples, pasos claros y mensajes de error explícitos.
- **Barreras esperadas:** formulario de cotización con campos que requieren interpretación; mensajes de error genéricos ("Ocurrió un error"); jerga de oficios; falta de ayudas contextuales; ausencia de dictado por voz para completar el oficio.
- **Secciones afectadas:** `#cotizacion`, `#resenas`, registro.
- **Severidad:** Media.
- **Verificación:** prueba con al menos 3 usuarios del perfil, revisión de legibilidad y consistencia de mensajes.

### P7 · Usuario en contexto limitado (discapacidad situacional)

- **Descripción:** persona sin discapacidad permanente pero en una situación que la limita: mala conexión, GPS impreciso, pantalla al sol, uso con una sola mano.
- **Barreras esperadas:** el mapa depende de tiles externos y de la geolocalización; si se deniega el permiso solo aparece un `alert`; la cotización apunta a `http://localhost:3001`, lo que falla fuera del entorno local.
- **Secciones afectadas:** `#mapa`, `#cotizacion`.
- **Severidad:** Media.
- **Verificación:** prueba con red limitada, permiso de ubicación denegado, uso con una mano.

## 5. Matriz resumen

| ID | Perfil | Barrera principal | Sección | Severidad |
|---|---|---|---|---|
| P1 | Baja destreza motriz | Objetivos táctiles pequeños | Menú móvil, mapa, formulario | Alta |
| P2 | Baja visión / contraste | Contraste y color como único indicador | Modo oscuro, estados, mapa | Crítica |
| P3 | Lector de pantalla | Mapa sin ARIA ni alternativa textual | Mapa, profesionales | Crítica |
| P4 | Solo teclado | Mapa y popups inaccesibles | Mapa, modal | Crítica |
| P5 | Discapacidad auditiva | Video sin subtítulos ni transcripción | Videollamada | Alta |
| P6 | Dificultad cognitiva | Mensajes y formularios poco claros | Cotización, reseñas | Media |
| P7 | Contexto limitado | Dependencia de GPS, red y localhost | Mapa, cotización | Media |

## 6. Hallazgos preliminares en el código

- `src/components/mapa-profesional.tsx`: `MapContainer` y `Marker` sin atributos ARIA ni texto alternativo; no existe vista de lista; el error de geolocalización usa `alert()`.
- `src/App.tsx`: el modal de login tiene `role="dialog"` y `aria-modal="true"`, pero no se observa `aria-labelledby`.
- `#estados`: los mensajes de éxito y error se distinguen por color y texto; falta confirmar `role="status"` / `aria-live`.
- `#cotizacion`: los campos tienen `Label htmlFor` correcto; el endpoint es `http://localhost:3001`.
- No hay implementación de dictado por voz en el código, aunque la guía lo menciona como herramienta esperada.

## 7. Limitaciones

- El análisis es preliminar y de código; las pruebas con usuarios reales se documentan en TP4-15.
- Las severidades se ajustan después de las auditorías WAVE y Lighthouse de TP4-12 y TP4-13.
