# TP4 · Actividad 3 · Correcciones de hallazgos medios de TP4-15

## 1. Objetivo

Cerrar los tres hallazgos de severidad **media** pendientes de las pruebas asistivas de TP4-15, antes de redactar la sección de accesibilidad del informe (TP4-16):

1. El cambio de rol en el registro no se anunciaba y movía el foco.
2. Las estrellas de calificación no indicaban al lector de pantalla cuál estaba seleccionada.
3. El formulario de cotización no marcaba los campos obligatorios ni asociaba los errores a cada campo.

## 2. Cambios implementados

### 2.1 Cambio de rol anunciado (`src/components/moduloUsuarios.tsx`)

- El `<select>` de rol ahora delega en `manejarCambioRol`, que actualiza el estado y escribe un mensaje en una región vivo.
- Se agregó una región `<p role="status" aria-live="polite" aria-atomic="true" class="sr-only">` siempre presente en el DOM, para que el lector anuncie el cambio sin mover el foco:
  - *"Rol actualizado a cliente. Ya no se requiere el oficio o especialidad."*
  - *"Rol actualizado a profesional. El campo oficio o especialidad está disponible."*
- El mensaje describe también la consecuencia visible (aparición/desaparición del campo *Oficio o Especialidad*), que era lo que antes pasaba desapercibido.

### 2.2 Estrellas con grupo y estado (`src/components/resenas/ResenaForm.tsx`)

- Los cinco botones se reemplazaron por **radios nativos** dentro de un `<fieldset>` con `<legend>` ("¿Cómo calificarías el trabajo realizado?").
- Cada radio tiene `aria-label="N de 5 estrellas"` y `checked`, por lo que Orca anuncia la opción y su estado (*"seleccionado"*).
- El `name` incluye el `solicitudId` para que varios formularios de reseña en la misma página no compitan entre sí.
- El foco se mantiene visible en el `label` mediante `focus-within:ring-2`, y la navegación con flechas es la nativa del grupo de radios.
- El contador visual "N de 5 estrellas" quedó como `aria-hidden="true"` para no duplicar el anuncio.

### 2.3 Cotización con campos obligatorios y errores asociados (`src/App.tsx`)

- Los tres campos (`nombre`, `servicio`, `detalle`) tienen `required` y un asterisco visible (`aria-hidden="true"`).
- El formulario usa `noValidate` para que la validación corra en la app y poder mostrar mensajes propios en español, en vez del globo nativo del navegador.
- Cada error se renderiza con un `id` (`error-nombre`, `error-servicio`, `error-detalle`) y se vincula al campo con `aria-describedby`; el campo pasa a `aria-invalid="true"` mientras el error esté presente.
- Al enviar con campos vacíos se valida cada uno, se enfoca el primer inválido y el `Alert` (`role="alert"`) anuncia el resumen: *"No se pudo enviar. Revisá los campos marcados o intentá de nuevo más tarde."*
- Los mensajes se limpian al corregir cada campo.

## 3. Verificación

- `npm run build`: correcto.
- `npx eslint src/App.tsx`: sin errores. El resto del proyecto conserva 7 errores de lint preexistentes (`any`, `react-refresh/only-export-components`, etc.) que no fueron introducidos por este cambio.

### Pendiente de verificación con lector real

Las capturas de antes/después con **Orca 46.1** (Linux Mint 22.1, Brave 158.1.100.58) deben tomarse en el entorno del equipo y agregarse al expediente de TP4-15 (`05_pruebas_asistivas.md`, PR #73) una vez mergeados ese PR y el de correcciones críticas (PR #74). Este documento registra únicamente los cambios de código; no incluye evidencia de audio generada artificialmente.
