const AdminView = (() => {
  let _products = [];
  let _orders = [];
  let _consultations = [];
  let _events = [];
  let _eventRegistrations = [];
  let _users = [];
  let _currentTab = 'products';
  let _editingProduct = null;

  /* ---- Render admin panel ---- */
  async function render(params = []) {
    if (!Store.isAdmin()) {
      Toast.show('Access denied. Admin only.', 'error');
      Router.navigate('signin');
      return;
    }

    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="admin-view">
        <section class="admin-hero" aria-labelledby="admin-title">
          <div class="container">
            <span class="deco-circle"></span>
            <p class="meta-tag">ADMINISTRATION PANEL</p>
            <h1 id="admin-title" class="heading-xl">Content Management</h1>
            <p class="lead">Manage products, categories, and orders</p>
          </div>
        </section>

        <div class="container">
          <!-- Admin Tabs -->
          <div class="admin-tabs" role="tablist" aria-label="Admin sections">
            <button class="tab-btn admin-tab ${_currentTab === 'products' ? 'active' : ''}"
                    data-tab="products" role="tab" aria-selected="${_currentTab === 'products'}">
              Products
            </button>
            <button class="tab-btn admin-tab ${_currentTab === 'orders' ? 'active' : ''}"
                    data-tab="orders" role="tab" aria-selected="${_currentTab === 'orders'}">
              Orders
            </button>
            <button class="tab-btn admin-tab ${_currentTab === 'consultations' ? 'active' : ''}"
                    data-tab="consultations" role="tab" aria-selected="${_currentTab === 'consultations'}">
              Consultations
            </button>
            <button class="tab-btn admin-tab ${_currentTab === 'events' ? 'active' : ''}"
                    data-tab="events" role="tab" aria-selected="${_currentTab === 'events'}">
              Events
            </button>
            <button class="tab-btn admin-tab ${_currentTab === 'users' ? 'active' : ''}"
                    data-tab="users" role="tab" aria-selected="${_currentTab === 'users'}">
              Users
            </button>
          </div>

          <!-- Tab Content -->
          <div class="admin-content" id="admin-content">
            <div class="spinner"></div>
          </div>
        </div>
      </div>
    `;

    _attachTabHandlers();
    await _loadData();
    _renderContent();
  }

  /* ---- Load data ---- */
  async function _loadData() {
    try {
      // Initialize products from JSON if localStorage is empty
      let products = Store.getProducts();
      if (products.length === 0) {
        products = await API.getProducts();
        products.forEach(product => Store.addProduct(product));
      }
      _products = Store.getProducts();
      
      // Initialize orders from JSON if localStorage is empty
      let orders = Store.getOrders();
      if (orders.length === 0) {
        orders = await API.getOrders();
        orders.forEach(order => Store.addOrder(order));
      }
      _orders = Store.getOrders();
      
      // Migrate existing orders to include weight field
      _migrateOrdersWithWeight();
      
      // Initialize consultations from JSON if localStorage is empty
      let consultations = Store.getConsultations();
      if (consultations.length === 0) {
        consultations = await API.getConsultations();
        consultations.forEach(cons => Store.addConsultation(cons));
      }
      _consultations = Store.getConsultations();
      
      // Initialize events from JSON if localStorage is empty
      let events = Store.getEvents();
      if (events.length === 0) {
        events = await API.getEvents();
        events.forEach(event => Store.addEvent(event));
      }
      _events = Store.getEvents();

      // Initialize event registrations from JSON if localStorage is empty
      let eventRegistrations = Store.getEventRegistrations();
      if (eventRegistrations.length === 0) {
        eventRegistrations = await API.getEventRegistrations();
        eventRegistrations.forEach(reg => Store.addEventRegistration(reg));
      }
      _eventRegistrations = Store.getEventRegistrations();

      // Initialize users from JSON if localStorage is empty
      let users = Store.getUsers();
      if (users.length === 0) {
        users = await API.getUsers();
        users.forEach(user => Store.addUser(user));
      }
      _users = Store.getUsers();
    } catch (e) {
      Toast.show('Failed to load data', 'error');
    }
  }

  /* ---- Migrate orders to include weight field ---- */
  function _migrateOrdersWithWeight() {
    let needsUpdate = false;
    _orders.forEach(order => {
      order.items.forEach(item => {
        if (!item.weight) {
          const product = _products.find(p => p.id === item.productId);
          if (product) {
            item.weight = _getWeightForProduct(product, item.price);
            needsUpdate = true;
          }
        }
      });
    });
    
    if (needsUpdate) {
      _orders.forEach(order => {
        Store.updateOrder(order.id, order);
      });
      _orders = Store.getOrders();
    }
  }

  /* ---- Get weight for product based on price ---- */
  function _getWeightForProduct(product, price) {
    if (!product.prices) return 'N/A';
    
    const priceEntries = Object.entries(product.prices);
    for (const [weight, productPrice] of priceEntries) {
      if (Math.abs(productPrice - price) < 0.01) {
        return weight;
      }
    }
    
    // Default to first available weight if no match
    return Object.keys(product.prices)[0] || 'N/A';
  }

  /* ---- Tab handlers ---- */
  function _attachTabHandlers() {
    document.querySelectorAll('.admin-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        _currentTab = btn.dataset.tab;
        _renderContent();
      });
    });
  }

  /* ---- Render content based on tab ---- */
  function _renderContent() {
    const content = document.getElementById('admin-content');
    if (!content) return;

    switch (_currentTab) {
      case 'products':
        _renderProducts(content);
        break;
      case 'orders':
        _renderOrders(content);
        break;
      case 'consultations':
        _renderConsultations(content);
        break;
      case 'events':
        _renderEvents(content);
        break;
      case 'users':
        _renderUsers(content);
        break;
    }
  }

  /* ---- Format price range ---- */
  function _formatPriceRange(product) {
    if (!product.prices || Object.keys(product.prices).length === 0) {
      return `$${product.price.toFixed(2)}`;
    }
    const prices = Object.values(product.prices);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) {
      return `$${min.toFixed(2)}`;
    }
    return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
  }

  /* ---- Render products table ---- */
  function _renderProducts(container) {
    container.innerHTML = `
      <div class="admin-section">
        <div class="admin-header">
          <h2 class="heading-lg">Products</h2>
          <button class="btn btn-primary" id="add-product-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Product
          </button>
        </div>

        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${_products.map(p => `
                <tr data-id="${p.id}">
                  <td>${p.id}</td>
                  <td><img src="${p.image}" alt="${p.name}" class="admin-thumb"></td>
                  <td>${p.name}</td>
                  <td>${p.category}</td>
                  <td>${_formatPriceRange(p)}</td>
                  <td>${p.availability.stockLevel}</td>
                  <td>
                    <button class="btn-icon btn-sm admin-edit-btn" data-id="${p.id}" aria-label="Edit product">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button class="btn-icon btn-sm admin-delete-btn" data-id="${p.id}" aria-label="Delete product">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    _attachProductHandlers();
  }

  /* ---- Render orders ---- */
  function _renderOrders(container) {
    container.innerHTML = `
      <div class="admin-section">
        <div class="admin-header">
          <h2 class="heading-lg">Orders</h2>
          <div class="admin-stats">
            <span class="stat-badge">Total: ${_orders.length}</span>
          </div>
        </div>

        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${_orders.length === 0 ? `
                <tr>
                  <td colspan="7" class="text-center">No orders yet</td>
                </tr>
              ` : _orders.map(order => `
                <tr data-id="${order.id}">
                  <td><strong>${order.id}</strong></td>
                  <td>${order.date}</td>
                  <td>${order.customer?.name || 'N/A'}</td>
                  <td>${order.items.length} item(s)</td>
                  <td>$${order.total.toFixed(2)}</td>
                  <td>
                    <select class="status-select" data-id="${order.id}" aria-label="Change order status">
                      <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                      <option value="in-progress" ${order.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                      <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                      <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <button class="btn-icon btn-sm admin-view-btn" data-id="${order.id}" aria-label="View order">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    _attachOrderHandlers();
  }

  /* ---- Product handlers ---- */
  function _attachProductHandlers() {
    document.getElementById('add-product-btn')?.addEventListener('click', () => {
      _showProductForm();
    });

    document.querySelectorAll('.admin-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const product = _products.find(p => p.id === Number(btn.dataset.id));
        if (product) _showProductForm(product);
      });
    });

    document.querySelectorAll('.admin-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this product?')) {
          const id = Number(btn.dataset.id);
          _products = _products.filter(p => p.id !== id);
          Store.deleteProduct(id);
          Toast.show('Product deleted', 'success');
          _renderProducts(document.getElementById('admin-content'));
        }
      });
    });
  }

  /* ---- Order handlers ---- */
  function _attachOrderHandlers() {
    document.querySelectorAll('.admin-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const order = _orders.find(o => o.id === btn.dataset.id);
        if (order) _showOrderDetails(order);
      });
    });

    document.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const orderId = e.target.dataset.id;
        const newStatus = e.target.value;
        const order = _orders.find(o => o.id === orderId);
        if (order) {
          order.status = newStatus;
          Store.updateOrder(orderId, { status: newStatus });
          Toast.show(`Order status updated to ${newStatus}`, 'success');
          _renderOrders(document.getElementById('admin-content'));
        }
      });
    });
  }

  /* ---- Show order details ---- */
  function _showOrderDetails(order) {
    const modal = document.createElement('div');
    modal.className = 'admin-modal-overlay';
    modal.innerHTML = `
      <div class="admin-modal">
        <div class="admin-modal-header">
          <h2 class="heading-md">Order Details: ${order.id}</h2>
          <button class="btn-icon admin-modal-close" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="admin-modal-body">
          <div class="order-details">
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${order.date}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="status-badge status-${order.status}">${order.status}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total:</span>
              <span class="detail-value">$${order.total.toFixed(2)}</span>
            </div>
            ${order.customer ? `
            <h3 class="detail-section-title">Customer Information</h3>
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${order.customer.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone:</span>
              <span class="detail-value">${order.customer.phone}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value">${order.customer.email}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Address:</span>
              <span class="detail-value">${order.customer.address}, ${order.customer.city}</span>
            </div>
            ` : ''}
            <h3 class="detail-section-title">Items</h3>
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Weight</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.weight || 'N/A'}</td>
                    <td>${item.qty}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>$${(item.qty * item.price).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${order.subtotal !== undefined ? `
            <h3 class="detail-section-title">Order Summary</h3>
            <div class="detail-row">
              <span class="detail-label">Subtotal:</span>
              <span class="detail-value">$${order.subtotal.toFixed(2)}</span>
            </div>
            ${order.promoDiscount > 0 ? `
            <div class="detail-row">
              <span class="detail-label">Promo Discount:</span>
              <span class="detail-value">-$${order.promoDiscount.toFixed(2)}</span>
            </div>
            ` : ''}
            ${order.bonusDiscount > 0 ? `
            <div class="detail-row">
              <span class="detail-label">Bonus Discount:</span>
              <span class="detail-value">-$${order.bonusDiscount.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Tax:</span>
              <span class="detail-value">$${order.tax.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Shipping:</span>
              <span class="detail-value">$${order.shipping.toFixed(2)}</span>
            </div>
            ` : ''}
          </div>
        </div>
        <div class="admin-modal-footer">
          <button class="btn btn-outline admin-modal-close-btn">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.admin-modal-close')?.addEventListener('click', () => modal.remove());
    modal.querySelector('.admin-modal-close-btn')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  /* ---- Show product form ---- */
  function _showProductForm(product = null) {
    const isEdit = !!product;
    const form = document.createElement('div');
    form.className = 'admin-modal-overlay';
    form.innerHTML = `
      <div class="admin-modal">
        <div class="admin-modal-header">
          <h2 class="heading-md">${isEdit ? 'Edit Product' : 'Add Product'}</h2>
          <button class="btn-icon admin-modal-close" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <form class="admin-form" id="product-form">
          <div class="form-row">
            <div class="form-group">
              <label for="p-name">Product Name</label>
              <input class="form-control" type="text" id="p-name" required
                     value="${product?.name || ''}" placeholder="Product name">
            </div>
            <div class="form-group">
              <label for="p-category">Category</label>
              <select class="form-control" id="p-category" required>
                <option value="">Select category</option>
                <option value="Specialty Coffee" ${product?.category === 'Specialty Coffee' ? 'selected' : ''}>Specialty Coffee</option>
                <option value="Craft Syrups" ${product?.category === 'Craft Syrups' ? 'selected' : ''}>Craft Syrups</option>
                <option value="Premium Tea" ${product?.category === 'Premium Tea' ? 'selected' : ''}>Premium Tea</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="p-subcategory">Subcategory</label>
              <input class="form-control" type="text" id="p-subcategory"
                     value="${product?.subcategory || ''}" placeholder="e.g., Single Origin, Flavored Syrups">
            </div>
            <div class="form-group">
              <label for="p-sku">SKU</label>
              <input class="form-control" type="text" id="p-sku"
                     value="${product?.metadata?.sku || ''}" placeholder="e.g., COF-BRA-SAN-001">
            </div>
          </div>


          <div class="form-row">
            <div class="form-group">
              <label for="p-stock">Stock Level</label>
              <input class="form-control" type="number" id="p-stock" required
                     value="${product?.availability?.stockLevel || 0}" placeholder="0">
            </div>
            <div class="form-group">
              <label for="p-rating">Rating (0-5)</label>
              <input class="form-control" type="number" step="0.1" min="0" max="5" id="p-rating"
                     value="${product?.metadata?.rating || 4.0}" placeholder="4.0">
            </div>
          </div>

          <div class="form-group">
            <label for="p-category">Prices by Volume</label>
            <div id="prices-container" class="prices-grid">
              <p class="price-hint">Select a category to see available volume options</p>
            </div>
          </div>

          <div class="form-group">
            <label for="p-image">Image URL</label>
            <input class="form-control" type="text" id="p-image" required
                   value="${product?.image || ''}" placeholder="images/product.png">
          </div>

          <div class="form-group">
            <label for="p-description">Description</label>
            <textarea class="form-control" id="p-description" rows="3"
                      placeholder="Product description">${product?.description || ''}</textarea>
          </div>

          <div class="form-group">
            <label for="p-long-description">Long Description</label>
            <textarea class="form-control" id="p-long-description" rows="5"
                      placeholder="Detailed product description">${product?.longDescription || ''}</textarea>
          </div>

          <div class="form-group">
            <label for="p-tasting-notes">Tasting Notes (comma-separated)</label>
            <input class="form-control" type="text" id="p-tasting-notes"
                   value="${product?.tastingNotes?.join(', ') || ''}"
                   placeholder="Chocolate, Caramel, Nuts">
          </div>

          <div class="form-group">
            <label>Specifications</label>
            <div id="specifications-container" class="specs-grid">
              <p class="specs-hint">Select a category to see available specification fields</p>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group checkbox-group">
              <input type="checkbox" id="p-bestseller" ${product?.availability?.isBestseller ? 'checked' : ''}>
              <label for="p-bestseller">Bestseller</label>
            </div>
            <div class="form-group checkbox-group">
              <input type="checkbox" id="p-new" ${product?.availability?.isNew ? 'checked' : ''}>
              <label for="p-new">New</label>
            </div>
            <div class="form-group checkbox-group">
              <input type="checkbox" id="p-sale" ${product?.availability?.isOnSale ? 'checked' : ''}>
              <label for="p-sale">On Sale</label>
            </div>
          </div>

          <div class="admin-modal-footer">
            <button type="button" class="btn btn-outline admin-cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Product</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(form);

    form.querySelector('.admin-modal-close')?.addEventListener('click', () => form.remove());
    form.querySelector('.admin-cancel-btn')?.addEventListener('click', () => form.remove());
    form.addEventListener('click', (e) => {
      if (e.target === form) form.remove();
    });

    form.querySelector('#product-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      _saveProduct(form, product);
    });

    // Dynamic price fields based on category
    const categorySelect = form.querySelector('#p-category');
    const pricesContainer = form.querySelector('#prices-container');
    const specsContainer = form.querySelector('#specifications-container');

    function updatePriceFields(category) {
      const priceFields = {
        'Specialty Coffee': [
          { key: '250g', label: '250g' },
          { key: '1kg', label: '1kg' }
        ],
        'Craft Syrups': [
          { key: '250ml', label: '250ml' },
          { key: '1L', label: '1L' }
        ],
        'Premium Tea': [
          { key: '100g', label: '100g' },
          { key: '500g', label: '500g' }
        ]
      };

      const fields = priceFields[category] || [];
      const existingPrices = product?.prices || {};

      pricesContainer.innerHTML = fields.map(field => `
        <div class="form-group">
          <label for="p-price-${field.key}">Price for ${field.label} ($)</label>
          <input class="form-control" type="number" step="0.01"
                 id="p-price-${field.key}" required
                 value="${existingPrices[field.key] || ''}" placeholder="0.00">
        </div>
      `).join('');
    }

    function updateSpecificationFields(category) {
      const specFields = {
        'Specialty Coffee': [
          { key: 'roast', label: 'Roast', placeholder: 'Medium' },
          { key: 'origin', label: 'Origin', placeholder: 'Brazil, São Paulo' },
          { key: 'process', label: 'Process', placeholder: 'Natural' },
          { key: 'altitude', label: 'Altitude', placeholder: '800–1200m' },
          { key: 'variety', label: 'Variety', placeholder: 'Bourbon, Catuai' },
          { key: 'harvest', label: 'Harvest', placeholder: '2024' }
        ],
        'Craft Syrups': [
          { key: 'volume', label: 'Volume', placeholder: '250ml' },
          { key: 'origin', label: 'Origin', placeholder: 'Ukraine, Kyiv' },
          { key: 'process', label: 'Process', placeholder: 'Artisanal' },
          { key: 'variety', label: 'Variety', placeholder: 'Madagascar Vanilla' },
          { key: 'bestBefore', label: 'Best Before', placeholder: '6 months' }
        ],
        'Premium Tea': [
          { key: 'origin', label: 'Origin', placeholder: 'China, Fujian' },
          { key: 'process', label: 'Process', placeholder: 'Scented' },
          { key: 'altitude', label: 'Altitude', placeholder: '800–1200m' },
          { key: 'variety', label: 'Variety', placeholder: 'Jasmine Pearls' },
          { key: 'harvest', label: 'Harvest', placeholder: 'Spring 2024' }
        ]
      };

      const fields = specFields[category] || [];
      const existingSpecs = product?.specifications || {};

      specsContainer.innerHTML = fields.map(field => `
        <div class="form-group">
          <label for="p-spec-${field.key}">${field.label}</label>
          <input class="form-control" type="text"
                 id="p-spec-${field.key}"
                 value="${existingSpecs[field.key] || ''}" placeholder="${field.placeholder}">
        </div>
      `).join('');
    }

    // Initial render
    const initialCategory = categorySelect?.value;
    if (initialCategory) {
      updatePriceFields(initialCategory);
      updateSpecificationFields(initialCategory);
    }

    // Update on category change
    categorySelect?.addEventListener('change', (e) => {
      updatePriceFields(e.target.value);
      updateSpecificationFields(e.target.value);
    });
  }

  /* ---- Save product ---- */
  function _saveProduct(form, existingProduct) {
    const tastingNotes = document.getElementById('p-tasting-notes').value
      .split(',')
      .map(n => n.trim())
      .filter(n => n);

    const category = document.getElementById('p-category').value;

    // Collect dynamic price fields
    const priceFields = {
      'Specialty Coffee': ['250g', '1kg'],
      'Craft Syrups': ['250ml', '1L'],
      'Premium Tea': ['100g', '500g']
    };

    const prices = {};
    (priceFields[category] || []).forEach(key => {
      const input = document.getElementById(`p-price-${key}`);
      if (input) {
        prices[key] = parseFloat(input.value) || 0;
      }
    });

    // Calculate basePrice from the first available price
    const priceValues = Object.values(prices);
    const basePrice = priceValues.length > 0 ? priceValues[0] : 0;
    const originalPrice = null;

    // Collect dynamic specification fields
    const specFieldKeys = {
      'Specialty Coffee': ['roast', 'origin', 'process', 'altitude', 'variety', 'harvest'],
      'Craft Syrups': ['volume', 'origin', 'process', 'variety', 'bestBefore'],
      'Premium Tea': ['origin', 'process', 'altitude', 'variety', 'harvest']
    };

    const specifications = {};
    (specFieldKeys[category] || []).forEach(key => {
      const input = document.getElementById(`p-spec-${key}`);
      if (input && input.value.trim()) {
        specifications[key] = input.value.trim();
      }
    });

    const productData = {
      id: existingProduct?.id || Date.now(),
      name: document.getElementById('p-name').value,
      category: category,
      subcategory: document.getElementById('p-subcategory').value || null,
      price: basePrice,
      originalPrice: originalPrice,
      prices: prices,
      image: document.getElementById('p-image').value,
      description: document.getElementById('p-description').value,
      longDescription: document.getElementById('p-long-description').value || '',
      tastingNotes: tastingNotes,
      specifications: specifications,
      availability: {
        inStock: true,
        stockLevel: parseInt(document.getElementById('p-stock').value),
        isBestseller: document.getElementById('p-bestseller').checked,
        isNew: document.getElementById('p-new').checked,
        isOnSale: document.getElementById('p-sale').checked
      },
      metadata: {
        sku: document.getElementById('p-sku').value || `SKU-${Date.now()}`,
        rating: parseFloat(document.getElementById('p-rating').value) || 4.0,
        reviews: existingProduct?.metadata?.reviews || 0,
        tags: tastingNotes.map(t => t.toLowerCase())
      }
    };

    if (existingProduct) {
      const index = _products.findIndex(p => p.id === existingProduct.id);
      if (index !== -1) _products[index] = productData;
      Store.updateProduct(existingProduct.id, productData);
      Toast.show('Product updated successfully', 'success');
    } else {
      _products.push(productData);
      Store.addProduct(productData);
      Toast.show('Product added successfully', 'success');
    }

    form.remove();
    _renderProducts(document.getElementById('admin-content'));
  }

  /* ---- Render consultations ---- */
  function _renderConsultations(container) {
    container.innerHTML = `
      <div class="admin-section">
        <div class="admin-header">
          <h2 class="heading-lg">Consultation Requests</h2>
          <div class="admin-stats">
            <span class="stat-badge">Total: ${_consultations.length}</span>
            <span class="stat-badge stat-pending">Pending: ${_consultations.filter(c => c.status === 'pending').length}</span>
          </div>
        </div>

        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Topic</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${_consultations.length === 0 ? `
                <tr>
                  <td colspan="7" class="text-center">No consultation requests</td>
                </tr>
              ` : _consultations.map(cons => `
                <tr data-id="${cons.id}">
                  <td><strong>${cons.id}</strong></td>
                  <td>${cons.date}</td>
                  <td>${cons.name}</td>
                  <td>${cons.phone}</td>
                  <td class="topic-cell">${cons.topic}</td>
                  <td>
                    <span class="status-badge status-${cons.status}">${cons.status}</span>
                  </td>
                  <td>
                    <button class="btn-icon btn-sm admin-contact-btn" data-id="${cons.id}" aria-label="Mark as contacted">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </button>
                    <button class="btn-icon btn-sm admin-delete-btn" data-id="${cons.id}" aria-label="Delete request">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    _attachConsultationHandlers();
  }

  /* ---- Consultation handlers ---- */
  function _attachConsultationHandlers() {
    document.querySelectorAll('.admin-contact-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cons = _consultations.find(c => c.id === btn.dataset.id);
        if (cons) {
          Store.updateConsultation(cons.id, { status: 'contacted' });
          cons.status = 'contacted';
          Toast.show('Marked as contacted', 'success');
          _renderConsultations(document.getElementById('admin-content'));
        }
      });
    });

    document.querySelectorAll('.admin-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this request?')) {
          Store.deleteConsultation(btn.dataset.id);
          _consultations = _consultations.filter(c => c.id !== btn.dataset.id);
          Toast.show('Request deleted', 'success');
          _renderConsultations(document.getElementById('admin-content'));
        }
      });
    });
  }

  /* ---- Render events ---- */
  function _renderEvents(container) {
    container.innerHTML = `
      <div class="admin-section">
        <div class="admin-header">
          <h2 class="heading-lg">Events Management</h2>
        </div>

        <div class="event-content" id="event-content">
          <div class="spinner"></div>
        </div>
      </div>
    `;

    _renderEventRegistrations(document.getElementById('event-content'));
  }

  /* ---- Render event registrations CRM ---- */
  function _renderEventRegistrations(container) {
    container.innerHTML = `
      <div class="admin-section">
        <div class="admin-header">
          <h3 class="heading-md">Event Registrations CRM</h3>
          <div class="admin-stats">
            <span class="stat-badge">Total: ${_eventRegistrations.length}</span>
            <span class="stat-badge stat-pending">New: ${_eventRegistrations.filter(r => r.status === 'New Request').length}</span>
          </div>
        </div>

        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date/Time</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Event</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${_eventRegistrations.length === 0 ? `
                <tr>
                  <td colspan="8" class="text-center">No registrations yet</td>
                </tr>
              ` : _eventRegistrations.map(reg => `
                <tr data-id="${reg.id}">
                  <td><strong>${reg.id}</strong></td>
                  <td>${new Date(reg.timestamp).toLocaleString('uk-UA')}</td>
                  <td>${reg.name}</td>
                  <td>${reg.phone}</td>
                  <td>${reg.email}</td>
                  <td>${reg.eventName}</td>
                  <td>
                    <select class="status-select" data-id="${reg.id}" aria-label="Change registration status">
                      <option value="New Request" ${reg.status === 'New Request' ? 'selected' : ''}>New Request</option>
                      <option value="Called" ${reg.status === 'Called' ? 'selected' : ''}>Called</option>
                      <option value="Confirmed" ${reg.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                      <option value="No Answer" ${reg.status === 'No Answer' ? 'selected' : ''}>No Answer</option>
                      <option value="Rejected" ${reg.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                    </select>
                  </td>
                  <td>
                    <button class="btn-icon btn-sm admin-delete-btn" data-id="${reg.id}" aria-label="Delete registration">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    _attachEventRegistrationHandlers();
  }

  /* ---- Event registration handlers ---- */
  function _attachEventRegistrationHandlers() {
    document.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const regId = e.target.dataset.id;
        const newStatus = e.target.value;
        const reg = _eventRegistrations.find(r => r.id === regId);
        if (reg) {
          reg.status = newStatus;
          Store.updateEventRegistration(regId, { status: newStatus });
          Toast.show(`Status updated to ${newStatus}`, 'success');
          _renderEventRegistrations(document.getElementById('event-content'));
        }
      });
    });

    document.querySelectorAll('.admin-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this registration?')) {
          Store.deleteEventRegistration(btn.dataset.id);
          _eventRegistrations = _eventRegistrations.filter(r => r.id !== btn.dataset.id);
          Toast.show('Registration deleted', 'success');
          _renderEventRegistrations(document.getElementById('event-content'));
        }
      });
    });
  }

  /* ---- Render users ---- */
  function _renderUsers(container) {
    container.innerHTML = `
      <div class="admin-section">
        <div class="admin-header">
          <h2 class="heading-lg">User Accounts</h2>
          <div class="admin-stats">
            <span class="stat-badge">Total: ${_users.length}</span>
          </div>
        </div>

        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>City</th>
                <th>Orders</th>
                <th>Spent</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${_users.length === 0 ? `
                <tr>
                  <td colspan="9" class="text-center">No users yet</td>
                </tr>
              ` : _users.map(user => `
                <tr data-id="${user.id}">
                  <td><strong>${user.id}</strong></td>
                  <td>${user.name}</td>
                  <td>${user.email}</td>
                  <td>${user.phone}</td>
                  <td>${user.city}</td>
                  <td>${user.ordersCount}</td>
                  <td>$${user.totalSpent.toFixed(2)}</td>
                  <td>
                    <span class="role-badge role-${user.role}">${user.role}</span>
                  </td>
                  <td>
                    <button class="btn-icon btn-sm admin-edit-btn" data-id="${user.id}" aria-label="Edit user">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button class="btn-icon btn-sm admin-delete-btn" data-id="${user.id}" aria-label="Delete user">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    _attachUserHandlers();
  }

  /* ---- User handlers ---- */
  function _attachUserHandlers() {
    document.querySelectorAll('.admin-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const user = _users.find(u => u.id === btn.dataset.id);
        if (user) _showUserForm(user);
      });
    });

    document.querySelectorAll('.admin-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this user?')) {
          const id = btn.dataset.id;
          _users = _users.filter(u => u.id !== id);
          Store.deleteUser(id);
          Toast.show('User deleted', 'success');
          _renderUsers(document.getElementById('admin-content'));
        }
      });
    });
  }

  /* ---- Show user form ---- */
  function _showUserForm(user) {
    const form = document.createElement('div');
    form.className = 'admin-modal-overlay';
    form.innerHTML = `
      <div class="admin-modal">
        <div class="admin-modal-header">
          <h2 class="heading-md">Edit User</h2>
          <button class="btn-icon admin-modal-close" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <form class="admin-form" id="user-form">
          <div class="form-group">
            <label for="u-id">User ID</label>
            <input class="form-control" type="text" id="u-id" disabled
                   value="${user.id}">
          </div>

          <div class="form-group">
            <label for="u-name">Full Name</label>
            <input class="form-control" type="text" id="u-name" required
                   value="${user.name}" placeholder="John Doe">
          </div>

          <div class="form-group">
            <label for="u-email">Email</label>
            <input class="form-control" type="email" id="u-email" required
                   value="${user.email}" placeholder="your@email.com">
          </div>

          <div class="form-group">
            <label for="u-phone">Phone</label>
            <input class="form-control" type="tel" id="u-phone" required
                   value="${user.phone}" placeholder="+380 XX XXX XX XX">
          </div>

          <div class="form-group">
            <label for="u-city">City</label>
            <input class="form-control" type="text" id="u-city" required
                   value="${user.city}" placeholder="Kyiv">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="u-orders">Orders Count</label>
              <input class="form-control" type="number" id="u-orders" required
                     value="${user.ordersCount}" min="0">
            </div>
            <div class="form-group">
              <label for="u-spent">Total Spent ($)</label>
              <input class="form-control" type="number" step="0.01" id="u-spent" required
                     value="${user.totalSpent}" min="0">
            </div>
          </div>

          <div class="form-group">
            <label for="u-role">Role</label>
            <select class="form-control" id="u-role" required>
              <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </div>

          <div class="admin-modal-footer">
            <button type="button" class="btn btn-outline admin-cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary">Update User</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(form);

    form.querySelector('.admin-modal-close')?.addEventListener('click', () => form.remove());
    form.querySelector('.admin-cancel-btn')?.addEventListener('click', () => form.remove());
    form.addEventListener('click', (e) => {
      if (e.target === form) form.remove();
    });

    form.querySelector('#user-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      _saveUser(form, user);
    });
  }

  /* ---- Save user ---- */
  function _saveUser(form, existingUser) {
    const userData = {
      id: existingUser.id,
      name: document.getElementById('u-name').value,
      email: document.getElementById('u-email').value,
      phone: document.getElementById('u-phone').value,
      city: document.getElementById('u-city').value,
      ordersCount: parseInt(document.getElementById('u-orders').value),
      totalSpent: parseFloat(document.getElementById('u-spent').value),
      role: document.getElementById('u-role').value,
      registeredDate: existingUser.registeredDate
    };

    const index = _users.findIndex(u => u.id === existingUser.id);
    if (index !== -1) _users[index] = userData;
    Store.updateUser(existingUser.id, userData);
    Toast.show('User updated successfully', 'success');

    form.remove();
    _renderUsers(document.getElementById('admin-content'));
  }

  return { render };
})();
