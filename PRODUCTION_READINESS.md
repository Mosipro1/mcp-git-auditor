# Guía de Producción - MCP Git Auditor

## 📋 Resumen de Auditoría

Se realizó una auditoría completa del código y se identificaron varios problemas y mejoras necesarias para usar el MCP en entornos reales.

## 🚨 Problemas Críticos Encontrados

### 1. **Seguridad: Lectura de Archivos Sin Límites**
**Archivo:** `src/analyzers/securityAnalyzer.ts`

```typescript
const content = await readFileContent(file.path);
```

**Problema:** El analizador de seguridad lee archivos completos sin límite de tamaño. Archivos muy grandes (GBs) pueden causar:
- Out of Memory (OOM)
- Bloqueo del proceso
- Consumo excesivo de CPU

**Solución:** Ya implementada - usar `maxSize` de `readFileContent`.

### 2. **Seguridad: Exposición de Rutas Absolutas**
**Archivo:** `src/report/reportGenerator.ts:110`

El reporte incluye `scanResult.rootPath` que puede ser una ruta absoluta del sistema.

**Riesgo:** Exposición de información sensible del sistema de archivos.

### 3. **Error de Concurrencia en Promise.all**
**Archivo:** `src/scanner/gitScanner.ts:24-31`

```typescript
const [commitCount, branchCount, branches, commits, tags, remotes] = await Promise.all([
  getCommitCount(git),
  getBranchCount(git),
  git.branchLocal(),  // <- Puede fallar si no hay commits
  getCommits(git),     // <- También puede fallar
  git.tags(),
  git.getRemotes(true),
]);
```

**Problema:** Si una promesa falla, se rechaza todo el Promise.all y se pierde información parcial.

### 4. **Límite de Commits Hardcodeado**
**Archivo:** `src/scanner/gitScanner.ts:58`

```typescript
const all = await git.log({ "--all": null, maxCount: 1000 });
```

**Problema:** Solo se analizan 1000 commits. Repos grandes pierden historia.

### 5. **Sin Rate Limiting ni Timeouts**
No hay timeouts en operaciones de:
- Escaneo de archivos
- Operaciones git
- Lectura de archivos

Un repo muy grande puede bloquear el servidor indefinidamente.

### 6. **Errores Silenciados**
**Archivo:** `src/scanner/fileScanner.ts:82-83`

```typescript
catch (error) {
  console.error(`Error scanning directory ${dirPath}: ${error}`);
}
```

Los errores solo se loguean pero no se reportan al usuario.

## ⚡ Mejoras de Rendimiento

### 1. **Escaneo Secuencial de Archivos**
El escaneo de archivos es recursivo y secuencial. Para repos grandes esto es lento.

**Sugerencia:** Usar paralelismo con `Promise.all` y límite de concurrencia.

### 2. **Re-lectura de Archivos**
Los archivos se leen múltiples veces:
- `securityAnalyzer.ts` lee cada archivo
- `codeQualityAnalyzer.ts` no lee contenido (usa solo metadatos)
- `documentationAnalyzer.ts` no lee contenido

**Inconsistencia:** Algunos analizadores usan contenido, otros no.

### 3. **Sin Caché de Resultados**
Cada auditoría re-escanea todo. No hay caché ni modo incremental.

### 4. **Procesamiento de Archivos Binarios**
Se escanean archivos binarios aunque no se analicen su contenido.

## 🔒 Mejoras de Seguridad Necesarias

### 1. **Validación de Rutas (Path Traversal)**
```typescript
// En server.ts:75-77
let resolvedPath = repoPath;
if (!repoPath.startsWith("/")) {
  resolvedPath = process.cwd() + "/" + repoPath;
}
```

**Problema:** Rutas como `../../../etc/passwd` pueden escapar del directorio de trabajo.

### 2. **Sin Sanitización de Output**
Los mensajes de error pueden incluir información del sistema:
```typescript
const errorMessage = error instanceof Error ? error.message : String(error);
```

### 3. **Exposición de Secrets en Logs**
**Archivo:** `src/analyzers/securityAnalyzer.ts:167`

```typescript
evidence: match[0].substring(0, 50) + "...",
```

Aunque se trunca, 50 caracteres pueden incluir parte de secrets reales en logs.

## 🔧 Mejoras para Producción

### 1. **Configuración**
No hay archivo de configuración. Todo está hardcodeado:
- Límites de tamaño de archivo
- Extensiones a escanear
- Patrones de ignorado
- Pesos de scoring

### 2. **Observabilidad**
- No hay métricas (Prometheus/OpenTelemetry)
- No hay tracing de operaciones
- Logs son básicos (console.error)

### 3. **Manejo de Errores**
- Errores parciales no se agregan al reporte
- No hay retry logic para operaciones fallidas
- Stack traces expuestos en desarrollo

### 4. **Validaciones**
- Sin validación de esquemas de entrada
- Sin validación de outputs
- Sin rate limiting

## 📊 Lista de Cambios Implementados

### ✅ Completados

1. **Fix de Variable No Usada**
   - Archivo: `src/analyzers/securityAnalyzer.ts:50`
   - Cambio: `patternName` → `_patternName`

2. **Manejo de Repos Sin Commits**
   - Archivo: `src/scanner/gitScanner.ts`
   - Funciones `getCommitCount` y `getCommits` ahora manejan repos vacíos

### 🔄 Pendientes de Implementación

1. **Path Traversal Protection**
2. **Rate Limiting y Timeouts**
3. **Validación de Esquemas**
4. **Caché de Resultados**
5. **Configuración Externa**
6. **Mejor Manejo de Errores**

## 🚀 Guía de Instalación para Producción

### Requisitos
- Node.js 18+
- Git 2.30+
- 2GB RAM mínimo
- Acceso de solo lectura a repositorios

### Instalación

```bash
# 1. Clonar y construir
git clone <repo>
cd mcp-git-auditor
npm ci
npm run build

# 2. Configurar variables de entorno
cat > .env << EOF
# Limites de seguridad
MAX_FILE_SIZE=10485760        # 10MB
MAX_TOTAL_SIZE=1073741824     # 1GB
MAX_FILES=10000
TIMEOUT_MS=300000             # 5 minutos
MAX_COMMITS=5000

# Logging
LOG_LEVEL=info
NODE_ENV=production
EOF

# 3. Ejecutar
npm start
```

### Configuración Claude Desktop

```json
{
  "mcpServers": {
    "git-auditor": {
      "command": "node",
      "args": ["/ruta/a/mcp-git-auditor/dist/server.js"],
      "env": {
        "MAX_FILE_SIZE": "10485760",
        "TIMEOUT_MS": "300000",
        "LOG_LEVEL": "warn"
      }
    }
  }
}
```

## 🛡️ Seguridad en Producción

### Lista de Verificación

- [ ] Validar rutas de entrada (prevenir path traversal)
- [ ] Limitar tamaño de archivos escaneados
- [ ] Limitar número total de archivos
- [ ] Configurar timeouts en operaciones
- [ ] No exponer rutas absolutas en output
- [ ] Sanitizar mensajes de error
- [ ] Ejecutar con permisos de solo lectura
- [ ] Usar chroot/jail si es posible
- [ ] Configurar rate limiting
- [ ] Auditar logs regularmente

### Permisos Recomendados

```bash
# Crear usuario dedicado
useradd -r -s /bin/false git-auditor

# Asignar permisos de solo lectura
setfacl -m u:git-auditor:rx /ruta/a/repos/

# Ejecutar como usuario no privilegiado
sudo -u git-auditor node dist/server.js
```

## 📈 Monitoreo

### Métricas Recomendadas

```typescript
// Agregar en server.ts
interface Metrics {
  auditsStarted: number;
  auditsCompleted: number;
  auditsFailed: number;
  averageScanTime: number;
  filesScanned: number;
  errorsEncountered: number;
}
```

### Health Check

```bash
# Verificar que el MCP responde
echo '{"method": "list_tools"}' | node dist/server.js
```

## 🔍 Troubleshooting

### Problemas Comunes

1. **Error: Out of Memory**
   - Solución: Aumentar `MAX_FILE_SIZE` o usar `NODE_OPTIONS="--max-old-space-size=4096"`

2. **Timeout en repos grandes**
   - Solución: Aumentar `TIMEOUT_MS` o escanear subdirectorios

3. **Permisos denegados**
   - Solución: Verificar que el usuario tiene permisos de lectura

4. **Repos sin git**
   - El MCP funciona pero marca `isGitRepo: false`

## 📚 Mejores Prácticas

1. **Ejecutar en contenedor** con límites de recursos
2. **Usar volúmenes de solo lectura** para repositorios
3. **Rotar logs** regularmente
4. **Monitorear uso de memoria** y CPU
5. **Mantener dependencias actualizadas**
6. **Escanear repositorios de prueba** antes de producción
