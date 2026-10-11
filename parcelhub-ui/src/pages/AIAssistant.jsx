import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./AIAssistant.css";

function AIAssistant() {
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    const name =
        localStorage.getItem("name") || "Customer";

    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: "ai",
            text: `Hi ${name.split(" ")[0]}! 👋 I'm ParcelHub AI. I can help you understand your shipments, tracking status, delivery process, and parcel information.`,
            time: getCurrentTime()
        }
    ]);

    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);

    /*
     * Scroll to the latest message whenever
     * a new message or typing indicator appears.
     */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages, typing]);

    function getCurrentTime() {
        return new Date().toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }

    /*
     * Send message to Spring Boot.
     *
     * Endpoint:
     * POST /api/ai/chat
     *
     * Axios automatically adds the JWT token
     * through services/api.js.
     */
    const sendMessage = async (
        customMessage = null
    ) => {
        const message =
            customMessage ?? input.trim();

        if (!message || typing) {
            return;
        }

        const userMessage = {
            id: Date.now(),
            sender: "user",
            text: message,
            time: getCurrentTime()
        };

        setMessages((currentMessages) => [
            ...currentMessages,
            userMessage
        ]);

        setInput("");
        setTyping(true);

        try {
            const response = await API.post(
                "/ai/chat",
                {
                    message: message
                }
            );

            let responseText;

            if (
                typeof response.data ===
                "string"
            ) {
                responseText =
                    response.data;
            } else if (
                response.data?.response
            ) {
                responseText =
                    response.data.response;
            } else if (
                response.data?.message
            ) {
                responseText =
                    response.data.message;
            } else {
                responseText =
                    "I couldn't generate a response right now.";
            }

            /*
             * Small delay so the typing animation
             * feels natural even when the backend
             * responds very quickly.
             */
            await new Promise((resolve) =>
                setTimeout(resolve, 500)
            );

            const aiMessage = {
                id: Date.now() + 1,
                sender: "ai",
                text: responseText,
                time: getCurrentTime()
            };

            setMessages((currentMessages) => [
                ...currentMessages,
                aiMessage
            ]);

        } catch (error) {
            console.error(
                "AI response error:",
                error
            );

            let errorMessage =
                "Sorry, I couldn't connect to ParcelHub AI. Please make sure the Spring Boot server is running.";

            if (error.response?.status === 401) {
                errorMessage =
                    "Your session has expired. Please login again.";
            } else if (
                error.response?.status === 403
            ) {
                errorMessage =
                    "You are not authorized to use ParcelHub AI.";
            } else if (
                error.response?.status === 500
            ) {
                errorMessage =
                    "ParcelHub AI encountered a server error. Please try again.";
            } else if (
                typeof error.response?.data ===
                "string"
            ) {
                errorMessage =
                    error.response.data;
            }

            const errorMessageObject = {
                id: Date.now() + 1,
                sender: "ai",
                text: errorMessage,
                time: getCurrentTime(),
                isError: true
            };

            setMessages((currentMessages) => [
                ...currentMessages,
                errorMessageObject
            ]);

        } finally {
            setTyping(false);
        }
    };

    /*
     * Form submit.
     */
    const handleSubmit = (event) => {
        event.preventDefault();

        sendMessage();
    };

    /*
     * Enter = send
     * Shift + Enter = new line
     */
    const handleKeyDown = (event) => {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();

            if (
                input.trim() &&
                !typing
            ) {
                sendMessage();
            }
        }
    };

    /*
     * Clear conversation.
     */
    const clearChat = () => {
        setMessages([
            {
                id: Date.now(),
                sender: "ai",
                text: `Chat cleared. 👋 How can I help you, ${name.split(" ")[0]}?`,
                time: getCurrentTime()
            }
        ]);
    };

    /*
     * Logout.
     */
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("name");
        localStorage.removeItem("email");
        localStorage.removeItem("role");

        navigate("/login");
    };

    /*
     * Quick questions.
     */
    const quickQuestions = [
        {
            icon: "📦",
            text: "How many parcels do I have?"
        },
        {
            icon: "🚚",
            text: "Where is my parcel?"
        },
        {
            icon: "✅",
            text: "How many parcels are delivered?"
        },
        {
            icon: "📍",
            text: "How does tracking work?"
        }
    ];

    return (
        <div className="ai-page">

            {/* =================================
                TOP NAVIGATION
            ================================= */}

            <header className="ai-topbar">

                <button
                    className="ai-back-button"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    <span className="back-arrow">
                        ←
                    </span>

                    <span>
                        Back to Dashboard
                    </span>
                </button>

                <div className="ai-brand">

                    <div className="ai-brand-icon">
                        ✨
                    </div>

                    <div>
                        <strong>
                            ParcelHub AI
                        </strong>

                        <span>
                            Smart Delivery Assistant
                        </span>
                    </div>

                </div>

                <div className="ai-user-area">

                    <div className="ai-user-avatar">
                        {name
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <span>
                        {name}
                    </span>

                    <button
                        className="ai-logout"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </header>

            {/* =================================
                MAIN CONTENT
            ================================= */}

            <main className="ai-main">

                {/* =================================
                    LEFT AI INFORMATION PANEL
                ================================= */}

                <aside className="ai-info-panel">

                    <div className="ai-hero-icon">
                        ✨
                    </div>

                    <span className="ai-label">
                        PARCELHUB INTELLIGENCE
                    </span>

                    <h1>
                        Your delivery
                        <br />
                        assistant.
                    </h1>

                    <p>
                        Ask questions about your
                        shipments and understand every
                        step of your delivery journey.
                    </p>

                    {/* CAPABILITIES */}

                    <div className="ai-capabilities">

                        <div className="ai-capability">

                            <span>
                                📍
                            </span>

                            <div>

                                <strong>
                                    Shipment Tracking
                                </strong>

                                <small>
                                    Understand your current
                                    parcel status.
                                </small>

                            </div>

                        </div>

                        <div className="ai-capability">

                            <span>
                                🚚
                            </span>

                            <div>

                                <strong>
                                    Delivery Updates
                                </strong>

                                <small>
                                    Learn what each delivery
                                    stage means.
                                </small>

                            </div>

                        </div>

                        <div className="ai-capability">

                            <span>
                                📦
                            </span>

                            <div>

                                <strong>
                                    Parcel Insights
                                </strong>

                                <small>
                                    Get information about
                                    your shipments.
                                </small>

                            </div>

                        </div>

                        <div className="ai-capability">

                            <span>
                                💬
                            </span>

                            <div>

                                <strong>
                                    Smart Assistance
                                </strong>

                                <small>
                                    Ask questions naturally
                                    and get quick answers.
                                </small>

                            </div>

                        </div>

                    </div>

                    {/* AI STATUS */}

                    <div className="ai-powered-card">

                        <div className="ai-powered-icon">
                            ✨
                        </div>

                        <div>

                            <strong>
                                AI Assistant
                            </strong>

                            <span>
                                Context-aware support
                            </span>

                        </div>

                        <div className="ai-online-dot"></div>

                    </div>

                </aside>

                {/* =================================
                    CHAT SECTION
                ================================= */}

                <section className="ai-chat-card">

                    {/* CHAT HEADER */}

                    <div className="ai-chat-header">

                        <div className="ai-chat-profile">

                            <div className="ai-chat-avatar">

                                ✨

                                <span></span>

                            </div>

                            <div>

                                <strong>
                                    ParcelHub AI
                                </strong>

                                <span>
                                    <i></i>
                                    Online
                                </span>

                            </div>

                        </div>

                        <button
                            className="clear-chat-button"
                            onClick={clearChat}
                        >
                            <span>
                                ↻
                            </span>

                            Clear Chat
                        </button>

                    </div>

                    {/* =================================
                        CHAT MESSAGES
                    ================================= */}

                    <div className="ai-messages">

                        <div className="ai-date-divider">
                            <span>
                                TODAY
                            </span>
                        </div>

                        {messages.map(
                            (message) => (

                                <div
                                    key={
                                        message.id
                                    }
                                    className={`chat-message ${
                                        message.sender ===
                                        "user"
                                            ? "user-message"
                                            : "ai-message"
                                    }`}
                                >

                                    {/* AI AVATAR */}

                                    {message.sender ===
                                        "ai" && (
                                        <div className="message-avatar">
                                            ✨
                                        </div>
                                    )}

                                    <div className="message-content">

                                        <div
                                            className={`message-bubble ${
                                                message.isError
                                                    ? "error-message"
                                                    : ""
                                            }`}
                                        >
                                            {message.text}
                                        </div>

                                        <span className="message-time">
                                            {message.time}
                                        </span>

                                    </div>

                                </div>

                            )
                        )}

                        {/* TYPING INDICATOR */}

                        {typing && (
                            <div className="chat-message ai-message">

                                <div className="message-avatar">
                                    ✨
                                </div>

                                <div className="message-content">

                                    <div className="typing-bubble">

                                        <span></span>
                                        <span></span>
                                        <span></span>

                                    </div>

                                    <span className="message-time">
                                        ParcelHub AI is typing...
                                    </span>

                                </div>

                            </div>
                        )}

                        <div
                            ref={messagesEndRef}
                        />

                    </div>

                    {/* =================================
                        QUICK QUESTIONS
                    ================================= */}

                    <div className="quick-questions">

                        <span>
                            QUICK QUESTIONS
                        </span>

                        <div>

                            {quickQuestions.map(
                                (question) => (

                                    <button
                                        key={
                                            question.text
                                        }
                                        onClick={() =>
                                            sendMessage(
                                                question.text
                                            )
                                        }
                                        disabled={
                                            typing
                                        }
                                    >
                                        <span>
                                            {
                                                question.icon
                                            }
                                        </span>

                                        {
                                            question.text
                                        }

                                    </button>

                                )
                            )}

                        </div>

                    </div>

                    {/* =================================
                        MESSAGE INPUT
                    ================================= */}

                    <form
                        className="ai-input-area"
                        onSubmit={
                            handleSubmit
                        }
                    >

                        <div className="ai-input-wrapper">

                            <textarea
                                value={input}
                                onChange={(
                                    event
                                ) =>
                                    setInput(
                                        event.target
                                            .value
                                    )
                                }
                                onKeyDown={
                                    handleKeyDown
                                }
                                placeholder="Ask ParcelHub AI anything about your shipment..."
                                rows="1"
                                disabled={
                                    typing
                                }
                            />

                            <button
                                type="submit"
                                disabled={
                                    !input.trim() ||
                                    typing
                                }
                                className="ai-send-button"
                                aria-label="Send message"
                            >
                                →
                            </button>

                        </div>

                        <span className="ai-input-hint">
                            Press Enter to send ·
                            Shift + Enter for a new
                            line
                        </span>

                    </form>

                </section>

            </main>

        </div>
    );
}

export default AIAssistant;