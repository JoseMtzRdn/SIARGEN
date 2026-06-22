# SIARGEN - Interfaz Web

## Especificaciones Técnicas
*   **Framework:** React 19 (compilado con Vite)
*   **Gestión de Estado:** Redux Toolkit
*   **Estilos:** Tailwind CSS (configurado con variables HSL adaptadas al manual de identidad del ISEM)
*   **Manejo de Formularios:** React Hook Form
*   **Animaciones:** Framer Motion

## Requisitos de Instalación
Para instalar y configurar el entorno de desarrollo local, ejecute los siguientes comandos en orden:

1. Instalar las dependencias de Node.js:
   ```bash
   npm install
   ```

2. Crear el archivo de configuración de entorno:
   ```bash
   cp .env.example .env
   ```
   Asegurarse de que la variable `VITE_API_URL` apunte a la dirección de la API del backend (por defecto `http://localhost:8000/api`).

3. Iniciar el servidor local de desarrollo:
   ```bash
   npm run dev
   ```

4. Compilar para entornos de producción:
   ```bash
   npm run build
   ```

