const Store = (() => {
  /* ---------- Helpers ---------- */
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /* ---------- Cart ---------- */
  let _cart = read('cart', []);

  function getCart() { return [..._cart]; }

  function addToCart(product, qty = 1) {
    const existing = _cart.find(i => i.id === product.id && i.selectedPack === product.selectedPack);
    if (existing) {
      existing.qty += qty;
    } else {
      _cart.push({
        id:    product.id,
        name:  product.name,
        price: product.selectedPrice || product.price,
        image: product.image,
        qty,
        selectedPack: product.selectedPack,
        selectedPrice: product.selectedPrice,
        priceKey: product.priceKey,
        prices: product.prices,
        category: product.category,
      });
    }
    _saveCart();
    _emit('cart:update');
  }

  function removeFromCart(productId) {
    _cart = _cart.filter(i => i.id !== productId);
    _saveCart();
    _emit('cart:update');
  }

  function changeQty(productId, delta) {
    const item = _cart.find(i => i.id === productId);
    if (!item) return;
    item.qty = Math.max(0, item.qty + delta);
    if (item.qty === 0) removeFromCart(productId);
    else { _saveCart(); _emit('cart:update'); }
  }

  function changeQtyByIndex(index, delta) {
    if (index < 0 || index >= _cart.length) return;
    _cart[index].qty = Math.max(0, _cart[index].qty + delta);
    if (_cart[index].qty === 0) {
      _cart.splice(index, 1);
    }
    _saveCart();
    _emit('cart:update');
  }

  function updateCartItem(index, updatedItem) {
    if (index >= 0 && index < _cart.length) {
      _cart[index] = { ..._cart[index], ...updatedItem };
      _saveCart();
      _emit('cart:update');
    }
  }

  function clearCart() { _cart = []; _saveCart(); _emit('cart:update'); }

  function cartTotal() {
    return _cart.reduce((s, i) => s + (i.selectedPrice || i.price) * i.qty, 0);
  }
  function cartCount() {
    return _cart.reduce((s, i) => s + i.qty, 0);
  }

  function _saveCart() {
    const user = getUser();
    if (user && user.id) {
      write(`cart_${user.id}`, _cart);
    } else {
      write('cart', _cart);
    }
  }

  function loadUserCart(userId) {
    const userCart = read(`cart_${userId}`, null);
    if (userCart) {
      _cart = userCart;
    } else {
      _cart = [];
    }
    write('cart', _cart);
  }

  function saveGuestCart() {
    write('cart', _cart);
  }

  function clearGuestCart() {
    write('cart', []);
  }

  /* ---------- User ---------- */
  let _user = read('user', null);

  function getUser() { return _user ? { ..._user } : null; }

  function setUser(data) {
    _user = data;
    write('user', data);
    _emit('user:update');
  }

  function logout() {
    const userId = _user?.id;
    if (userId) {
      write(`cart_${userId}`, _cart);
    }
    _user = null;
    localStorage.removeItem('user');
    _cart = [];
    write('cart', []);
    _emit('user:update');
    _emit('cart:update');
  }

  function isLoggedIn() { return !!_user; }

  function isAdmin() { return _user && _user.role === 'admin'; }

  /* ---------- User profile ---------- */
  function getProfile() { return read('userProfile', null); }
  function saveProfile(data) { write('userProfile', data); }

  /* ---------- Bonuses ---------- */
  function getBonuses() {
    const user = getUser();
    if (user && user.id) {
      return read(`bonuses_${user.id}`, 50.0);
    }
    return read('userBonuses', 50.0);
  }
  function setBonuses(val) {
    const user = getUser();
    if (user && user.id) {
      write(`bonuses_${user.id}`, val);
    } else {
      write('userBonuses', val);
    }
  }
  function addBonuses(amount) {
    const current = getBonuses();
    setBonuses(current + amount);
  }

  /* ---------- Avatar ---------- */
  function getAvatar() { return localStorage.getItem('userAvatar') || null; }
  function setAvatar(dataUrl) { localStorage.setItem('userAvatar', dataUrl); }

  /* ---------- Admin Data (consultations, orders, events, users, products) ---------- */
  function getAdminData(key) { return read(`admin_${key}`, []); }
  function setAdminData(key, data) { write(`admin_${key}`, data); }

  function getProducts() { return getAdminData('products'); }
  function addProduct(data) {
    const products = getProducts();
    products.push(data);
    setAdminData('products', products);
  }
  function updateProduct(id, updates) {
    const products = getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      setAdminData('products', products);
    }
  }
  function deleteProduct(id) {
    const products = getProducts().filter(p => p.id !== id);
    setAdminData('products', products);
  }

  function getConsultations() { return getAdminData('consultations'); }
  function addConsultation(data) {
    const consultations = getConsultations();
    consultations.push(data);
    setAdminData('consultations', consultations);
  }
  function updateConsultation(id, updates) {
    const consultations = getConsultations();
    const index = consultations.findIndex(c => c.id === id);
    if (index !== -1) {
      consultations[index] = { ...consultations[index], ...updates };
      setAdminData('consultations', consultations);
    }
  }
  function deleteConsultation(id) {
    const consultations = getConsultations().filter(c => c.id !== id);
    setAdminData('consultations', consultations);
  }

  function getOrders() {
    const user = getUser();
    if (user && user.id) {
      return read(`orders_${user.id}`, []);
    }
    return getAdminData('orders');
  }
  function addOrder(data) {
    const user = getUser();
    if (user && user.id) {
      const orders = read(`orders_${user.id}`, []);
      orders.push(data);
      write(`orders_${user.id}`, orders);
    } else {
      const orders = getAdminData('orders');
      orders.push(data);
      setAdminData('orders', orders);
    }
  }
  function updateOrder(id, updates) {
    const user = getUser();
    if (user && user.id) {
      const orders = read(`orders_${user.id}`, []);
      const index = orders.findIndex(o => o.id === id);
      if (index !== -1) {
        orders[index] = { ...orders[index], ...updates };
        write(`orders_${user.id}`, orders);
      }
    } else {
      const orders = getAdminData('orders');
      const index = orders.findIndex(o => o.id === id);
      if (index !== -1) {
        orders[index] = { ...orders[index], ...updates };
        setAdminData('orders', orders);
      }
    }
  }

  function getEvents() { return getAdminData('events'); }
  function addEvent(data) {
    const events = getEvents();
    events.push(data);
    setAdminData('events', events);
  }
  function updateEvent(id, updates) {
    const events = getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index !== -1) {
      events[index] = { ...events[index], ...updates };
      setAdminData('events', events);
    }
  }
  function deleteEvent(id) {
    const events = getEvents().filter(e => e.id !== id);
    setAdminData('events', events);
  }

  function getEventRegistrations() { return getAdminData('eventRegistrations'); }
  function addEventRegistration(data) {
    const registrations = getEventRegistrations();
    registrations.push(data);
    setAdminData('eventRegistrations', registrations);
  }
  function updateEventRegistration(id, updates) {
    const registrations = getEventRegistrations();
    const index = registrations.findIndex(r => r.id === id);
    if (index !== -1) {
      registrations[index] = { ...registrations[index], ...updates };
      setAdminData('eventRegistrations', registrations);
    }
  }
  function deleteEventRegistration(id) {
    const registrations = getEventRegistrations().filter(r => r.id !== id);
    setAdminData('eventRegistrations', registrations);
  }

  function getUsers() { return getAdminData('users'); }
  function addUser(data) {
    const users = getUsers();
    users.push(data);
    setAdminData('users', users);
  }
  function updateUser(id, updates) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      setAdminData('users', users);
    }
  }
  function deleteUser(id) {
    const users = getUsers().filter(u => u.id !== id);
    setAdminData('users', users);
  }

  /* ---------- Simple event bus ---------- */
  const _listeners = {};
  function on(event, cb) {
    (_listeners[event] = _listeners[event] || []).push(cb);
  }
  function _emit(event, data) {
    (_listeners[event] || []).forEach(cb => cb(data));
  }

  /* Public */
  return {
    getCart, addToCart, removeFromCart,
    changeQty, changeQtyByIndex, updateCartItem, clearCart, cartTotal, cartCount,
    loadUserCart, saveGuestCart, clearGuestCart,
    getUser, setUser, logout, isLoggedIn, isAdmin,
    getProfile, saveProfile,
    getBonuses, setBonuses, addBonuses,
    getAvatar, setAvatar,
    getProducts, addProduct, updateProduct, deleteProduct,
    getConsultations, addConsultation, updateConsultation, deleteConsultation,
    getOrders, addOrder, updateOrder,
    getEvents, addEvent, updateEvent, deleteEvent,
    getEventRegistrations, addEventRegistration, updateEventRegistration, deleteEventRegistration,
    getUsers, addUser, updateUser, deleteUser,
    on,
  };
})();