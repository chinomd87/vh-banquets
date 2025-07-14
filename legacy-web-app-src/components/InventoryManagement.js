import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft, Boxes, Plus, Search, Edit, AlertTriangle, Trash2, Package, TrendingUp, Settings, Save, X } from 'lucide-react';
import { useDb, useAuth } from '../contexts/AppContext';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

// Inventory categories
const INVENTORY_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'tables', label: 'Tables' },
  { value: 'chairs', label: 'Chairs' },
  { value: 'linens', label: 'Linens' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'decor', label: 'Decor' },
  { value: 'catering', label: 'Catering' },
  { value: 'lighting', label: 'Lighting' },
];

// Item status helpers
const getItemStatus = (quantity, minStock) => {
  if (quantity === 0) return 'out';
  if (quantity <= minStock) return 'critical';
  if (quantity <= minStock * 1.5) return 'low';
  return 'good';
};

const getStatusColor = (status) => {
  switch (status) {
    case 'good': return 'bg-green-100 text-green-800';
    case 'low': return 'bg-yellow-100 text-yellow-800';
    case 'critical': return 'bg-orange-100 text-orange-800';
    case 'out': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status) => {
  if (status === 'critical' || status === 'low' || status === 'out') {
    return <AlertTriangle size={16} className="text-orange-500" />;
  }
  return null;
};

// Add/Edit Item Modal
const ItemModal = ({ item, isOpen, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'tables',
    quantity: 0,
    minStock: 5,
    description: '',
    location: '',
    cost: 0,
    supplier: '',
    ...item
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        category: item.category || 'tables',
        quantity: item.quantity || 0,
        minStock: item.minStock || 5,
        description: item.description || '',
        location: item.location || '',
        cost: item.cost || 0,
        supplier: item.supplier || ''
      });
    } else {
      setFormData({
        name: '',
        category: 'tables',
        quantity: 0,
        minStock: 5,
        description: '',
        location: '',
        cost: 0,
        supplier: ''
      });
    }
  }, [item, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {item ? 'Edit Item' : 'Add New Item'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="item-name" className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                id="item-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Round Tables (60 inch)"
                required
              />
            </div>

            <div>
              <label htmlFor="item-category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="item-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {INVENTORY_CATEGORIES.slice(1).map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="item-quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  id="item-quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="item-minstock" className="block text-sm font-medium text-gray-700 mb-1">
                  Min Stock
                </label>
                <input
                  id="item-minstock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label htmlFor="item-location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                id="item-location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Storage Room A, Shelf 2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="item-cost" className="block text-sm font-medium text-gray-700 mb-1">
                  Cost per Unit ($)
                </label>
                <input
                  id="item-cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="item-supplier" className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <input
                  id="item-supplier"
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Supplier name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="item-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="item-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows="3"
                placeholder="Additional details about this item..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <Save size={16} />
                {item ? 'Update' : 'Add'} Item
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

ItemModal.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string,
    category: PropTypes.string,
    quantity: PropTypes.number,
    minStock: PropTypes.number,
    description: PropTypes.string,
    location: PropTypes.string,
    cost: PropTypes.number,
    supplier: PropTypes.string
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired
};

export function InventoryManagement({ navigateTo }) {
  const db = useDb();
  const { user } = useAuth();
  
  // State management
  const [inventoryItems, setInventoryItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time Firebase data fetching
  useEffect(() => {
    if (!db || !user) return;

    const appId = process.env.REACT_APP_VH_BANQUETS_APP_ID || "vh-banquets-app";
    const inventoryCollection = collection(db, `artifacts/${appId}/users/${user.uid}/inventory`);
    const inventoryQuery = query(inventoryCollection, orderBy('name'));

    const unsubscribe = onSnapshot(inventoryQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: getItemStatus(doc.data().quantity || 0, doc.data().minStock || 5)
      }));
      setInventoryItems(items);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory data');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db, user]);

  // Computed values
  const filteredAndSortedItems = useMemo(() => {
    let filtered = inventoryItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.location?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort items
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        if (aValue < bValue) return -1;
        if (aValue > bValue) return 1;
        return 0;
      } else {
        if (aValue > bValue) return -1;
        if (aValue < bValue) return 1;
        return 0;
      }
    });

    return filtered;
  }, [inventoryItems, searchTerm, selectedCategory, sortBy, sortDirection]);

  const inventoryStats = useMemo(() => {
    return {
      totalItems: inventoryItems.length,
      totalValue: inventoryItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.cost || 0)), 0),
      lowStockItems: inventoryItems.filter(item => item.status === 'low').length,
      criticalItems: inventoryItems.filter(item => item.status === 'critical').length,
      outOfStockItems: inventoryItems.filter(item => item.status === 'out').length,
      categories: [...new Set(inventoryItems.map(item => item.category))].length
    };
  }, [inventoryItems]);

  // CRUD Operations
  const handleAddItem = async (itemData) => {
    if (!db || !user) return;

    setIsSubmitting(true);
    try {
      const appId = process.env.REACT_APP_VH_BANQUETS_APP_ID || "vh-banquets-app";
      const inventoryCollection = collection(db, `artifacts/${appId}/users/${user.uid}/inventory`);
      
      await addDoc(inventoryCollection, {
        ...itemData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      toast.success('Item added successfully!');
      setShowModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItem = async (itemData) => {
    if (!db || !user || !editingItem) return;

    setIsSubmitting(true);
    try {
      const appId = process.env.REACT_APP_VH_BANQUETS_APP_ID || "vh-banquets-app";
      const itemDoc = doc(db, `artifacts/${appId}/users/${user.uid}/inventory`, editingItem.id);
      
      await updateDoc(itemDoc, {
        ...itemData,
        updatedAt: new Date().toISOString()
      });
      
      toast.success('Item updated successfully!');
      setShowModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!db || !user) return;
    
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const appId = process.env.REACT_APP_VH_BANQUETS_APP_ID || "vh-banquets-app";
      const itemDoc = doc(db, `artifacts/${appId}/users/${user.uid}/inventory`, itemId);
      
      await deleteDoc(itemDoc);
      toast.success('Item deleted successfully!');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleQuantityUpdate = async (itemId, newQuantity) => {
    if (!db || !user) return;

    try {
      const appId = process.env.REACT_APP_VH_BANQUETS_APP_ID || "vh-banquets-app";
      const itemDoc = doc(db, `artifacts/${appId}/users/${user.uid}/inventory`, itemId);
      
      await updateDoc(itemDoc, {
        quantity: newQuantity,
        updatedAt: new Date().toISOString()
      });
      
      toast.success('Quantity updated!');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
          <p className="text-gray-600">Real-time tracking and management of banquet equipment and supplies</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Plus size={16} />
            Add Item
          </button>
          <button
            onClick={() => navigateTo('dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-800">{inventoryStats.totalItems}</p>
            </div>
            <Boxes className="text-gray-500" size={32} />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              Total Value: ${inventoryStats.totalValue.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Needs Attention</p>
              <p className="text-2xl font-bold text-orange-600">
                {inventoryStats.lowStockItems + inventoryStats.criticalItems + inventoryStats.outOfStockItems}
              </p>
            </div>
            <AlertTriangle className="text-orange-500" size={32} />
          </div>
          <div className="mt-2">
            <span className="text-sm text-orange-600">
              {inventoryStats.outOfStockItems} out of stock
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-blue-600">{inventoryStats.categories}</p>
            </div>
            <Package className="text-blue-500" size={32} />
          </div>
          <div className="mt-2">
            <span className="text-sm text-blue-600">
              Active categories
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Value</p>
              <p className="text-2xl font-bold text-green-600">
                ${inventoryStats.totalItems > 0 ? Math.round(inventoryStats.totalValue / inventoryStats.totalItems) : 0}
              </p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600">
              Per item
            </span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {INVENTORY_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <select
              value={`${sortBy}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortBy(field);
                setSortDirection(direction);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="quantity-desc">Quantity High-Low</option>
              <option value="quantity-asc">Quantity Low-High</option>
              <option value="category-asc">Category A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Inventory Items</h3>
          <span className="text-sm text-gray-600">{filteredAndSortedItems.length} items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Item {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('category')}
                >
                  Category {sortBy === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantity')}
                >
                  Quantity {sortBy === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(item.status)}
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600 capitalize">{item.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityUpdate(item.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500"
                        min="0"
                      />
                      <span className="text-xs text-gray-500">/ {item.minStock}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{item.location || 'Not specified'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      ${((item.quantity || 0) * (item.cost || 0)).toLocaleString()}
                    </span>
                    {item.cost > 0 && (
                      <div className="text-xs text-gray-500">${item.cost} each</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingItem(item);
                          setShowModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit item"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredAndSortedItems.length === 0 && (
            <div className="text-center py-12">
              <Boxes size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first inventory item'
                }
              </p>
              {!searchTerm && selectedCategory === 'all' && (
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setShowModal(true);
                  }}
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  <Plus size={16} />
                  Add First Item
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Professional Features */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
          <Settings className="text-blue-600" size={20} />
          Professional Inventory Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="text-blue-700">
              <strong>✓ Real-time Tracking:</strong> Live updates across all devices
            </p>
            <p className="text-blue-700">
              <strong>✓ Smart Alerts:</strong> Automatic low stock notifications
            </p>
            <p className="text-blue-700">
              <strong>✓ Quick Updates:</strong> Inline quantity editing
            </p>
            <p className="text-blue-700">
              <strong>✓ Advanced Search:</strong> Search by name, location, description
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-blue-700">
              <strong>✓ Cost Tracking:</strong> Per-item and total value calculation
            </p>
            <p className="text-blue-700">
              <strong>✓ Location Management:</strong> Track where items are stored
            </p>
            <p className="text-blue-700">
              <strong>✓ Category Organization:</strong> Organize by equipment type
            </p>
            <p className="text-blue-700">
              <strong>✓ Supplier Tracking:</strong> Maintain vendor relationships
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <ItemModal
        item={editingItem}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingItem(null);
        }}
        onSave={editingItem ? handleUpdateItem : handleAddItem}
        isLoading={isSubmitting}
      />
    </div>
  );
}

InventoryManagement.propTypes = {
  navigateTo: PropTypes.func.isRequired
};
