const ProfileView = (() => {

  function render() {
    const user    = Store.getUser();
    const profile = Store.getProfile() || {};
    const bonuses = Store.getBonuses();
    const avatar  = Store.getAvatar();

    /* If not logged in, redirect */
    if (!user) {
      Toast.show('Please sign in to view your profile', 'info');
      Router.navigate('signin');
      return;
    }

    const main = document.getElementById('main-content');
    main.innerHTML = `
      <!-- Hero -->
      <section class="profile-hero" aria-labelledby="profile-title">
        <div class="container" style="position:relative;z-index:1">
          <span class="deco-circle"></span>
          <p class="meta-tag">YOUR ACCOUNT</p>
          <h1 id="profile-title" class="heading-xl">My Profile</h1>
          <p class="lead">Manage your information and preferences</p>
        </div>
      </section>

      <div class="container">
        <div class="profile-dashboard">

          <!-- SIDEBAR -->
          <aside class="profile-sidebar">

            <!-- Avatar -->
            <div class="profile-panel">
              <div class="avatar-wrap">
                <div class="avatar-ring">
                  <img id="avatar-img"
                       src="${avatar || 'images/image12.png'}"
                       alt="Your avatar">
                </div>
                <label for="avatar-upload" class="btn btn-outline"
                       style="cursor:pointer">Change photo</label>
                <input type="file" id="avatar-upload"
                       accept="image/*" class="sr-only">
                <p style="font-size:.85rem;color:var(--clr-light);text-align:center">
                  ${user.name}
                </p>
              </div>
            </div>

            <!-- Bonus system -->
            <div class="profile-panel bonus-card">
              <h2>Bonus system</h2>
              <dl class="bonus-dl">
                <div class="bonus-row-item">
                  <dt>Member #</dt>
                  <dd>${user.id || 'N/A'}</dd>
                </div>
                <div class="bonus-row-item">
                  <dt>Points Balance</dt>
                  <dd id="bonus-display">${Math.floor(bonuses)} pts</dd>
                </div>
              </dl>
            </div>

            <!-- Logout -->
            <button class="btn btn-outline" id="logout-btn"
                    style="width:100%;justify-content:center">
              Sign out
            </button>

          </aside>

          <!-- MAIN CONTENT -->
          <section class="profile-content" aria-label="Profile details">
            <form class="profile-form" id="profile-form" novalidate>

              <fieldset class="profile-fieldset">
                <legend>Personal information</legend>
                <div class="profile-grid">
                  <div class="form-group">
                    <label for="pf-fullname">Full Name</label>
                    <input class="form-control" type="text"
                           id="pf-fullname" name="fullName"
                           value="${profile.fullName || user.name || ''}"
                           readonly autocomplete="name">
                  </div>
                  <div class="form-group">
                    <label for="pf-phone">Phone</label>
                    <input class="form-control" type="tel"
                           id="pf-phone" name="phone"
                           value="${profile.phone || user.phone || ''}"
                           readonly autocomplete="tel">
                  </div>
                  <div class="form-group">
                    <label for="pf-email">Email</label>
                    <input class="form-control" type="email"
                           id="pf-email" name="email"
                           value="${profile.email || user.email || ''}"
                           readonly autocomplete="email">
                  </div>
                  <div class="form-group">
                    <label for="pf-city">City</label>
                    <input class="form-control" type="text"
                           id="pf-city" name="city"
                           value="${profile.city || user.city || ''}"
                           readonly autocomplete="address-level2">
                  </div>
                </div>
              </fieldset>

              <fieldset class="profile-fieldset">
                <legend>Delivery info</legend>
                <div class="profile-grid">
                  <div class="form-group">
                    <label for="pf-recipient">Recipient Name</label>
                    <input class="form-control" type="text"
                           id="pf-recipient" name="recipientName"
                           value="${profile.recipientName || user.name || ''}"
                           readonly>
                  </div>
                  <div class="form-group">
                    <label for="pf-dcity">Delivery City</label>
                    <input class="form-control" type="text"
                           id="pf-dcity" name="deliveryCity"
                           value="${profile.deliveryCity || ''}"
                           readonly>
                  </div>
                  <div class="form-group">
                    <label for="pf-method">Preferred Method</label>
                    <input class="form-control" type="text"
                           id="pf-method" name="method"
                           value="${profile.method || 'Nova Poshta'}"
                           readonly>
                  </div>
                  <div class="form-group">
                    <label for="pf-branch">Branch</label>
                    <input class="form-control" type="text"
                           id="pf-branch" name="branch"
                           value="${profile.branch || ''}"
                           readonly>
                  </div>
                </div>
              </fieldset>

              <footer class="profile-form-actions">
                <button type="button" class="btn btn-outline" id="edit-toggle">
                  Edit
                </button>
                <button type="submit" class="btn btn-primary">Save</button>
              </footer>
            </form>
          </section>

        </div>
      </div>
    `;

    _attachHandlers(user);
  }

  function _attachHandlers(user) {
    /* Avatar upload */
    document.getElementById('avatar-upload')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file?.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = ev => {
        document.getElementById('avatar-img').src = ev.target.result;
        Store.setAvatar(ev.target.result);
        Toast.show('Avatar updated!', 'success');
      };
      reader.readAsDataURL(file);
    });

    /* Edit toggle */
    document.getElementById('edit-toggle')?.addEventListener('click', function () {
      const inputs = document.querySelectorAll('.profile-form input');
      const editing = this.textContent.trim() === 'Edit';
      inputs.forEach(inp => {
        inp.readOnly = !editing;
        inp.style.background = editing ? '' : 'var(--clr-bg-alt)';
      });
      this.textContent = editing ? 'Cancel' : 'Edit';
    });

    /* Save profile */
    document.getElementById('profile-form')?.addEventListener('submit', e => {
      e.preventDefault();

      const fullName = document.getElementById('pf-fullname').value.trim();
      const phone = document.getElementById('pf-phone').value.trim();
      const email = document.getElementById('pf-email').value.trim();
      const city = document.getElementById('pf-city').value.trim();
      const recipientName = document.getElementById('pf-recipient').value.trim();
      const deliveryCity = document.getElementById('pf-dcity').value.trim();
      const branch = document.getElementById('pf-branch').value.trim();

      // Validation
      if (!fullName) {
        Toast.show('Full name is required', 'error');
        return;
      }
      if (!phone) {
        Toast.show('Phone is required', 'error');
        return;
      }
      if (!email) {
        Toast.show('Email is required', 'error');
        return;
      }
      if (!city) {
        Toast.show('City is required', 'error');
        return;
      }
      if (!recipientName) {
        Toast.show('Recipient name is required', 'error');
        return;
      }
      if (!deliveryCity) {
        Toast.show('Delivery city is required', 'error');
        return;
      }
      if (!branch) {
        Toast.show('Branch is required', 'error');
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

      const data = {};
      new FormData(e.target).forEach((v, k) => { data[k] = v; });
      Store.saveProfile(data);
      Store.setUser({ ...user, name: data.fullName || user.name });
      /* Make fields readonly again */
      document.querySelectorAll('.profile-form input').forEach(inp => {
        inp.readOnly = true;
        inp.style.background = '';
      });
      document.getElementById('edit-toggle').textContent = 'Edit';
      Toast.show('Profile saved!', 'success');
      Navbar.render();
    });

    /* Logout */
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      Store.logout();
      Navbar.render();
      Toast.show('Signed out', 'info');
      Router.navigate('home');
    });
  }

  return { render };
})();