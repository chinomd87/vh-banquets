const SERVICE_CHARGE_RATE = 0.22;
const TAX_RATE = 0.08;

/**
 * Formats a number as a USD currency string.
 * @param {number} amount - The amount to format.
 * @returns {string} - The formatted currency string.
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount || 0);
};

/**
 * Default menu structure for financial calculations
 */
const MENU_STRUCTURE = {
  appetizers: [
    { id: 'app1', name: 'Bruschetta', price: 8 },
    { id: 'app2', name: 'Spinach Artichoke Dip', price: 12 },
    { id: 'app3', name: 'Shrimp Cocktail', price: 15 }
  ],
  mainCourses: [
    { id: 'main1', name: 'Grilled Chicken', price: 25 },
    { id: 'main2', name: 'Beef Tenderloin', price: 35 },
    { id: 'main3', name: 'Vegetarian Pasta', price: 20 }
  ],
  desserts: [
    { id: 'des1', name: 'Chocolate Cake', price: 8 },
    { id: 'des2', name: 'Tiramisu', price: 10 },
    { id: 'des3', name: 'Fresh Fruit Tart', price: 9 }
  ]
};

/**
 * Calculates the complete financial details for an event.
 * @param {object} menuSelections - The selected menu items for the event.
 * @param {number} guestCount - The number of guests.
 * @param {Array} payments - An array of payment objects.
 * @param {object} menuStructure - Optional custom menu structure.
 * @returns {object} - An object containing all financial calculations.
 */
export const calculateFinancials = (menuSelections = {}, guestCount = 0, payments = [], menuStructure = MENU_STRUCTURE) => {
  let subtotal = 0;
  const lineItems = [];

  // Calculate costs for each menu category
  Object.entries(menuSelections).forEach(([category, selectedItems]) => {
    if (selectedItems && selectedItems.length > 0) {
      const categoryItems = menuStructure[category] || [];
      
      selectedItems.forEach(itemId => {
        const item = categoryItems.find(menuItem => menuItem.id === itemId);
        if (item) {
          const itemTotal = item.price * guestCount;
          subtotal += itemTotal;
          lineItems.push({
            name: `${item.name} (${guestCount} guests)`,
            cost: itemTotal,
            category: category
          });
        }
      });
    }
  });

  const serviceCharge = subtotal * SERVICE_CHARGE_RATE;
  const tax = (subtotal + serviceCharge) * TAX_RATE;
  const total = subtotal + serviceCharge + tax;

  const paid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const balance = total - paid;

  // Add service charge and tax to line items
  if (serviceCharge > 0) {
    lineItems.push({
      name: `Service Charge (${(SERVICE_CHARGE_RATE * 100).toFixed(0)}%)`,
      cost: serviceCharge,
      category: 'fees'
    });
  }

  if (tax > 0) {
    lineItems.push({
      name: `Tax (${(TAX_RATE * 100).toFixed(0)}%)`,
      cost: tax,
      category: 'fees'
    });
  }

  return {
    subtotal,
    serviceCharge,
    tax,
    total,
    paid,
    balance,
    lineItems,
  };
};