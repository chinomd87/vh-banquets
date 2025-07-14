import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  CreditCard,
  Lock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// Shift4 Payment Integration Component
function Shift4PaymentComponent({
  amount,
  eventId,
  eventName,
  clientEmail,
  onPaymentSuccess,
  onPaymentError,
  isTestMode = true,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [shift4Loaded, setShift4Loaded] = useState(false);

  // Shift4 Configuration
  const shift4Config = {
    publicKey: isTestMode
      ? "pu_test_WVMFC9GFuvm54b0uorifKkCh" // Test key from docs
      : process.env.REACT_APP_SHIFT4_PUBLIC_KEY, // Your production key
    apiUrl: isTestMode
      ? "https://api.sandbox.shift4.com/charges"
      : "https://api.shift4.com/charges",
  };

  const initializeShift4 = useCallback(() => {
    if (window.Shift4Checkout) {
      window.Shift4Checkout.key = shift4Config.publicKey;

      window.Shift4Checkout.success = (result) => {
        console.log("Shift4 Payment Success:", result);
        setPaymentStatus("success");
        setIsLoading(false);

        // Handle successful payment
        const paymentData = {
          id: `shift4_${Date.now()}`,
          chargeId: result.chargeId,
          amount: amount,
          description: `VH Banquets - ${eventName}`,
          email: result.email || clientEmail,
          date: new Date().toISOString(),
          method: "credit_card",
          status: "completed",
        };

        onPaymentSuccess(paymentData);
      };

      window.Shift4Checkout.error = (errorMessage) => {
        console.error("Shift4 Payment Error:", errorMessage);
        setPaymentStatus("error");
        setIsLoading(false);
        onPaymentError(errorMessage);
      };
    }
  }, [shift4Config.publicKey, amount, eventName, clientEmail, onPaymentSuccess, onPaymentError]);

  const openShift4Checkout = async () => {
    if (!shift4Loaded || !window.Shift4Checkout) {
      alert("Payment system is loading. Please try again in a moment.");
      return;
    }

    setIsLoading(true);
    setPaymentStatus(null);

    try {
      // Create checkout request (this would normally be done on your backend)
      const checkoutRequest = await createCheckoutRequest();

      window.Shift4Checkout.open({
        checkoutRequest: checkoutRequest,
        name: "VH Banquets",
        description: `Payment for ${eventName}`,
        amount: Math.round(amount * 100), // Convert to cents
        currency: "USD",
        email: clientEmail,
        billingAddress: true,
        shippingAddress: false,
      });
    } catch (error) {
      console.error("Error opening Shift4 checkout:", error);
      setPaymentStatus("error");
      setIsLoading(false);
      onPaymentError("Failed to open payment form. Please try again.");
    }
  };

  // This should be implemented on your backend for security
  const createCheckoutRequest = async () => {
    // For demo purposes, using a mock request
    // In production, this should call your backend API
    const mockRequest = {
      charge: {
        amount: Math.round(amount * 100), // Amount in cents
        currency: "USD",
        description: `VH Banquets - ${eventName}`,
        metadata: {
          eventId: eventId,
          eventName: eventName,
          clientEmail: clientEmail,
        },
      },
    };

    // This would be your backend endpoint that creates and signs the request
    // For now, returning a mock signed request (this won't work in real implementation)
    return btoa(JSON.stringify(mockRequest));
  };

  // Load Shift4 Checkout script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://dev.shift4.com/checkout.js";
    script.onload = () => {
      setShift4Loaded(true);
      initializeShift4();
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [initializeShift4]);

  const renderPaymentStatus = () => {
    if (paymentStatus === "success") {
      return (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle size={20} />
          <span>Payment processed successfully!</span>
        </div>
      );
    }

    if (paymentStatus === "error") {
      return (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle size={20} />
          <span>Payment failed. Please try again.</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Lock className="text-green-600" size={20} />
          <span className="text-sm text-gray-600">Secure Payment</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800">VH Banquets Payment</h3>
        <p className="text-gray-600">{eventName}</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Total Amount:</span>
          <span className="text-2xl font-bold text-gray-800">
            ${amount.toFixed(2)}
          </span>
        </div>
      </div>

      {renderPaymentStatus()}

      <button
        onClick={openShift4Checkout}
        disabled={isLoading || !shift4Loaded || paymentStatus === "success"}
        className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Processing...
          </>
        ) : (
          <>
            <CreditCard size={20} />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </button>

      {isTestMode && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Test Mode:</strong> Use card number 4242 4242 4242 4242 with
            any valid expiry and CVC.
          </p>
        </div>
      )}

      <div className="mt-4 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Lock size={12} />
          <span>Secured by Shift4 Payments</span>
        </div>
      </div>
    </div>
  );
}

Shift4PaymentComponent.propTypes = {
  amount: PropTypes.number.isRequired,
  eventId: PropTypes.string.isRequired,
  eventName: PropTypes.string.isRequired,
  clientEmail: PropTypes.string.isRequired,
  onPaymentSuccess: PropTypes.func.isRequired,
  onPaymentError: PropTypes.func.isRequired,
  isTestMode: PropTypes.bool,
};
export default Shift4PaymentComponent;
