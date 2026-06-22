# SIARGEN - Sistema General de Archivo

Plataforma de gestión documental y control archivístico para el Instituto de Salud del Estado de México (ISEM)

## Estructura del proyecto

* **siargen-api**: Backend en Laravel 9.
* **siargen-web**: Frontend en React 19 con Vite y Redux.

## Instalación y ejecución rápida

### Requisitos previos
* PHP >= 8.1
* Node.js >= 18
* MySQL 
* Composer

### Backend (siargen-api)
1. Entrar a la carpeta: `cd siargen-api`
2. Instalar dependencias: `composer install`
3. Configurar entorno: `cp .env.example .env` (editar los accesos de base de datos en `.env`)
4. Generar app key: `php artisan key:generate`
5. Crear la base de datos: `php artisan migrate:fresh --seed`
6.  `php artisan serve --port=8000`

### Frontend (siargen-web)
1. Entrar a la carpeta: `cd siargen-web`
2. Instalar dependencias: `npm install`
3. Configurar entorno: `cp .env.example .env`
4. Iniciar servidor de desarrollo: `npm run dev`

### Acceso inicial
* **Usuario:** `adminti`
* **Contraseña:** `password`
