const API = (() => {
  const BASE = './data';

  /* Generic fetch with error handling */
  async function fetchJSON(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
    return response.json();
  }

  /* ---- Products ---- */
  async function getProducts() {
    // Check localStorage first for admin-added products
    const localProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
    if (localProducts.length > 0) {
      return localProducts;
    }
    // Fall back to JSON file
    return fetchJSON(`${BASE}/products.json`);
  }

  async function getProductById(id) {
    const products = await getProducts();
    return products.find(p => p.id === Number(id)) || null;
  }

  async function getProductsByCategory(category) {
    const products = await getProducts();
    if (!category || category === 'all') return products;
    return products.filter(p => p.category === category);
  }

  async function getBestsellers(limit = 4) {
    const products = await getProducts();
    return products.filter(p => p.availability.isBestseller).slice(0, limit);
  }

  async function searchProducts(query) {
    const products = await getProducts();
    const q = query.toLowerCase().trim();
    if (!q) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tastingNotes.some(n => n.toLowerCase().includes(q)) ||
      (p.metadata.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  /* ---- Categories ---- */
  async function getCategories() {
    return fetchJSON(`${BASE}/categories.json`);
  }

  /* ---- Orders ---- */
  async function getOrders() {
    return fetchJSON(`${BASE}/orders.json`);
  }

  /* ---- Consultations ---- */
  async function getConsultations() {
    return fetchJSON(`${BASE}/consultations.json`);
  }

  /* ---- Events ---- */
  async function getEvents() {
    return fetchJSON(`${BASE}/events.json`);
  }

  /* ---- Event Registrations ---- */
  async function getEventRegistrations() {
    return fetchJSON(`${BASE}/event-registrations.json`);
  }

  /* ---- Users ---- */
  async function getUsers() {
    return fetchJSON(`${BASE}/users.json`);
  }

  /* ---- Promo Codes ---- */
  async function getPromoCodes() {
    return fetchJSON(`${BASE}/promocodes.json`);
  }

  /* Public interface */
  return {
    getProducts,
    getProductById,
    getProductsByCategory,
    getBestsellers,
    searchProducts,
    getCategories,
    getOrders,
    getConsultations,
    getEvents,
    getEventRegistrations,
    getUsers,
    getPromoCodes,
  };
})();