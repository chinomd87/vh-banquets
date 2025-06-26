const express = require("express");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Rate limiting for RhodeSign API endpoints
const rhodeSignLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    error: "Too many RhodeSign requests, please try again later",
    code: "RHODESIGN_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhook rate limiting (more restrictive)
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Allow up to 100 webhook calls per minute
  message: {
    error: "Webhook rate limit exceeded",
    code: "WEBHOOK_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// In-memory storage for demo (use database in production)
let contractSignatureRequests = new Map();
let signatureStatuses = new Map();

/**
 * POST /api/rhodesign/initiate-signature
 * Initiate signature process with RhodeSign
 */
router.post(
  "/initiate-signature",
  rhodeSignLimiter,
  authenticateToken,
  requireRole(["admin", "staff"]),
  async (req, res) => {
    try {
      const {
        contractId,
        contractTitle,
        contractContent,
        signerEmail,
        signerName,
        eventDetails,
        returnUrl,
        callbackUrl,
      } = req.body;

      // Validate required fields
      if (!contractId || !contractTitle || !contractContent || !signerEmail) {
        return res.status(400).json({
          error: "Missing required fields",
          required: [
            "contractId",
            "contractTitle",
            "contractContent",
            "signerEmail",
          ],
        });
      }

      // Generate signature request ID
      const signatureRequestId = `vh_${contractId}_${Date.now()}`;

      // Prepare request for RhodeSign
      const rhodeSignRequest = {
        requestId: signatureRequestId,
        document: {
          title: contractTitle,
          content: contractContent,
          type: "CONTRACT",
        },
        signer: {
          email: signerEmail,
          name: signerName || signerEmail.split("@")[0],
          role: "CLIENT",
        },
        event: eventDetails,
        callbacks: {
          success:
            callbackUrl ||
            `${process.env.VH_BANQUETS_URL}/api/rhodesign/webhook/signature-complete`,
          failure:
            callbackUrl ||
            `${process.env.VH_BANQUETS_URL}/api/rhodesign/webhook/signature-failed`,
          status: `${process.env.VH_BANQUETS_URL}/api/rhodesign/webhook/status-update`,
        },
        returnUrl: returnUrl || `${process.env.VH_BANQUETS_URL}/#/contracts`,
        metadata: {
          source: "VH_BANQUETS",
          contractId,
          initiatedBy: req.user.email,
          initiatedAt: new Date().toISOString(),
        },
      };

      // In production, send this to RhodeSign API
      const rhodeSignResponse = await sendToRhodeSign(rhodeSignRequest);

      // Store the request for tracking
      contractSignatureRequests.set(signatureRequestId, {
        ...rhodeSignRequest,
        status: "INITIATED",
        createdAt: new Date().toISOString(),
        rhodeSignUrl: rhodeSignResponse.signingUrl,
      });

      // Update signature status
      signatureStatuses.set(contractId, {
        status: "PENDING_SIGNATURE",
        signatureRequestId,
        rhodeSignUrl: rhodeSignResponse.signingUrl,
        initiatedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });

      res.json({
        success: true,
        signatureRequestId,
        rhodeSignUrl: rhodeSignResponse.signingUrl,
        status: "INITIATED",
        message: "Signature process initiated successfully",
      });
    } catch (error) {
      console.error("Error initiating signature with RhodeSign:", error);
      res.status(500).json({
        error: "Failed to initiate signature process",
        details: error.message,
      });
    }
  }
);

/**
 * GET /api/rhodesign/signature-status/:contractId
 * Get signature status for a contract
 */
router.get(
  "/signature-status/:contractId",
  rhodeSignLimiter,
  authenticateToken,
  async (req, res) => {
    try {
      const { contractId } = req.params;

      const status = signatureStatuses.get(contractId);

      if (!status) {
        return res.status(404).json({
          error: "No signature process found for this contract",
        });
      }

      // In production, also check with RhodeSign API for latest status
      const latestStatus = await checkRhodeSignStatus(
        status.signatureRequestId
      );

      res.json({
        contractId,
        ...status,
        latestUpdate: latestStatus,
      });
    } catch (error) {
      console.error("Error getting signature status:", error);
      res.status(500).json({
        error: "Failed to get signature status",
        details: error.message,
      });
    }
  }
);

/**
 * POST /api/rhodesign/webhook/signature-complete
 * Webhook handler for successful signature completion
 */
router.post("/webhook/signature-complete", webhookLimiter, async (req, res) => {
  try {
    const signature = req.headers["x-rhodesign-signature"];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const { requestId, contractId, signedDocument, signer, signedAt } =
      req.body;

    console.log(
      `Signature completed for contract ${contractId} by ${signer.email}`
    );

    // Update contract status
    signatureStatuses.set(contractId, {
      status: "SIGNED",
      signatureRequestId: requestId,
      signedAt,
      signer,
      signedDocument,
      lastUpdated: new Date().toISOString(),
    });

    // Update request status
    if (contractSignatureRequests.has(requestId)) {
      const request = contractSignatureRequests.get(requestId);
      contractSignatureRequests.set(requestId, {
        ...request,
        status: "COMPLETED",
        signedAt,
        signer,
        signedDocument,
      });
    }

    // In production, you might want to:
    // 1. Update database
    // 2. Send notification emails
    // 3. Trigger business logic
    // 4. Update CRM/ERP systems

    // Send notification (implement as needed)
    await sendSignatureCompleteNotification(contractId, signer);

    res.json({
      success: true,
      message: "Signature completion processed successfully",
    });
  } catch (error) {
    console.error("Error processing signature completion webhook:", error);
    res.status(500).json({
      error: "Failed to process signature completion",
      details: error.message,
    });
  }
});

/**
 * POST /api/rhodesign/webhook/signature-failed
 * Webhook handler for failed signature attempts
 */
router.post("/webhook/signature-failed", webhookLimiter, async (req, res) => {
  try {
    const signature = req.headers["x-rhodesign-signature"];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const { requestId, contractId, failureReason, failedAt, signer } = req.body;

    console.log(
      `Signature failed for contract ${contractId}: ${failureReason}`
    );

    // Update contract status
    signatureStatuses.set(contractId, {
      status: "SIGNATURE_FAILED",
      signatureRequestId: requestId,
      failureReason,
      failedAt,
      signer,
      lastUpdated: new Date().toISOString(),
    });

    // Update request status
    if (contractSignatureRequests.has(requestId)) {
      const request = contractSignatureRequests.get(requestId);
      contractSignatureRequests.set(requestId, {
        ...request,
        status: "FAILED",
        failureReason,
        failedAt,
      });
    }

    // Send failure notification
    await sendSignatureFailureNotification(contractId, signer, failureReason);

    res.json({
      success: true,
      message: "Signature failure processed successfully",
    });
  } catch (error) {
    console.error("Error processing signature failure webhook:", error);
    res.status(500).json({
      error: "Failed to process signature failure",
      details: error.message,
    });
  }
});

/**
 * POST /api/rhodesign/webhook/status-update
 * Webhook handler for general status updates
 */
router.post("/webhook/status-update", webhookLimiter, async (req, res) => {
  try {
    const signature = req.headers["x-rhodesign-signature"];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const { requestId, contractId, status, updatedAt, details } = req.body;

    console.log(`Status update for contract ${contractId}: ${status}`);

    // Update status
    const currentStatus = signatureStatuses.get(contractId) || {};
    signatureStatuses.set(contractId, {
      ...currentStatus,
      status,
      lastUpdated: updatedAt,
      statusDetails: details,
    });

    // Update request
    if (contractSignatureRequests.has(requestId)) {
      const request = contractSignatureRequests.get(requestId);
      contractSignatureRequests.set(requestId, {
        ...request,
        status,
        lastUpdated: updatedAt,
        statusDetails: details,
      });
    }

    res.json({
      success: true,
      message: "Status update processed successfully",
    });
  } catch (error) {
    console.error("Error processing status update webhook:", error);
    res.status(500).json({
      error: "Failed to process status update",
      details: error.message,
    });
  }
});

/**
 * POST /api/rhodesign/resend-signature
 * Resend signature request
 */
router.post(
  "/resend-signature",
  rhodeSignLimiter,
  authenticateToken,
  requireRole(["admin", "staff"]),
  async (req, res) => {
    try {
      const { contractId } = req.body;

      const status = signatureStatuses.get(contractId);

      if (!status) {
        return res.status(404).json({
          error: "No signature process found for this contract",
        });
      }

      if (status.status === "SIGNED") {
        return res.status(400).json({
          error: "Contract is already signed",
        });
      }

      // Resend via RhodeSign API
      await resendRhodeSignRequest(status.signatureRequestId);

      // Update last updated timestamp
      signatureStatuses.set(contractId, {
        ...status,
        lastUpdated: new Date().toISOString(),
        resentAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: "Signature request resent successfully",
        resentAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error resending signature request:", error);
      res.status(500).json({
        error: "Failed to resend signature request",
        details: error.message,
      });
    }
  }
);

/**
 * GET /api/rhodesign/contracts
 * Get all contracts with signature status
 */
router.get(
  "/contracts",
  rhodeSignLimiter,
  authenticateToken,
  async (req, res) => {
    try {
      const contracts = [];

      for (const [contractId, status] of signatureStatuses.entries()) {
        contracts.push({
          contractId,
          ...status,
        });
      }

      res.json({
        contracts,
        total: contracts.length,
      });
    } catch (error) {
      console.error("Error getting contracts:", error);
      res.status(500).json({
        error: "Failed to get contracts",
        details: error.message,
      });
    }
  }
);

// Helper Functions

/**
 * Send request to RhodeSign API
 */
async function sendToRhodeSign(request) {
  // In production, this would make an actual HTTP request to RhodeSign
  console.log("Sending to RhodeSign:", request);

  // Mock response for development
  return {
    success: true,
    requestId: request.requestId,
    signingUrl: `${process.env.RHODESIGN_URL || "https://rhodesign.app"}/sign/${
      request.requestId
    }`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  };
}

/**
 * Check status with RhodeSign API
 */
async function checkRhodeSignStatus(requestId) {
  // In production, this would make an actual HTTP request to RhodeSign
  console.log("Checking RhodeSign status for:", requestId);

  // Mock response for development
  return {
    status: "PENDING",
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Resend signature request via RhodeSign
 */
async function resendRhodeSignRequest(requestId) {
  // In production, this would make an actual HTTP request to RhodeSign
  console.log("Resending RhodeSign request:", requestId);

  return {
    success: true,
    resentAt: new Date().toISOString(),
  };
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload, signature) {
  if (!process.env.RHODESIGN_WEBHOOK_SECRET) {
    console.warn(
      "RHODESIGN_WEBHOOK_SECRET not configured, skipping signature verification"
    );
    return true; // Allow in development
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RHODESIGN_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  const providedSignature = signature.replace("sha256=", "");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(providedSignature, "hex")
  );
}

/**
 * Send signature completion notification
 */
async function sendSignatureCompleteNotification(contractId, signer) {
  console.log(
    `Sending signature completion notification for contract ${contractId} signed by ${signer.email}`
  );

  // In production, implement email notification
  // Example: Send email to VH Banquets staff about signed contract
}

/**
 * Send signature failure notification
 */
async function sendSignatureFailureNotification(contractId, signer, reason) {
  console.log(
    `Sending signature failure notification for contract ${contractId}: ${reason}`
  );

  // In production, implement email notification
  // Example: Alert staff about failed signature attempt
}

module.exports = router;
