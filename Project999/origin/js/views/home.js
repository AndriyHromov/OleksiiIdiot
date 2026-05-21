const HomeView = (() => {

  /* Greeting logic (вимога на взаємодію з користувачем) */
  function _greeting() {
    const user = Store.getUser();
    const container = document.getElementById('greeting-banner');
    if (!container) return;
    if (user) {
      container.innerHTML = `
        <div class="greeting-banner">
          Welcome back, <strong>${user.name}</strong>! 
          ☕ Your next great cup is waiting.
        </div>`;
      container.style.display = 'block';
    } else {
      container.style.display = 'none';
    }
  }

  /* Build product card HTML */
  function _cardHTML(p) {
    const discount = p.originalPrice
      ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
    const badges = [
      p.availability.isNew       ? `<span class="badge badge-new">NEW</span>` : '',
      p.availability.isOnSale    ? `<span class="badge badge-sale">-${discount}%</span>` : '',
      p.availability.isBestseller? `<span class="badge badge-bestseller">BESTSELLER</span>` : '',
    ].join('');

    const notes = p.tastingNotes
      .map(n => `<li class="note-pill">${n}</li>`)
      .join('');

    const priceHTML = p.originalPrice
      ? `<span class="original">$${p.originalPrice.toFixed(2)}</span>$${p.price.toFixed(2)}`
      : `$${p.price.toFixed(2)}`;

    return `
      <article class="product-card"
               data-id="${p.id}"
               tabindex="0"
               role="button"
               aria-label="${p.name}, $${p.price.toFixed(2)}">
        <div class="product-card-badges">${badges}</div>
        <img class="product-card-img"
             src="${p.image}"
             alt="${p.name}"
             loading="lazy">
        <div class="product-card-body">
          <h3 class="product-card-name">${p.name}</h3>
          <ul class="product-card-notes" aria-label="Tasting notes">${notes}</ul>
          <div class="product-card-bottom">
            <span class="product-card-price">${priceHTML}</span>
            <button class="btn-icon add-to-cart-btn"
                    data-id="${p.id}"
                    aria-label="Add ${p.name} to cart">
              <img src="images/iconShoppingBag.png" alt="">
            </button>
          </div>
        </div>
      </article>`;
  }

  /* Render bestsellers grid */
  async function _renderBestsellers(category = null) {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;
    grid.innerHTML = `<div class="spinner"></div>`;
    try {
      let products = await API.getProducts();
      if (category) products = products.filter(p => p.category === category);
      else           products = products.filter(p => p.availability.isBestseller);
      products = products.slice(0, 4);
      grid.innerHTML = products.map(_cardHTML).join('');
      _attachCardHandlers(grid);
    } catch (e) {
      grid.innerHTML = `<p style="color:red">Failed to load products.</p>`;
    }
  }

  /* Card click & add-to-cart handlers */
  function _attachCardHandlers(container) {
    container.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('.add-to-cart-btn')) return;
        Router.navigate(`product/${card.dataset.id}`);
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter') Router.navigate(`product/${card.dataset.id}`);
      });
    });
    container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        const product = await API.getProductById(btn.dataset.id);
        if (product) {
          Store.addToCart(product);
          Toast.show(`${product.name} added to cart!`, 'success');
        }
      });
    });
  }

  /* Category tab switcher */
  function _attachTabHandlers() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const cat = tab.dataset.category || null;
        _renderBestsellers(cat);
      });
    });
  }

  /* Consultation form */
  function _attachFormHandler() {
    const form = document.querySelector('.consult-form');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.querySelector('#userName')?.value.trim();
      const phone = form.querySelector('#userPhone')?.value.trim();
      const topic = form.querySelector('#userTopic')?.value.trim();
      const agree = form.querySelector('#agreement')?.checked;
      if (!agree) { Toast.show('Please agree to be contacted', 'error'); return; }

      if (!name || !phone || !topic) {
        Toast.show('Please fill in all fields', 'error');
        return;
      }

      const consultation = {
        id: `CONS-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        name,
        phone,
        topic,
        status: 'pending'
      };

      Store.addConsultation(consultation);
      Toast.show(`Thank you, ${name}! We will contact you soon.`, 'success');
      form.reset();
    });
  }

  /* Event registration modal */
  function _showEventRegistrationModal() {
    const modal = document.createElement('div');
    modal.className = 'admin-modal-overlay';
    modal.innerHTML = `
      <div class="admin-modal">
        <div class="admin-modal-header">
          <h2 class="heading-md">Secure Your Spot</h2>
          <button class="btn-icon admin-modal-close" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <form class="admin-form" id="event-registration-form">
          <div class="form-group">
            <label for="reg-name">Full Name</label>
            <input class="form-control" type="text" id="reg-name" required
                   placeholder="Your full name" autocomplete="name">
          </div>
          <div class="form-group">
            <label for="reg-phone">Phone Number</label>
            <input class="form-control" type="tel" id="reg-phone" required
                   placeholder="+380 XX XXX XX XX" autocomplete="tel">
          </div>
          <div class="form-group">
            <label for="reg-email">Email</label>
            <input class="form-control" type="email" id="reg-email" required
                   placeholder="your@email.com" autocomplete="email">
          </div>
          <div class="admin-modal-footer">
            <button type="button" class="btn btn-outline admin-cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary">Register</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.admin-modal-close')?.addEventListener('click', () => modal.remove());
    modal.querySelector('.admin-cancel-btn')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    /* Phone mask for Ukrainian numbers */
    const phoneInput = modal.querySelector('#reg-phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) {
          if (value[0] === '0') {
            value = '38' + value;
          }
          if (!value.startsWith('380')) {
            value = '380' + value;
          }
        }

        let formatted = '';
        if (value.length > 0) {
          formatted = '+' + value.substring(0, 3);
          if (value.length > 3) {
            formatted += ' ' + value.substring(3, 5);
          }
          if (value.length > 5) {
            formatted += ' ' + value.substring(5, 8);
          }
          if (value.length > 8) {
            formatted += ' ' + value.substring(8, 10);
          }
          if (value.length > 10) {
            formatted += ' ' + value.substring(10, 12);
          }
        }
        e.target.value = formatted;
      });
    }

    modal.querySelector('#event-registration-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const email = document.getElementById('reg-email').value.trim();

      if (!name || !phone || !email) {
        Toast.show('Please fill in all fields', 'error');
        return;
      }

      const events = await API.getEvents();
      const activeEvent = events.find(e => e.status === 'upcoming') || events[0];

      const registration = {
        id: `REG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        name,
        phone,
        email,
        eventId: activeEvent?.id || 'EVT-2025-001',
        eventName: activeEvent?.title || 'Coffee Tasting Workshop',
        status: 'Новий запит'
      };

      Store.addEventRegistration(registration);
      Toast.show('Registration successful! We will contact you soon.', 'success');
      modal.remove();

      if (activeEvent) {
        const eventIndex = events.findIndex(e => e.id === activeEvent.id);
        if (eventIndex !== -1) {
          events[eventIndex].registered = (events[eventIndex].registered || 0) + 1;
          Store.updateEvent(activeEvent.id, { registered: events[eventIndex].registered });
        }
      }
    });
  }

  /* About anchor scroll */
  function _scrollToAbout() {
    const el = document.getElementById('about');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* Main render */
  async function render() {
    const main = document.getElementById('main-content');
    main.innerHTML = `

      <!-- Greeting banner -->
      <div id="greeting-banner" style="display:none"></div>

      <!-- ===== HERO ===== -->
      <section class="hero" aria-labelledby="hero-title">
        <figure class="hero-visual">
          <img src="images/image1.jpg"
               alt="Bartender pouring cold brew over ice"
               fetchpriority="high">
        </figure>

        <div class="hero-content">
          <header>
            <p class="meta-tag">WORKSHOP / SUMMER 2026 / KYIV</p>
            <h1 id="hero-title" class="heading-xl">
              Craft Your Signature Summer
            </h1>
            <p class="lead">
              Master the art of cold brews, artisanal lemonades, and iced 
              botanical teas. An exclusive tasting &amp; learning session 
              for the curious.
            </p>
          </header>

          <div class="hero-cards">
            <div class="hero-card">
              <img class="hero-card-img"
                   src="images/image12.png"
                   alt="Botanical ingredients"
                   loading="lazy">
              <p><strong>Takeaways:</strong></p>
              <ul>
                <li>Tasting of 6 unique summer drinks</li>
                <li>A takeaway guide with all the recipes</li>
                <li>A small gift set (syrup sampler)</li>
                <li>10% discount on all Origin products</li>
              </ul>
              <div class="hero-actions">
                <button class="btn btn-primary" id="secure-spot-btn">SECURE YOUR SPOT</button>
              </div>
              <p class="urgency" role="alert">⚡ Only 5 spots left!</p>
            </div>

            <aside class="host-card">
              <img class="host-avatar"
                   src="images/image123.png"
                   alt="James Hoffmann"
                   loading="lazy">
              <h3>Hosted by James Hoffmann</h3>
              <p>World Barista Champion &amp; Sensory Expert</p>
            </aside>
          </div>
        </div>
      </section>

      <!-- ===== ESSENCE ===== -->
      <section class="section-essence" id="about" aria-labelledby="essence-title">
        <div class="container">
          <span class="deco-circle"></span>
          <header class="essence-header">
            <p class="meta-tag">OUR ESSENCE — KYIV BASED</p>
            <h2 id="essence-title" class="heading-lg">
              Crafting the Culture of Taste
            </h2>
            <p>Origin is more than a supplier. We curate fine flavours — 
               sourcing unique coffee lots, rare tea leaves, and botanical 
               ingredients to elevate your daily ritual.</p>
          </header>

          <div class="essence-grid">
            <article class="essence-card">
              <h3>Steep with Peace</h3>
              <p>High-altitude whole-leaf teas. Hand-picked and minimally 
                 processed to preserve the delicate aroma of nature.</p>
            </article>
            <article class="essence-card">
              <h3>Brew with Nature</h3>
              <p>Artisanal syrups crafted from real berries, herbs and 
                 spices — no artificial colours or flavours.</p>
            </article>
            <article class="essence-card">
              <h3>Roast with Soul</h3>
              <p>Specialty coffee sourced directly from farmers. Freshly 
                 roasted in small batches in Kyiv.</p>
            </article>
          </div>
        </div>
      </section>

      <!-- ===== BESTSELLERS ===== -->
      <section class="section-bestsellers" aria-labelledby="best-title">
        <div class="container">
          <div class="bestsellers-header">
            <h2 id="best-title" class="heading-lg">Our bestsellers</h2>
            <nav class="category-tabs" aria-label="Filter by category">
              <button class="tab-btn active" data-category="">All</button>
              <button class="tab-btn" data-category="Specialty Coffee">Coffee</button>
              <button class="tab-btn" data-category="Craft Syrups">Syrups</button>
              <button class="tab-btn" data-category="Premium Tea">Tea</button>
            </nav>
          </div>

          <div class="products-grid" role="list" aria-label="Products"></div>

          <div class="bestsellers-footer">
            <a href="#catalog" class="btn btn-outline" id="view-all-products-link">VIEW ALL PRODUCTS</a>
          </div>
        </div>
      </section>

      <!-- ===== CONSULTATION ===== -->
      <section class="section-consultation" aria-labelledby="consult-title">
        <div class="container">
          <div class="consult-wrapper">
            <header>
              <h2 id="consult-title" class="heading-lg">
                Get product consultation
              </h2>
              <p class="lead">
                Leave a short request and we'll curate a selection that 
                fits your taste and ritual format.
              </p>
            </header>

            <form class="consult-form" novalidate>
              <fieldset class="consult-left">
                <legend class="sr-only">Contact Details</legend>
                <div class="form-group">
                  <label for="userName">Name</label>
                  <input class="form-control" type="text"
                         id="userName" name="userName"
                         required autocomplete="name"
                         placeholder="Your name">
                </div>
                <div class="form-group">
                  <label for="userPhone">Phone</label>
                  <input class="form-control" type="tel"
                         id="userPhone" name="userPhone"
                         required autocomplete="tel"
                         placeholder="+380 XX XXX XX XX">
                </div>
                <div class="form-group">
                  <label for="userOrg">Organization</label>
                  <input class="form-control" type="text"
                         id="userOrg" name="userOrg"
                         autocomplete="organization"
                         placeholder="Optional">
                </div>
              </fieldset>

              <fieldset class="consult-right">
                <legend class="sr-only">Request Details</legend>
                <div class="form-group" style="flex-grow:1;display:flex;flex-direction:column">
                  <label for="userTopic">Topic / Request</label>
                  <textarea class="form-control"
                            id="userTopic" name="userTopic"
                            rows="6" required
                            placeholder="Tell us about your needs..."></textarea>
                </div>
              </fieldset>

              <footer class="consult-footer">
                <label class="checkbox-row">
                  <input type="checkbox" id="agreement" name="agreement" required>
                  <span>I agree to be contacted for consultation</span>
                </label>
                <button type="submit" class="btn btn-primary">SEND REQUEST</button>
              </footer>
            </form>
          </div>
        </div>
      </section>
    `;

    /* After render: wire up interactions */
    _greeting();
    await _renderBestsellers();
    _attachTabHandlers();
    _attachFormHandler();

    /* Secure your spot button */
    document.getElementById('secure-spot-btn')?.addEventListener('click', () => {
      _showEventRegistrationModal();
    });

    /* View all products scroll to top */
    document.getElementById('view-all-products-link')?.addEventListener('click', function(e) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    /* Scroll-to-about from other pages */
    if (window._scrollToAbout) {
      setTimeout(_scrollToAbout, 100);
      window._scrollToAbout = false;
    }
  }

  return { render };
})();
