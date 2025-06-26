import React, { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  FileText,
  Users,
  TrendingUp,
  Settings,
} from "lucide-react";
import api from "../utils/api";
import toast from "react-hot-toast";

const RhodeSignDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    contracts: [],
    stats: {
      total: 0,
      pending: 0,
      signed: 0,
      failed: 0,
    },
    recentActivity: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getActivityType = (status) => {
    switch (status) {
      case "SIGNED":
        return "success";
      case "SIGNATURE_FAILED":
        return "error";
      case "INITIATED":
      case "PENDING_SIGNATURE":
        return "pending";
      default:
        return "info";
    }
  };

  const getActivityMessage = (contract) => {
    switch (contract.status) {
      case "SIGNED":
        return `Contract ${contract.contractId} was signed successfully`;
      case "SIGNATURE_FAILED":
        return `Contract ${contract.contractId} signature failed`;
      case "INITIATED":
        return `Contract ${contract.contractId} signature process initiated`;
      case "PENDING_SIGNATURE":
        return `Contract ${contract.contractId} awaiting signature`;
      default:
        return `Contract ${contract.contractId} status updated`;
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/rhodesign/contracts");
      const contracts = response.data.contracts || [];

      // Calculate stats
      const stats = {
        total: contracts.length,
        pending: contracts.filter((c) =>
          ["INITIATED", "PENDING_SIGNATURE"].includes(c.status)
        ).length,
        signed: contracts.filter((c) => c.status === "SIGNED").length,
        failed: contracts.filter((c) => c.status === "SIGNATURE_FAILED").length,
      };

      // Generate recent activity
      const recentActivity = contracts
        .filter((c) => c.lastUpdated)
        .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
        .slice(0, 10)
        .map((contract) => ({
          id: contract.contractId,
          type: getActivityType(contract.status),
          message: getActivityMessage(contract),
          timestamp: contract.lastUpdated,
          status: contract.status,
        }));

      setDashboardData({
        contracts,
        stats,
        recentActivity,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "SIGNED":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "SIGNATURE_FAILED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "INITIATED":
      case "PENDING_SIGNATURE":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status) => {
    if (status === "SIGNED") return "bg-green-100 text-green-800";
    if (status === "SIGNATURE_FAILED") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading RhodeSign dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            RhodeSign Integration Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor and manage digital signature workflows
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <a
            href={process.env.REACT_APP_RHODESIGN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open RhodeSign
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Contracts
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardData.stats.total}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Pending Signatures
              </p>
              <p className="text-3xl font-bold text-yellow-600">
                {dashboardData.stats.pending}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Signed Contracts
              </p>
              <p className="text-3xl font-bold text-green-600">
                {dashboardData.stats.signed}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Failed Signatures
              </p>
              <p className="text-3xl font-bold text-red-600">
                {dashboardData.stats.failed}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Recent Activity
            </h2>
          </div>
          <div className="p-6">
            {dashboardData.recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {dashboardData.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contract Status Overview */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Contract Status Overview
            </h2>
          </div>
          <div className="p-6">
            {dashboardData.contracts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No contracts found
              </p>
            ) : (
              <div className="space-y-3">
                {dashboardData.contracts.slice(0, 10).map((contract) => (
                  <div
                    key={contract.contractId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(contract.status)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Contract {contract.contractId}
                        </p>
                        <p className="text-xs text-gray-500">
                          {contract.lastUpdated &&
                            new Date(contract.lastUpdated).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                        contract.status
                      )}`}
                    >
                      {contract.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Integration Status
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="text-sm font-medium text-green-800">
                  RhodeSign Connection
                </p>
                <p className="text-xs text-green-600">Active</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="text-sm font-medium text-green-800">
                  Webhook Handler
                </p>
                <p className="text-xs text-green-600">Operational</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="text-sm font-medium text-green-800">
                  API Integration
                </p>
                <p className="text-xs text-green-600">Ready</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">
                  Integration Guidelines
                </h4>
                <p className="text-sm text-blue-600 mt-1">
                  VH Banquets is fully integrated with RhodeSign for secure
                  digital signature workflows. All contract signatures are
                  processed through RhodeSign's secure platform with real-time
                  status updates and webhook notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RhodeSignDashboard;
