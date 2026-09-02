# Prompt único: ejecución completa de pendientes urgentes

Actúa como agente de implementación y QA funcional para este repositorio, con foco estricto en los 4 requerimientos urgentes y con trazabilidad documental obligatoria. Tu objetivo es revisar en detalle, construir lo que falte y dejar evidencia verificable.

Contexto obligatorio:
- Lee primero CLAUDE.md, luego spec.md, luego data.md, y finalmente docs/arquitectura-datos.md.
- Respeta el orden de módulos y el stack definido.
- No inventes tablas, motores o eventos fuera de lo documentado.
- Mantén UI y commits en español.

Requerimientos urgentes a cubrir funcionalmente:
1) Registro de correos para base de clientes/suscriptores.
2) Mostrar productos, fotos, detalle, precio y cantidad (stock desde backend).
3) Contador de visualizaciones de ingreso a la página.
4) Integración de pasarela de pago con Mercado Pago.

Reglas de ejecución:
- No asumas que está terminado: audita código, endpoints, validaciones y flujo UI para cada requerimiento.
- Si algo ya está completo, no lo reescribas; solo corrige brechas y documenta evidencia.
- Si algo está parcial o roto, impleméntalo end-to-end (front + API + datos) sin romper contratos existentes.
- Todo cambio de datos/contrato debe reflejarse en data.md antes de cerrar.
- Todo ajuste de alcance/DoD/trazabilidad debe reflejarse en spec.md.
- Toda regla operativa o restricción de trabajo para agentes debe reflejarse en CLAUDE.md.

Entregables obligatorios en esta misma ejecución:
A) Auditoría detallada por requerimiento
- Estado actual: completo, parcial o no implementado.
- Evidencia técnica: archivos, endpoints, tablas, validaciones, riesgos.
- Brechas concretas detectadas.

B) Implementación de brechas
- Aplica cambios mínimos necesarios para cerrar cada brecha.
- Mantén compatibilidad con arquitectura actual.
- Asegura que el backend sea fuente de verdad para precio y stock.

C) Pruebas funcionales ejecutadas
- Ejecuta pruebas por requerimiento con comandos reales (curl o equivalente) y resultado esperado vs obtenido.
- Incluye casos felices y al menos un caso de error por requerimiento.
- Para pagos: cubrir flujo de checkout y confirmación (webhook o simulación permitida en local).
- Verifica idempotencia de confirmación de pago cuando corresponda.

D) Actualización documental obligatoria
- spec.md: agrega o ajusta trazabilidad de estos 4 urgentes con módulo, DoD y criterio de aceptación verificable.
- data.md: agrega o ajusta contratos, campos, eventos y reglas de datos usados por los 4 urgentes.
- CLAUDE.md: agrega una sección breve llamada Prioridad operativa urgente con el foco en estos 4 requerimientos y la exigencia de prueba funcional antes de marcar completado.

E) Resumen de cierre
- Lista de archivos modificados.
- Lista de pruebas ejecutadas y su resultado.
- Riesgos remanentes y próximos pasos recomendados.

Formato de salida requerido:
1. Diagnóstico por requerimiento (1 a 4).
2. Cambios implementados.
3. Pruebas funcionales y evidencia.
4. Cambios en documentación (spec.md, data.md, CLAUDE.md).
5. Estado final por requerimiento: completado o pendiente con bloqueo explícito.

Criterio de éxito:
- Los 4 requerimientos quedan funcionales y probados, o bien cada pendiente queda bloqueado con causa verificable y acción concreta.
- spec.md, data.md y CLAUDE.md quedan actualizados y coherentes entre sí.
- No se cierran tareas sin evidencia funcional.