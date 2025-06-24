import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from 'react-hot-toast';
import { Menu as MenuIcon } from 'lucide-react';
import PropTypes from 'prop-types';

function ClientPortalPage({ navigateTo }) {
    const [accessCode, setAccessCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [authenticatedClient, setAuthenticatedClient] = useState(null);
    const [clientEvents, setClientEvents] = useState([]);

    // NOTE: This component no longer receives `events` or `clients` props.
    // All data is fetched securely from the backend.

    const handleClientLogin = async () => {
        if (!accessCode) {
            toast.error("Please enter an access code.");
            return;
        }

        setIsLoading(true);
        try {
            const functions = getFunctions();
            const getClientEventData = httpsCallable(functions, 'getClientEventData');
            const result = await getClientEventData({ accessCode });
            
            const { client, events } = result.data;
            setAuthenticatedClient(client);
            setClientEvents(events);
            toast.success("Welcome! Access granted.");

        } catch (error) {
            console.error("Authentication error:", error);
            toast.error(error.message || 'Invalid access code.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        setAuthenticatedClient(null);
        setClientEvents([]);
        setAccessCode('');
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
                    <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-1">Access Code</label>
                    <input
                        id="accessCode"
                        type="text"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        placeholder="Enter your unique event access code"
                        className="w-full rounded-md border-gray-300 shadow-sm"
                    />
                </div>
                
                <button
                    onClick={handleClientLogin}
                    disabled={isLoading || !accessCode}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                >
                    {isLoading ? 'Verifying...' : 'Access My Event'}
                </button>
            </div>
        </div>
    );
    
    const renderClientDashboard = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{authenticatedClient?.name}</h2>
                        <p className="text-sm text-gray-500">Your Event Dashboard</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Logout
                    </button>
                </div>
                
                <div className="space-y-4">
                    {clientEvents.map(event => (
                        <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold">{event.title || event.eventName}</h4>
                            <p className="text-sm text-gray-600">{event.eventDate}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Client Portal</h1>
                <p className="text-gray-600">Access and manage your event details</p>
            </div>

            {authenticatedClient ? renderClientDashboard() : renderLoginForm()}
        </div>
    );
}

ClientPortalPage.propTypes = {
    navigateTo: PropTypes.func.isRequired
};

export default ClientPortalPage;