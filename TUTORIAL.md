# 🤖 Tutorial: VíasBot Telegram - Estado de Vías en Tiempo Real

Bienvenido a **VíasBot**, tu asistente inteligente para consultar el estado de las vías, tráfico, clima y accidentes en tiempo real a través de Telegram.

---

## 📱 Primeros Pasos

### 1. Encontrar el Bot en Telegram

1. Abre la aplicación de **Telegram** en tu teléfono o computadora
2. Busca el bot: **@ViasBotBot** (o el nombre que hayas configurado)
3. Presiona **"Iniciar"** o envía el comando `/start`

### 2. Comandos Principales

El bot reconoce automáticamente tus consultas en lenguaje natural. Aquí hay algunos ejemplos:

---

## 🚗 Consultas de Tráfico

### Preguntar sobre tráfico en una ubicación específica

**Ejemplos:**
```
¿Cómo está el tráfico en la Calle 5?
Tráfico en la Carrera 7
¿Hay congestión en la Avenida Paseo?
Estado del tráfico en el centro
```

**Respuesta del bot:**
```
🚗 Estado de Tráfico

🟢 Velocidad: 45 km/h (Límite: 60 km/h)
⏱️ Tiempo estimado: 12 minutos
📊 Confiabilidad: 95%

🌤️ Clima
Temperatura: 22°C
Condición: Parcialmente nublado
Viento: 8 km/h
Visibilidad: 10 km

⚠️ Incidentes
🚨 Accidente en Calle 5 con Carrera 10
   📍 Centro histórico
   ⏱️ Retraso: 15 min
```

---

## 🌤️ Consultas de Clima

### Preguntar sobre el clima en una ubicación

**Ejemplos:**
```
¿Qué clima hace en la Avenida Principal?
Clima en el norte
¿Va a llover hoy en la Calle 10?
Condiciones climáticas en el sur
```

**Respuesta del bot:**
```
🌤️ Clima

Temperatura: 24°C
Condición: Lluvia ligera
Viento: 12 km/h
Visibilidad: 8 km
🌧️ Lluvia: 2.5 mm

⚠️ Alertas: Lluvia moderada esperada en 2 horas
```

---

## 🛣️ Rutas Frecuentes

### Consultar una ruta que has guardado

**Ejemplos:**
```
¿Cómo está la ruta al trabajo?
Tráfico ruta centro-norte
Estado de la ruta a casa
```

El bot recordará tus rutas frecuentes y te mostrará información actualizada.

---

## ⚠️ Reportar Incidentes

### Reportar un accidente o problema en la vía

**Ejemplos:**
```
Hay un accidente en la Calle 10
Reporte: congestión en la autopista norte
Incidente en Carrera 5 con Calle 20
```

El bot registrará el incidente y lo incluirá en futuras consultas de la zona.

---

## 💡 Comandos Especiales

### `/ayuda` - Ver opciones disponibles
Muestra un menú con todos los comandos y opciones disponibles.

**Respuesta:**
```
🤖 VíasBot - Ayuda

Puedo ayudarte con:

📍 Tráfico: Pregunta sobre el estado del tráfico
   Ej: "¿Cómo está el tráfico en la Calle 5?"

🌤️ Clima: Consulta las condiciones climáticas
   Ej: "¿Qué clima hace en la Avenida Principal?"

🛣️ Rutas: Información sobre rutas frecuentes
   Ej: "¿Cómo está la ruta al trabajo?"

⚠️ Incidentes: Reporta o consulta accidentes
   Ej: "Hay un accidente en la Calle 10"

💡 Consejos:
   • Sé específico con la ubicación
   • Incluye nombre de calle o avenida
   • Pregunta de forma natural

¿Qué necesitas saber?
```

---

## 📊 Información Incluida en las Respuestas

### Datos de Tráfico
- **Velocidad actual**: Velocidad promedio en la zona
- **Límite de velocidad**: Velocidad máxima permitida
- **Congestión**: Nivel de tráfico (🟢 Libre, 🟡 Moderado, 🔴 Pesado, ⛔ Bloqueado)
- **Tiempo estimado**: Minutos para recorrer la zona
- **Confiabilidad**: Porcentaje de precisión de los datos

### Datos de Clima
- **Temperatura**: En grados Celsius
- **Condición**: Descripción del clima (soleado, nublado, lluvia, etc.)
- **Viento**: Velocidad en km/h
- **Visibilidad**: En kilómetros
- **Precipitación**: Lluvia esperada en mm
- **Alertas**: Advertencias de clima severo

### Incidentes
- **Tipo**: Accidente, congestión, construcción, etc.
- **Ubicación**: Dirección o zona específica
- **Retraso**: Minutos adicionales esperados
- **Descripción**: Detalles del incidente

---

## 🎯 Consejos para Mejores Resultados

### 1. Sé Específico con Ubicaciones
❌ **Evita:** "¿Cómo está el tráfico?"
✅ **Mejor:** "¿Cómo está el tráfico en la Calle 5?"

### 2. Incluye Nombres de Calles o Avenidas
❌ **Evita:** "Tráfico en el centro"
✅ **Mejor:** "Tráfico en la Carrera 7 con Calle 10"

### 3. Pregunta de Forma Natural
El bot entiende lenguaje natural, así que puedes escribir como lo harías normalmente:
- "¿Cómo está el tráfico...?"
- "Dime el estado del tráfico en..."
- "¿Hay congestión en...?"
- "Clima en..."

### 4. Actualiza Tus Rutas Frecuentes
Guarda las rutas que usas regularmente para acceso rápido:
- Ruta al trabajo
- Ruta a casa
- Ruta a la universidad
- Rutas de viajes frecuentes

---

## ⚡ Respuesta Rápida

El bot está diseñado para responder rápidamente:
- **Tiempo promedio de respuesta**: 2-5 segundos
- **Datos actualizados**: Cada 5-10 minutos
- **Disponibilidad**: 24/7

---

## 🔄 Actualizaciones en Tiempo Real

El bot obtiene información de:
- **TomTom Traffic API**: Datos de tráfico en tiempo real
- **OpenWeatherMap**: Información climática actualizada
- **Base de datos local**: Rutas frecuentes y configuración

---

## ❓ Preguntas Frecuentes

### ¿Qué pasa si el bot no entiende mi consulta?
El bot te pedirá que seas más específico o te mostrará opciones disponibles. Escribe `/ayuda` para ver ejemplos.

### ¿Puedo guardar rutas favoritas?
Sí, el bot aprenderá tus rutas frecuentes con el tiempo. Puedes consultarlas por nombre.

### ¿Qué tan precisos son los datos?
Los datos de tráfico tienen una precisión del 85-95% según TomTom. El clima se actualiza cada 10 minutos.

### ¿Hay límite de consultas?
No hay límite de consultas. Puedes usar el bot las veces que necesites.

### ¿Dónde se guardan mis datos?
Tus consultas se guardan en una base de datos segura solo para mejorar el servicio. No se comparten con terceros.

---

## 📞 Soporte

Si encuentras problemas o tienes sugerencias:
1. Escribe `/ayuda` para ver opciones
2. Intenta reformular tu consulta
3. Contacta al administrador del bot

---

## 🎉 ¡Disfruta usando VíasBot!

Esperamos que VíasBot te ayude a navegar las vías de forma más segura e informada. 

**¡Bienvenido a la experiencia de consultas de tráfico inteligente!** 🚀
