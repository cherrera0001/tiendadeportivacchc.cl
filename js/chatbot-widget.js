(() => {
  const CHAT_WIDGET_CONTAINER = 'chat-widget-container';
  const CHAT_MESSAGES = 'chat-messages';
  const CHAT_INPUT = 'chat-input';
  const CHAT_SEND = 'chat-send-btn';

  let isOpen = false;
  let isLoading = false;

  function crearWidget() {
    if (document.getElementById(CHAT_WIDGET_CONTAINER)) return;

    const html = `
    <div id="${CHAT_WIDGET_CONTAINER}" class="chat-widget">
      <div class="chat-header">
        <h3>Hola 👋</h3>
        <button id="chat-close-btn" class="chat-close-btn">×</button>
      </div>
      <div id="${CHAT_MESSAGES}" class="chat-messages"></div>
      <div class="chat-input-area">
        <input
          id="${CHAT_INPUT}"
          type="text"
          placeholder="Pregunta sobre productos o envíos..."
          maxlength="1000"
        />
        <button id="${CHAT_SEND}" class="chat-send-btn">Enviar</button>
      </div>
    </div>

    <button id="chat-toggle-btn" class="chat-toggle-btn" title="Abrir chat">
      💬
    </button>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    const toggleBtn = document.getElementById('chat-toggle-btn');
    const closeBtn = document.getElementById('chat-close-btn');
    const sendBtn = document.getElementById(CHAT_SEND);
    const inputEl = document.getElementById(CHAT_INPUT);

    toggleBtn.addEventListener('click', () => {
      isOpen = !isOpen;
      const widget = document.getElementById(CHAT_WIDGET_CONTAINER);
      widget.classList.toggle('open', isOpen);
      if (isOpen) inputEl.focus();
    });

    closeBtn.addEventListener('click', () => {
      isOpen = false;
      const widget = document.getElementById(CHAT_WIDGET_CONTAINER);
      widget.classList.remove('open');
    });

    sendBtn.addEventListener('click', () => enviarMensaje(inputEl));
    inputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensaje(inputEl);
      }
    });

    agregarMensajeBienvenida();
  }

  function agregarMensajeBienvenida() {
    const messagesDiv = document.getElementById(CHAT_MESSAGES);
    messagesDiv.innerHTML = `
      <div class="chat-message bot">
        <p>Hola 👋 Soy el asistente de tienda-deportiva CCHC.</p>
        <p>Puedo ayudarte con:</p>
        <ul>
          <li>Búsqueda de productos</li>
          <li>Información de envío y devoluciones</li>
          <li>Métodos de pago</li>
          <li>Recomendaciones de artículos</li>
        </ul>
        <p>¿En qué puedo ayudarte?</p>
      </div>
    `;
  }

  async function enviarMensaje(inputEl) {
    const mensaje = inputEl.value.trim();
    if (!mensaje || isLoading) return;

    const messagesDiv = document.getElementById(CHAT_MESSAGES);

    // Agregar mensaje del usuario
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-message user';
    userDiv.innerHTML = `<p>${escaparHTML(mensaje)}</p>`;
    messagesDiv.appendChild(userDiv);

    inputEl.value = '';
    isLoading = true;
    document.getElementById(CHAT_SEND).disabled = true;

    // Mostrar indicador de escritura
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot typing';
    typingDiv.innerHTML = '<p>Escribiendo...</p>';
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje })
      });

      typingDiv.remove();

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.mensaje || 'Error al procesar tu pregunta');
      }

      const data = await response.json();

      const botDiv = document.createElement('div');
      botDiv.className = 'chat-message bot';
      botDiv.innerHTML = `<p>${escaparHTML(data.mensaje)}</p>`;
      messagesDiv.appendChild(botDiv);
    } catch (err) {
      typingDiv.remove();

      const errorDiv = document.createElement('div');
      errorDiv.className = 'chat-message bot error';
      errorDiv.innerHTML = `<p>❌ ${escaparHTML(err.message)}</p>`;
      messagesDiv.appendChild(errorDiv);
    } finally {
      isLoading = false;
      document.getElementById(CHAT_SEND).disabled = false;
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      inputEl.focus();
    }
  }

  function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', crearWidget);
  } else {
    crearWidget();
  }
})();
