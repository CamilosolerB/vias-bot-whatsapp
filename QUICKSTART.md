# ⚡ Inicio Rápido: VíasBot Telegram

**¿Quieres empezar ya?** Esta es la guía más rápida para poner el bot funcionando en 5 minutos.

---

## 🎯 Resumen Ejecutivo

VíasBot es un bot de Telegram que te permite consultar:
- 🚗 **Estado del tráfico** en tiempo real
- 🌤️ **Condiciones climáticas** actualizadas
- ⚠️ **Incidentes y accidentes** en vías
- 🛣️ **Rutas frecuentes** guardadas

---

## 5️⃣ Pasos para Empezar

### 1. Obtener Credenciales (2 min)

**Telegram:**
- Abre Telegram → Busca `@BotFather`
- Envía `/newbot` → Sigue instrucciones
- **Copia el token** (ejemplo: `123456:ABC-DEF1234...`)

**TomTom:**
- Ve a [developer.tomtom.com](https://developer.tomtom.com)
- Crea cuenta → API Keys → Copia tu clave

**OpenWeatherMap:**
- Ve a [openweathermap.org](https://openweathermap.org)
- Crea cuenta → API Keys → Copia tu clave

### 2. Configurar en Manus (2 min)

1. Ve a **Settings** → **Secrets**
2. Agrega estas 3 variables:
   ```
   TELEGRAM_BOT_TOKEN = tu_token_aqui
   TOMTOM_API_KEY = tu_clave_tomtom_aqui
   OPENWEATHER_API_KEY = tu_clave_openweather_aqui
   ```
3. Guarda

### 3. Registrar Webhook (1 min)

En tu terminal, ejecuta:

```bash
curl -X POST https://api.telegram.org/bot<TU_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://tu-proyecto.manus.space/api/webhooks/telegram"}'
```

Reemplaza:
- `<TU_TOKEN>` con tu token de BotFather
- `tu-proyecto.manus.space` con tu URL de Manus

### 4. Probar el Bot (1 min)

1. Abre Telegram
2. Busca tu bot (ej: `@vias_bot`)
3. Envía: `/ayuda`
4. ¡Deberías recibir una respuesta!

### 5. Usar el Bot (Ahora!)

Intenta estas consultas:

```
¿Cómo está el tráfico en la Calle 5?
Clima en Bogotá
Hay un accidente en la Carrera 7
```

---

## 📱 Ejemplos de Uso

### Consulta de Tráfico
```
Usuario: ¿Cómo está el tráfico en la Avenida Paseo?

Bot: 🚗 Estado de Tráfico

🟢 Velocidad: 45 km/h (Límite: 60 km/h)
⏱️ Tiempo estimado: 12 minutos
📊 Confiabilidad: 95%

🌤️ Clima
Temperatura: 22°C
Condición: Parcialmente nublado
Viento: 8 km/h
```

### Consulta de Clima
```
Usuario: Clima en el centro

Bot: 🌤️ Clima

Temperatura: 24°C
Condición: Lluvia ligera
Viento: 12 km/h
Visibilidad: 8 km
🌧️ Lluvia: 2.5 mm
```

### Reportar Incidente
```
Usuario: Hay un accidente en la Calle 10

Bot: ✅ Incidente registrado
Ubicación: Calle 10
Tipo: Accidente
Hora: 14:30

Este incidente aparecerá en futuras consultas de la zona.
```

---

## 🆘 Si Algo No Funciona

| Problema | Solución |
|----------|----------|
| Bot no responde | Verifica que el webhook esté registrado correctamente |
| Error de API | Asegúrate de que las claves sean válidas |
| Respuesta lenta | Espera 5-10 segundos, el bot procesa en background |
| Webhook error | Verifica que la URL sea accesible desde internet |

---

## 📚 Documentación Completa

Para más detalles:
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Guía de configuración detallada
- **[TUTORIAL.md](./TUTORIAL.md)** - Tutorial completo de uso
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura técnica

---

## 🚀 ¡Listo!

Tu bot está funcionando. Ahora puedes:

✅ Consultar tráfico en tiempo real
✅ Ver condiciones climáticas
✅ Reportar incidentes
✅ Guardar rutas frecuentes

**¡Disfruta usando VíasBot!** 🎉
