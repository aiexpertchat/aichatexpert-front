import React, { useState } from "react";
import PricingModal from "./PricingModal";

const UsageModalDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("Free");
  const [interactionsLeft, setInteractionsLeft] = useState(3);

  // Function to open modal with different scenarios
  const openModal = (scenario) => {
    switch (scenario) {
      case "free-limit":
        setCurrentPlan("Free");
        setInteractionsLeft(0);
        break;
      case "low-interactions":
        setCurrentPlan("Pro");
        setInteractionsLeft(22);
        break;
      case "upgrade":
        setCurrentPlan("Free");
        setInteractionsLeft(5);
        break;
      default:
        setCurrentPlan("Free");
        setInteractionsLeft(5);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Pricing Modal Demo</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <button
          onClick={() => openModal("free-limit")}
          className="p-4 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg"
        >
          Free Plan Limit Reached
        </button>

        <button
          onClick={() => openModal("low-interactions")}
          className="p-4 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg"
        >
          Pro Plan (Low Interactions)
        </button>

        <button
          onClick={() => openModal("upgrade")}
          className="p-4 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg"
        >
          Upgrade Options
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Current Settings</h2>
        <p className="mb-1">
          <strong>Plan:</strong> {currentPlan}
        </p>
        <p>
          <strong>Interactions Remaining:</strong> {interactionsLeft}
        </p>

        <div className="mt-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Open Pricing Modal
          </button>
        </div>
      </div>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentPlan={currentPlan}
        interactionsLeft={interactionsLeft}
      />
    </div>
  );
};

export default UsageModalDemo;
