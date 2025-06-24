import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// --- FIREBASE CONFIG (Using environment variables) ---
const firebaseConfig = window.__firebase_config || {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const AppContext = createContext();

export function AppProvider({ children }) {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [storage, setStorage] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);

  // --- Firebase Initialization ---
  useEffect(() => {
    const existingApps = getApps();
    const app = existingApps.length === 0 ? initializeApp(firebaseConfig) : existingApps[0];
    const firestoreDb = getFirestore(app);
    const firestoreAuth = getAuth(app);
    const firestoreStorage = getStorage(app);

    setDb(firestoreDb);
    setAuth(firestoreAuth);
    setStorage(firestoreStorage);

    const unsubscribe = onAuthStateChanged(firestoreAuth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        signInAnonymously(firestoreAuth).catch(console.error);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- Firestore Data Fetching ---
  useEffect(() => {
    if (!db || !user) return;

    const appId = window.__app_id || process.env.REACT_APP_VH_BANQUETS_APP_ID || "vh-banquets-app";
    const basePath = `artifacts/${appId}/users/${user.uid}`;

    // Fetch Events and derive Clients
    const eventsQuery = query(collection(db, `${basePath}/events`));
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      eventsData.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
      setEvents(eventsData);

      const clientData = new Map();
      eventsData.forEach(event => {
        if (event.clientInfo?.email) {
          clientData.set(event.clientInfo.email, event.clientInfo);
        }
      });
      setClients(Array.from(clientData.values()));
    });

    // Fetch Staff
    const staffQuery = query(collection(db, `${basePath}/staff`));
    const unsubscribeStaff = onSnapshot(staffQuery, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      staffData.sort((a, b) => a.name.localeCompare(b.name));
      setStaff(staffData);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeStaff();
    };
  }, [db, user]);

  const value = useMemo(() => ({
    db,
    auth,
    storage,
    user,
    isLoading,
    events,
    clients,
    staff
  }), [db, auth, storage, user, isLoading, events, clients, staff]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Custom hooks for easy consumption
// Custom hooks for easy consumption
export const useDb = () => useContext(AppContext).db;
export const useAuth = () => useContext(AppContext);
export const useStorage = () => useContext(AppContext).storage;
export const useData = () => {
    const { events, clients, staff, isLoading } = useContext(AppContext);
    return { events, clients, staff, isLoading };
};