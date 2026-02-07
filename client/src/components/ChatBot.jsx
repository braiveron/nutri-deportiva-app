import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { api } from '../services/api';

export default function ChatBot({ userId, dbUserName }) { 
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate(); 

  // Referencias
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null); // 👈 1. Nueva Referencia para el contenedor principal

  // Lógica de Saludo
  const getGreeting = (name) => {
    let cleanName = "Atleta";
    if (name && typeof name === 'string' && !name.includes('{')) {
        cleanName = name.split(' ')[0];
    }
    return `¡Hola ${cleanName}! Soy tu Nutri-Coach 🧑‍⚕️. ¿En qué puedo ayudarte con tu dieta o entreno hoy?`;
  };

  const [messages, setMessages] = useState([
    { role: 'system', content: getGreeting(dbUserName) }
  ]);
  
  // Auto-scroll al fondo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Actualizar nombre si llega tarde
  useEffect(() => {
    if (dbUserName) {
        setMessages(prev => {
            if (prev.length === 1 && prev[0].role === 'system') {
                return [{ role: 'system', content: getGreeting(dbUserName) }];
            }
            return prev;
        });
    }
  }, [dbUserName]);

  // 👇 2. LÓGICA DE "CLICK OUTSIDE" (Cerrar al hacer clic fuera)
  useEffect(() => {
    function handleClickOutside(event) {
      // Si el chat está abierto Y el clic NO fue dentro del contenedor del chat
      if (isOpen && chatContainerRef.current && !chatContainerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    // Agregamos el "escucha" al documento
    document.addEventListener("mousedown", handleClickOutside);
    
    // Limpieza al desmontar
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]); // Se reactiva cada vez que isOpen cambia


  const handleSend = async () => {
    if (!input.trim() || !userId) return;
    const userMessage = input;
    setInput(''); 
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
        const response = await api.sendChatMessage(userId, userMessage);
        if (response.success) {
            setMessages(prev => [...prev, { role: 'system', content: response.reply }]);
        } else {
            setMessages(prev => [...prev, { role: 'system', content: "Tuve un problema de conexión." }]);
        }
    } catch {
        setMessages(prev => [...prev, { role: 'system', content: "Error de red 🔌." }]);
    } finally {
        setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  // Función parseadora de LINKS
  const renderContent = (content) => {
    const linkRegex = /\[\[LINK:(.*?)\]\]/;
    const match = content.match(linkRegex);

    if (match) {
        const route = match[1]; 
        const cleanText = content.replace(linkRegex, '').trim(); 

        return (
            <div className="flex flex-col gap-2">
                <p dangerouslySetInnerHTML={{ __html: cleanText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                <button 
                    onClick={() => {
                        setIsOpen(false); 
                        navigate(route);  
                    }}
                    className="mt-2 bg-sportRed text-white text-xs font-bold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 transition-all flex items-center justify-center gap-2 w-full animate-pulse"
                >
                    IR A LA SECCIÓN {route.replace('/', '').toUpperCase()} 🚀
                </button>
            </div>
        );
    }
    return content.split('\n').map((line, i) => (
        <p key={i} className={i > 0 ? 'mt-2' : ''} dangerouslySetInnerHTML={{ 
            __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
        }} />
    ));
  };

  return (
    // 👇 3. ASIGNAMOS LA REF AL CONTENEDOR PRINCIPAL
    <div 
        ref={chatContainerRef} 
        className="fixed bottom-6 right-6 z-[100] flex flex-col items-end font-sans"
    >
      
      {isOpen && (
        <div className="bg-white w-80 md:w-96 h-[32rem] rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden mb-4 animate-fade-in-up ring-1 ring-black/5">
            
            {/* Cabecera */}
            <div className="bg-sportDark p-4 flex justify-between items-center text-white shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                        <span className="text-2xl">🧑‍⚕️</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-base leading-tight">Nutri-Coach</h3>
                        <span className="text-[11px] text-green-400 flex items-center gap-1.5 font-medium">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                             En línea
                        </span>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>

            {/* Mensajes */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50 space-y-4 scroll-smooth">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-end gap-2'}`}>
                        {msg.role === 'system' && (
                            <div className="w-6 h-6 rounded-full bg-sportDark flex items-center justify-center text-xs shadow-sm shrink-0 mb-1">🧑‍⚕️</div>
                        )}
                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed ${
                            msg.role === 'user' 
                                ? 'bg-sportRed text-white rounded-br-sm' 
                                : 'bg-white border border-gray-100 text-gray-700 rounded-bl-sm'
                        }`}>
                            {msg.role === 'system' ? renderContent(msg.content) : msg.content}
                        </div>
                    </div>
                ))}
                
                {loading && (
                    <div className="flex justify-start items-end gap-2">
                        <div className="w-6 h-6 rounded-full bg-sportDark flex items-center justify-center text-xs shadow-sm shrink-0 mb-1">🧑‍⚕️</div>
                        <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-sm shadow-sm flex gap-1.5 h-12 items-center">
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu duda..."
                    className="flex-1 bg-gray-100 rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sportRed/30"
                />
                <button 
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="absolute right-4 bg-sportRed text-white p-2 rounded-full hover:bg-red-700 disabled:opacity-50 flex items-center justify-center shadow-md"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transform rotate-90 translate-x-[1px]">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                </button>
            </div>
        </div>
      )}

      {/* Botón Flotante */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'bg-gray-800 rotate-90' : 'bg-sportRed'} hover:scale-110 text-white p-4 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center ring-4 ring-white z-[110]`}
      >
        {isOpen ? (
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 transition-transform duration-300 transform -rotate-90">
               <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
             </svg>
        ) : (
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
               <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.678 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
             </svg>
        )}
      </button>

    </div>
  );
}