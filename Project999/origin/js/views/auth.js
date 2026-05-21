const AuthView = (() => {

  /* ---- Sign In ---- */
  function renderSignIn() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="auth-view">
        <section class="auth-card" aria-labelledby="signin-title">

          <div class="auth-content">
            <h1 id="signin-title">Sign in</h1>

            <form class="auth-form" id="signin-form" novalidate>
              <div class="form-group">
                <label for="si-email">Email</label>
                <input class="form-control" type="email"
                       id="si-email" required autocomplete="username"
                       placeholder="your@email.com">
              </div>
              <div class="form-group">
                <label for="si-pass">Password</label>
                <input class="form-control" type="password"
                       id="si-pass" required autocomplete="current-password"
                       placeholder="••••••••">
              </div>
              <div class="auth-actions">
                <p class="auth-link">
                  No account? <a href="#signup">Sign up</a>
                </p>
                <button type="submit" class="btn-auth">Sign in</button>
              </div>
            </form>
          </div>

          <aside class="auth-visual">
            <img src="images/image1.jpg"
                 alt="Specialty coffee" fetchpriority="high">
          </aside>

        </section>
      </div>
    `;

    document.getElementById('signin-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('si-email').value.trim();
      const pass  = document.getElementById('si-pass').value;

      // Validation
      if (!email) {
        Toast.show('Email is required', 'error');
        return;
      }
      if (!pass) {
        Toast.show('Password is required', 'error');
        return;
      }

      // Email format validation (strict)
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        Toast.show('Please enter a valid email address (e.g., user@example.com)', 'error');
        return;
      }

      // Password validation (minimum 6 characters)
      if (pass.length < 6) {
        Toast.show('Password must be at least 6 characters', 'error');
        return;
      }

      /* Admin authentication */
      if (email === 'admin@origin.com' && pass === 'admin123') {
        Store.setUser({ email: 'admin@origin.com', name: 'Admin', role: 'admin' });
        Toast.show('Welcome, Admin!', 'success');
        Navbar.render();
        Router.navigate('admin');
        return;
      }

      /* User authentication - check against localStorage users */
      const users = Store.getUsers();
      const user = users.find(u => u.email === email && u.password === pass);

      if (user) {
        /* Merge guest cart with user cart */
        const guestCart = Store.getCart();
        Store.loadUserCart(user.id);
        const userCart = Store.getCart();

        /* Merge carts - add items from guest cart that aren't in user cart */
        guestCart.forEach(guestItem => {
          const existingItem = userCart.find(userItem =>
            userItem.id === guestItem.id && userItem.selectedPack === guestItem.selectedPack
          );
          if (existingItem) {
            existingItem.qty += guestItem.qty;
          } else {
            userCart.push(guestItem);
          }
        });

        /* Save merged cart */
        Store.setUser({
          email: user.email,
          name: user.name,
          role: user.role,
          id: user.id,
          phone: user.phone,
          city: user.city
        });
        Store.saveProfile({
          fullName: user.name,
          email: user.email,
          phone: user.phone,
          city: user.city
        });
        Store.clearGuestCart();
        Toast.show(`Welcome back, ${user.name}!`, 'success');
        Navbar.render();
        Router.navigate('home');
      } else {
        Toast.show('Invalid email or password', 'error');
      }
    });
  }

  /* ---- Sign Up ---- */
  function renderSignUp() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="auth-view">
        <section class="auth-card" aria-labelledby="signup-title">

          <div class="auth-content">
            <h1 id="signup-title">Registration</h1>

            <form class="auth-form" id="signup-form" novalidate>
              <div class="form-group">
                <label for="su-name">Full Name</label>
                <input class="form-control" type="text"
                       id="su-name" required autocomplete="name"
                       placeholder="John Doe">
              </div>
              <div class="form-group">
                <label for="su-phone">Phone</label>
                <input class="form-control" type="tel"
                       id="su-phone" required autocomplete="tel"
                       placeholder="+380 XX XXX XX XX">
              </div>
              <div class="form-group">
                <label for="su-email">Email</label>
                <input class="form-control" type="email"
                       id="su-email" required autocomplete="email"
                       placeholder="your@email.com">
              </div>
              <div class="form-group">
                <label for="su-city">City</label>
                <input class="form-control" type="text"
                       id="su-city" required autocomplete="address-level2"
                       placeholder="Kyiv">
              </div>
              <div class="auth-form-row">
                <div class="form-group">
                  <label for="su-pass">Password</label>
                  <input class="form-control" type="password"
                         id="su-pass" required autocomplete="new-password"
                         placeholder="••••••••">
                </div>
                <div class="form-group">
                  <label for="su-pass2">Confirm Password</label>
                  <input class="form-control" type="password"
                         id="su-pass2" required autocomplete="new-password"
                         placeholder="••••••••">
                </div>
              </div>
              <div class="auth-actions">
                <p class="auth-link">
                  Have an account? <a href="#signin">Sign in</a>
                </p>
                <button type="submit" class="btn-auth">Sign up</button>
              </div>
            </form>
          </div>

          <aside class="auth-visual">
            <img src="images/image1.jpg"
                 alt="Specialty coffee" fetchpriority="high">
          </aside>

        </section>
      </div>
    `;

    document.getElementById('signup-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const name  = document.getElementById('su-name').value.trim();
      const email = document.getElementById('su-email').value.trim();
      const phone = document.getElementById('su-phone').value.trim();
      const pass  = document.getElementById('su-pass').value;
      const pass2 = document.getElementById('su-pass2').value;
      const city  = document.getElementById('su-city').value.trim();

      // Validation - required fields
      if (!name) {
        Toast.show('Full name is required', 'error');
        return;
      }
      if (!email) {
        Toast.show('Email is required', 'error');
        return;
      }
      if (!phone) {
        Toast.show('Phone is required', 'error');
        return;
      }
      if (!pass) {
        Toast.show('Password is required', 'error');
        return;
      }
      if (!city) {
        Toast.show('City is required', 'error');
        return;
      }

      // Name validation (minimum 2 characters)
      if (name.length < 2) {
        Toast.show('Name must be at least 2 characters', 'error');
        return;
      }

      // Email format validation (strict)
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        Toast.show('Please enter a valid email address (e.g., user@example.com)', 'error');
        return;
      }

      // Phone format validation (Ukrainian format: +380 XX XXX XX XX)
      const phoneRegex = /^\+380\d{9}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        Toast.show('Please enter a valid phone number (format: +380XXXXXXXXX, 12 digits total)', 'error');
        return;
      }

      // City validation (minimum 2 characters)
      if (city.length < 2) {
        Toast.show('City must be at least 2 characters', 'error');
        return;
      }

      // Password validation (minimum 6 characters)
      if (pass.length < 6) {
        Toast.show('Password must be at least 6 characters', 'error');
        return;
      }

      // Password confirmation
      if (pass !== pass2) {
        Toast.show('Passwords do not match', 'error');
        return;
      }

      // Check if email already exists
      const users = Store.getUsers();
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        Toast.show('Email already registered. Please sign in.', 'error');
        return;
      }

      /* Generate user ID */
      const userId = `USR-${new Date().getFullYear()}-${String(users.length + 1).padStart(3, '0')}`;

      /* Merge guest cart with new user cart */
      const guestCart = Store.getCart();
      Store.setUser({ email, name, city, role: 'user', id: userId });
      Store.saveProfile({ fullName: name, email, phone, city });
      Store.clearGuestCart();

      // Save user to admin users list
      const user = {
        id: userId,
        email,
        name,
        phone,
        city,
        role: 'user',
        password: pass,
        registeredDate: new Date().toISOString().split('T')[0],
        ordersCount: 0,
        totalSpent: 0
      };
      Store.addUser(user);

      Toast.show(`Welcome, ${name}! 🎉`, 'success');
      Navbar.render();
      Router.navigate('home');
    });
  }

  return { renderSignIn, renderSignUp };
})();