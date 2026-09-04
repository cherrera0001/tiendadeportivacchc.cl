import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from '../db.js';

let client = null;

function initializeChatbot() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY no configurada. El chatbot no funcionará.');
    return null;
  }

  return new GoogleGenerativeAI(apiKey);
}

async function obtenerContextoProductos() {
  try {
    const productos = await query(`
      SELECT
        p.id,
        p.nombre,
        p.marca,
        c.nombre as categoriaNombre,
        p.descripcion,
        p.precio,
        p.stock
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.activo = true
      LIMIT 50
    `);

    return productos.map(p =>
      `${p.nombre} (${p.marca}, ${p.categoriaNombre}): $${p.precio} CLP, Stock: ${p.stock} | ${p.descripcion}`
    ).join('\n');
  } catch (err) {
    console.error('Error al obtener productos:', err);
    return '';
  }
}

async function obtenerInfoTienda() {
  return `
Información de tienda-deportiva CCHC:
- Tienda: tiendadeportivacchc.cl
- Rubro: Artículos deportivos y outdoor
- Ubicación: Chile
- Horario: Lunes a Domingo, 10:00 a 20:00
- Despacho: $4.990 CLP (gratis sobre $59.990)
- Métodos de pago: Mercado Pago (tarjeta, transferencia, efectivo)
- Devoluciones: 30 días desde la compra
- Garantía: Según fabricante
- Contacto: info@tiendadeportivacchc.cl
- WhatsApp: +56975550000

Categorías disponibles:
- Running
- Fútbol
- Gimnasio
- Ciclismo
- Outdoor
  `.trim();
}

export async function handleChat(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Inicializar cliente al momento de la solicitud
  if (!client) {
    client = initializeChatbot();
  }

  if (!client) {
    return res.status(503).json({
      error: 'chatbot_no_disponible',
      mensaje: 'El chatbot no está configurado. Por favor, contacta a soporte.'
    });
  }

  const { mensaje } = req.body;

  if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length === 0) {
    return res.status(400).json({
      error: 'mensaje_requerido',
      mensaje: 'El mensaje no puede estar vacío'
    });
  }

  if (mensaje.length > 1000) {
    return res.status(400).json({
      error: 'mensaje_muy_largo',
      mensaje: 'El mensaje no puede tener más de 1000 caracteres'
    });
  }

  try {
    const [contextoProductos, infoTienda] = await Promise.all([
      obtenerContextoProductos(),
      obtenerInfoTienda()
    ]);

    const systemPrompt = `Eres un asistente de atención al cliente para tienda-deportiva CCHC, una tienda de artículos deportivos y outdoor en Chile.

${infoTienda}

CATÁLOGO DISPONIBLE:
${contextoProductos || 'No hay información de productos disponible'}

INSTRUCCIONES:
1. Responde en español (ES-CL).
2. Sé amable, conciso y profesional.
3. Si el usuario pregunta por un producto, busca en el catálogo y proporciona detalles (precio, stock, descripción).
4. Si pregunta sobre envíos, devoluciones, garantía o métodos de pago, usa la información de la tienda.
5. Si la pregunta está fuera de tu conocimiento, sugiere contactar a info@tiendadeportivacchc.cl o WhatsApp +56975550000.
6. Nunca inventes información sobre productos o políticas que no conozcas.
7. Sé breve: máximo 3-4 oraciones por respuesta.`;

    const model = client.getGenerativeModel({
      model: 'gemini-1.5-pro',
      systemInstruction: systemPrompt
    });

    const result = await model.generateContent(mensaje);
    const respuesta = result.response.text();

    return res.status(200).json({
      mensaje: respuesta,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error en chatbot:', err.message);

    if (err.message && (err.message.includes('API key') || err.message.includes('401'))) {
      return res.status(401).json({
        error: 'gemini_auth_error',
        mensaje: 'API key de Google Gemini no es válida. Genera una nueva en https://aistudio.google.com/app/apikeys'
      });
    }

    if (err.message && err.message.includes('404')) {
      return res.status(503).json({
        error: 'gemini_model_error',
        mensaje: 'El modelo Gemini no está disponible con tu API key. Verifica que tengas acceso en Google Cloud Console.'
      });
    }

    return res.status(500).json({
      error: 'chat_error',
      mensaje: 'No pudimos procesar tu pregunta. Intenta de nuevo en un momento.'
    });
  }
}
