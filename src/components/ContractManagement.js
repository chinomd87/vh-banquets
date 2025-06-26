import { useState, useEffect } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import RhodeSignIntegration from "./RhodeSignIntegration";
import {
  FileText,
  Plus,
  Send,
  Eye,
  Shield,
  Calendar,
  User,
  DollarSign,
  Building,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

const ContractManagement = () => {
  const [contracts, setContracts] = useState([]);
  const [signatures, setSignatures] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newContract, setNewContract] = useState({
    title: "",
    signerEmail: "",
    eventDate: "",
    venue: "VH Banquets",
    totalAmount: "",
    depositAmount: "",
    description: "",
  });

  useEffect(() => {
    const loadContracts = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, you'd fetch contracts from your backend
        // For now, we'll use mock data
        const mockContracts = [
          {
            id: "contract-1",
            title: "Wedding Reception - Smith Family",
            signerEmail: "john.smith@email.com",
            eventDate: "2025-08-15",
            venue: "VH Banquets Main Hall",
            totalAmount: "$5,500",
            depositAmount: "$2,750",
            status: "pending",
            createdDate: "2025-06-20",
          },
          {
            id: "contract-2",
            title: "Corporate Event - Tech Corp",
            signerEmail: "events@techcorp.com",
            eventDate: "2025-07-10",
            venue: "VH Banquets Conference Room",
            totalAmount: "$3,200",
            depositAmount: "$1,600",
            status: "signed",
            createdDate: "2025-06-18",
          },
        ];

        setContracts(mockContracts);

        // Load signatures for each contract
        for (const contract of mockContracts) {
          await loadContractSignatures(contract.id);
        }
      } catch (error) {
        console.error("Failed to load contracts:", error);
        toast.error("Failed to load contracts");
      } finally {
        setIsLoading(false);
      }
    };

    loadContracts();
  }, []);

  const loadContractSignatures = async (contractId) => {
    try {
      const response = await api.get(`/signatures/contract/${contractId}`);
      setSignatures((prev) => ({
        ...prev,
        [contractId]: response.data.signatures,
      }));
    } catch (error) {
      console.error(
        `Failed to load signatures for contract ${contractId}:`,
        error
      );
    }
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();

    if (!newContract.title || !newContract.signerEmail) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Generate a unique contract ID
      const contractId = `contract-${Date.now()}`;

      // Create signing session
      const response = await api.post("/signatures/create-session", {
        contractId,
        signerEmail: newContract.signerEmail,
        contractData: {
          title: newContract.title,
          eventDate: newContract.eventDate,
          venue: newContract.venue,
          totalAmount: newContract.totalAmount,
          depositAmount: newContract.depositAmount,
          description: newContract.description,
        },
      });

      toast.success("Contract created and signing link sent!");

      // Add to contracts list
      const contract = {
        id: contractId,
        ...newContract,
        status: "pending",
        createdDate: new Date().toISOString().split("T")[0],
        signingUrl: response.data.session.signingUrl,
      };

      setContracts((prev) => [...prev, contract]);

      // Reset form
      setNewContract({
        title: "",
        signerEmail: "",
        eventDate: "",
        venue: "VH Banquets",
        totalAmount: "",
        depositAmount: "",
        description: "",
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create contract:", error);
      toast.error("Failed to create contract");
    }
  };

  const handleSendReminder = async (contractId) => {
    try {
      // In a real implementation, you'd send a reminder email
      toast.success("Reminder sent successfully!");
    } catch (error) {
      console.error("Failed to send reminder:", error);
      toast.error("Failed to send reminder");
    }
  };

  const handleRhodeSignStatusUpdate = (contractId, status) => {
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId ? { ...c, rhodeSignStatus: status } : c
      )
    );
  };

  const copySigningLink = (signingUrl) => {
    navigator.clipboard.writeText(signingUrl);
    toast.success("Signing link copied to clipboard!");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "signed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "expired":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "signed":
        return "Signed";
      case "pending":
        return "Pending Signature";
      case "expired":
        return "Expired";
      default:
        return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Contract Management
          </h1>
          <p className="text-gray-600 mt-2">
            Create and manage digital contracts with e-signature capabilities
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Contract
        </button>
      </div>

      {/* Create Contract Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Create New Contract
            </h2>
          </div>

          <form onSubmit={handleCreateContract} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Contract Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={newContract.title}
                  onChange={(e) =>
                    setNewContract((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Wedding Reception - Smith Family"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="signerEmail"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Signer Email *
                </label>
                <input
                  type="email"
                  id="signerEmail"
                  value={newContract.signerEmail}
                  onChange={(e) =>
                    setNewContract((prev) => ({
                      ...prev,
                      signerEmail: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="client@email.com"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="eventDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Event Date
                </label>
                <input
                  type="date"
                  id="eventDate"
                  value={newContract.eventDate}
                  onChange={(e) =>
                    setNewContract((prev) => ({
                      ...prev,
                      eventDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="venue"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Venue
                </label>
                <input
                  type="text"
                  id="venue"
                  value={newContract.venue}
                  onChange={(e) =>
                    setNewContract((prev) => ({
                      ...prev,
                      venue: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VH Banquets Main Hall"
                />
              </div>

              <div>
                <label
                  htmlFor="totalAmount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Total Amount
                </label>
                <input
                  type="text"
                  id="totalAmount"
                  value={newContract.totalAmount}
                  onChange={(e) =>
                    setNewContract((prev) => ({
                      ...prev,
                      totalAmount: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="$5,500"
                />
              </div>

              <div>
                <label
                  htmlFor="depositAmount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Deposit Amount
                </label>
                <input
                  type="text"
                  id="depositAmount"
                  value={newContract.depositAmount}
                  onChange={(e) =>
                    setNewContract((prev) => ({
                      ...prev,
                      depositAmount: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="$2,750"
                />
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={newContract.description}
                onChange={(e) =>
                  setNewContract((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional contract details..."
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Contract
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contracts List */}
      <div className="grid grid-cols-1 gap-6">
        {contracts.map((contract) => (
          <div
            key={contract.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {contract.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Created: {contract.createdDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(contract.status)}
                  <span className="text-sm font-medium text-gray-700">
                    {getStatusText(contract.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Signer</p>
                    <p className="text-sm font-medium">
                      {contract.signerEmail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Event Date</p>
                    <p className="text-sm font-medium">
                      {contract.eventDate || "TBD"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Building className="h-4 w-4 text-gray-400 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Venue</p>
                    <p className="text-sm font-medium">{contract.venue}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Total Amount</p>
                    <p className="text-sm font-medium">
                      {contract.totalAmount || "TBD"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              {signatures[contract.id] &&
                signatures[contract.id].length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Shield className="h-4 w-4 mr-1" />
                      Signatures
                    </h4>
                    <div className="space-y-2">
                      {signatures[contract.id].map((sig) => (
                        <div
                          key={sig.id || `${sig.signerEmail}-${sig.timestamp}`}
                          className="bg-green-50 border border-green-200 rounded-md p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                {sig.signerEmail}
                              </p>
                              <p className="text-xs text-green-600">
                                Signed on{" "}
                                {new Date(sig.timestamp).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(sig.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* RhodeSign Integration */}
              <div className="mb-4">
                <RhodeSignIntegration
                  contract={contract}
                  onStatusUpdate={(status) =>
                    handleRhodeSignStatusUpdate(contract.id, status)
                  }
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => copySigningLink(contract.signingUrl || "#")}
                  className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Copy Signing Link
                </button>

                {contract.status === "pending" && (
                  <button
                    onClick={() => handleSendReminder(contract.id)}
                    className="flex items-center px-3 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors text-sm"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Send Reminder
                  </button>
                )}

                <button
                  onClick={() => loadContractSignatures(contract.id)}
                  className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                >
                  <Shield className="h-4 w-4 mr-1" />
                  View Signatures
                </button>
              </div>
            </div>
          </div>
        ))}

        {contracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No contracts yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first contract to get started with digital signatures
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Contract
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractManagement;
