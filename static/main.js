/**
 * Main Chat JS - Material Design Edition
 * Gerencia Socket.io, Scroll Dinâmico e UI
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicialização do Socket.io
    // Conecta automaticamente ao servidor que serve a página
    const socket = io.connect(window.location.protocol + '//' + document.domain + ':' + location.port);
    
    let uid = null;
    let userScrolled = false; // Flag para saber se o usuário subiu o chat manualmente

    // Elementos da DOM
    const messagesDiv = document.getElementById('messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const notificationBanner = document.getElementById('notification-banner');
    const userUidDisplay = document.getElementById('user-uid');

    // --- EVENTOS DO SOCKET ---

    // Ao conectar, recebe o ID único da sessão
    socket.on('connect', () => {
        uid = socket.id;
        userUidDisplay.textContent = uid;
        console.log("Conectado com ID: ", uid);
    });

    // Recebe a cor personalizada do servidor (se o seu backend enviar)
    socket.on('color_assigned', (data) => {
        userUidDisplay.style.color = data.color;
        userUidDisplay.style.fontWeight = 'bold';
    });

    // Recebe novas mensagens (de todos, inclusive as suas)
    socket.on('message_received', (data) => {
        renderMessage(data);
    });

    // --- LÓGICA DE INTERAÇÃO ---

    // Função para enviar mensagem
    const sendMessage = () => {
        const text = messageInput.value.trim();
        
        if (text !== '') {
            // Envia para o servidor
            socket.emit('new_message', { 
                message: text, 
                uid: uid 
            });
            
            // Limpa o input e foca novamente
            messageInput.value = '';
            messageInput.focus();
            
            // Força o scroll para baixo ao enviar
            userScrolled = false;
            notificationBanner.style.display = 'none';
        }
    };

    // Clique no botão
    sendButton.addEventListener('click', sendMessage);

    // Tecla Enter no teclado
    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
            event.preventDefault();
        }
    });

    // Controle de Scroll (detecta se o usuário está lendo mensagens antigas)
    messagesDiv.addEventListener('scroll', () => {
        // Se a distância do fundo for maior que 50px, consideramos que ele "subiu"
        const isAtBottom = messagesDiv.scrollHeight - messagesDiv.scrollTop <= messagesDiv.clientHeight + 50;
        userScrolled = !isAtBottom;

        if (!userScrolled) {
            notificationBanner.style.display = 'none';
        }
    });

    // Clique no banner de "Nova Mensagem" faz scroll até o fim
    notificationBanner.addEventListener('click', () => {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        notificationBanner.style.display = 'none';
        userScrolled = false;
    });

    // --- RENDERIZAÇÃO ---

    /**
     * Cria o HTML da mensagem com as classes do Materialize
     */
    function renderMessage(data) {
        const isMine = (data.uid === uid);
        
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('message-div');
        
        // Aplica classe 'msg-mine' se for minha, 'msg-others' se for de outro
        messageWrapper.classList.add(isMine ? 'msg-mine' : 'msg-others');

        // Estrutura interna da bolha
        messageWrapper.innerHTML = `
            <span class="uid-label" style="color:${data.color || '#9e9e9e'}">
                ${isMine ? 'Você' : 'ID: ' + data.uid.substring(0, 5)}
            </span>
            <div class="text-content">${data.message}</div>
        `;

        messagesDiv.appendChild(messageWrapper);

        // Lógica de Scroll Automático
        if (!userScrolled) {
            // Se o usuário está no fundo, desce automaticamente
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        } else if (!isMine) {
            // Se o usuário está lendo o histórico e chega mensagem de OUTRO, mostra o aviso
            notificationBanner.style.display = 'inline-block';
        }
    }
});
