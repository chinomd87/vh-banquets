const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

/**
 * Securely fetches event data for a client using a unique access code.
 * The client-side application should NEVER receive the full list of events.
 */
exports.getClientEventData = functions.https.onCall(async (data, context) => {
  const { accessCode } = data;

  if (!accessCode || typeof accessCode !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with a valid "accessCode".'
    );
  }

  const db = admin.firestore();
  
  // Query the 'events' collection group to find the event with the matching access code.
  // This assumes you add a unique 'accessCode' field to each event document.
  const eventsQuery = db.collectionGroup('events').where('accessCode', '==', accessCode);
  const snapshot = await eventsQuery.get();

  if (snapshot.empty) {
    throw new functions.https.HttpsError(
      'not-found',
      'Invalid access code. Please check the code and try again.'
    );
  }

  const clientEvents = [];
  let clientInfo = null;

  snapshot.forEach(doc => {
    const eventData = doc.data();
    clientEvents.push({ id: doc.id, ...eventData });
    if (!clientInfo) {
      clientInfo = eventData.clientInfo;
    }
  });

  // Return only the data for the authenticated client.
  return {
    client: clientInfo,
    events: clientEvents,
  };
});