# JMeter - Plan de Pruebas para Visitas Securiti

Este directorio contiene los archivos necesarios para ejecutar pruebas de carga y funcionales con Apache JMeter sobre el backend del sistema de gestión de visitas.

## Archivos

- **visitas-securiti-test-plan.jmx**: Plan de pruebas funcionales básicas
- **load-test-plan.jmx**: Plan de pruebas de carga (rendimiento)
- **stress-test-plan.jmx**: Plan de pruebas de estrés (límites del sistema)
- **test-data.csv**: Datos de prueba (credenciales de usuarios)
- **README.md**: Este archivo con instrucciones

## Requisitos Previos

1. Apache JMeter instalado (ya instalado según indicaste)
2. Backend corriendo en `http://localhost:3001`
3. Base de datos con datos de prueba inicializados

## Configuración

### Variables del Plan de Pruebas

Puedes modificar estas variables en el archivo JMX o desde la interfaz de JMeter:

- `BASE_URL`: URL base del backend (default: `http://localhost:3001`)
- `API_PATH`: Prefijo de la API (default: `/api`)

### Datos de Prueba

Edita el archivo `test-data.csv` con credenciales válidas de tu sistema:

```csv
test_email,test_password
admin@securiti.com,Admin123!
host@securiti.com,Host123!
```

## Grupos de Prueba Incluidos

El plan de pruebas incluye los siguientes grupos:

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Usuarios**: 1
- **Descripción**: Verifica que el servidor esté funcionando

### 2. Authentication Tests
- **Endpoints**: 
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- **Usuarios**: 5 (con ramp-up de 5 segundos)
- **Descripción**: Prueba el flujo de autenticación y extracción del token JWT

### 3. Visits Tests
- **Endpoints**: 
  - `POST /api/auth/login`
  - `GET /api/visits?page=1&limit=10`
- **Usuarios**: 3
- **Descripción**: Prueba el listado de visitas con paginación

### 4. Access Code Tests
- **Endpoints**: 
  - `POST /api/auth/login`
  - `GET /api/access`
  - `GET /api/access/public/active`
- **Usuarios**: 3
- **Descripción**: Prueba los endpoints de códigos de acceso

### 5. Dashboard Tests
- **Endpoints**: 
  - `POST /api/auth/login`
  - `GET /api/dashboard/stats`
- **Usuarios**: 2
- **Descripción**: Prueba las estadísticas del dashboard

## Tipos de Pruebas Disponibles

### 1. Pruebas Funcionales (visitas-securiti-test-plan.jmx)
Pruebas básicas para verificar que todos los endpoints funcionen correctamente.
- **Usuarios concurrentes**: 1-5
- **Objetivo**: Validar funcionalidad

### 2. Pruebas de Carga (load-test-plan.jmx)
Simula tráfico real del sistema para medir rendimiento.
- **Usuarios concurrentes**: 10-20
- **Duración**: 5-10 minutos
- **Objetivo**: Medir tiempos de respuesta bajo carga normal

**Escenarios incluidos:**
- ✅ Registro público de visitas (20 usuarios, 10 loops)
- ✅ Verificación de lista negra (15 usuarios, 20 loops)
- ✅ Operaciones autenticadas (10 usuarios, 5 loops)
- ✅ Check-in de códigos de acceso (deshabilitado por defecto)

### 3. Pruebas de Estrés (stress-test-plan.jmx)
Lleva el sistema al límite para encontrar el punto de quiebre.
- **Usuarios concurrentes**: 50-200
- **Duración**: 5 minutos con incremento gradual
- **Objetivo**: Identificar límites del sistema

**Escenarios incluidos:**
- ⚡ Carga incremental (0 a 100 usuarios en 60 segundos)
- ⚡ Spike test (200 usuarios en 5 segundos) - deshabilitado por defecto

## Cómo Ejecutar

### Opción 1: Interfaz Gráfica (GUI)

1. Abre JMeter:
   ```powershell
   jmeter
   ```

2. Abre el archivo del plan de pruebas:
   - File → Open → Selecciona `visitas-securiti-test-plan.jmx`

3. Configura las variables si es necesario (click en "Test Plan")

4. Ejecuta las pruebas:
   - Click en el botón verde "Start" (▶)

5. Revisa los resultados en:
   - View Results Tree (para ver requests individuales)
   - Summary Report (resumen de métricas)
   - Aggregate Report (estadísticas agregadas)

### Opción 2: Modo No-GUI (Línea de Comandos) - RECOMENDADO PARA CARGA

Para pruebas de carga más realistas, usa el modo no-GUI:

```powershell
# Navega al directorio del proyecto
cd c:\Users\becarios\Documents\visitas-securiti\jmeter

# PRUEBAS FUNCIONALES (básicas)
jmeter -n -t visitas-securiti-test-plan.jmx -l functional-results.jtl -e -o functional-report/

# PRUEBAS DE CARGA (rendimiento)
jmeter -n -t load-test-plan.jmx -l load-results.jtl -e -o load-report/

# PRUEBAS DE ESTRÉS (límites)
jmeter -n -t stress-test-plan.jmx -l stress-results.jtl -e -o stress-report/

# Parámetros:
# -n: modo no-GUI
# -t: archivo del plan de pruebas
# -l: archivo de resultados (.jtl)
# -e: generar reporte HTML
# -o: directorio para el reporte HTML
```

Después de la ejecución, abre `[tipo]-report/index.html` en tu navegador para ver el reporte detallado.

### Opción 3: Ejecutar con Variables Personalizadas

```powershell
jmeter -n -t visitas-securiti-test-plan.jmx ^
  -JBASE_URL=http://localhost:3001 ^
  -l results.jtl ^
  -e -o report/
```

## Métricas Importantes

Al revisar los resultados, presta atención a:

- **Response Time (Tiempo de Respuesta)**: Debe ser < 1000ms para la mayoría de requests
- **Throughput**: Requests por segundo que el servidor puede manejar
- **Error Rate**: Debe ser 0% o muy bajo
- **90th Percentile**: 90% de las peticiones deben completarse en este tiempo

## Agregar Más Pruebas

### Para agregar un nuevo endpoint:

1. Abre el plan de pruebas en JMeter
2. Click derecho en un Thread Group existente → Add → Sampler → HTTP Request
3. Configura:
   - Path: `${BASE_URL}${API_PATH}/tu-endpoint`
   - Method: GET/POST/PUT/DELETE
   - Body (si aplica)
4. Agrega assertions si es necesario
5. Guarda el archivo

### Para pruebas de carga más intensivas:

Modifica los Thread Groups:
- **Number of Threads**: Aumenta el número de usuarios concurrentes
- **Ramp-Up Period**: Tiempo para alcanzar el máximo de usuarios
- **Loop Count**: Número de veces que cada usuario ejecuta el test

Ejemplo de prueba de carga pesada:
- Number of Threads: 100
- Ramp-Up: 30 segundos
- Loop Count: 10

## Endpoints Disponibles

### Autenticación
- `POST /api/auth/login` - Login de usuario
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/refresh` - Refrescar token

### Visitas
- `GET /api/visits` - Listar visitas (con paginación)
- `GET /api/visits/:id` - Obtener visita específica
- `POST /api/visits` - Crear visita
- `PUT /api/visits/:id` - Actualizar visita
- `DELETE /api/visits/:id` - Eliminar visita

### Códigos de Acceso
- `GET /api/access` - Listar códigos de acceso
- `GET /api/access/:id` - Obtener código específico
- `POST /api/access` - Crear código de acceso
- `PUT /api/access/:id` - Actualizar código
- `DELETE /api/access/:id` - Eliminar código
- `GET /api/access/public/active` - Códigos públicos activos
- `POST /api/access/check-in/:accessCode` - Check-in con código
- `POST /api/access/redeem` - Canjear código

### Dashboard
- `GET /api/dashboard/stats` - Estadísticas del dashboard
- `GET /api/dashboard/recent-visits` - Visitas recientes

### Usuarios
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Lista Negra
- `GET /api/blacklist` - Listar entradas
- `POST /api/blacklist` - Agregar entrada
- `DELETE /api/blacklist/:id` - Eliminar entrada
- `GET /api/blacklist/check/:email` - Verificar email

### Reportes
- `GET /api/reports/visits` - Reporte de visitas
- `GET /api/reports/access-codes` - Reporte de códigos

## Solución de Problemas

### Error: "Connection refused"
- Verifica que el backend esté corriendo en el puerto correcto
- Comprueba la variable `BASE_URL` en el plan de pruebas

### Error: "401 Unauthorized" en todos los requests
- Verifica que las credenciales en `test-data.csv` sean correctas
- Asegúrate de que el token JWT se está extrayendo correctamente (revisa el JSON Post Processor)

### Resultados inconsistentes
- Asegúrate de que la base de datos tenga datos de prueba
- Verifica que no haya rate limiting activo
- Reduce el número de usuarios concurrentes

### El servidor se sobrecarga
- Reduce el número de threads en los Thread Groups
- Aumenta el Ramp-Up period
- Agrega delays entre requests (Timer → Constant Timer)

## Recomendaciones por Tipo de Prueba

### Para Pruebas de Carga (Load Test)
```powershell
# Ejecuta con el backend en producción o staging
jmeter -n -t load-test-plan.jmx -l results.jtl -e -o report/

# Monitorea durante la prueba:
# -Análisis de Resultados

### Métricas Clave

**Response Time (Tiempo de Respuesta)**
- Promedio: < 500ms ✅ Excelente
- Promedio: 500-1000ms ⚠️ Aceptable
- Promedio: > 1000ms ❌ Necesita optimización
- 90th Percentile: < 1000ms ideal

**Throughput (Peticiones/segundo)**
- Debe ser constante bajo carga normal
- Si disminuye bajo carga = cuello de botella

**Error Rate (Tasa de Errores)**
- 0% ✅ Ideal
- < 1% ⚠️ Aceptable
- > 5% ❌ Problema crítico

**Latency vs Response Time**
- Latency alta = problemas de red
- Response time alto = procesamiento lento

### Interpretar Reportes HTML

El reporte HTML generado incluye:

1. **Dashboard**: Vista general de métricas
2. **Response Times Over Time**: Gráfica de tiempos
3. **Active Threads Over Time**: Usuarios concurrentes
4. **Throughput**: Requests por segundo
5. **Response Time Percentiles**: Distribución de tiempos
6. **Transactions Per Second**: TPS del sistema

### Qué Buscar

❌ **Señales de Problema:**
- Tiempos de respuesta crecientes (curva ascendente)
- Errores de conexión o timeouts
- Throughput decreciente con más usuarios
- Memoria/CPU al 100%

✅ **Señales Saludables:**
- Tiempos de respuesta estables
- 0% errores
- Throughput proporcional a usuarios
- Recursos por debajo del 80%

## Próximos Pasos

Puedes extender estas pruebas agregando:

- Tests de resistencia (carga constante durante largo tiempo - endurance)
- Tests con diferentes perfiles de usuario (admin vs host vs reception)
- Validaciones más detalladas de las respuestas JSON
- Tests de los endpoints de creación/actualización/eliminación
- Integración con CI/CD para pruebas automáticas
- Monitoreo con herramientas como Grafana + Prometheusa enabled="true"

jmeter -n -t stress-test-plan.jmx -l stress-results.jtl -e -o stress-report/

# Observa cuándo el sistema comienza a fallar:
# - Incremento en errores 5XX
# - Tiempos de respuesta > 3000ms
# - CPU/memoria al 100%
```

### Personalizar Carga
Edita el archivo JMX o usa parámetros:

```powershell
# Cambiar URL base
jmeter -n -t load-test-plan.jmx -JBASE_URL=http://192.168.1.100:3001 -l results.jtl

# Para editar usuarios/loops, modifica el XML directamente o usa la GUI
```

## Mejores Prácticas

1. **Siempre ejecuta primero con pocos usuarios** para validar que las pruebas funcionan
2. **Usa el modo no-GUI para pruebas de carga pesadas** (consume menos recursos)
3. **Monitorea el servidor** mientras ejecutas las pruebas (CPU, memoria, logs)
4. **Guarda los resultados** para comparar con ejecuciones futuras
5. **Limpia la base de datos** si es necesario entre ejecuciones de pruebas
6. **Incrementa la carga gradualmente** - no saltes de 10 a 1000 usuarios
7. **Ejecuta pruebas en horarios de bajo tráfico** si usas producción

## Próximos Pasos

Puedes extender estas pruebas agregando:

- Tests de rendimiento con más carga
- Tests de estrés (carga extrema hasta que falle)
- Tests de resistencia (carga constante durante largo tiempo)
- Tests de picos (subidas repentinas de carga)
- Validaciones más detalladas de las respuestas JSON
- Tests de los endpoints de creación/actualización/eliminación

## Recursos Adicionales

- [Documentación oficial de JMeter](https://jmeter.apache.org/usermanual/index.html)
- [Best Practices de JMeter](https://jmeter.apache.org/usermanual/best-practices.html)
- [JMeter Performance Testing](https://www.blazemeter.com/blog/jmeter-tutorial)
