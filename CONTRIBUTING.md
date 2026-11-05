# Guía de contribución

## Ramas

| Rama | Uso |
|---|---|
| `main` | Versión estable / entregas |
| `developer` | Integración del trabajo del grupo |
| `feature/tp4-<tema>` | Trabajo individual por tarea |

No se pushea directo a `main` ni a `developer`. Todo entra por Pull Request.

### Nombres de rama para el TP4

- `feature/tp4-repo-setup`
- `feature/tp4-calidad`
- `feature/tp4-usabilidad`
- `feature/tp4-accesibilidad`
- `feature/tp4-informe`
- `feature/tp4-presentacion`

## Commits

Usamos Conventional Commits:

- `feat:` funcionalidad nueva
- `fix:` corrección de bug
- `docs:` documentación
- `chore:` tareas de mantenimiento
- `refactor:` reorganización sin cambio de comportamiento
- `test:` pruebas

Ejemplo: `docs(tp4): agregar análisis de accesibilidad`

## Pull Requests

1. Crear la rama desde `developer` actualizada.
2. Hacer los cambios y commitear.
3. Pushear la rama.
4. Abrir un PR **contra `developer`**, no contra `main`.
5. Completar la plantilla del PR.
6. Vincular la issue con `Closes #<número>` en la descripción.
7. Pedir revisión a otro integrante.
8. Mergear con **Squash and merge**.

## Tablero

- Mover la issue a `In progress` al empezar.
- Moverla a `In review` al abrir el PR.
- Moverla a `Done` recién cuando el PR está mergeado y los criterios tildados.

## Seguridad

- No commitear `.env`, claves, tokens ni credenciales.
- Usar variables de entorno para Supabase y servicios externos.
