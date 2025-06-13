# 🔮 Spiritual Guides API

Una API moderna desarrollada con NestJS para generar guías espirituales personalizados usando inteligencia artificial.

## ✨ Características

- **Generación de Guías Espirituales**: Crea guías únicos basados en respuestas de encuestas
- **Integración con OpenAI**: Utiliza GPT-4 y DALL-E 3 para generar descripciones e imágenes
- **Animación con Replicate**: Convierte imágenes estáticas en videos animados
- **Efectos Boomerang**: Crea videos con efecto loop usando FFmpeg
- **Base de Datos MongoDB**: Almacenamiento persistente de usuarios y guías
- **API RESTful**: Endpoints bien documentados con Swagger/OpenAPI
- **Validación Robusta**: Validación de datos con class-validator
- **Tipado TypeScript**: Código completamente tipado para mejor mantenimiento

## 🚀 Instalación

### Prerrequisitos

- Node.js (versión 18+)
- MongoDB (local o remoto)
- Cuenta de OpenAI con API key
- Cuenta de Replicate con token de acceso

### Configuración

1. **Clonar e instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**

Crear archivo `.env` con:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/spiritual-guides

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Replicate Configuration
REPLICATE_TOKEN=r8_your-replicate-token-here

# Server Configuration
PORT=3000

# Node Environment
NODE_ENV=development
```

3. **Compilar y ejecutar:**
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## 📚 Uso de la API

### Endpoints Principales

#### 👤 Usuarios

- `POST /users` - Crear usuario
- `GET /users` - Obtener todos los usuarios
- `GET /users/:id` - Obtener usuario por ID
- `GET /users/email/:email` - Obtener usuario por email
- `PATCH /users/:id` - Actualizar usuario
- `DELETE /users/:id` - Eliminar usuario

#### 🔮 Guías Espirituales

- `POST /spiritual-guides/generate` - **Generar guía completo** (endpoint principal)
- `GET /spiritual-guides` - Obtener todos los guías
- `GET /spiritual-guides/:id` - Obtener guía por ID
- `GET /spiritual-guides/user/:userId` - Obtener guías de un usuario
- `PATCH /spiritual-guides/:id` - Actualizar guía
- `DELETE /spiritual-guides/:id` - Eliminar guía

### Ejemplo de Uso

#### 1. Crear un usuario:
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "María García",
    "email": "maria@ejemplo.com"
  }'
```

#### 2. Generar guía espiritual completo:
```bash
curl -X POST http://localhost:3000/spiritual-guides/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_AQUÍ",
    "surveyAnswers": [
      "Escuchás algo que no sabías que estaba ahí",
      "Uno donde nada te apura",
      "Te confiás a lo que se siente verdadero",
      "Extrañás lo que se esconde",
      "Sentís que no necesitás hablar mucho",
      "Es algo que no cambia aunque cambies",
      "Sería con una voz que ya escuchaste antes",
      "Te quedás quieto y dejás que todo pase por vos",
      "Sería lento, profundo y sin saltos",
      "Te descubrís como si fueras otra persona",
      "Sería la que observa en silencio",
      "Deseás que te abrace sin tocarte",
      "Te perdés un poco, pero te gusta",
      "Uno donde todo suena apagado",
      "Te sentís en casa aunque no sepas por qué",
      "No necesitás que se muestre",
      "Se dejaría llevar sin saber a dónde",
      "Desconfiás un poco, como si faltara algo",
      "Sería hecho de presencias compartidas",
      "Esperás una señal que solo vos puedas entender"
    ]
  }'
```

Esta llamada realizará todo el proceso:
1. ✨ Genera descripción del guía con GPT-4
2. 🎨 Crea imagen con DALL-E 3
3. 🎬 Anima la imagen con Replicate
4. 🎪 Crea video boomerang con FFmpeg
5. 💾 Guarda todo en la base de datos

## 🏗️ Estructura del Proyecto

```
src/
├── app.module.ts              # Módulo principal
├── main.ts                    # Punto de entrada
├── users/                     # Módulo de usuarios
│   ├── controllers/
│   ├── services/
│   ├── entities/
│   └── dto/
├── spiritual-guides/          # Módulo de guías espirituales
│   ├── controllers/
│   ├── services/
│   ├── entities/
│   └── dto/
└── external-services/         # Servicios externos
    └── services/
        ├── openai.service.ts
        ├── replicate.service.ts
        └── file.service.ts
```

## 🔧 Servicios Integrados

### OpenAI Service
- **GPT-4**: Generación de descripciones de guías espirituales
- **DALL-E 3**: Creación de imágenes únicas para cada guía

### Replicate Service
- **Animación de Imágenes**: Convierte imágenes estáticas en videos animados
- **Polling Asíncrono**: Manejo de procesos de larga duración

### File Service
- **Gestión de Archivos**: Descarga y almacenamiento local
- **FFmpeg Integration**: Procesamiento de video y efectos boomerang
- **Cleanup**: Limpieza automática de archivos temporales

## 📖 Documentación de la API

Una vez que la aplicación esté ejecutándose, puedes acceder a la documentación interactiva en:

**http://localhost:3000/api**

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run start:dev          # Modo desarrollo con hot reload
npm run start:debug        # Modo debug

# Producción
npm run build              # Compilar para producción
npm run start:prod         # Ejecutar en producción

# Testing
npm run test               # Tests unitarios
npm run test:e2e           # Tests end-to-end
npm run test:cov           # Coverage

# Linting
npm run lint              # Ejecutar linter
npm run format            # Formatear código
```

## 🎯 Características Técnicas

- **Arquitectura Modular**: Separación clara de responsabilidades
- **Validación Robusta**: DTOs con class-validator
- **Manejo de Errores**: Exceptions handlers personalizados
- **Logging**: Sistema de logs estructurado
- **Documentación**: Auto-generación con Swagger
- **Tipado Completo**: TypeScript en todo el proyecto
- **Async/Await**: Manejo moderno de asincronía

## 🔮 Proceso de Generación

1. **Usuario completa encuesta** con 20 preguntas espirituales
2. **GPT-4 analiza respuestas** y genera descripción única del guía
3. **DALL-E 3 crea imagen** basada en la descripción
4. **Replicate anima la imagen** para darle vida
5. **FFmpeg procesa el video** y crea efecto boomerang
6. **Todo se almacena** en MongoDB para acceso futuro

## 🚨 Consideraciones de Producción

- Configurar límites de rate limiting
- Implementar autenticación/autorización
- Configurar monitoreo y métricas
- Optimizar almacenamiento de archivos (ej: AWS S3)
- Implementar cache para respuestas frecuentes
- Configurar logs estructurados

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

---

✨ **¡Conectando almas con sus guías espirituales a través de la magia de la tecnología!** ✨ 