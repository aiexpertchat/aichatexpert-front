import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Modal from "react-modal";
import PricingModal from "./Components/PricingModal";
import UsageDisplay from "./Components/UsageDisplay"; // Import the new component

// Initialize Modal for accessibility
Modal.setAppElement("#root"); // Ensure this matches your root element ID

// Get token from local storage
const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Use authorization in every request explicitly
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    headers: {
      Authorization: token ? `${token}` : "",
      "Content-Type": "application/json",
    },
  };
};

// Set base URL for API requests
const api = axios.create({
  baseURL: "https://ai-expert-chat-9tckp.ondigitalocean.app/api",
  headers: {
    "Content-Type": "application/json",
  },
});

function LandingPage() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [fetchingConversations, setFetchingConversations] = useState(false);

  // User plan state
  const [userPlan, setUserPlan] = useState("Free");
  const [interactionsLeft, setInteractionsLeft] = useState(5);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    type: "info", // info, error, warning, upgrade
    action: null,
    actionLabel: "",
  });

  // Pricing modal state
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Email capture modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ name: "", email: "" });
  const [emailSubmitting, setEmailSubmitting] = useState(false);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Fetch conversations from API on initial render
  useEffect(() => {
    fetchConversations();
  }, []);

  // Function to update interactionsLeft from the UsageDisplay component
  const updateInteractionsLeft = (remaining) => {
    if (remaining !== undefined) {
      setInteractionsLeft(remaining === "Unlimited" ? Infinity : remaining);
    }
  };

  // Function to fetch conversations from API
  const fetchConversations = async () => {
    try {
      setFetchingConversations(true);
      const response = await axios.get(
        "https://ai-expert-chat-9tckp.ondigitalocean.app/api/chat/recent",
        getAuthHeaders()
      );
      if (response.data.chats) {
        // Transform API response to match local format
        const formattedConversations = response.data.chats.map((chat) => ({
          id: chat.id,
          title: chat.title,
          lastUpdated: chat.updatedAt,
          messages: [], // We'll load messages when conversation is selected
        }));
        setConversations(formattedConversations);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      // Fall back to local storage if API fails
      const savedConversations = localStorage.getItem("conversations");
      if (savedConversations) {
        setConversations(JSON.parse(savedConversations));
      }
    } finally {
      setFetchingConversations(false);
    }
  };

  // Handle rate limit exceeded
  const handleRateLimitExceeded = (data) => {
    const { limit, planType, suggestedUpgrade, boostPackage, resetTime } = data;

    let title = "Usage Limit Reached";
    let message = `You've used all ${limit} chat interactions available on your ${planType} plan.`;

    if (resetTime) {
      const resetDate = new Date(resetTime);
      message += ` Your limit will reset on ${resetDate.toLocaleDateString()} at ${resetDate.toLocaleTimeString()}.`;
    }

    if (suggestedUpgrade) {
      message += ` Consider upgrading to ${suggestedUpgrade.plan} for ${suggestedUpgrade.limit} interactions.`;
    }

    // Show pricing modal instead of error modal
    setShowPricingModal(true);
  };

  // Show error modal
  const showErrorModal = (title, message) => {
    setModalContent({
      title,
      message,
      type: "error",
      action: () => setShowModal(false),
      actionLabel: "Close",
    });

    setShowModal(true);
  };

  // Handle email submission for free plan users
  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!emailData.name || !emailData.email) {
      return;
    }

    try {
      setEmailSubmitting(true);

      // Submit email to API
      await axios.post(
        "https://ai-expert-chat-9tckp.ondigitalocean.app/api/auth/capture-email",
        emailData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Close modal
      setShowEmailModal(false);

      // Show success message
      setModalContent({
        title: "Thank You!",
        message: "You now have 5 additional chat interactions.",
        type: "info",
        action: () => setShowModal(false),
        actionLabel: "Continue",
      });

      setShowModal(true);

      // Update interactions count - this will now be handled by UsageDisplay component
      // and will refresh automatically

      // Retry the last message
      if (userInput.trim()) {
        sendMessage();
      }
    } catch (error) {
      console.error("Failed to submit email:", error);

      // Show error message
      setEmailSubmitting(false);

      setModalContent({
        title: "Error",
        message: "Failed to submit your information. Please try again.",
        type: "error",
        action: () => setShowModal(false),
        actionLabel: "Close",
      });

      setShowModal(true);
    } finally {
      setEmailSubmitting(false);
    }
  };

  // Function to create a new conversation
  const createNewConversation = async () => {
    // For UI responsiveness, create a temporary local conversation first
    const tempId = "temp-" + Date.now().toString();
    const newConversation = {
      id: tempId,
      title: "New Conversation",
      messages: [],
      lastUpdated: new Date().toISOString(),
      isTemp: true, // Mark as temporary
    };

    // Update local state
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(tempId);
    setMessages([]);

    // The actual API creation will happen when the first message is sent
  };

  // Function to load a conversation
  const loadConversation = async (conversationId) => {
    // Skip API call for temporary conversations
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation && conversation.isTemp) {
      setMessages(conversation.messages);
      setCurrentConversationId(conversationId);

      // Auto-hide sidebar on mobile after selecting a conversation
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(
        `https://ai-expert-chat-9tckp.ondigitalocean.app/api/chat/${conversationId}`,
        getAuthHeaders()
      );

      if (response.data.chat) {
        // Transform messages from API format
        const formattedMessages = response.data.chat.messages.map((msg) => ({
          role: msg.role === "assistant" ? "ai" : msg.role,
          content: msg.content,
        }));

        setMessages(formattedMessages);
        setCurrentConversationId(conversationId);

        // Auto-hide sidebar on mobile after selecting a conversation
        if (window.innerWidth < 768) {
          setShowSidebar(false);
        }
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
      // Handle 401 unauthorized error
      if (error.response && error.response.status === 401) {
        alert("Please log in to view this conversation.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update the current conversation title based on the first message
  const updateConversationTitle = (msgs) => {
    if (!currentConversationId) return;

    // Find the first user message to use as title
    const firstUserMessage = msgs.find((msg) => msg.role === "user");
    if (!firstUserMessage) return;

    // Limit title length
    let title = firstUserMessage.content;
    if (title.length > 30) {
      title = title.substring(0, 30) + "...";
    }

    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            title,
            messages: msgs,
            lastUpdated: new Date().toISOString(),
          };
        }
        return conv;
      });

      // For temporary conversations, still update localStorage
      if (currentConversationId.startsWith("temp-")) {
        localStorage.setItem("conversations", JSON.stringify(updated));
      }

      return updated;
    });
  };

  // Auto-create new conversation if none is selected and user starts typing
  useEffect(() => {
    if (!currentConversationId && userInput.trim() !== "") {
      createNewConversation();
    }
  }, [userInput, currentConversationId]);

  // Function to send messages

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    // Create new conversation if none is selected
    if (!currentConversationId) {
      createNewConversation();
    }

    // Ensure sidebar is hidden on mobile when sending a message
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }

    await fetchUsageData();
    // Add user message to chat
    const userMsg = userInput.trim();
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);

    // Update conversation in state
    updateConversationTitle(newMessages);

    setUserInput("");
    setIsLoading(true);

    try {
      // Add loading indicator while waiting for response
      setMessages([...newMessages, { role: "ai", isTyping: true }]);

      // Determine if we're creating a new chat or adding to existing one
      if (currentConversationId && currentConversationId.startsWith("temp-")) {
        // New conversation - call create endpoint
        const response = await axios.post(
          "https://ai-expert-chat-9tckp.ondigitalocean.app/api/chat",
          { message: userMsg },
          getAuthHeaders()
        );

        if (response.data.chat) {
          // Update the conversation ID from temporary to real
          const realId = response.data.chat._id;

          setCurrentConversationId(realId);
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === currentConversationId
                ? { ...conv, id: realId, isTemp: false }
                : conv
            )
          );

          if (response.data.chat.messages[1]?.role === "assistant") {
            // Add the AI response directly
            setMessages((prevMessages) => {
              const newMessages = [...prevMessages];
              // Replace the typing indicator with the complete response
              newMessages[newMessages.length - 1] = {
                role: "ai",
                content: response.data.chat.messages[1].content,
              };
              return newMessages;
            });
          }
        }
      } else {
        // Existing conversation - send message to API
        const response = await axios.post(
          `https://ai-expert-chat-9tckp.ondigitalocean.app/api/chat/${currentConversationId}/message`,
          { message: userMsg },
          getAuthHeaders()
        );

        if (response.data.response) {
          // Add the AI response directly
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            // Replace the typing indicator with the complete response
            newMessages[newMessages.length - 1] = {
              role: "ai",
              content: response.data.response,
            };

            // Update conversation in state
            updateConversationTitle(newMessages);

            return newMessages;
          });
        }

        // Update interactions count if provided in response
        if (response.data.interactionsLeft !== undefined) {
          setInteractionsLeft(response.data.interactionsLeft);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Handle specific error responses
      if (error.response) {
        const { status, data } = error.response;

        if (status === 401) {
          // Authentication required
          showErrorModal(
            "Authentication Required",
            "You need to log in to continue."
          );
        } else if (status === 402 && data.requiresAuth) {
          // Email capture required for free plan users
          setShowEmailModal(true);
        } else if (status === 429) {
          // Rate limit exceeded
          handleRateLimitExceeded(data);
        } else {
          // General error
          let errorMessage = "Unable to get response from AI.";
          if (data && data.error) {
            errorMessage = data.error;
          }
          showErrorModal("Error", errorMessage);
        }
      } else {
        // Network or other error
        showErrorModal(
          "Connection Error",
          "Unable to connect to the server. Please check your internet connection."
        );
      }

      // Update messages with error state
      const errorMessages = [
        ...newMessages,
        {
          role: "ai",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ];
      setMessages(errorMessages);
      updateConversationTitle(errorMessages);
    } finally {
      setIsLoading(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  // Auto-adjust textarea height
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  // Handle mobile sidebar visibility
  useEffect(() => {
    const handleResize = () => {
      // Only initialize sidebar visibility based on screen size on first load
      // but don't automatically hide it when in a conversation
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset textarea height when input is cleared
  useEffect(() => {
    if (!userInput && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [userInput]);

  // Function to delete a conversation
  const deleteConversation = async (id, e) => {
    e.stopPropagation();

    // For temporary conversations, just remove from state
    if (id.startsWith("temp-")) {
      setConversations((prev) => prev.filter((conv) => conv.id !== id));

      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
      return;
    }

    try {
      await axios.delete(
        `https://ai-expert-chat-9tckp.ondigitalocean.app/api/chat/${id}`,
        getAuthHeaders()
      );

      setConversations((prev) => prev.filter((conv) => conv.id !== id));

      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      alert("Failed to delete conversation. Please try again.");
    }
  };

  // Toggle sidebar function
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [usageData, setUsageData] = useState({
    planType: "Free",
    currentUsage: 0,
    limit: 5,
    remaining: 5,
    resetTime: null,
    boostCredits: 0,
    loading: true,
    error: null,
  });

  const fetchUsageData = async () => {
    try {
      setUsageData((prev) => ({ ...prev, loading: true, error: null }));

      // Use the new endpoint we created to fetch rate limit info
      const response = await axios.get(
        "https://ai-expert-chat-9tckp.ondigitalocean.app/api/v1/auth/rate-limit-info",
        getAuthHeaders()
      );

      if (response.data && response.data.success) {
        const data = response.data;

        setUsageData({
          planType: data.planType || "Free",
          currentUsage: data.currentUsage || 0,
          limit: data.limit || 5,
          remaining: data.remaining || 0,
          resetTime: data.resetTime ? new Date(data.resetTime) : null,
          boostCredits: data.boostCredits || 0,
          windowDuration: data.windowDuration || "24 hours",
          loading: false,
          error: null,
        });

        // If fetchInteractionsLeft callback is provided, update parent component
      }
    } catch (error) {
      console.error("Failed to fetch usage data:", error);

      // Fall back to default values on error
      setUsageData((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to fetch usage data",
      }));
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      {/* Sidebar for conversations */}
      <div
        className={`${
          showSidebar ? "h-60 md:h-auto md:w-80" : "h-0 md:w-0"
        } bg-white border-} bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden w-full md:flex-shrink-0`}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-medium text-gray-800">Conversations</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={createNewConversation}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              aria-label="New conversation"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
            </button>
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-500 rounded-full hover:bg-gray-100 md:hidden"
              aria-label="Hide sidebar"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {fetchingConversations ? (
            <div className="p-4 flex justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 italic">
              No conversations yet
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {conversations.map((conv) => (
                <li
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`p-3 hover:bg-gray-100 cursor-pointer transition-colors ${
                    currentConversationId === conv.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(conv.lastUpdated)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="ml-2 text-gray-400 hover:text-red-500"
                      aria-label="Delete conversation"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* User Plan Info - Replaced with our new UsageDisplay component */}
        <UsageDisplay
          onShowPricingModal={() => setShowPricingModal(true)}
          fetchInteractionsLeft={updateInteractionsLeft}
          fetchUsageData={fetchUsageData}
          usageData={usageData}
          setUsageData={setUsageData}
        />
        <button
          className="my-2 px-4 py-2 font-bold text-xs "
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/auth";
          }}
        >
          LogOut
        </button>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-gray-200 py-3 px-4 bg-white shadow-sm flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-1 mr-3 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded"
            aria-label="Toggle sidebar"
          >
            {showSidebar ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            )}
          </button>
          <h1 className="text-xl font-medium text-gray-800 flex-1 text-center pr-6 truncate">
            {currentConversationId
              ? conversations.find((c) => c.id === currentConversationId)
                  ?.title || "Chat with Expert AI"
              : "What do you want to ask the Expert AI?"}
          </h1>

          {/* Add upgrade button in header for better visibility */}
          <div className="ml-auto flex items-center space-x-2">
            {userPlan !== "Premium" && usageData.remaining !== Infinity && (
              <>
                <span className="hidden md:inline text-sm text-gray-500">
                  {usageData.remaining} chats left
                </span>
                <button
                  onClick={() => setShowPricingModal(true)}
                  className="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                >
                  Upgrade
                </button>
              </>
            )}
          </div>
        </header>

        {/* Chat container */}
        <div className="flex-1 overflow-hidden flex flex-col max-w-5xl w-full mx-auto">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3 max-w-md">
                  <h2 className="text-lg font-medium text-gray-800">
                    How can I help you today?
                  </h2>
                  <p className="text-gray-600">
                    Ask me anything about your data, tasks, or questions
                  </p>

                  {/* Add upgrade banner for free users */}
                  {usageData.planType === "Free" && (
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 mb-2">
                        <span className="font-semibold">
                          {usageData?.planType} Plan:
                        </span>{" "}
                        You have {usageData.remaining} chats remaining.
                      </p>
                      <button
                        onClick={() => setShowPricingModal(true)}
                        className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                      >
                        Upgrade for more features
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-none"
                      }`}
                    >
                      {/* For regular messages */}
                      {!msg.isTyping && msg.content}

                      {/* For typing indicator - only show when loading */}
                      {msg.isTyping && (
                        <div className="flex items-center space-x-1.5">
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 bg-white p-3 md:p-4">
            <div className="max-w-4xl mx-auto">
              {/* Show upgrade banner when user is low on chats */}
              {usageData.remaining <= 10 &&
                userPlan !== "Premium" &&
                usageData.remaining > 0 && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
                    <p className="text-sm text-amber-800">
                      <svg
                        className="inline-block w-4 h-4 mr-1 mb-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Only{" "}
                      <span className="font-bold">
                        {usageData.remaining} chat interactions
                      </span>{" "}
                      remaining on your {userPlan} plan.
                    </p>
                    <button
                      onClick={() => setShowPricingModal(true)}
                      className="text-xs bg-amber-700 text-white px-3 py-1 rounded hover:bg-amber-800 transition-colors"
                    >
                      Upgrade Now
                    </button>
                  </div>
                )}

              <div className="relative rounded-xl border border-gray-300 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <textarea
                  ref={textareaRef}
                  className="w-full py-3 px-4 md:py-4 md:px-5 pr-14 resize-none focus:outline-none text-gray-700 max-h-[180px] min-h-[52px] rounded-xl"
                  placeholder="Type your question here..."
                  value={userInput}
                  onChange={(e) => {
                    setUserInput(e.target.value);
                    adjustTextareaHeight();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={isLoading}
                  rows="1"
                />
                <button
                  onClick={sendMessage}
                  disabled={!userInput.trim() || isLoading}
                  className={`absolute right-3 bottom-3 rounded-full p-2 transition-colors ${
                    userInput.trim() && !isLoading
                      ? "text-white bg-blue-500 hover:bg-blue-600"
                      : "text-gray-300 bg-gray-100 cursor-not-allowed"
                  }`}
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      ></path>
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Press Enter to send, Shift+Enter for a new line
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Informational Modal */}
      <Modal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        contentLabel={modalContent.title}
        className="mx-auto mt-20 p-6 bg-white rounded-lg shadow-xl max-w-md"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              {modalContent.title}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>

          {/* Icon based on type */}
          <div className="flex justify-center">
            {modalContent.type === "error" && (
              <div className="p-3 bg-red-100 text-red-500 rounded-full">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
            )}
            {modalContent.type === "info" && (
              <div className="p-3 bg-blue-100 text-blue-500 rounded-full">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
            )}
            {modalContent.type === "upgrade" && (
              <div className="p-3 bg-purple-100 text-purple-500 rounded-full">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  ></path>
                </svg>
              </div>
            )}
          </div>

          <p className="text-gray-600">{modalContent.message}</p>

          <div className="flex justify-end pt-2">
            {modalContent.action && (
              <button
                onClick={modalContent.action}
                className={`px-4 py-2 rounded font-medium ${
                  modalContent.type === "error"
                    ? "bg-red-500 text-white"
                    : modalContent.type === "upgrade"
                    ? "bg-purple-500 text-white"
                    : "bg-blue-500 text-white"
                }`}
              >
                {modalContent.actionLabel}
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Email Capture Modal */}
      <Modal
        isOpen={showEmailModal}
        onRequestClose={() => !emailSubmitting && setShowEmailModal(false)}
        contentLabel="Continue with Free Plan"
        className="mx-auto mt-20 p-6 bg-white rounded-lg shadow-xl max-w-md"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              Continue with Free Plan
            </h2>
            {!emailSubmitting && (
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            )}
          </div>

          <p className="text-gray-600">
            You've used your 5 free chats. Please provide your name and email to
            continue with 5 additional free interactions.
          </p>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                value={emailData.name}
                onChange={(e) =>
                  setEmailData({ ...emailData, name: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={emailSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={emailData.email}
                onChange={(e) =>
                  setEmailData({ ...emailData, email: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={emailSubmitting}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={emailSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded font-medium flex items-center"
              >
                {emailSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Add the Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        currentPlan={userPlan}
        interactionsLeft={usageData.remaining}
      />
    </div>
  );
}

export default LandingPage;
