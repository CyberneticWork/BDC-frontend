import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Mic, MicOff } from "lucide-react";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your HR System assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 🎙️ Initialize voice recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        handleSend(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  // 🧠 Handle sending message
  const handleSend = async (textValue = null) => {
    const messageText = textValue || inputValue;
    if (messageText.trim() === "") return;

    const userMessage = {
      id: messages.length + 1,
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: messageText }),
      });

      const data = await response.json();

      const botResponse = {
        id: messages.length + 2,
        text: data.response || "Sorry, I couldn’t get a reply from the server.",
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);

      // 🗣️ Speak the bot response aloud
      speakText(botResponse.text);
    } catch (error) {
      console.error("Error fetching response:", error);
      const botError = {
        id: messages.length + 2,
        text: "⚠️ There was an issue connecting to the server.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botError]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🗣️ Text-to-speech function
  const speakText = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.pitch = 1;
      utterance.rate = 1;
      utterance.volume = 1;
      window.speechSynthesis.cancel(); // stop previous speech
      window.speechSynthesis.speak(utterance);
    }
  };

  // 🎤 Start/stop listening
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chat with System
        </h1>
        <p className="text-gray-600">Ask me anything about the HR system</p>
      </div>

      <div className="flex flex-col h-[500px] border border-gray-200 rounded-xl overflow-hidden">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-4 ${
                message.sender === "bot" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-xs rounded-lg p-3 ${
                  message.sender === "bot"
                    ? "bg-indigo-100 text-gray-800 rounded-tl-none"
                    : "bg-indigo-600 text-white rounded-tr-none"
                }`}
              >
                <div className="flex items-center mb-1">
                  {message.sender === "bot" ? (
                    <Bot className="h-4 w-4 mr-2" />
                  ) : (
                    <User className="h-4 w-4 mr-2" />
                  )}
                  <span className="font-semibold text-sm">
                    {message.sender === "bot" ? "System Assistant" : "You"}
                  </span>
                </div>
                <p className="text-sm">{message.text}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex mb-4 justify-start">
              <div className="max-w-xs rounded-lg p-3 bg-indigo-100 text-gray-800 rounded-tl-none">
                <div className="flex items-center mb-1">
                  <Bot className="h-4 w-4 mr-2" />
                  <span className="font-semibold text-sm">
                    System Assistant
                  </span>
                </div>
                <p className="text-sm italic text-gray-500">Typing...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center">
            <button
              onClick={toggleListening}
              className={`p-2 rounded-l-lg ${
                isListening
                  ? "bg-red-500 text-white"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              } transition-colors duration-200`}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type or speak your message..."
              className="flex-1 border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />

            <button
              onClick={() => handleSend()}
              className="bg-indigo-600 text-white p-2 rounded-r-lg hover:bg-indigo-700 transition-colors duration-200"
              disabled={isLoading}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
