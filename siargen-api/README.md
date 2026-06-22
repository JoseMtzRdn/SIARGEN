# SIARGEN - API Backend

## Especificaciones Técnicas
*   **Plataforma:** Laravel 9 (PHP >= 8.1)
*   **Autenticación:** Laravel Sanctum (autenticación basada en tokens personales de base de datos)
*   **Arquitectura:** Patrón Service/Repository para desacoplar la lógica de negocio del acceso a datos.
*   **Seguridad:** Aislamiento de datos a nivel de unidad administrativa (FALA/BOLA) implementado mediante Laravel Policies y el trait IsolateByUnidad.

## Requisitos de Instalación
Para instalar y configurar el entorno de desarrollo local, ejecute los siguientes comandos en orden:

1. Instalar las dependencias de Composer:
   ```bash
   composer install
   ```

2. Crear el archivo de configuración de entorno:
   ```bash
   cp .env.example .env
   ```
   Configure las variables de acceso a la base de datos MySQL en el archivo `.env`.

3. Generar la clave de la aplicación:
   ```bash
   php artisan key:generate
   ```

4. Ejecutar las migraciones y poblar la base de datos con los roles y el usuario administrador inicial:
   ```bash
   php artisan migrate:fresh --seed
   ```

5. Iniciar el servidor local de desarrollo:
   ```bash
   php artisan serve --port=8000
   ```


