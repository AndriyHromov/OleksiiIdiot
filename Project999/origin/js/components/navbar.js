const Navbar = (() => {
  function render() {
    const user  = Store.getUser();
    const count = Store.cartCount();

    document.getElementById('site-header').innerHTML = `
      <a href="#home" class="nav-logo" aria-label="Origin Home">
        Origin
        <img src="images/iconCup.png" alt="" aria-hidden="true">
      </a>

      <nav class="main-nav" aria-label="Main navigation">
        <ul>
          <li><a href="#home"    data-route="home">Main</a></li>
          <li><a href="#catalog" data-route="catalog">Catalog</a></li>
          <li><a href="#about" data-route="about">MiniGame</a></li>
        </ul>
      </nav>

      <div class="nav-actions">
        <button class="nav-btn" id="nav-cart-btn" aria-label="Open Cart">
          <img src="images/iconShoppingBag.png" alt="">
          ${count > 0 ? `<span class="cart-badge">${count}</span>` : ''}
        </button>
        ${Store.isAdmin() ? `
          <button class="nav-btn" id="nav-admin-btn" aria-label="Admin Panel">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </button>
        ` : ''}
        <button class="nav-btn" id="nav-user-btn"
                aria-label="${user ? 'My Profile' : 'Sign In'}">
          ${user
            ? `<div class="avatar-mini" title="${user.name}">${user.name[0].toUpperCase()}</div>`
            : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`}
        </button>
        <button class="hamburger" id="hamburger" aria-label="Toggle menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>

      <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">
        <ul>
          <li><a href="#home">Main</a></li>
          <li><a href="#catalog">Catalog</a></li>
          <li><a href="#about">MiniGame</a></li>
          <li><a href="#cart">Cart ${count > 0 ? `(${count})` : ''}</a></li>
          ${user
            ? `<li><a href="#profile">Profile</a></li>
               <li><button class="btn btn-outline" id="mobile-logout">Logout</button></li>`
            : `<li><a href="#signin">Sign In</a></li>
               <li><a href="#signup">Sign Up</a></li>`}
        </ul>
      </nav>
    `;

    _attachHandlers();
    _highlightActive();
    _scrollBehavior();
  }

  function _attachHandlers() {
    /* Cart button */
    document.getElementById('nav-cart-btn')?.addEventListener('click', () => {
      Router.navigate('cart');
    });

    /* Admin button */
    document.getElementById('nav-admin-btn')?.addEventListener('click', () => {
      Router.navigate('admin');
    });

    /* User button */
    document.getElementById('nav-user-btn')?.addEventListener('click', () => {
      Router.navigate(Store.isLoggedIn() ? 'profile' : 'signin');
    });

    /* Hamburger */
    const ham = document.getElementById('hamburger');
    const mob = document.getElementById('mobile-nav');
    ham?.addEventListener('click', () => {
      const open = mob.classList.toggle('open');
      ham.classList.toggle('open', open);
      ham.setAttribute('aria-expanded', String(open));
    });

    /* Close mobile nav on link click */
    mob?.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mob.classList.remove('open');
        ham.classList.remove('open');
      });
    });

    /* Mobile logout */
    document.getElementById('mobile-logout')?.addEventListener('click', () => {
      Store.logout();
      Navbar.render();
      Router.navigate('home');
      Toast.show('Signed out successfully', 'info');
    });
  }

  function _highlightActive() {
    const current = window.location.hash.slice(1).split('/')[0] || 'home';
    document.querySelectorAll('.main-nav a, .mobile-nav a').forEach(a => {
      const route = a.getAttribute('href')?.replace('#', '');
      a.classList.toggle('active', route === current);
    });
  }

  function _scrollBehavior() {
    let lastY = 0;
    const header = document.getElementById('site-header');
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle('scrolled', y > 10);
      header.classList.toggle('hidden',   y > lastY && y > 100);
      lastY = y;
    };
    /* Remove any old listener by replacing via clone trick */
    window.removeEventListener('scroll', window._navScroll);
    window._navScroll = onScroll;
    window.addEventListener('scroll', onScroll, { passive: true });

    /* Close mobile menu on resize to desktop */
    const onResize = () => {
      if (window.innerWidth > 767) {
        const mob = document.getElementById('mobile-nav');
        const ham = document.getElementById('hamburger');
        if (mob) mob.classList.remove('open');
        if (ham) {
          ham.classList.remove('open');
          ham.setAttribute('aria-expanded', 'false');
        }
      }
    };
    window.removeEventListener('resize', window._navResize);
    window._navResize = onResize;
    window.addEventListener('resize', onResize);
  }

  /* Re-render just the cart badge */
  function updateBadge() {
    const count  = Store.cartCount();
    const btn    = document.getElementById('nav-cart-btn');
    if (!btn) return;
    const badge = btn.querySelector('.cart-badge');
    if (count > 0) {
      if (badge) badge.textContent = count;
      else btn.insertAdjacentHTML('beforeend',
        `<span class="cart-badge">${count}</span>`);
    } else {
      badge?.remove();
    }
  }

  /* Listen for store events */
  Store.on('cart:update', updateBadge);
  Store.on('user:update', render);

  return { render, updateBadge };
})();