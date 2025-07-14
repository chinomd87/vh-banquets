import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import SignatureCanvas from "react-signature-canvas";
import toast from "react-hot-toast";
import {
  FileText,
  PenTool,
  Check,
  X,
  Clock,
  Shield,
  AlertTriangle,
  Download,
  Eye,
} from "lucide-react";

const ESignaturePage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const sigPadRef = useRef();

  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureData, setSignatureData] = useState("");
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const [error, setError] = useState(null);

  const getExpiryTextColor = (expired, hours) => {
    if (expired) return "text-red-600";
    if (hours < 2) return "text-orange-600";
    return "text-gray-900";
  };

  useEffect(() => {
    const loadSigningSession = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/signatures/session/${sessionId}`);
        setSession(response.data.session);
      } catch (error) {
        console.error("Failed to load signing session:", error);

        if (error.response?.status === 404) {
          setError("Signing session not found or has expired.");
        } else if (error.response?.status === 410) {
          setError(
            "This signing session has expired. Please request a new signing link."
          );
        } else {
          setError("Failed to load contract for signing. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      loadSigningSession();
    }
  }, [sessionId]);

  const clearSignature = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
      setSignatureData("");
    }
  };

  const saveSignature = () => {
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      const dataUrl = sigPadRef.current.toDataURL();
      setSignatureData(dataUrl);
      return true;
    }
    return false;
  };

  const handleSignContract = async () => {
    // Validation
    if (!agreementChecked) {
      toast.error("Please confirm that you agree to the contract terms");
      return;
    }

    if (!identityConfirmed) {
      toast.error("Please confirm your identity");
      return;
    }

    if (!saveSignature()) {
      toast.error("Please provide your signature");
      return;
    }

    try {
      setIsSigning(true);

      const response = await api.post(`/signatures/complete/${sessionId}`, {
        signatureData,
      });

      toast.success("Contract signed successfully!");

      // Redirect to success page or show success message
      setTimeout(() => {
        navigate("/signature-complete", {
          state: {
            signatureId: response.data.signature.id,
            contractId: response.data.signature.contractId,
          },
        });
      }, 2000);
    } catch (error) {
      console.error("Signature completion failed:", error);

      if (error.response?.status === 404) {
        toast.error("Signing session not found");
      } else if (error.response?.status === 410) {
        toast.error("Signing session has expired");
      } else if (error.response?.status === 409) {
        toast.error("This contract has already been signed");
      } else {
        toast.error("Failed to complete signature. Please try again.");
      }
    } finally {
      setIsSigning(false);
    }
  };

  const downloadContract = () => {
    if (session?.contractData?.pdfUrl) {
      window.open(session.contractData.pdfUrl, "_blank");
    } else {
      toast.error("Contract document not available for download");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-center text-gray-600">
            Loading contract for signing...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-4">
            Unable to Load Contract
          </h2>
          <p className="text-center text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isExpired = new Date() > new Date(session.expiresAt);
  const timeUntilExpiry = new Date(session.expiresAt) - new Date();
  const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-6 w-6 mr-3" />
                <h1 className="text-xl font-semibold">Contract Signature</h1>
              </div>
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                <span className="text-sm">Secure Signing</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="block text-sm font-medium text-gray-700">
                  Contract ID
                </div>
                <p className="text-sm text-gray-900">{session.contractId}</p>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-700">
                  Signer Email
                </div>
                <p className="text-sm text-gray-900">{session.signerEmail}</p>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-700">
                  Expires
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-gray-500" />
                  <p
                    className={`text-sm ${getExpiryTextColor(
                      isExpired,
                      hoursUntilExpiry
                    )}`}
                  >
                    {isExpired ? "Expired" : `${hoursUntilExpiry}h remaining`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Content */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Contract Details
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={downloadContract}
                  className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
                <button
                  onClick={() => window.open("#", "_blank")}
                  className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Contract
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-4">
                {session.contractData.title || "Event Contract"}
              </h3>

              {/* Contract summary or key terms */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold mb-2">Key Terms:</h4>
                <ul className="space-y-1 text-sm">
                  <li>
                    <strong>Event Date:</strong>{" "}
                    {session.contractData.eventDate || "TBD"}
                  </li>
                  <li>
                    <strong>Venue:</strong>{" "}
                    {session.contractData.venue || "VH Banquets"}
                  </li>
                  <li>
                    <strong>Total Amount:</strong>{" "}
                    {session.contractData.totalAmount || "As quoted"}
                  </li>
                  <li>
                    <strong>Deposit Required:</strong>{" "}
                    {session.contractData.depositAmount || "50% of total"}
                  </li>
                </ul>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                By signing this contract, you agree to all terms and conditions
                as outlined in the full contract document. Please review the
                complete contract using the "View Full Contract" button above
                before signing.
              </p>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <PenTool className="h-5 w-5 mr-2" />
              Digital Signature
            </h2>
          </div>

          <div className="px-6 py-6">
            {/* Identity Confirmation */}
            <div className="mb-6">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="identityConfirm"
                  checked={identityConfirmed}
                  onChange={(e) => setIdentityConfirmed(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="identityConfirm"
                  className="ml-2 text-sm text-gray-700"
                >
                  I confirm that I am <strong>{session.signerEmail}</strong> and
                  I am authorized to sign this contract on behalf of the parties
                  involved.
                </label>
              </div>
            </div>

            {/* Signature Canvas */}
            <div className="mb-6">
              <div className="block text-sm font-medium text-gray-700 mb-2">
                Please provide your signature below:
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <SignatureCanvas
                  ref={sigPadRef}
                  canvasProps={{
                    width: 500,
                    height: 200,
                    className: "signature-canvas w-full border rounded",
                  }}
                  backgroundColor="rgb(255, 255, 255)"
                />
              </div>
              <div className="flex justify-between mt-2">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="flex items-center px-3 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </button>
                <p className="text-xs text-gray-500 self-center">
                  Use your mouse or finger to sign above
                </p>
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div className="mb-6">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="agreement"
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="agreement"
                  className="ml-2 text-sm text-gray-700"
                >
                  I have read, understood, and agree to all terms and conditions
                  outlined in this contract. I understand that this electronic
                  signature has the same legal effect as a handwritten
                  signature.
                </label>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Legal Notice:</p>
                  <p>
                    This electronic signature is legally binding under the
                    Electronic Signatures in Global and National Commerce Act
                    (ESIGN) and applicable state laws. Your signature will be
                    recorded with timestamp, IP address, and device information
                    for verification purposes.
                  </p>
                </div>
              </div>
            </div>

            {/* Sign Button */}
            <button
              onClick={handleSignContract}
              disabled={
                isSigning ||
                isExpired ||
                !agreementChecked ||
                !identityConfirmed
              }
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSigning ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Completing signature...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Check className="h-5 w-5 mr-2" />
                  Sign Contract
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ESignaturePage;
