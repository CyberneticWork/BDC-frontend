import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";

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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() === "") return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Simulate bot response after a delay
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: getBotResponse(inputValue),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const getBotResponse = (userInput) => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes("employee") || lowerInput.includes("staff")) {
      return "You can manage employees through the HR Master section. Would you like me to navigate you there?";
    } else if (
      lowerInput.includes("payroll") ||
      lowerInput.includes("salary")
    ) {
      return "For payroll and salary management, check the Salary Process section in HR Master.";
    } else if (lowerInput.includes("leave") || lowerInput.includes("holiday")) {
      return "Leave management is available under Time Attendance in HR Master. You can approve leaves or view the calendar there.";
    } else if (
      lowerInput.includes("performance") ||
      lowerInput.includes("pms")
    ) {
      return "Performance Management System (PMS) features are in the PMS section of the dashboard.";
    } else if (lowerInput.includes("learning") || lowerInput.includes("lms")) {
      return "Learning Management System (LMS) is available in the Learning Management section.";
    } else if (
      lowerInput.includes("accounting") ||
      lowerInput.includes("finance")
    ) {
      return "Accounting features are in the Accounting section. You can manage customers, transactions, and view financial reports there.";
    } else if (lowerInput.includes("help")) {
      return "I can help you navigate the HR System. Try asking about employees, payroll, leave management, performance reviews, or accounting features.";
    } else if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
      return "Hello there! How can I assist you with the HR System today?";
    } else {
      return "I'm here to help you navigate the HR System. For specific assistance, try asking about employees, payroll, leave management, or other features.";
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
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-l-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={handleSend}
              className="bg-indigo-600 text-white p-2 rounded-r-lg hover:bg-indigo-700 transition-colors duration-200"
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
