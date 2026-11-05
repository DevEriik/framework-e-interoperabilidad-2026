# 📚 Trabajo Práctico N°2: CMS y Frameworks Web

Repositorio oficial correspondiente al desarrollo, documentación y código del **Trabajo Práctico N°2** de la asignatura **Framework e Interoperabilidad** — Tecnicatura Universitaria en Desarrollo Web (Universidad Nacional del Comahue).

---

## 👥 Equipo: Grupo 1 - NoCode

| Integrante           | Legajo   | Rol / Módulo Principal | Rama |
| :------------------- | :------- | :-------------- | :--- |
| **Abril Gavilan**    | FAI-5163 | Módulo 3: Evaluaciones y Reseñas (Closed-Loop) | `feature/abril` |
| **Daniela Oñatibia** | FAI-4775 | Módulo 2: Gestión de Usuarios y Perfiles | `feature/dani`  |
| **Erick Gonzalez**   | FAI-3433 | Módulo 1: Catálogo de Servicios | `feature/erick` |

---

## 🎯 Resumen del Proyecto: "ExpertoYa"
Para este trabajo práctico, el equipo desarrolló la base técnica completa de **ExpertoYa**, una plataforma transaccional diseñada para conectar clientes con profesionales de oficios matriculados. El sistema se compone de una arquitectura Cliente-Servidor unificada que integra el diseño frontend de la plataforma con una API backend robusta.

### Módulos Implementados
1. **Catálogo de Servicios:** Listado y creación de ofertas de oficios.
2. **Gestión de Usuarios:** Registro de clientes y profesionales con encriptación de contraseñas (`bcryptjs`) y autenticación.
3. **Reseñas y Calificaciones:** Sistema *Closed-Loop* conectado a una base de datos real en la nube para calificar profesionales.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología Elegida | Justificación |
| :--- | :--- | :--- |
| **Backend & API** | **Express.js (Node.js)** | Arquitectura minimalista y óptimo manejo asíncrono para rutas RESTful. |
| **Base de Datos** | **PostgreSQL (Supabase)** | Base de datos relacional en la nube para garantizar persistencia y escalabilidad. |
| **Frontend UI** | **React + TypeScript (Vite)** | Renderizado reactivo basado en componentes y tipado estático seguro. |
| **Estilos** | **Tailwind CSS + Shadcn/ui** | Paradigma *utility-first* y componentes accesibles de alto rendimiento visual. |

> 📄 **Documentación técnica:** Puedes revisar todos los informes de calidad, auditorías de usabilidad y manuales técnicos en la carpeta [`/docs`](./docs/).

---

## 📂 Estructura del Repositorio

```text
├── docs/                      # Informes técnicos, auditorías de UI/UX y capturas del template
├── server/                    # ⚙️ BACKEND UNIFICADO (API Express)
│   ├── src/
│   │   ├── config/            # Conexión a la BD (Supabase)
│   │   ├── controllers/       # Lógica de negocio
│   │   ├── routes/            # Endpoints REST
│   │   └── index.js           # Punto de entrada unificado de la API
│   ├── .env                   # (No incluido en Git) Variables de entorno
│   └── package.json           
├── src/                       # 🎨 FRONTEND (React)
│   ├── components/            # Componentes de UI y de los 3 módulos
│   ├── App.tsx                # Layout principal de ExpertoYa
│   └── main.tsx               
└── package.json               
```

---

## 🚀 Guía de Instalación y Ejecución Local

Para probar el proyecto completo (Frontend + Backend) en tu máquina, sigue estos pasos al pie de la letra, ya que necesitas levantar dos servidores en simultáneo.

### 1. Clonar el Repositorio
```bash
git clone https://github.com/DevEriik/TP-Nro2-FI--CMS-Framework-NO-CODE-.git
cd TP-Nro2-FI--CMS-Framework-NO-CODE-
```

### 2. Configurar y Levantar el Servidor Backend (API)
Abre una terminal nueva y ejecuta:
```bash
# Entrar a la carpeta del servidor
cd server

# Instalar las librerías del backend
npm install

# ¡IMPORTANTE! Crea un archivo .env en esta carpeta con las claves de Supabase.
# (Solicitar credenciales a los administradores del repo)

# Levantar el servidor (Correrá en el puerto 3001)
npm run dev
```

### 3. Configurar y Levantar el Frontend (React)
Abre una **segunda terminal** en la raíz del proyecto (`TP-Nro2-FI--CMS-Framework-NO-CODE-`) y ejecuta:
```bash
# Instalar dependencias de React/Vite
npm install

# Levantar la interfaz web
npm run dev
```

👉 Una vez que ambas terminales estén corriendo, abre tu navegador en: **`http://localhost:5173/`**

---

## 📊 Gestión del Proyecto

Todo el flujo de trabajo colaborativo, revisión de código y resolución de conflictos de integración se gestionó mediante metodología ágil.
🔗 **[Ver Tablero Kanban Oficial del Grupo 1](https://github.com/users/DevEriik/projects/4/views/1)**
