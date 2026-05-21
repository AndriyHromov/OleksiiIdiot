const CartView = (() => {
  let PROMO_CODES = {};
  let _promoDisc  = 0;
  let _bonusDisc  = 0;
  const SHIP = 5.00;

  /* ---- Render full view ---- */
  async function render() {
    try {
      const promoData = await API.getPromoCodes();
      PROMO_CODES = {};
      promoData.forEach(p => {
        if (p.active) {
          PROMO_CODES[p.code.toUpperCase()] = p.discount / 100;
        }
      });
    } catch (e) {
      console.error('Failed to load promo codes:', e);
    }

    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="cart-page">

        <!-- Hero -->
        <section class="cart-hero" aria-labelledby="cart-title">
          <div class="container" style="position:relative;z-index:1">
            <span class="deco-circle"></span>
            <p class="meta-tag">YOUR ORDER</p>
            <h1 id="cart-title" class="heading-xl">Your Cart</h1>
            <p class="lead">Review your items and proceed to checkout</p>
          </div>
        </section>

        <div class="container">
          <div class="cart-dashboard">

            <!-- LEFT COLUMN -->
            <div class="cart-col">

              <!-- Cart items -->
              <div class="cart-panel">
                <div class="cart-panel-head">
                  <h2>Cart Items</h2>
                  <span id="cart-item-count" style="color:var(--clr-light);font-size:.9rem"></span>
                </div>
                <div class="cart-panel-body">
                  <div id="cart-items-container"></div>
                </div>
              </div>

              <!-- Order history -->
              <div class="cart-panel">
                <div class="cart-panel-head">
                  <h2>Order History</h2>
                </div>
                <div class="cart-panel-body">
                  <div class="history-filters">
                    <button class="history-filter-btn active" data-filter="all">All</button>
                    <button class="history-filter-btn" data-filter="new">New</button>
                    <button class="history-filter-btn" data-filter="in-progress">In progress</button>
                    <button class="history-filter-btn" data-filter="completed">Completed</button>
                  </div>
                  <div id="order-history-container"></div>
                </div>
              </div>

            </div>

            <!-- RIGHT COLUMN -->
            <div class="cart-col">

              <!-- Summary -->
              <div class="cart-panel">
                <div class="cart-panel-head"><h2>Order Summary</h2></div>
                <div class="cart-panel-body">

                  <!-- Promo -->
                  <div class="promo-row">
                    <div class="form-row">
                      <input class="form-control" type="text"
                             id="promo-input" placeholder="Promo code">
                      <button class="btn btn-outline" id="promo-btn">Apply</button>
                    </div>
                  </div>

                  <!-- Bonus -->
                  <div class="bonus-row">
                    <div class="bonus-balance">
                      <span class="label">Available bonuses</span>
                      <span class="value" id="bonus-balance-val">
                        $${Store.getBonuses().toFixed(2)}
                      </span>
                    </div>
                    <div class="form-row">
                      <input class="form-control" type="number"
                             id="bonus-input"
                             placeholder="Use bonuses" min="0" step="0.01">
                      <button class="btn btn-outline" id="bonus-btn">Apply</button>
                    </div>
                  </div>

                  <!-- Rows -->
                  <div class="summary-rows" id="summary-rows"></div>

                </div>
              </div>

              <!-- Contact & Delivery -->
              <div class="cart-panel">
                <div class="cart-panel-head"><h2>Contact &amp; Delivery</h2></div>
                <div class="cart-panel-body">
                  <form class="contact-form" id="contact-form" novalidate>
                    <div class="form-grid-2">
                      <div class="form-group">
                        <label for="cf-name">Full Name</label>
                        <input class="form-control" type="text"
                               id="cf-name" required autocomplete="name">
                      </div>
                      <div class="form-group">
                        <label for="cf-phone">Phone</label>
                        <input class="form-control" type="tel"
                               id="cf-phone" required autocomplete="tel">
                      </div>
                    </div>
                    <div class="form-group">
                      <label for="cf-email">Email</label>
                      <input class="form-control" type="email"
                             id="cf-email" required autocomplete="email">
                    </div>
                    <div class="form-group">
                      <label for="cf-address">Delivery Address</label>
                      <input class="form-control" type="text"
                             id="cf-address" required autocomplete="street-address">
                    </div>
                    <div class="form-grid-2">
                      <div class="form-group">
                        <label for="cf-city">City</label>
                        <input class="form-control" type="text"
                               id="cf-city" required autocomplete="address-level2">
                      </div>
                      <div class="form-group">
                        <label for="cf-notes">Notes</label>
                        <input class="form-control" type="text" id="cf-notes">
                      </div>
                    </div>
                  </form>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    `;

    _renderCartItems();
    _updateSummary();
    await _renderOrderHistory('all');
    _attachHandlers();
  }

  /* ---- Cart items ---- */
  function _renderCartItems() {
    const container = document.getElementById('cart-items-container');
    const cart = Store.getCart();
    const countEl = document.getElementById('cart-item-count');
    if (countEl) countEl.textContent = cart.length
      ? `${cart.length} item${cart.length > 1 ? 's' : ''}`
      : '';

    if (cart.length === 0) {
      container.innerHTML = `
        <div class="empty-cart">
          <p>Your cart is empty.</p>
          <a href="#catalog">Browse our catalog</a>
        </div>`;
      return;
    }

    container.innerHTML = `
      <ul class="cart-items-list">
        ${cart.map((item, index) => {
          const itemPrice = item.selectedPrice || item.price;
          const packagingLabel = _getPackagingLabel(item);
          const packagingOptions = _getPackagingOptions(item);
          
          return `
          <li class="cart-item" data-index="${index}">
            <img class="cart-item-img"
                 src="${item.image}"
                 alt="${item.name}"
                 data-id="${item.id}">
            <div class="cart-item-info">
              <span class="cart-item-name" data-id="${item.id}">
                ${item.name}
              </span>
              <span class="cart-item-packaging">${packagingLabel}</span>
              <span class="cart-item-price">
                $${itemPrice.toFixed(2)} each
              </span>
              <span class="cart-item-subtotal">
                $${(itemPrice * item.qty).toFixed(2)}
              </span>
            </div>
            <div class="cart-item-qty">
              <button class="qty-btn" data-index="${index}" data-delta="-1"
                      aria-label="Decrease quantity">−</button>
              <span class="qty-value">${item.qty}</span>
              <button class="qty-btn" data-index="${index}" data-delta="1"
                      aria-label="Increase quantity">+</button>
            </div>
            <div class="cart-item-packaging-select">
              <select class="packaging-select" data-index="${index}">
                ${packagingOptions.map(opt => `
                  <option value="${opt.value}" ${opt.value === (item.selectedPack || '250') ? 'selected' : ''}>
                    ${opt.label}
                  </option>
                `).join('')}
              </select>
            </div>
            <button class="cart-item-remove"
                    data-id="${item.id}"
                    aria-label="Remove ${item.name}">✕</button>
          </li>`;
        }).join('')}
      </ul>`;
  }

  function _getPackagingLabel(item) {
    if (!item.selectedPack) return '';
    const category = item.category;
    if (category === "Specialty Coffee") {
      return item.selectedPack === '1000' ? '1 kg' : '250 g';
    } else if (category === "Craft Syrups") {
      return item.selectedPack === '1000' ? '1 L' : '250 ml';
    } else if (category === "Premium Tea") {
      return item.selectedPack === '500' ? '500 g' : '100 g';
    }
    return item.selectedPack;
  }

  function _getPackagingOptions(item) {
    const category = item.category;
    if (category === "Specialty Coffee") {
      return [
        { value: "250", label: "250 g", priceKey: "250g" },
        { value: "1000", label: "1 kg", priceKey: "1kg" }
      ];
    } else if (category === "Craft Syrups") {
      return [
        { value: "250", label: "250 ml", priceKey: "250ml" },
        { value: "1000", label: "1 L", priceKey: "1L" }
      ];
    } else if (category === "Premium Tea") {
      return [
        { value: "100", label: "100 g", priceKey: "100g" },
        { value: "500", label: "500 g", priceKey: "500g" }
      ];
    }
    return [
      { value: "250", label: "250 g", priceKey: "250g" },
      { value: "1000", label: "1 kg", priceKey: "1kg" }
    ];
  }

  function _getWeightLabel(item) {
    const category = item.category;
    const selectedPack = item.selectedPack || '250';
    if (category === "Specialty Coffee") {
      return selectedPack === '1000' ? '1kg' : '250g';
    } else if (category === "Craft Syrups") {
      return selectedPack === '1000' ? '1L' : '250ml';
    } else if (category === "Premium Tea") {
      return selectedPack === '500' ? '500g' : '100g';
    }
    return selectedPack === '1000' ? '1kg' : '250g';
  }

  /* ---- Order history ---- */
  async function _renderOrderHistory(filter) {
    const container = document.getElementById('order-history-container');
    container.innerHTML = `<div class="spinner"></div>`;
    try {
      let orders = Store.getOrders();
      if (filter !== 'all') orders = orders.filter(o => o.status === filter);
      if (orders.length === 0) {
        container.innerHTML = `
          <div class="empty-cart">
            <p>No orders found.</p>
          </div>`;
        return;
      }
      container.innerHTML = orders.map(o => `
        <div class="order-item" data-id="${o.id}">
          <div class="order-head">
            <div class="order-meta">
              <span class="order-id">${o.id}</span>
              <span class="order-date">${o.date}</span>
            </div>
            <div class="order-right">
              <span class="order-total">$${o.total.toFixed(2)}</span>
              <span class="order-status ${o.status}">${o.status}</span>
              <span class="order-chevron">▼</span>
            </div>
          </div>
          <div class="order-body">
            <div class="order-products">
              ${o.items.map(item => `
                <div class="order-product" data-id="${item.productId}">
                  <div class="order-product-info">
                    <h4>${item.name}</h4>
                    <p>Qty: ${item.qty} × $${item.price.toFixed(2)}</p>
                  </div>
                </div>`).join('')}
            </div>
          </div>
        </div>`).join('');
      _attachOrderHandlers();
    } catch (e) {
      container.innerHTML = `<p style="color:var(--clr-light)">History unavailable.</p>`;
    }
  }

  function _attachOrderHandlers() {
    document.querySelectorAll('.order-head').forEach(head => {
      head.addEventListener('click', () => {
        head.closest('.order-item').classList.toggle('open');
      });
    });
    document.querySelectorAll('.order-product').forEach(prod => {
      prod.addEventListener('click', () => {
        if (prod.dataset.id) Router.navigate(`product/${prod.dataset.id}`);
      });
    });
  }

  /* ---- Summary ---- */
  function _updateSummary() {
    const rows = document.getElementById('summary-rows');
    if (!rows) return;
    const subtotal = Store.cartTotal();
    const promoAmt = subtotal * _promoDisc;
    const bonusAmt = _bonusDisc;
    const tax      = (subtotal - promoAmt - bonusAmt) * 0.1;
    const shipping = subtotal > 0 ? SHIP : 0;
    const total    = subtotal - promoAmt - bonusAmt + tax + shipping;

    rows.innerHTML = `
      <div class="summary-row">
        <span class="label">Subtotal</span>
        <span class="value">$${subtotal.toFixed(2)}</span>
      </div>
      ${promoAmt > 0 ? `
      <div class="summary-row discount">
        <span class="label">Promo discount</span>
        <span class="value">−$${promoAmt.toFixed(2)}</span>
      </div>` : ''}
      ${bonusAmt > 0 ? `
      <div class="summary-row discount">
        <span class="label">Bonus discount</span>
        <span class="value">−$${bonusAmt.toFixed(2)}</span>
      </div>` : ''}
      <div class="summary-row">
        <span class="label">Shipping</span>
        <span class="value">$${shipping.toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span class="label">Tax (10%)</span>
        <span class="value">$${tax.toFixed(2)}</span>
      </div>
      <div class="summary-row total">
        <span class="label">Total</span>
        <span class="value">$${total.toFixed(2)}</span>
      </div>
      <button class="btn btn-primary" id="checkout-btn" style="width:100%;margin-top:16px">
        Place Order
      </button>
    `;
  }

  /* ---- All event handlers ---- */
  function _attachHandlers() {
    /* Qty & remove - use named function to allow removal */
    function handleCartClick(e) {
      const qtyBtn    = e.target.closest('.qty-btn');
      const removeBtn = e.target.closest('.cart-item-remove');
      const nameLink  = e.target.closest('.cart-item-name, .cart-item-img');

      if (qtyBtn) {
        Store.changeQtyByIndex(Number(qtyBtn.dataset.index), Number(qtyBtn.dataset.delta));
        _renderCartItems(); _updateSummary();
      }
      if (removeBtn) {
        Store.removeFromCart(Number(removeBtn.dataset.id));
        _renderCartItems(); _updateSummary();
        Toast.show('Item removed', 'info');
      }
      if (nameLink && nameLink.dataset.id) {
        Router.navigate(`product/${nameLink.dataset.id}`);
      }
    }

    /* Remove existing handler to prevent duplicates */
    document.removeEventListener('click', handleCartClick);
    document.addEventListener('click', handleCartClick);

    /* Promo code */
    document.getElementById('promo-btn')?.addEventListener('click', () => {
      const code = document.getElementById('promo-input')?.value.trim().toUpperCase();
      if (PROMO_CODES[code]) {
        _promoDisc = PROMO_CODES[code];
        _updateSummary();
        Toast.show(`Promo applied! ${Math.round(_promoDisc * 100)}% off`, 'success');
      } else {
        Toast.show('Invalid promo code', 'error');
      }
    });

    /* Bonus */
    document.getElementById('bonus-btn')?.addEventListener('click', () => {
      const requested = parseFloat(document.getElementById('bonus-input')?.value) || 0;
      const available = Store.getBonuses();
      const maxUse    = Store.cartTotal() * 0.5;
      if (requested <= 0) { Toast.show('Enter a bonus amount', 'error'); return; }
      if (requested > available) { Toast.show('Insufficient bonuses', 'error'); return; }
      if (requested > maxUse)    { Toast.show(`Max bonus: $${maxUse.toFixed(2)}`, 'error'); return; }
      _bonusDisc = requested;
      Store.setBonuses(available - requested);
      document.getElementById('bonus-balance-val').textContent =
        `$${Store.getBonuses().toFixed(2)}`;
      _updateSummary();
      Toast.show(`$${requested.toFixed(2)} bonus applied!`, 'success');
    });

    /* History filters */
    document.querySelectorAll('.history-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.history-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _renderOrderHistory(btn.dataset.filter);
      });
    });

    /* Packaging selection change */
    document.addEventListener('change', e => {
      if (e.target.classList.contains('packaging-select')) {
        const index = parseInt(e.target.dataset.index);
        const cart = Store.getCart();
        const item = cart[index];
        if (!item || !item.prices) return;

        const selectedValue = e.target.value;
        const packagingOptions = _getPackagingOptions(item);
        const selectedOption = packagingOptions.find(opt => opt.value === selectedValue);

        if (selectedOption && item.prices[selectedOption.priceKey]) {
          item.selectedPack = selectedValue;
          item.selectedPrice = item.prices[selectedOption.priceKey];
          Store.updateCartItem(index, item);
          _renderCartItems();
          _updateSummary();
        }
      }
    });

    /* Checkout button */
    document.getElementById('checkout-btn')?.addEventListener('click', () => {
      const cart = Store.getCart();
      if (cart.length === 0) {
        Toast.show('Your cart is empty', 'error');
        return;
      }

      const contactForm = document.getElementById('contact-form');
      if (!contactForm) return;

      const name = document.getElementById('cf-name')?.value.trim();
      const phone = document.getElementById('cf-phone')?.value.trim();
      const email = document.getElementById('cf-email')?.value.trim();
      const address = document.getElementById('cf-address')?.value.trim();
      const city = document.getElementById('cf-city')?.value.trim();

      if (!name || !phone || !email || !address || !city) {
        Toast.show('Please fill in all contact fields', 'error');
        return;
      }

      const subtotal = Store.cartTotal();
      const promoAmt = subtotal * _promoDisc;
      const bonusAmt = _bonusDisc;
      const tax = (subtotal - promoAmt - bonusAmt) * 0.1;
      const shipping = subtotal > 0 ? SHIP : 0;
      const total = subtotal - promoAmt - bonusAmt + tax + shipping;

      const user = Store.getUser();
      const order = {
        id: `ORD-${new Date().getFullYear()}-${String(Store.getOrders().length + 1).padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        userId: user?.id || null,
        customer: { name, phone, email, address, city },
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          qty: item.qty,
          price: item.selectedPrice || item.price,
          weight: _getWeightLabel(item)
        })),
        subtotal,
        promoDiscount: promoAmt,
        bonusDiscount: bonusAmt,
        tax,
        shipping,
        total,
        status: 'in-progress'
      };

      Store.addOrder(order);
      Store.clearCart();
      _promoDisc = 0;
      _bonusDisc = 0;

      /* Add 10% bonuses to user account */
      if (Store.isLoggedIn()) {
        const bonusAmount = total * 0.10;
        Store.addBonuses(bonusAmount);
        Toast.show(`Order placed successfully! +$${bonusAmount.toFixed(2)} bonuses added`, 'success');
      } else {
        Toast.show('Order placed successfully!', 'success');
      }
      _renderCartItems();
      _updateSummary();
      _renderOrderHistory('all');
      contactForm.reset();
    });
  }

  return { render };
})();
