import React, { useState } from "react";
import Modal from "react-modal";
import axios from "axios";

// Initialize Modal for accessibility
Modal.setAppElement("#root"); // Make sure this matches your root element ID

const PricingModal = ({
  isOpen,
  onClose,
  currentPlan = "Free",
  interactionsLeft = 0,
}) => {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [processing, setProcessing] = useState(false);
  const [showBoost, setShowBoost] = useState(
    interactionsLeft <= 25 &&
      currentPlan !== "Free" &&
      currentPlan !== "Premium"
  );

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      features: [
        "5 free chat interactions",
        "Email required after 5 interactions",
        "5 additional free chat interactions",
        "No memory (resets after each session)",
      ],
      buttonText: "Current Plan",
      isPopular: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: "$9.99",
      period: "/month",
      features: [
        "300 chat interactions per month",
        "Session-based memory",
        "Priority support",
      ],
      buttonText: "Upgrade to Pro",
      isPopular: true,
    },
    {
      id: "pro-plus",
      name: "ProPlus",
      price: "$14.99",
      period: "/month",
      features: [
        "500 chat interactions per month",
        "Session-based memory",
        "Priority support",
      ],
      buttonText: "Upgrade to Pro+",
      isPopular: false,
    },
    {
      id: "premium",
      name: "Premium",
      price: "$34.99",
      period: "/month",
      features: [
        "Unlimited chat interactions",
        "Extended memory",
        "Priority support",
        "Advanced features",
      ],
      buttonText: "Upgrade to Premium",
      isPopular: false,
    },
  ];

  const handleUpgrade = async (plan) => {
    setProcessing(true);

    try {
      // Simulate API call for checkout
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Call your checkout API here using axios
      const response = await axios.post(
        "https://ai-expert-chat-9tckp.ondigitalocean.app/api/checkout",
        { plan: plan.name },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: localStorage.getItem("token"),
          },
        }
      );

      if (response.data?.session?.url) {
        window.location.href = response.data.session.url;
      } else {
        console.error("No checkout URL returned from server.");
      }
      // If successful, close modal and refresh
      onClose();
    } catch (error) {
      console.error("Error processing upgrade:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleBoostPurchase = async () => {
    setProcessing(true);

    try {
      // Call your boost purchase API here using axios
      const response = await axios.post(
        "https://ai-expert-chat-9tckp.ondigitalocean.app/api/checkout",
        { plan: "Pro" },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: localStorage.getItem("token"),
          },
        }
      );

      // If successful, close modal
      onClose();
    } catch (error) {
      console.error("Error processing boost purchase:", error);
    } finally {
      setProcessing(false);
    }
  };

  const customModalStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      maxWidth: "900px",
      width: "90%",
      maxHeight: "90vh",
      borderRadius: "8px",
      padding: "0",
    },
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      zIndex: 1000,
    },
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customModalStyles}
      contentLabel="Upgrade Plan"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Choose Your Plan</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Warning for low interactions */}
        {interactionsLeft <= 25 &&
          currentPlan !== "Free" &&
          currentPlan !== "Premium" && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-amber-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700">
                    <strong>Only {interactionsLeft} interactions left!</strong>{" "}
                    Upgrade your plan or purchase a chat boost to continue.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-lg overflow-hidden ${
                plan.isPopular ? "border-blue-500 shadow-lg" : "border-gray-200"
              } ${currentPlan === plan.name ? "ring-2 ring-blue-500" : ""}`}
            >
              {plan.isPopular && (
                <div className="bg-blue-500 text-white text-center py-1 text-sm font-medium">
                  MOST POPULAR
                </div>
              )}

              <div className="p-5">
                <h3 className="text-xl font-semibold text-gray-800">
                  {plan.name}
                </h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-500">{plan.period}</span>
                  )}
                </div>

                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="h-5 w-5 text-green-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={currentPlan === plan.name || processing}
                    className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      currentPlan === plan.name
                        ? "bg-gray-100 text-gray-600 cursor-default"
                        : plan.isPopular
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {currentPlan === plan.name
                      ? "Current Plan"
                      : `Upgrade to ${plan.name}`}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Boost Option */}
        {showBoost && (
          <div className="border border-blue-200 rounded-lg p-5 bg-blue-50 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Chat Boost
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Need more interactions? Add 100 extra chats to your current
                  plan.
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex items-center">
                <span className="text-xl font-bold text-gray-900 mr-4">
                  $3.99
                </span>
                <button
                  onClick={handleBoostPurchase}
                  disabled={processing}
                  className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {processing ? "Processing..." : "Buy Chat Boost"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-sm text-gray-500">
          All plans include standard customer support and regular updates.
          <br />
          Questions? Contact our{" "}
          <a href="#" className="text-blue-500 hover:text-blue-700">
            support team
          </a>
          .
        </div>
      </div>
    </Modal>
  );
};

export default PricingModal;
