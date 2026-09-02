# Prompt único: actualizar Monday solo con validaciones reales

Usa el skill monday-avances-cchc y sincroniza Monday.com vía MCP con este repositorio, pero con una regla estricta: solo actualizar estado y carta Gantt de requerimientos que tengan validación funcional real y verificable.

Reglas obligatorias:
1. Lee CLAUDE.md, spec.md y data.md antes de tocar Monday.
2. No asumas completado por implementación parcial: exige evidencia ejecutada.
3. Si no hay evidencia verificable, mantener o mover a En progreso/Bloqueado, nunca a Completado.
4. No inventar IDs de board, grupos, columnas o items.
5. Si el MCP de Monday no está disponible, detener y reportar bloqueo de integración.

Criterio de validación real (mínimo para marcar Completado):
- Evidencia de prueba funcional ejecutada en la sesión (resultado observable de endpoint, flujo UI, test o script).
- Evidencia técnica trazable (archivo(s) cambiado(s), endpoint(s), contrato de datos).
- Coherencia con DoD del módulo en spec.md.

Foco principal de verificación (4 urgentes):
1) Registro de correos de personas (suscriptores).
2) Productos con fotos, detalle, precio y stock desde backend.
3) Contador de ingreso a la página.
4) Integración de Mercado Pago (checkout + confirmación válida).

Acciones en Monday requeridas:
A) Board
- Buscar cada requerimiento por req_id o título.
- Si no existe, crearlo en Backlog con modulo y criterio_dod.
- Actualizar estado solo según evidencia:
  - Completado: solo con validación real.
  - En progreso: implementado parcial o sin prueba completa.
  - Bloqueado: impedimento claro con causa y acción siguiente.
- Registrar evidencia en columna evidencia con resumen concreto de validación.

B) Carta Gantt
- Actualizar fecha_inicio cuando exista trabajo activo real.
- Actualizar fecha_cierre solo para requerimientos validados y completados.
- Ajustar dependencias si un bloqueo impide módulos siguientes.
- No cerrar hitos dependientes de tareas no validadas.

C) Integridad documental
- Verificar que cualquier estado Completado esté alineado con spec.md y data.md.
- Si detectas desalineación documental, no cerrar: marcar Bloqueado por documentación y dejar acción correctiva.

Formato de salida obligatorio:
1. Requerimientos validados y actualizados a Completado (con evidencia).
2. Requerimientos actualizados a En progreso (qué falta validar).
3. Requerimientos marcados Bloqueado (causa y próximo paso).
4. Cambios aplicados en Gantt (inicio, cierre, dependencias).
5. Riesgos de sobredeclarar avance evitados.

Criterio de éxito:
- Monday board y carta Gantt reflejan únicamente avance real validado.
- Ningún requerimiento aparece como Completado sin evidencia funcional verificable.