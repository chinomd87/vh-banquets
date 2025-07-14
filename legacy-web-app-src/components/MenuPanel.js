import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { doc, writeBatch } from "firebase/firestore";
import { toast } from 'react-hot-toast';
import { useDb, useAuth } from '../contexts/AppContext';
import { calculateFinancials, formatCurrency } from '../utils/financials';

function MenuPanel({ event, onUpdate, readOnly = false }) {
    const db = useDb();
    const { user } = useAuth();
    const [menuSelections, setMenuSelections] = useState(event.menu || {});
    const [isSaving, setIsSaving] = useState(false);
    const [financialPreview, setFinancialPreview] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    
    // Enhanced menu items with more detailed information
    const menuItems = useMemo(() => ({
        appetizers: [
            { id: 'app1', name: 'Bruschetta', price: 8, description: 'Fresh tomatoes, basil, and garlic on toasted bread' },
            { id: 'app2', name: 'Spinach Artichoke Dip', price: 12, description: 'Creamy dip served with tortilla chips' },
            { id: 'app3', name: 'Shrimp Cocktail', price: 15, description: 'Fresh shrimp with cocktail sauce' }
        ],
        mainCourses: [
            { id: 'main1', name: 'Grilled Chicken', price: 25, description: 'Herb-seasoned grilled chicken breast' },
            { id: 'main2', name: 'Beef Tenderloin', price: 35, description: 'Premium beef tenderloin with red wine reduction' },
            { id: 'main3', name: 'Vegetarian Pasta', price: 20, description: 'Seasonal vegetables with penne pasta' }
        ],
        desserts: [
            { id: 'des1', name: 'Chocolate Cake', price: 8, description: 'Rich chocolate cake with ganache' },
            { id: 'des2', name: 'Tiramisu', price: 10, description: 'Classic Italian dessert with coffee and mascarpone' },
            { id: 'des3', name: 'Fresh Fruit Tart', price: 9, description: 'Seasonal fruit with pastry cream' }
        ]
    }), []);

    // Calculate financial preview whenever selections change
    useEffect(() => {
        if (event.guestCount && event.guestCount > 0) {
            const preview = calculateFinancials(
                menuSelections, 
                event.guestCount, 
                event.financials?.payments || [],
                menuItems
            );
            setFinancialPreview(preview);
        }
    }, [menuSelections, event.guestCount, event.financials?.payments, menuItems]);

    // Check if there are unsaved changes
    useEffect(() => {
        const currentSelections = JSON.stringify(menuSelections);
        const savedSelections = JSON.stringify(event.menu || {});
        setHasChanges(currentSelections !== savedSelections);
    }, [menuSelections, event.menu]);

    const handleItemToggle = (category, itemId) => {
        if (readOnly) return;
        
        setMenuSelections(prev => {
            const current = prev[category] || [];
            const updated = current.includes(itemId)
                ? current.filter(id => id !== itemId)
                : [...current, itemId];
            return { ...prev, [category]: updated };
        });
    };

    const getSelectedItemsCount = () => {
        return Object.values(menuSelections).reduce((total, items) => total + (items?.length || 0), 0);
    };

    const resetSelections = () => {
        setMenuSelections(event.menu || {});
        setHasChanges(false);
    };
    
    const handleSave = async () => {
        if (!event.id || !user?.uid) {
            toast.error("Unable to save: Missing event or user information");
            return;
        }

        if (getSelectedItemsCount() === 0) {
            toast.error("Please select at least one menu item");
            return;
        }

        setIsSaving(true);
        const eventDocRef = doc(db, `artifacts/vh-banquets-app/users/${user.uid}/events/${event.id}`);
        const batch = writeBatch(db);

        try {
            const newFinancials = calculateFinancials(
                menuSelections, 
                event.guestCount, 
                event.financials?.payments || [],
                menuItems
            );
            
            const updatedEvent = {
                ...event,
                menu: menuSelections,
                financials: { ...event.financials, ...newFinancials },
                lastModified: new Date()
            };

            batch.update(eventDocRef, {
                menu: menuSelections,
                financials: { ...event.financials, ...newFinancials },
                lastModified: new Date()
            });
            
            await batch.commit();

            onUpdate(updatedEvent);
            setHasChanges(false);
            toast.success("Menu saved and financials updated!");
        } catch (error) {
            console.error("Error saving menu: ", error);
            toast.error("Failed to save menu. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-semibold">Menu Selection</h3>
                <p className="text-gray-600">
                    Select items for your event{event.guestCount ? ` (${event.guestCount} guests)` : ''}
                    {readOnly && <span className="text-red-600 ml-2">(Read Only)</span>}
                </p>
            </div>
            
            {/* Financial Preview */}
            {financialPreview && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Cost Preview</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-blue-600">Subtotal</p>
                            <p className="font-semibold">{formatCurrency(financialPreview.subtotal)}</p>
                        </div>
                        <div>
                            <p className="text-blue-600">Service Charge</p>
                            <p className="font-semibold">{formatCurrency(financialPreview.serviceCharge)}</p>
                        </div>
                        <div>
                            <p className="text-blue-600">Tax</p>
                            <p className="font-semibold">{formatCurrency(financialPreview.tax)}</p>
                        </div>
                        <div>
                            <p className="text-blue-600">Total</p>
                            <p className="font-semibold text-lg">{formatCurrency(financialPreview.total)}</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Menu Categories */}
            <div className="space-y-6">
                {Object.entries(menuItems).map(([category, items]) => (
                    <div key={category} className="bg-white border rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-3 capitalize">
                            {category.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <div className="space-y-3">
                            {items.map(item => (
                                <div key={item.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                                    <label className="flex items-start space-x-3 cursor-pointer" aria-label={`Select ${item.name} menu item for ${formatCurrency(item.price)} per person`}>
                                        <input
                                            type="checkbox"
                                            checked={menuSelections[category]?.includes(item.id) || false}
                                            onChange={() => handleItemToggle(category, item.id)}
                                            disabled={readOnly}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                                            aria-describedby={`item-desc-${item.id}`}
                                        />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="font-medium">{item.name}</span>
                                                    <p id={`item-desc-${item.id}`} className="text-sm text-gray-600 mt-1">{item.description}</p>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <span className="font-semibold text-gray-800">{formatCurrency(item.price)}</span>
                                                    <p className="text-xs text-gray-500">per person</p>
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t">
                <div className="text-sm text-gray-600">
                    {getSelectedItemsCount()} item(s) selected
                    {hasChanges && <span className="text-orange-600 ml-2">• Unsaved changes</span>}
                </div>
                
                <div className="flex gap-3">
                    {hasChanges && !readOnly && (
                        <button
                            onClick={resetSelections}
                            disabled={isSaving}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Reset
                        </button>
                    )}
                    
                    {!readOnly && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !hasChanges || getSelectedItemsCount() === 0}
                            className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSaving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                            {isSaving ? "Saving..." : "Save Menu & Update Quote"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

MenuPanel.propTypes = {
    event: PropTypes.shape({
        id: PropTypes.string.isRequired,
        menu: PropTypes.object,
        guestCount: PropTypes.number.isRequired,
        financials: PropTypes.shape({
            payments: PropTypes.array
        })
    }).isRequired,
    onUpdate: PropTypes.func.isRequired,
    readOnly: PropTypes.bool
};

export default MenuPanel;