import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
} from "firebase/firestore";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  Users as UsersIcon,
  Trash2,
  Edit,
  FileText,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  ClipboardList,
  Utensils,
  ListOrdered,
  ChevronDown,
  ChevronUp,
  Menu as MenuIcon,
  Save,
  PlayCircle,
  AlertCircle,
  CheckSquare,
  User,
  UserPlus,
  Phone,
  Mail,
  CreditCard,
} from "lucide-react";

// --- FIREBASE CONFIG (WILL BE REPLACED IN PRODUCTION) ---
const firebaseConfig = window.__firebase_config || {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
};

// --- GLOBAL APP ID ---
const appId = window.__app_id || "vh-banquets-app";

// --- MENU DATA (from Private Event Packet) ---
const MENU_STRUCTURE = {
  appetizers: [
    {
      id: "fruit_tray",
      name: "Fresh Fruit Assortment Tray",
      price: 5.0,
      type: "per_person",
    },
    {
      id: "cheese_tray",
      name: "Cheese, Cracker & Fruit Tray",
      price: 4.5,
      type: "per_person",
    },
    {
      id: "antipasto",
      name: "Italian Antipasto Station",
      price: 12.0,
      type: "per_person",
    },
  ],
  dinners: [
    {
      id: "chicken_family",
      name: 'Roasted Chicken "Family-Style"',
      price: 24.95,
      type: "per_person",
    },
  ],
  halfAndHalf: [
    {
      id: "roast_beef",
      name: "Roast Beef Au Jus",
      price: 6.0,
      type: "per_person_add",
    },
    {
      id: "pot_roast",
      name: "Pot Roast with Brown Gravy",
      price: 6.0,
      type: "per_person_add",
    },
    {
      id: "pork_loin",
      name: "Pork Loin with Apple Brandy Cream Sauce",
      price: 6.0,
      type: "per_person_add",
    },
    {
      id: "stuffed_sole",
      name: "Stuffed Sole with Seafood Stuffing",
      price: 7.0,
      type: "per_person_add",
    },
  ],
  desserts: [
    {
      id: "bread_pudding",
      name: "House-made Bread Pudding",
      price: 0,
      type: "ask",
    },
    { id: "torte", name: "Flourless Chocolate Torte", price: 0, type: "ask" },
    { id: "tiramisu", name: "House-made Tiramisu", price: 0, type: "ask" },
    { id: "cheesecake", name: "Seasonal Cheesecake", price: 0, type: "ask" },
    {
      id: "venetian_table",
      name: "Venetian Display Table",
      price: 11.0,
      type: "per_person",
    },
  ],
  additions: [
    {
      id: "haricot_verts",
      name: "Haricot Verte",
      price: 4.0,
      type: "per_person",
    },
    {
      id: "asparagus",
      name: "Grilled Asparagus",
      price: 5.0,
      type: "per_person",
    },
    {
      id: "veg_medley",
      name: "Seasonal Vegetable Medley",
      price: 3.0,
      type: "per_person",
    },
  ],
  bar: [
    {
      id: "champagne_toast",
      name: "Champagne Toast",
      price: 3.0,
      type: "per_person",
    },
    {
      id: "wine_toast",
      name: "White Wine Toast",
      price: 2.0,
      type: "per_person",
    },
    {
      id: "cider_toast",
      name: "Sparkling Cider",
      price: 1.25,
      type: "per_person",
    },
    {
      id: "sangria",
      name: "Seasonal Sangria",
      price: 225.0,
      type: "per_gallon",
    },
    {
      id: "single_mixer",
      name: "Single Alcohol & Mixer",
      price: 150.0,
      type: "per_gallon",
    },
    {
      id: "multi_liqueur",
      name: "Multiple Liqueur Cocktail",
      price: 240.0,
      type: "per_gallon",
    },
  ],
};
const SERVICE_CHARGE_RATE = 0.22;
const TAX_RATE = 0.08; // Combined 7% sales + 1% meal

// --- Main App Component ---
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [db, setDb] = useState(null);
  const [, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);

  // Ref to track if component is mounted to prevent memory leaks
  const isMountedRef = useRef(true);
  
  // AbortController for cancelling async operations
  const abortControllerRef = useRef(new AbortController());

  // --- Firebase Initialization and Auth ---
  useEffect(() => {
    let unsubscribeAuth = null;
    const abortController = abortControllerRef.current;
    
    try {
      // Use singleton pattern to prevent multiple Firebase app instances
      let app;
      const existingApps = getApps();
      if (existingApps.length === 0) {
        app = initializeApp(firebaseConfig);
      } else {
        app = existingApps[0];
      }
      
      const firestoreDb = getFirestore(app);
      const firestoreAuth = getAuth(app);
      setDb(firestoreDb);
      setAuth(firestoreAuth);

      unsubscribeAuth = onAuthStateChanged(firestoreAuth, async (user) => {
        if (!isMountedRef.current) return;
        
        if (user) {
          setUserId(user.uid);
        } else {
          try {
            if (window.__initial_auth_token) {
              await signInWithCustomToken(
                firestoreAuth,
                window.__initial_auth_token
              );
            } else {
              await signInAnonymously(firestoreAuth);
            }
          } catch (error) {
            console.error("Sign-in failed:", error);
            if (isMountedRef.current) {
              setIsLoading(false);
            }
          }
        }
      });
    } catch (error) {
      console.error("Firebase init failed:", error);
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }

    // Cleanup function to unsubscribe from auth state changes
    return () => {
      isMountedRef.current = false;
      abortController.abort();
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
    };
  }, []);

  // --- Firestore Data Fetching ---
  useEffect(() => {
    if (!db || !userId) return;

    const eventsCollectionPath = `artifacts/${appId}/users/${userId}/events`;
    const staffCollectionPath = `artifacts/${appId}/users/${userId}/staff`;

    const eventsQuery = query(collection(db, eventsCollectionPath));
    const staffQuery = query(collection(db, staffCollectionPath));

    const unsubscribeEvents = onSnapshot(
      eventsQuery,
      (querySnapshot) => {
        if (!isMountedRef.current) return;
        
        const eventsData = [];
        const clientData = new Map();
        querySnapshot.forEach((doc) => {
          const event = { id: doc.id, ...doc.data() };
          eventsData.push(event);
          if (event.clientInfo) {
            clientData.set(event.clientInfo.email, event.clientInfo);
          }
        });
        eventsData.sort(
          (a, b) => new Date(b.eventDate) - new Date(a.eventDate)
        );
        setEvents(eventsData);
        setClients(Array.from(clientData.values()));
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching events:", error);
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    );

    const unsubscribeStaff = onSnapshot(
      staffQuery,
      (querySnapshot) => {
        if (!isMountedRef.current) return;
        
        const staffData = [];
        querySnapshot.forEach((doc) => {
          const staffMember = { id: doc.id, ...doc.data() };
          staffData.push(staffMember);
        });
        staffData.sort((a, b) => a.name.localeCompare(b.name));
        setStaff(staffData);
      },
      (error) => {
        console.error("Error fetching staff:", error);
      }
    );

    return () => {
      unsubscribeEvents();
      unsubscribeStaff();
    };
  }, [db, userId]);

  const navigateTo = useCallback((pageName, data = null) => {
    setSelectedEvent(data);
    setPage(pageName);
  }, []);

  const handleEventUpdate = useCallback((updatedEvent) => {
    setEvents(events => 
      events.map((e) => e.id === updatedEvent.id ? updatedEvent : e)
    );
    setSelectedEvent(updatedEvent);
  }, []);

  const renderPage = () => {
    switch (page) {
      case "newEvent":
        return (
          <EventForm
            db={db}
            userId={userId}
            onBack={() => setPage("dashboard")}
          />
        );
      case "eventDetail":
        return (
          <EventDetail
            event={selectedEvent}
            db={db}
            userId={userId}
            onBack={() => setPage("dashboard")}
            navigateTo={navigateTo}
            onUpdate={handleEventUpdate}
            staff={staff}
          />
        );
      case "editEvent":
        return (
          <EventForm
            db={db}
            userId={userId}
            onBack={() => navigateTo("eventDetail", selectedEvent)}
            existingEvent={selectedEvent}
          />
        );
      case "clients":
        return (
          <ClientsPage
            clients={clients}
            navigateTo={navigateTo}
            events={events}
          />
        );
      case "staff":
        return <StaffPage staff={staff} db={db} userId={userId} />;
      case "clientPortal":
        return (
          <ClientPortalPage
            events={events}
            clients={clients}
            navigateTo={navigateTo}
          />
        );
      case "contracts":
        return (
          <ContractsPage
            events={events}
            db={db}
            userId={userId}
            navigateTo={navigateTo}
          />
        );
      case "clientEventView":
        return (
          <ClientEventDetailPage
            event={selectedEvent}
            navigateTo={navigateTo}
          />
        );
      case "clientContract":
        return (
          <ClientContractViewPage
            event={selectedEvent}
            navigateTo={navigateTo}
          />
        );
      case "dashboard":
      default:
        return (
          <Dashboard
            events={events}
            isLoading={isLoading}
            navigateTo={navigateTo}
          />
        );
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen text-gray-800">
      <AppHeader setPage={setPage} currentPage={page} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
    </div>
  );
}

function AppHeader({ setPage, currentPage }) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <MenuIcon className="text-indigo-600" size={28} />
            <h1 className="text-2xl font-bold text-gray-800">VH Banquets</h1>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setPage("dashboard")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === "dashboard"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setPage("clients")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === "clients"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Clients
            </button>
            <button
              onClick={() => setPage("staff")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === "staff"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Staff
            </button>
            <button
              onClick={() => setPage("clientPortal")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === "clientPortal"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Client Portal
            </button>
            <button
              onClick={() => setPage("contracts")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === "contracts"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Contracts
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

function Dashboard({ events, isLoading, navigateTo }) {
  // ... same as before
  const getStatusChip = (status) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Tentative":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div>
      <header className="flex items-center justify-between mb-8 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold">Event Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Manage all your banquet bookings.
          </p>
        </div>
        <button
          onClick={() => navigateTo("newEvent")}
          className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-700 transition-all transform hover:scale-105"
        >
          <Plus size={20} /> New Booking
        </button>
      </header>
      {isLoading ? (
        <div className="text-center py-10">
          <p>Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white rounded-lg shadow">
          <Package size={48} className="mx-auto text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-800">
            No Bookings Yet
          </h2>
          <p className="mt-1 text-gray-500">
            Click "New Booking" to get started and add your first event.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => navigateTo("eventDetail", event)}
              className="bg-white rounded-xl shadow-md p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold truncate">
                  {event.clientInfo?.name || "N/A"}
                </h3>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusChip(
                    event.status
                  )}`}
                >
                  {event.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate">
                {event.eventName || "Private Event"}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={16} className="text-gray-400" />
                  <span>
                    {new Date(event.eventDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={16} className="text-gray-400" />
                  <span>{event.eventTime}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <UsersIcon size={16} className="text-gray-400" />
                  <span>{event.guestCount} Guests</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientsPage({ clients, events }) {
  const getClientEvents = (email) =>
    events.filter((e) => e.clientInfo.email === email);
  return (
    <div>
      <header className="mb-8 pb-4 border-b">
        <h1 className="text-3xl font-bold">Clients</h1>
        <p className="text-gray-500 mt-1">View and manage all your clients.</p>
      </header>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Contact
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Events
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Last Event Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => {
              const clientEvents = getClientEvents(client.email);
              const lastEvent = clientEvents.sort(
                (a, b) => new Date(b.eventDate) - new Date(a.eventDate)
              )[0];
              return (
                <tr key={client.email}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {client.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{client.email}</div>
                    <div className="text-sm text-gray-500">{client.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {clientEvents.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lastEvent
                      ? new Date(lastEvent.eventDate).toLocaleDateString(
                          undefined,
                          { timeZone: "UTC" }
                        )
                      : "N/A"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventDetail({
  event,
  db,
  userId,
  onBack,
  navigateTo,
  onUpdate,
  staff,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  if (!event) return null;

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        const eventDocPath = `artifacts/${appId}/users/${userId}/events/${event.id}`;
        await deleteDoc(doc(db, eventDocPath));
        onBack();
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("Failed to delete event.");
      }
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: ClipboardList },
    { id: "planning", label: "Planning", icon: Edit },
    { id: "menu", label: "Menu & Bar", icon: Utensils },
    { id: "financials", label: "Financials", icon: DollarSign },
    { id: "staff", label: "Staff", icon: UsersIcon },
    { id: "timeline", label: "Timeline", icon: ListOrdered },
    { id: "eventsheets", label: "Event Sheets", icon: FileText },
    { id: "contract", label: "Contract", icon: ClipboardList },
  ];

  return (
    <div>
      <header className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-0"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateTo("editEvent", event)}
            className="flex items-center gap-2 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300"
          >
            <Edit size={16} /> Edit Details
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold">{event.clientInfo.name}</h1>
          <p className="text-lg text-indigo-600 font-semibold">
            {event.eventName || "Private Event"}
          </p>
        </div>

        <div className="border-b border-gray-200 mt-6">
          <nav
            className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto"
            aria-label="Tabs"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="pt-8">
          {activeTab === "overview" && <OverviewPanel event={event} />}
          {activeTab === "planning" && (
            <PlanningPanel
              event={event}
              db={db}
              userId={userId}
              onUpdate={onUpdate}
            />
          )}
          {activeTab === "menu" && (
            <MenuPanel
              event={event}
              db={db}
              userId={userId}
              onUpdate={onUpdate}
            />
          )}
          {activeTab === "financials" && (
            <FinancialsPanel
              event={event}
              db={db}
              userId={userId}
              onUpdate={onUpdate}
            />
          )}
          {activeTab === "staff" && (
            <StaffAssignmentPanel
              event={event}
              db={db}
              userId={userId}
              onUpdate={onUpdate}
              staff={staff}
            />
          )}
          {activeTab === "timeline" && (
            <TimelinePanel
              event={event}
              db={db}
              userId={userId}
              onUpdate={onUpdate}
              staff={staff}
            />
          )}
          {activeTab === "eventsheets" && (
            <EventSheetsPanel event={event} staff={staff} />
          )}
          {activeTab === "contract" && (
            <div className="text-center p-8">
              <p className="text-gray-500">
                Digital contract integration coming soon!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Event Detail Sub-Panels ---

function OverviewPanel({ event }) {
  /* ... same as before ... */
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div className="flex items-center gap-4">
        <Calendar className="text-indigo-500" size={32} />
        <div>
          <p className="text-sm text-gray-500">Event Date</p>
          <p className="font-semibold text-lg">
            {new Date(event.eventDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "UTC",
            })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Clock className="text-indigo-500" size={32} />
        <div>
          <p className="text-sm text-gray-500">Event Time</p>
          <p className="font-semibold text-lg">{event.eventTime}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <UsersIcon className="text-indigo-500" size={32} />
        <div>
          <p className="text-sm text-gray-500">Guest Count</p>
          <p className="font-semibold text-lg">{event.guestCount} People</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <FileText className="text-indigo-500" size={32} />
        <div>
          <p className="text-sm text-gray-500">Contract Status</p>
          <p
            className={`font-semibold text-lg flex items-center gap-2 ${
              event.contractSigned ? "text-green-600" : "text-red-600"
            }`}
          >
            {event.contractSigned ? (
              <CheckCircle size={20} />
            ) : (
              <XCircle size={20} />
            )}
            {event.contractSigned ? "Signed" : "Not Signed"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <DollarSign className="text-indigo-500" size={32} />
        <div>
          <p className="text-sm text-gray-500">Total Cost</p>
          <p className="font-semibold text-lg">
            $
            {(event.financials?.total || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>
      <div
        className={`col-span-1 lg:col-span-1 text-lg font-bold px-4 py-2 rounded-lg flex items-center justify-center ${
          event.status === "Confirmed"
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800"
        }`}
      >
        Status: {event.status}
      </div>
      <div className="md:col-span-2 lg:col-span-3 mt-4 pt-6 border-t">
        <h3 className="text-xl font-bold mb-2">Notes</h3>
        <p className="text-gray-600 whitespace-pre-wrap">
          {event.notes || "No special notes for this event."}
        </p>
      </div>
    </div>
  );
}
function PlanningPanel({ event, db, userId, onUpdate }) {
  /* ... same as before ... */
  const [planningData, setPlanningData] = useState(event.planning || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const [section, field] = name.split(".");
    if (type === "checkbox") {
      setPlanningData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [field]: checked },
      }));
    } else {
      setPlanningData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [field]: value },
      }));
    }
  };
  const handleVendorChange = (e, index) => {
    const { name, value } = e.target;
    const vendors = [...(planningData.vendors || [])];
    vendors[index] = { ...vendors[index], [name]: value };
    setPlanningData((prev) => ({ ...prev, vendors }));
  };
  const addVendor = () => {
    const vendors = [
      ...(planningData.vendors || []),
      { type: "", name: "", phone: "", email: "" },
    ];
    setPlanningData((prev) => ({ ...prev, vendors }));
  };
  const removeVendor = (index) => {
    const vendors = [...(planningData.vendors || [])];
    vendors.splice(index, 1);
    setPlanningData((prev) => ({ ...prev, vendors }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const eventDocRef = doc(
        db,
        `artifacts/${appId}/users/${userId}/events/${event.id}`
      );
      await updateDoc(eventDocRef, { planning: planningData });
      onUpdate({ ...event, planning: planningData });
      alert("Planning details saved successfully!");
    } catch (error) {
      console.error("Error saving planning data: ", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderInput = (section, field, label, type = "text", options) => (
    <div>
      {" "}
      <label
        htmlFor={`${section}.${field}`}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>{" "}
      {type === "select" ? (
        <select
          name={`${section}.${field}`}
          id={`${section}.${field}`}
          onChange={handleInputChange}
          value={planningData[section]?.[field] || ""}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value=""></option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          name={`${section}.${field}`}
          id={`${section}.${field}`}
          onChange={handleInputChange}
          value={planningData[section]?.[field] || ""}
          rows="3"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        ></textarea>
      ) : (
        <input
          type={type}
          name={`${section}.${field}`}
          id={`${section}.${field}`}
          onChange={handleInputChange}
          value={planningData[section]?.[field] || ""}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      )}{" "}
    </div>
  );
  const renderCheckbox = (section, field, label) => (
    <div className="flex items-center">
      <input
        type="checkbox"
        name={`${section}.${field}`}
        id={`${section}.${field}`}
        onChange={handleInputChange}
        checked={!!planningData[section]?.[field]}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600"
      />
      <label
        htmlFor={`${section}.${field}`}
        className="ml-2 block text-sm text-gray-900"
      >
        {label}
      </label>
    </div>
  );

  return (
    <div className="space-y-10">
      <CollapsibleSection title="Event Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderInput("details", "guestOfHonor", "Guest(s) of Honor")}
          {renderInput(
            "details",
            "seatingType",
            "Seating Arrangement",
            "select",
            ["Open", "Assigned"]
          )}
          {renderInput("details", "serviceStyle", "Service Style", "select", [
            "Sit-down Family-Style",
            "Buffet",
          ])}
          {renderInput(
            "details",
            "decorations",
            "Decorations (Centerpieces, Banners, etc.)",
            "textarea"
          )}
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="Setup & Equipment">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderCheckbox(
            "equipment",
            "registrationTable",
            "Registration/Welcome Table"
          )}
          {renderCheckbox("equipment", "easels", "Easels or Display Tables")}
          {renderCheckbox("equipment", "micAndPodium", "Microphone & Podium")}
          {renderCheckbox("equipment", "danceFloor", "Dance Floor")}
          {renderCheckbox("equipment", "raffleAuction", "Raffle/Auction Table")}
          {renderCheckbox(
            "equipment",
            "photographer",
            "Photographer/Videographer"
          )}
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="Bar & Beverage">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderInput("bar", "barType", "Bar Type", "select", [
            "Cash Bar",
            "Open Bar",
          ])}
          {renderInput("bar", "toast", "Toast Required", "select", [
            "No",
            "Yes",
          ])}
          {renderCheckbox("bar", "drinkTickets", "Drink Tickets")}
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="Vendors">
        {(planningData.vendors || []).map((vendor, index) => (
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 mb-4 border rounded-lg relative"
          >
            <input
              type="text"
              name="type"
              placeholder="Vendor Type (e.g. Florist)"
              value={vendor.type}
              onChange={(e) => handleVendorChange(e, index)}
              className="block w-full rounded-md border-gray-300 shadow-sm"
            />
            <input
              type="text"
              name="name"
              placeholder="Contact Name"
              value={vendor.name}
              onChange={(e) => handleVendorChange(e, index)}
              className="block w-full rounded-md border-gray-300 shadow-sm"
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={vendor.phone}
              onChange={(e) => handleVendorChange(e, index)}
              className="block w-full rounded-md border-gray-300 shadow-sm"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={vendor.email}
              onChange={(e) => handleVendorChange(e, index)}
              className="block w-full rounded-md border-gray-300 shadow-sm"
            />
            <button
              onClick={() => removeVendor(index)}
              className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 leading-none"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <button
          onClick={addVendor}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center gap-1 mt-2"
        >
          <Plus size={16} /> Add Vendor
        </button>
      </CollapsibleSection>
      <CollapsibleSection title="Special Requirements">
        <div className="space-y-4">
          {renderInput(
            "special",
            "allergies",
            "Allergies & Dietary Restrictions",
            "textarea"
          )}
          {renderInput(
            "special",
            "accessibility",
            "Accessibility Requirements",
            "textarea"
          )}
          {renderInput(
            "special",
            "comments",
            "Other Questions or Comments",
            "textarea"
          )}
        </div>
      </CollapsibleSection>
      <div className="mt-8 pt-6 border-t flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Planning Details"}
        </button>
      </div>
    </div>
  );
}
function MenuPanel({ event, db, userId, onUpdate }) {
  const [menuSelections, setMenuSelections] = useState(event.menu || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectionChange = (category, itemId) => {
    setMenuSelections((prev) => {
      const currentItems = prev[category] || [];
      const newItems = currentItems.includes(itemId)
        ? currentItems.filter((id) => id !== itemId)
        : [...currentItems, itemId];
      return { ...prev, [category]: newItems };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const eventDocRef = doc(
        db,
        `artifacts/${appId}/users/${userId}/events/${event.id}`
      );
      await updateDoc(eventDocRef, { menu: menuSelections });

      // Recalculate totals and update financials
      const { total } = calculateFinancials(menuSelections, event.guestCount);
      const financials = {
        ...event.financials,
        total: total,
        generatedAt: new Date().toISOString(),
      };
      await updateDoc(eventDocRef, { financials });

      onUpdate({ ...event, menu: menuSelections, financials });
      alert("Menu saved successfully! Financials have been updated.");
    } catch (error) {
      console.error("Error saving menu: ", error);
      alert("Failed to save menu. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderMenuCategory = (title, categoryKey, items) => (
    <CollapsibleSection title={title}>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`${categoryKey}.${item.id}`}
                checked={
                  menuSelections[categoryKey]?.includes(item.id) || false
                }
                onChange={() => handleSelectionChange(categoryKey, item.id)}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor={`${categoryKey}.${item.id}`}
                className="ml-3 text-sm font-medium text-gray-800"
              >
                {item.name}
              </label>
            </div>
            <span className="text-sm text-gray-600">
              {item.price > 0
                ? `$${item.price.toFixed(2)} ${item.type.replace("_", " ")}`
                : "Ask for Price"}
            </span>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );

  return (
    <div className="space-y-6">
      {renderMenuCategory(
        "Appetizers",
        "appetizers",
        MENU_STRUCTURE.appetizers
      )}
      {renderMenuCategory("Dinners", "dinners", MENU_STRUCTURE.dinners)}
      {renderMenuCategory(
        "Half & Half Add-ons",
        "halfAndHalf",
        MENU_STRUCTURE.halfAndHalf
      )}
      {renderMenuCategory("Desserts", "desserts", MENU_STRUCTURE.desserts)}
      {renderMenuCategory(
        "Side Additions",
        "additions",
        MENU_STRUCTURE.additions
      )}
      {renderMenuCategory("Bar & Toasts", "bar", MENU_STRUCTURE.bar)}
      <div className="mt-8 pt-6 border-t flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Menu & Recalculate Quote"}
        </button>
      </div>
    </div>
  );
}
function FinancialsPanel({ event, db, userId, onUpdate }) {
  const [payments, setPayments] = useState(event.financials?.payments || []);
  const [newPaymentDesc, setNewPaymentDesc] = useState("");
  const [newPaymentAmount, setNewPaymentAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const financials = useMemo(
    () => calculateFinancials(event.menu, event.guestCount, payments),
    [event.menu, event.guestCount, payments]
  );

  const addPayment = async () => {
    if (!newPaymentDesc || !newPaymentAmount) {
      alert("Please provide a payment description and amount.");
      return;
    }
    const newPayment = {
      id: `pay_${Date.now()}`,
      date: new Date().toISOString(),
      description: newPaymentDesc,
      amount: parseFloat(newPaymentAmount),
    };
    const updatedPayments = [...payments, newPayment];

    setIsSaving(true);
    try {
      const eventDocRef = doc(
        db,
        `artifacts/${appId}/users/${userId}/events/${event.id}`
      );
      const updatedFinancials = {
        ...event.financials,
        payments: updatedPayments,
      };
      await updateDoc(eventDocRef, { financials: updatedFinancials });
      onUpdate({ ...event, financials: updatedFinancials });
      setPayments(updatedPayments);
      setNewPaymentDesc("");
      setNewPaymentAmount("");
    } catch (error) {
      console.error("Error adding payment: ", error);
      alert("Failed to add payment.");
    } finally {
      setIsSaving(false);
    }
  };

  const removePayment = async (paymentId) => {
    const updatedPayments = payments.filter((p) => p.id !== paymentId);
    setIsSaving(true);
    try {
      const eventDocRef = doc(
        db,
        `artifacts/${appId}/users/${userId}/events/${event.id}`
      );
      const updatedFinancials = {
        ...event.financials,
        payments: updatedPayments,
      };
      await updateDoc(eventDocRef, { financials: updatedFinancials });
      onUpdate({ ...event, financials: updatedFinancials });
      setPayments(updatedPayments);
    } catch (error) {
      console.error("Error removing payment: ", error);
      alert("Failed to remove payment.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
      <div className="md:col-span-3 space-y-6">
        <CollapsibleSection title="Quote Details">
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <button
              onClick={() => {
                const testCalc = calculateFinancials(
                  {
                    appetizers: ["fruit_tray", "cheese_tray"],
                    dinners: ["chicken_family"],
                    halfAndHalf: ["roast_beef"],
                    bar: ["champagne_toast"],
                    desserts: ["venetian_table"],
                  },
                  50
                );
                console.log("Test Financial Calculation:", testCalc);
                alert(
                  `Financial Calculation Test:\n\nGuest Count: 50\nSubtotal: $${testCalc.subtotal.toFixed(
                    2
                  )}\nService Charge: $${testCalc.serviceCharge.toFixed(
                    2
                  )}\nTax: $${testCalc.tax.toFixed(
                    2
                  )}\nTotal: $${testCalc.total.toFixed(
                    2
                  )}\n\nCheck console for detailed breakdown.`
                );
              }}
              className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
            >
              Test Calculations
            </button>
          </div>
          <table className="min-w-full">
            <tbody className="divide-y divide-gray-200">
              {financials.lineItems.map((item) => (
                <tr key={item.name}>
                  <td className="py-2 pr-4 text-sm text-gray-600">
                    {item.name}
                  </td>
                  <td className="py-2 pl-4 text-right text-sm font-medium text-gray-800">
                    ${item.cost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-300">
              <tr>
                <td className="py-2 font-semibold">Subtotal</td>
                <td className="py-2 text-right font-semibold">
                  ${financials.subtotal.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="py-1 text-sm text-gray-500">
                  Service Charge ({SERVICE_CHARGE_RATE * 100}%)
                </td>
                <td className="py-1 text-right text-sm text-gray-500">
                  ${financials.serviceCharge.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="py-1 text-sm text-gray-500">Tax</td>
                <td className="py-1 text-right text-sm text-gray-500">
                  ${financials.tax.toFixed(2)}
                </td>
              </tr>
              <tr className="bg-gray-100">
                <td className="py-3 font-bold text-lg">Total Estimated Cost</td>
                <td className="py-3 text-right font-bold text-lg">
                  ${financials.total.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </CollapsibleSection>
        <CollapsibleSection title="Payments Received">
          <div className="space-y-2">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center bg-gray-50 p-2 rounded"
              >
                <div>
                  <p className="text-sm font-medium">{p.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(p.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-green-600">
                    ${p.amount.toFixed(2)}
                  </span>
                  <button onClick={() => removePayment(p.id)}>
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No payments logged.
              </p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t flex gap-2">
            <input
              type="text"
              placeholder="Payment description"
              value={newPaymentDesc}
              onChange={(e) => setNewPaymentDesc(e.target.value)}
              className="flex-grow rounded-md border-gray-300 shadow-sm"
            />
            <input
              type="number"
              placeholder="Amount"
              value={newPaymentAmount}
              onChange={(e) => setNewPaymentAmount(e.target.value)}
              className="w-28 rounded-md border-gray-300 shadow-sm"
            />
            <button
              onClick={addPayment}
              disabled={isSaving}
              className="bg-indigo-600 text-white px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Online Payment Processing">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="text-blue-600" size={20} />
                <h4 className="font-semibold text-blue-800">
                  Secure Online Payment
                </h4>
              </div>
              <p className="text-sm text-blue-700 mb-4">
                Process secure payments using Shift4 payment gateway. Clients
                can pay online with credit/debit cards.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="pl-8 w-full rounded-md border-gray-300 shadow-sm"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment For
                  </label>
                  <select className="w-full rounded-md border-gray-300 shadow-sm">
                    <option value="deposit">Deposit</option>
                    <option value="partial">Partial Payment</option>
                    <option value="full">Full Payment</option>
                    <option value="balance">Remaining Balance</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                  onClick={() =>
                    alert(
                      "Opening Shift4 Payment Portal (Demo)\n\nIn production, this would:\n1. Create signed checkout request\n2. Open Shift4 payment form\n3. Process payment securely\n4. Update payment records automatically"
                    )
                  }
                >
                  <CreditCard size={16} />
                  Process Payment
                </button>
                <button
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                  onClick={() =>
                    alert(
                      "Payment Link Generated!\n\nA secure payment link would be created and can be:\n• Emailed to the client\n• Embedded in invoices\n• Shared via text message\n\nLink expires in 24 hours for security."
                    )
                  }
                >
                  Generate Payment Link
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="font-medium text-gray-800 mb-2">
                Payment Gateway Features:
              </h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• PCI DSS compliant secure processing</li>
                <li>• Real-time payment verification</li>
                <li>• Automatic receipt generation</li>
                <li>• Integration with QuickBooks/accounting</li>
                <li>• Fraud protection and chargeback management</li>
              </ul>
            </div>
          </div>
        </CollapsibleSection>
      </div>
      <div className="md:col-span-2">
        <div className="bg-indigo-50 rounded-xl p-6 sticky top-8 text-center">
          <p className="text-indigo-800 font-semibold">Total Cost</p>
          <p className="text-4xl font-bold text-indigo-900 my-2">
            ${financials.total.toFixed(2)}
          </p>
          <p className="text-indigo-800 font-semibold mt-6">Total Paid</p>
          <p className="text-3xl font-bold text-green-600">
            ${financials.paid.toFixed(2)}
          </p>
          <div className="my-4 h-px bg-indigo-200"></div>
          <p className="text-indigo-800 font-bold text-lg">Balance Due</p>
          <p className="text-5xl font-extrabold text-red-600 mt-2">
            ${financials.balance.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
function TimelinePanel({ event, db, userId, onUpdate, staff = [] }) {
  const [timelineItems, setTimelineItems] = useState(event.timeline || []);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    time: "",
    title: "",
    description: "",
    type: "setup",
    assignedTo: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const timelineTypes = [
    {
      value: "setup",
      label: "Setup",
      color: "bg-blue-100 text-blue-800",
      icon: PlayCircle,
    },
    {
      value: "staff",
      label: "Staff",
      color: "bg-purple-100 text-purple-800",
      icon: User,
    },
    {
      value: "service",
      label: "Service",
      color: "bg-green-100 text-green-800",
      icon: Utensils,
    },
    {
      value: "guest",
      label: "Guest Activity",
      color: "bg-yellow-100 text-yellow-800",
      icon: UsersIcon,
    },
    {
      value: "important",
      label: "Important",
      color: "bg-red-100 text-red-800",
      icon: AlertCircle,
    },
    {
      value: "cleanup",
      label: "Cleanup",
      color: "bg-gray-100 text-gray-800",
      icon: CheckSquare,
    },
  ];

  const getTypeConfig = (type) =>
    timelineTypes.find((t) => t.value === type) || timelineTypes[0];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Sort timeline items by time
      const sortedItems = [...timelineItems].sort((a, b) => {
        const timeA = new Date(`2000-01-01T${a.time}`);
        const timeB = new Date(`2000-01-01T${b.time}`);
        return timeA - timeB;
      });

      const eventDocRef = doc(
        db,
        `artifacts/${appId}/users/${userId}/events/${event.id}`
      );
      await updateDoc(eventDocRef, { timeline: sortedItems });
      onUpdate({ ...event, timeline: sortedItems });
      setTimelineItems(sortedItems);
      alert("Timeline saved successfully!");
    } catch (error) {
      console.error("Error saving timeline: ", error);
      alert("Failed to save timeline. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const addTimelineItem = () => {
    if (!newItem.time || !newItem.title) {
      alert("Please provide at least time and title for the timeline item.");
      return;
    }

    const item = {
      id: `timeline_${Date.now()}`,
      ...newItem,
      createdAt: new Date().toISOString(),
    };

    setTimelineItems((prev) => [...prev, item]);
    setNewItem({
      time: "",
      title: "",
      description: "",
      type: "setup",
      assignedTo: "",
    });
    setIsEditing(false);
  };

  const editTimelineItem = (item) => {
    setEditingItem(item);
    setNewItem({ ...item });
    setIsEditing(true);
  };

  const updateTimelineItem = () => {
    if (!newItem.time || !newItem.title) {
      alert("Please provide at least time and title for the timeline item.");
      return;
    }

    setTimelineItems((prev) =>
      prev.map((item) =>
        item.id === editingItem.id
          ? { ...newItem, updatedAt: new Date().toISOString() }
          : item
      )
    );
    setEditingItem(null);
    setNewItem({
      time: "",
      title: "",
      description: "",
      type: "setup",
      assignedTo: "",
    });
    setIsEditing(false);
  };

  const deleteTimelineItem = (itemId) => {
    if (window.confirm("Are you sure you want to delete this timeline item?")) {
      setTimelineItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  const moveTimelineItem = (itemId, direction) => {
    const currentIndex = timelineItems.findIndex((item) => item.id === itemId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= timelineItems.length) return;

    const newItems = [...timelineItems];
    [newItems[currentIndex], newItems[newIndex]] = [
      newItems[newIndex],
      newItems[currentIndex],
    ];
    setTimelineItems(newItems);
  };

  const loadDefaultTimeline = () => {
    const defaultItems = [
      {
        id: "def1",
        time: "14:00",
        title: "Staff Arrival",
        description: "Kitchen and service staff arrive for setup",
        type: "staff",
        assignedTo: "All Staff",
      },
      {
        id: "def2",
        time: "14:30",
        title: "Kitchen Prep Begin",
        description: "Start food preparation and cooking",
        type: "setup",
        assignedTo: "Kitchen Staff",
      },
      {
        id: "def3",
        time: "15:00",
        title: "Room Setup",
        description: "Table setup, linens, centerpieces",
        type: "setup",
        assignedTo: "Service Staff",
      },
      {
        id: "def4",
        time: "16:00",
        title: "Bar Setup",
        description: "Bar setup and beverage preparation",
        type: "setup",
        assignedTo: "Bartender",
      },
      {
        id: "def5",
        time: "17:00",
        title: "Final Prep Check",
        description: "Final kitchen and service preparations",
        type: "important",
        assignedTo: "Manager",
      },
      {
        id: "def6",
        time: "17:30",
        title: "Guest Arrival",
        description: "Guests begin arriving",
        type: "guest",
        assignedTo: "",
      },
      {
        id: "def7",
        time: "18:00",
        title: "Cocktail Hour",
        description: "Appetizers and drinks service",
        type: "service",
        assignedTo: "Service Staff",
      },
      {
        id: "def8",
        time: "19:00",
        title: "Dinner Service",
        description: "Main dinner service begins",
        type: "service",
        assignedTo: "All Staff",
      },
      {
        id: "def9",
        time: "21:00",
        title: "Dessert Service",
        description: "Dessert and coffee service",
        type: "service",
        assignedTo: "Service Staff",
      },
      {
        id: "def10",
        time: "22:00",
        title: "Event Conclusion",
        description: "Guest departure and cleanup begins",
        type: "cleanup",
        assignedTo: "All Staff",
      },
    ];
    setTimelineItems(defaultItems);
  };

  const sortedTimelineItems = [...timelineItems].sort((a, b) => {
    const timeA = new Date(`2000-01-01T${a.time}`);
    const timeB = new Date(`2000-01-01T${b.time}`);
    return timeA - timeB;
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Event Timeline</h2>
          <p className="text-sm text-gray-500">
            Manage the schedule and flow of your event
          </p>
        </div>
        <div className="flex gap-2">
          {timelineItems.length === 0 && (
            <button
              onClick={loadDefaultTimeline}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              <PlayCircle size={16} />
              Load Default Timeline
            </button>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Plus size={16} />
            Add Item
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Save size={16} />
            {isSaving ? "Saving..." : "Save Timeline"}
          </button>
        </div>
      </div>

      {/* Timeline Items */}
      <div className="space-y-4">
        {sortedTimelineItems.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <ListOrdered size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No Timeline Items
            </h3>
            <p className="text-gray-500 mb-4">
              Create your event timeline to manage the flow of your event.
            </p>
            <button
              onClick={loadDefaultTimeline}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Load Default Timeline
            </button>
          </div>
        ) : (
          sortedTimelineItems.map((item, index) => {
            const typeConfig = getTypeConfig(item.type);
            const Icon = typeConfig.icon;

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Icon size={24} className="text-indigo-600" />
                      </div>
                      <span className="text-sm font-bold text-gray-800">
                        {item.time}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {item.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}
                        >
                          {typeConfig.label}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-gray-600 text-sm mb-2">
                          {item.description}
                        </p>
                      )}

                      {item.assignedTo && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <User size={14} />
                          <span>Assigned to: {item.assignedTo}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => moveTimelineItem(item.id, "up")}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => moveTimelineItem(item.id, "down")}
                      disabled={index === sortedTimelineItems.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      onClick={() => editTimelineItem(item)}
                      className="p-1 text-blue-500 hover:text-blue-700"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteTimelineItem(item.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Item Form */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? "Edit Timeline Item" : "Add Timeline Item"}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newItem.time}
                    onChange={(e) =>
                      setNewItem((prev) => ({ ...prev, time: e.target.value }))
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newItem.type}
                    onChange={(e) =>
                      setNewItem((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm"
                  >
                    {timelineTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Timeline item title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm"
                  rows="3"
                  placeholder="Additional details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <select
                  value={newItem.assignedTo}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      assignedTo: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="">Select staff member...</option>
                  <option value="All Staff">All Staff</option>
                  <option value="Kitchen Staff">Kitchen Staff</option>
                  <option value="Service Staff">Service Staff</option>
                  <option value="Manager">Manager</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingItem(null);
                  setNewItem({
                    time: "",
                    title: "",
                    description: "",
                    type: "setup",
                    assignedTo: "",
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={editingItem ? updateTimelineItem : addTimelineItem}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {editingItem ? "Update" : "Add"} Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ title, children }) {
  /* ... same as before ... */
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-gray-50 rounded-t-lg hover:bg-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}

function StaffAssignmentPanel({ event, db, userId, onUpdate, staff = [] }) {
  const [assignedStaff, setAssignedStaff] = useState(event.assignedStaff || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleStaffAssignment = (staffId, isAssigned) => {
    if (isAssigned) {
      setAssignedStaff((prev) => [...prev, staffId]);
    } else {
      setAssignedStaff((prev) => prev.filter((id) => id !== staffId));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const eventDocRef = doc(
        db,
        `artifacts/${appId}/users/${userId}/events/${event.id}`
      );
      await updateDoc(eventDocRef, { assignedStaff });
      onUpdate({ ...event, assignedStaff });
      alert("Staff assignments saved successfully!");
    } catch (error) {
      console.error("Error saving staff assignments: ", error);
      alert("Failed to save staff assignments. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getAssignedStaffData = () => {
    return staff.filter((member) => assignedStaff.includes(member.id));
  };

  const getUnassignedStaffData = () => {
    return staff.filter((member) => !assignedStaff.includes(member.id));
  };

  const getRoleColor = (role) => {
    const colors = {
      Manager: "bg-purple-100 text-purple-800",
      Chef: "bg-red-100 text-red-800",
      Server: "bg-blue-100 text-blue-800",
      Bartender: "bg-green-100 text-green-800",
      "Kitchen Assistant": "bg-orange-100 text-orange-800",
      "Setup Crew": "bg-gray-100 text-gray-800",
      "Cleanup Crew": "bg-yellow-100 text-yellow-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Staff Assignment</h2>
          <p className="text-sm text-gray-500">
            Assign staff members to this event
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <Save size={16} />
          {isSaving ? "Saving..." : "Save Assignments"}
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white rounded-lg shadow">
          <User size={48} className="mx-auto text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-800">
            No Staff Members
          </h2>
          <p className="mt-1 text-gray-500">
            Add your first team member to get started.
          </p>
          <button
            onClick={() => setIsAddingStaff(true)}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Add Staff Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned Staff */}
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
              <CheckCircle size={20} />
              Assigned Staff ({getAssignedStaffData().length})
            </h3>
            <div className="space-y-3">
              {getAssignedStaffData().length === 0 ? (
                <p className="text-green-600 text-sm">No staff assigned yet</p>
              ) : (
                getAssignedStaffData().map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {member.name}
                        </h4>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                            member.role
                          )}`}
                        >
                          {member.role}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStaffAssignment(member.id, false)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Staff */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <UsersIcon size={20} />
              Available Staff ({getUnassignedStaffData().length})
            </h3>
            <div className="space-y-3">
              {getUnassignedStaffData().length === 0 ? (
                <p className="text-gray-600 text-sm">
                  All staff members are assigned
                </p>
              ) : (
                getUnassignedStaffData().map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {member.name}
                        </h4>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                            member.role
                          )}`}
                        >
                          {member.role}
                        </span>
                        {member.hourlyRate && (
                          <p className="text-xs text-gray-500">
                            ${member.hourlyRate}/hour
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleStaffAssignment(member.id, true)}
                      className="text-green-500 hover:text-green-700"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Summary */}
      {getAssignedStaffData().length > 0 && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            Event Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-800">
                {getAssignedStaffData().length}
              </p>
              <p className="text-sm text-blue-600">Total Staff</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-800">
                {event.guestCount}
              </p>
              <p className="text-sm text-blue-600">Guests</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-800">
                {event.guestCount && getAssignedStaffData().length
                  ? Math.round(event.guestCount / getAssignedStaffData().length)
                  : 0}
                :1
              </p>
              <p className="text-sm text-blue-600">Guest:Staff Ratio</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StaffPage({ staff, db, userId }) {
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [newStaff, setNewStaff] = useState({
    name: "",
    role: "Server",
    phone: "",
    email: "",
    hourlyRate: "",
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    },
    skills: [],
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const staffRoles = [
    "Server",
    "Bartender",
    "Chef",
    "Kitchen Assistant",
    "Manager",
    "Setup Crew",
    "Cleanup Crew",
  ];

  const staffSkills = [
    "Wine Service",
    "Cocktail Making",
    "Food Preparation",
    "Event Setup",
    "Customer Service",
    "Cash Handling",
    "Equipment Operation",
    "Team Leadership",
  ];

  const dayNames = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };

  const handleSaveStaff = async () => {
    if (!newStaff.name || !newStaff.role) {
      alert("Please provide at least name and role.");
      return;
    }

    setIsSaving(true);
    try {
      const staffCollectionPath = `artifacts/${appId}/users/${userId}/staff`;

      if (editingStaff) {
        const staffDocRef = doc(db, staffCollectionPath, editingStaff.id);
        await updateDoc(staffDocRef, {
          ...newStaff,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await addDoc(collection(db, staffCollectionPath), {
          ...newStaff,
          createdAt: new Date().toISOString(),
        });
      }

      resetForm();
      alert(
        editingStaff
          ? "Staff member updated successfully!"
          : "Staff member added successfully!"
      );
    } catch (error) {
      console.error("Error saving staff: ", error);
      alert("Failed to save staff member. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember);
    setNewStaff({ ...staffMember });
    setIsAddingStaff(true);
  };

  const handleDeleteStaff = async (staffId) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        const staffDocRef = doc(
          db,
          `artifacts/${appId}/users/${userId}/staff/${staffId}`
        );
        await deleteDoc(staffDocRef);
        alert("Staff member deleted successfully!");
      } catch (error) {
        console.error("Error deleting staff: ", error);
        alert("Failed to delete staff member.");
      }
    }
  };

  const resetForm = () => {
    setNewStaff({
      name: "",
      role: "Server",
      phone: "",
      email: "",
      hourlyRate: "",
      availability: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true,
      },
      skills: [],
      notes: "",
    });
    setIsAddingStaff(false);
    setEditingStaff(null);
  };

  const toggleSkill = (skill) => {
    const currentSkills = newStaff.skills || [];
    const updatedSkills = currentSkills.includes(skill)
      ? currentSkills.filter((s) => s !== skill)
      : [...currentSkills, skill];
    setNewStaff((prev) => ({ ...prev, skills: updatedSkills }));
  };

  const toggleAvailability = (day) => {
    setNewStaff((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: !prev.availability[day],
      },
    }));
  };

  const getRoleColor = (role) => {
    const colors = {
      Manager: "bg-purple-100 text-purple-800",
      Chef: "bg-red-100 text-red-800",
      Server: "bg-blue-100 text-blue-800",
      Bartender: "bg-green-100 text-green-800",
      "Kitchen Assistant": "bg-orange-100 text-orange-800",
      "Setup Crew": "bg-gray-100 text-gray-800",
      "Cleanup Crew": "bg-yellow-100 text-yellow-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <header className="mb-8 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Staff Management</h1>
            <p className="text-gray-500 mt-1">
              Manage your team members and their assignments.
            </p>
          </div>
          <button
            onClick={() => setIsAddingStaff(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-700"
          >
            <UserPlus size={20} />
            Add Staff Member
          </button>
        </div>
      </header>

      {/* Staff Grid */}
      {staff.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white rounded-lg shadow">
          <User size={48} className="mx-auto text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-800">
            No Staff Members
          </h2>
          <p className="mt-1 text-gray-500">
            Add your first team member to get started.
          </p>
          <button
            onClick={() => setIsAddingStaff(true)}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Add Staff Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {member.name}
                    </h3>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                        member.role
                      )}`}
                    >
                      {member.role}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditStaff(member)}
                    className="p-1 text-blue-500 hover:text-blue-700"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(member.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-500" />
                    <span>{member.phone}</span>
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-500" />
                    <span>{member.email}</span>
                  </div>
                )}
                {member.hourlyRate && (
                  <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-gray-500" />
                    <span>${member.hourlyRate}/hour</span>
                  </div>
                )}
              </div>

              {/* Availability */}
              {member.availability && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    AVAILABILITY
                  </p>
                  <div className="flex gap-1">
                    {Object.entries(member.availability).map(
                      ([day, available]) => (
                        <span
                          key={day}
                          className={`w-8 h-8 rounded text-xs flex items-center justify-center font-medium ${
                            available
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {dayNames[day]}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Skills */}
              {member.skills && member.skills.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    SKILLS
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {member.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {member.skills.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                        +{member.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {isAddingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) =>
                    setNewStaff((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={newStaff.role}
                  onChange={(e) =>
                    setNewStaff((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm"
                >
                  {staffRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newStaff.phone}
                  onChange={(e) =>
                    setNewStaff((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) =>
                    setNewStaff((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newStaff.hourlyRate}
                  onChange={(e) =>
                    setNewStaff((prev) => ({
                      ...prev,
                      hourlyRate: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>

            {/* Availability */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <div className="grid grid-cols-7 gap-2">
                {Object.entries(dayNames).map(([day, shortName]) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleAvailability(day)}
                    className={`p-2 rounded text-sm font-medium transition-colors ${
                      newStaff.availability[day]
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    } border`}
                  >
                    {shortName}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {staffSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`p-2 rounded text-xs font-medium transition-colors text-left ${
                      (newStaff.skills || []).includes(skill)
                        ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    } border`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={newStaff.notes}
                onChange={(e) =>
                  setNewStaff((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="w-full rounded-md border-gray-300 shadow-sm"
                rows="3"
                placeholder="Additional notes about this staff member..."
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStaff}
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : editingStaff ? "Update" : "Add"} Staff
                Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EventForm({ db, userId, onBack, existingEvent = null }) {
  const [formData, setFormData] = useState({
    title: "",
    eventDate: "",
    eventTime: "",
    guestCount: "",
    clientInfo: {
      name: "",
      email: "",
      phone: "",
      organization: "",
    },
    eventType: "private",
    location: "Villa Hirschberg",
    status: "Inquiry",
    contractSigned: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existingEvent) {
      setFormData(existingEvent);
    }
  }, [existingEvent]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes(".")) {
      const [section, field] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.eventDate || !formData.clientInfo.name) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSaving(true);
    try {
      const eventData = {
        ...formData,
        guestCount: parseInt(formData.guestCount) || 0,
        updatedAt: new Date().toISOString(),
      };

      if (existingEvent) {
        const eventDocRef = doc(
          db,
          `artifacts/${appId}/users/${userId}/events/${existingEvent.id}`
        );
        await updateDoc(eventDocRef, eventData);
        alert("Event updated successfully!");
      } else {
        eventData.createdAt = new Date().toISOString();
        await addDoc(
          collection(db, `artifacts/${appId}/users/${userId}/events`),
          eventData
        );
        alert("Event created successfully!");
      }
      onBack();
    } catch (error) {
      console.error("Error saving event: ", error);
      alert("Failed to save event. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="text-2xl font-bold">
          {existingEvent ? "Edit Event" : "New Event"}
        </h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <select
              name="eventType"
              value={formData.eventType}
              onChange={handleInputChange}
              className="w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="private">Private Event</option>
              <option value="corporate">Corporate Event</option>
              <option value="wedding">Wedding</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleInputChange}
              className="w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              type="time"
              name="eventTime"
              value={formData.eventTime}
              onChange={handleInputChange}
              className="w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guest Count
            </label>
            <input
              type="number"
              name="guestCount"
              value={formData.guestCount}
              onChange={handleInputChange}
              className="w-full rounded-md border-gray-300 shadow-sm"
              min="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="Inquiry">Inquiry</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name *
              </label>
              <input
                type="text"
                name="clientInfo.name"
                value={formData.clientInfo.name}
                onChange={handleInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <input
                type="text"
                name="clientInfo.organization"
                value={formData.clientInfo.organization}
                onChange={handleInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="clientInfo.email"
                value={formData.clientInfo.email}
                onChange={handleInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="clientInfo.phone"
                value={formData.clientInfo.phone}
                onChange={handleInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="contractSigned"
            checked={formData.contractSigned}
            onChange={handleInputChange}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Contract Signed
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-6">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : existingEvent ? "Update" : "Create"} Event
          </button>
        </div>
      </form>
    </div>
  );
}

// --- PHASE 3: CLIENT PORTAL & CONTRACTS ---

// Client Portal Page - Secure view for clients to access their event information
function ClientPortalPage({ events, clients, navigateTo }) {
    const [selectedClientId, setSelectedClientId] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [authenticatedClient, setAuthenticatedClient] = useState(null);
    const [clientEvents, setClientEvents] = useState([]);

    // Mock access codes for demo (in production, these would be generated securely)
    const clientAccessCodes = {
        'client1': 'VH2024-001',
        'client2': 'VH2024-002',
        'client3': 'VH2024-003'
    };

    const handleClientLogin = () => {
        const client = clients.find(c => c.id === selectedClientId);
        if (client && clientAccessCodes[selectedClientId] === accessCode) {
            setAuthenticatedClient(client);
            const eventsForClient = events.filter(e => e.clientId === selectedClientId);
            setClientEvents(eventsForClient);
        } else {
            alert('Invalid client or access code. Please try again.');
        }
    };

    const handleLogout = () => {
        setAuthenticatedClient(null);
        setClientEvents([]);
        setAccessCode('');
        setSelectedClientId('');
    };

    const renderLoginForm = () => (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
                <MenuIcon className="text-indigo-600 mx-auto mb-4" size={48} />
                <h2 className="text-2xl font-bold text-gray-800">VH Banquets</h2>
                <p className="text-gray-600">Client Portal Access</p>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Your Event</label>
                    <select
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm"
                    >
                        <option value="">Choose your event...</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>
                                {client.name} - {client.email}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Access Code</label>
                    <input
                        type="text"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        placeholder="Enter your access code"
                        className="w-full rounded-md border-gray-300 shadow-sm"
                    />
                </div>
                
                <button
                    onClick={handleClientLogin}
                    disabled={!selectedClientId || !accessCode}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-300"
                >
                    Access My Event
                </button>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Demo Access Codes:</h3>
                <div className="text-sm text-blue-700 space-y-1">
                    {Object.entries(clientAccessCodes).map(([clientId, code]) => {
                        const client = clients.find(c => c.id === clientId);
                        return client ? (
                            <div key={clientId}>• {client.name}: {code}</div>
                        ) : null;
                    })}
                </div>
            </div>
        </div>
    );

    const renderClientDashboard = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{authenticatedClient.name}</h2>
                        <p className="text-sm text-gray-500">
                            Your Event Dashboard
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Logout
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <h3 className="font-semibold text-indigo-800">Contact Information</h3>
                        <div className="text-sm text-indigo-700 mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                                <Mail size={14} className="text-gray-500" />
                                {authenticatedClient.email}
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={14} className="text-gray-500" />
                                {authenticatedClient.phone}
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-semibold text-green-800">Total Events</h3>
                        <div className="text-2xl font-bold text-green-700 mt-2">
                            {clientEvents.length}
                        </div>
                    </div>
                    
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h3 className="font-semibold text-purple-800">Upcoming Events</h3>
                        <div className="text-2xl font-bold text-purple-700 mt-2">
                            {clientEvents.filter(e => new Date(e.date) > new Date()).length}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Your Events</h3>
                <div className="space-y-4">
                    {clientEvents.length === 0 ? (
                        <p className="text-gray-500">No events found for your account.</p>
                    ) : (
                        clientEvents.map(event => (
                            <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold">{event.name}</h4>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        event.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                        event.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {event.status}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Calendar size={14} className="text-gray-500" />
                                            <span className="font-medium">Date:</span> {event.date}
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock size={14} className="text-gray-500" />
                                            <span className="font-medium">Time:</span> {event.time}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <UsersIcon size={14} className="text-gray-500" />
                                            <span className="font-medium">Guests:</span> {event.guestCount}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MenuIcon size={14} className="text-gray-500" />
                                            <span className="font-medium">Event Type:</span> {event.eventType}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        {event.menu && (
                                            <div className="mb-2">
                                                <span className="font-medium">Menu Selections:</span>
                                                <div className="text-xs text-gray-600 mt-1">
                                                    {Object.entries(event.menu).map(([category, items]) => 
                                                        Array.isArray(items) && items.length > 0 && (
                                                            <div key={category}>{category}: {items.length} items</div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {event.financials && (
                                            <div>
                                                <span className="font-medium">Event Total:</span>
                                                <div className="text-lg font-bold text-green-600">
                                                    ${event.financials.grandTotal || 0}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                                    <button
                                        onClick={() => navigateTo('clientEventView', event)}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
                                    >
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => navigateTo('clientContract', event)}
                                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                                    >
                                        View Contract
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Client Portal</h1>
}

// Contracts Page - Digital contract generation and signing
function ContractsPage({ events, db, userId, navigateTo }) {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [contractTemplate, setContractTemplate] = useState('standard');
    const [generatedContract, setGeneratedContract] = useState('');
    const [signatureData, setSignatureData] = useState(null);

    const contractTemplates = {
        standard: {
            name: 'Standard Banquet Contract',
            content: `BANQUET AND CATERING AGREEMENT

This Agreement is made between VH Banquets ("Caterer") and {{CLIENT_NAME}} ("Client") for the following event:

EVENT DETAILS:
Event Name: {{EVENT_NAME}}
Date: {{EVENT_DATE}}
Time: {{EVENT_TIME}}
Guest Count: {{GUEST_COUNT}}
Location: {{VENUE}}

MENU SELECTIONS:
{{MENU_DETAILS}}

FINANCIAL TERMS:
Subtotal: ${{SUBTOTAL}}
Service Charge (22%): ${{SERVICE_CHARGE}}
Tax: ${{TAX}}
Total Amount: ${{TOTAL}}

PAYMENT SCHEDULE:
- Deposit (50%): ${{DEPOSIT}} - Due upon signing
- Final Payment: ${{FINAL_PAYMENT}} - Due 7 days before event

TERMS AND CONDITIONS:
1. Final guest count must be confirmed 72 hours prior to event
2. Menu changes after 14 days before event may incur additional charges
3. Client is responsible for any damages to venue or equipment
4. Cancellation policy: 30 days notice required for full refund
5. Force majeure events may require rescheduling

By signing below, both parties agree to the terms outlined in this contract.

Client Signature: _______________________ Date: _______
{{CLIENT_NAME}}

Caterer Signature: _______________________ Date: _______
VH Banquets Representative`
        },
        premium: {
            name: 'Premium Event Contract',
            content: `PREMIUM BANQUET AND CATERING AGREEMENT

This Premium Agreement is made between VH Banquets ("Caterer") and {{CLIENT_NAME}} ("Client").

[Similar structure but with additional premium terms, liability coverage, etc.]`
        }
    };

    const generateContract = (event) => {
        if (!event) return '';

        const template = contractTemplates[contractTemplate];
        let contract = template.content;

        // Replace template variables
        const replacements = {
            '{{CLIENT_NAME}}': event.clientName || 'Client Name',
            '{{EVENT_NAME}}': event.name || 'Event',
            '{{EVENT_DATE}}': event.date || 'TBD',
            '{{EVENT_TIME}}': event.time || 'TBD',
            '{{GUEST_COUNT}}': event.guestCount || '0',
            '{{VENUE}}': event.venue || 'VH Banquets Location',
            '{{MENU_DETAILS}}': generateMenuSummary(event),
            '{{SUBTOTAL}}': event.financials?.subtotal || '0.00',
            '{{SERVICE_CHARGE}}': event.financials?.serviceCharge || '0.00',
            '{{TAX}}': event.financials?.tax || '0.00',
            '{{TOTAL}}': event.financials?.grandTotal || '0.00',
            '{{DEPOSIT}}': ((event.financials?.grandTotal || 0) * 0.5).toFixed(2),
            '{{FINAL_PAYMENT}}': ((event.financials?.grandTotal || 0) * 0.5).toFixed(2)
        };

        Object.entries(replacements).forEach(([placeholder, value]) => {
            contract = contract.replace(new RegExp(placeholder, 'g'), value);
        });

        return contract;
    };

    const generateMenuSummary = (event) => {
        if (!event.menu) return 'Menu details to be finalized';

        let summary = '';
        Object.entries(event.menu).forEach(([category, items]) => {
            if (Array.isArray(items) && items.length > 0) {
                summary += `${category.toUpperCase()}:\n`;
                items.forEach(item => {
                    summary += `- ${item.name || item}\n`;
                });
                summary += '\n';
            }
        });

        return summary || 'Standard menu selections';
    };

    const handleEventSelect = (event) => {
        setSelectedEvent(event);
        setGeneratedContract(generateContract(event));
    };

    const handleSendForSignature = () => {
        if (!selectedEvent) return;

        // In a real implementation, this would:
        // 1. Save the contract to the database
        // 2. Send an email to the client with a secure signing link
        // 3. Create a digital signature workflow

        alert(`Contract sent to ${selectedEvent.clientName} for digital signature. They will receive an email with a secure signing link.`);
    };

    const renderContractsList = () => (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Event Contracts</h3>
                <div className="flex gap-2">
                    <select
                        value={contractTemplate}
                        onChange={(e) => setContractTemplate(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm text-sm"
                    >
                        {Object.entries(contractTemplates).map(([key, template]) => (
                            <option key={key} value={key}>{template.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-3">
                {events.length === 0 ? (
                    <p className="text-gray-500">No events available for contract generation.</p>
                ) : (
                    events.map(event => (
                        <div 
                            key={event.id} 
                            className={`border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 ${
                                selectedEvent?.id === event.id ? 'border-indigo-500 bg-indigo-50' : ''
                            }`}
                            onClick={() => handleEventSelect(event)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-semibold">{event.name}</h4>
                                    <p className="text-sm text-gray-600">
                                        {event.clientName} • {event.date} • {event.guestCount} guests
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        event.contractStatus === 'signed' ? 'bg-green-100 text-green-800' :
                                        event.contractStatus === 'sent' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {event.contractStatus || 'Draft'}
                                    </span>
                                    {event.financials?.grandTotal && (
                                        <span className="text-sm font-medium text-green-600">
                                            ${event.financials.grandTotal}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const renderContractPreview = () => (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Contract Preview</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.print()}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                    >
                        Print
                    </button>
                    <button
                        onClick={handleSendForSignature}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                        Send for Signature
                    </button>
                </div>
            </div>

            {selectedEvent ? (
                <div className="border border-gray-300 rounded-lg p-6 bg-gray-50 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                        {generatedContract}
                    </pre>
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Select an event to generate and preview its contract</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Contract Management</h1>
                    <p className="text-gray-600">Generate and manage digital contracts for events</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigateTo('dashboard')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                    >
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderContractsList()}
                {renderContractPreview()}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Digital Contract Features:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Automatically generates contracts from event data</li>
                    <li>• Customizable contract templates for different event types</li>
                    <li>• Digital signature workflow with secure client access</li>
                    <li>• Email notifications and reminders</li>
                    <li>• PDF generation and printing capabilities</li>
                    <li>• Contract status tracking and management</li>
                </ul>
            </div>
        </div>
    );
}
