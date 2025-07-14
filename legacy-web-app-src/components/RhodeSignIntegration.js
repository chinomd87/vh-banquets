import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  FileText,
  Send,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  User,
  Calendar,
  Building,
  DollarSign,
} from "lucide-react";
import api from "../utils/api";
import toast from "react-hot-toast";

const RhodeSignIntegration = ({ contract, onStatusUpdate }) => {
  const [signatureStatus, setSignatureStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitiating, setIsInitiating] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showInitiateForm, setShowInitiateForm] = useState(false);
  const [signatureConfig, setSignatureConfig] = useState({
    signerEmail: contract?.clientEmail || "",
    signerName: contract?.clientName || "",
    returnUrl: "",
    customMessage: "",
  });

  const loadSignatureStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get(
        `/rhodesign/signature-status/${contract.id}`
      );
      setSignatureStatus(response.data);

      if (onStatusUpdate) {
        onStatusUpdate(response.data);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Error loading signature status:", error);
        toast.error("Failed to load signature status");
      }
    } finally {
      setIsLoading(false);
    }
  }, [contract.id, onStatusUpdate]);

  useEffect(() => {
    if (contract?.id) {
      loadSignatureStatus();
    }
  }, [contract?.id, loadSignatureStatus]);

  const initiateSignature = async () => {
    try {
      setIsInitiating(true);

      const response = await api.post("/rhodesign/initiate-signature", {
        contractId: contract.id,
        contractTitle: `${contract.title || "Event Contract"} - VH Banquets`,
        contractContent: generateContractContent(contract),
        signerEmail: signatureConfig.signerEmail,
        signerName: signatureConfig.signerName,
        eventDetails: {
          eventName: contract.title || contract.eventName,
          eventDate: contract.date || contract.eventDate,
          venue: contract.venue || "VH Banquets",
          guestCount: contract.guestCount,
          totalAmount: contract.totalCost || contract.totalAmount,
        },
        returnUrl:
          signatureConfig.returnUrl || `${window.location.origin}/#/contracts`,
        callbackUrl: `${process.env.REACT_APP_API_URL}/api/rhodesign/webhook`,
      });

      setSignatureStatus(response.data);
      setShowInitiateForm(false);

      toast.success("Signature process initiated successfully!");

      if (onStatusUpdate) {
        onStatusUpdate(response.data);
      }
    } catch (error) {
      console.error("Error initiating signature:", error);
      toast.error(
        error.response?.data?.error || "Failed to initiate signature process"
      );
    } finally {
      setIsInitiating(false);
    }
  };

  const resendSignature = async () => {
    try {
      setIsResending(true);

      await api.post("/rhodesign/resend-signature", {
        contractId: contract.id,
      });

      toast.success("Signature request resent successfully!");
      await loadSignatureStatus();
    } catch (error) {
      console.error("Error resending signature:", error);
      toast.error(
        error.response?.data?.error || "Failed to resend signature request"
      );
    } finally {
      setIsResending(false);
    }
  };

  const generateContractContent = (contractData) => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #1f2937; margin-bottom: 10px;">VH BANQUETS EVENT CONTRACT</h1>
        <p style="color: #6b7280;">Professional Event Planning & Catering Services</p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Event Details</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
          <div>
            <p><strong>Event Name:</strong> ${
              contractData.title || contractData.eventName || "TBD"
            }</p>
            <p><strong>Event Date:</strong> ${
              contractData.date || contractData.eventDate || "TBD"
            }</p>
            <p><strong>Event Time:</strong> ${
              contractData.time || contractData.eventTime || "TBD"
            }</p>
          </div>
          <div>
            <p><strong>Venue:</strong> ${
              contractData.venue || "VH Banquets"
            }</p>
            <p><strong>Guest Count:</strong> ${
              contractData.guestCount || "TBD"
            }</p>
            <p><strong>Event Type:</strong> ${
              contractData.eventType || "Special Event"
            }</p>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Client Information</h2>
        <div style="margin-top: 20px;">
          <p><strong>Client Name:</strong> ${
            contractData.clientName || "TBD"
          }</p>
          <p><strong>Email:</strong> ${contractData.clientEmail || "TBD"}</p>
          <p><strong>Phone:</strong> ${contractData.clientPhone || "TBD"}</p>
          <p><strong>Company:</strong> ${
            contractData.clientCompany || "N/A"
          }</p>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Financial Details</h2>
        <div style="margin-top: 20px;">
          <p><strong>Total Amount:</strong> $${
            contractData.totalCost || contractData.totalAmount || "0.00"
          }</p>
          <p><strong>Deposit Required:</strong> $${
            contractData.depositAmount || contractData.totalCost * 0.5 || "0.00"
          }</p>
          <p><strong>Balance Due:</strong> $${
            contractData.totalCost -
              (contractData.depositAmount || contractData.totalCost * 0.5) ||
            "0.00"
          }</p>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Terms & Conditions</h2>
        <div style="margin-top: 20px; line-height: 1.6;">
          <p>By signing this contract, both parties agree to the following terms:</p>
          <ul style="margin-top: 10px; padding-left: 20px;">
            <li>Full payment is due 30 days prior to the event date</li>
            <li>Cancellations must be made at least 14 days in advance</li>
            <li>Menu changes must be finalized 7 days before the event</li>
            <li>VH Banquets will provide all agreed-upon services as outlined</li>
            <li>Client is responsible for any damages to the venue or equipment</li>
          </ul>
        </div>
      </div>

      <div style="margin-top: 50px; border-top: 2px solid #e5e7eb; padding-top: 30px;">
        <p style="color: #6b7280; font-style: italic;">
          This contract is digitally signed and legally binding. 
          Generated on ${new Date().toLocaleDateString()} by VH Banquets Event Management System.
        </p>
      </div>
    </div>
    `;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "INITIATED":
      case "PENDING_SIGNATURE":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "SIGNED":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "SIGNATURE_FAILED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "EXPIRED":
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "INITIATED":
        return "Signature Initiated";
      case "PENDING_SIGNATURE":
        return "Awaiting Signature";
      case "SIGNED":
        return "Successfully Signed";
      case "SIGNATURE_FAILED":
        return "Signature Failed";
      case "EXPIRED":
        return "Signature Expired";
      default:
        return "No Signature Request";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "INITIATED":
      case "PENDING_SIGNATURE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "SIGNED":
        return "bg-green-100 text-green-800 border-green-200";
      case "SIGNATURE_FAILED":
        return "bg-red-100 text-red-800 border-red-200";
      case "EXPIRED":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">
            Loading signature status...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-indigo-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Digital Signature - RhodeSign Integration
              </h3>
              <p className="text-sm text-gray-600">
                Secure contract signing powered by RhodeSign
              </p>
            </div>
          </div>
          <button
            onClick={loadSignatureStatus}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            title="Refresh Status"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Current Status */}
        {signatureStatus && (
          <div className="mb-6">
            <div
              className={`inline-flex items-center px-3 py-2 rounded-full border ${getStatusColor(
                signatureStatus.status
              )}`}
            >
              {getStatusIcon(signatureStatus.status)}
              <span className="ml-2 text-sm font-medium">
                {getStatusText(signatureStatus.status)}
              </span>
            </div>

            {signatureStatus.lastUpdated && (
              <p className="text-sm text-gray-500 mt-2">
                Last updated:{" "}
                {new Date(signatureStatus.lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Contract Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <User className="w-4 h-4 text-gray-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Client</p>
              <p className="text-sm font-medium">
                {contract.clientName || "TBD"}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Event Date</p>
              <p className="text-sm font-medium">
                {contract.date || contract.eventDate || "TBD"}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <Building className="w-4 h-4 text-gray-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Venue</p>
              <p className="text-sm font-medium">
                {contract.venue || "VH Banquets"}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="text-sm font-medium">
                ${contract.totalCost || contract.totalAmount || "0.00"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {!signatureStatus && (
            <div>
              <button
                onClick={() => setShowInitiateForm(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Initiate Digital Signature
              </button>
            </div>
          )}

          {signatureStatus &&
            signatureStatus.status === "PENDING_SIGNATURE" && (
              <div className="flex flex-wrap gap-3">
                <a
                  href={signatureStatus.rhodeSignUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in RhodeSign
                </a>
                <button
                  onClick={resendSignature}
                  disabled={isResending}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isResending ? "Resending..." : "Resend Request"}
                </button>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(signatureStatus.rhodeSignUrl)
                  }
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Copy Link
                </button>
              </div>
            )}

          {signatureStatus && signatureStatus.status === "SIGNED" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <div>
                  <h4 className="text-green-800 font-medium">
                    Contract Successfully Signed
                  </h4>
                  <p className="text-green-600 text-sm">
                    Signed by {signatureStatus.signer?.email} on{" "}
                    {signatureStatus.signedAt &&
                      new Date(signatureStatus.signedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {signatureStatus.signedDocument && (
                <div className="mt-3">
                  <a
                    href={signatureStatus.signedDocument}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:text-green-900 underline text-sm"
                  >
                    Download Signed Contract
                  </a>
                </div>
              )}
            </div>
          )}

          {signatureStatus && signatureStatus.status === "SIGNATURE_FAILED" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="w-6 h-6 text-red-500 mr-3" />
                <div>
                  <h4 className="text-red-800 font-medium">Signature Failed</h4>
                  <p className="text-red-600 text-sm">
                    {signatureStatus.failureReason ||
                      "Unknown error occurred during signing"}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setShowInitiateForm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Initiate Signature Form Modal */}
      {showInitiateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Initiate Digital Signature
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="signerEmail"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Signer Email *
                </label>
                <input
                  id="signerEmail"
                  type="email"
                  value={signatureConfig.signerEmail}
                  onChange={(e) =>
                    setSignatureConfig((prev) => ({
                      ...prev,
                      signerEmail: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="client@example.com"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="signerName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Signer Name *
                </label>
                <input
                  id="signerName"
                  type="text"
                  value={signatureConfig.signerName}
                  onChange={(e) =>
                    setSignatureConfig((prev) => ({
                      ...prev,
                      signerName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="returnUrl"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Return URL (after signing)
                </label>
                <input
                  id="returnUrl"
                  type="url"
                  value={signatureConfig.returnUrl}
                  onChange={(e) =>
                    setSignatureConfig((prev) => ({
                      ...prev,
                      returnUrl: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://vhbanquets.com/#/contracts"
                />
              </div>

              <div>
                <label
                  htmlFor="customMessage"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Custom Message (optional)
                </label>
                <textarea
                  id="customMessage"
                  value={signatureConfig.customMessage}
                  onChange={(e) =>
                    setSignatureConfig((prev) => ({
                      ...prev,
                      customMessage: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                  placeholder="Please review and sign your event contract..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowInitiateForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={initiateSignature}
                disabled={
                  isInitiating ||
                  !signatureConfig.signerEmail ||
                  !signatureConfig.signerName
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInitiating ? "Initiating..." : "Send for Signature"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

RhodeSignIntegration.propTypes = {
  contract: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    eventName: PropTypes.string,
    clientName: PropTypes.string,
    clientEmail: PropTypes.string,
    clientPhone: PropTypes.string,
    clientCompany: PropTypes.string,
    date: PropTypes.string,
    eventDate: PropTypes.string,
    time: PropTypes.string,
    eventTime: PropTypes.string,
    venue: PropTypes.string,
    guestCount: PropTypes.number,
    eventType: PropTypes.string,
    totalCost: PropTypes.number,
    totalAmount: PropTypes.number,
    depositAmount: PropTypes.number,
  }).isRequired,
  onStatusUpdate: PropTypes.func,
};

export default RhodeSignIntegration;
