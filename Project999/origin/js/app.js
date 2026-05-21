const Toast = (() => {
  function show(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastIn .3s ease reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
  return { show };
})();

/* ---- Bootstrap ---- */
document.addEventListener('DOMContentLoaded', async () => {

  /* Initialize users from JSON to localStorage if not already loaded */
  const localUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
  if (localUsers.length === 0) {
    try {
      const jsonUsers = await API.getUsers();
      localStorage.setItem('admin_users', JSON.stringify(jsonUsers));
    } catch (error) {
      console.error('Failed to load users from JSON:', error);
    }
  }

  /* Initialize orders from JSON to localStorage if not already loaded */
  const localOrders = JSON.parse(localStorage.getItem('admin_orders') || '[]');
  if (localOrders.length === 0) {
    try {
      const jsonOrders = await API.getOrders();
      localStorage.setItem('admin_orders', JSON.stringify(jsonOrders));

      /* Distribute orders to user-specific localStorage */
      const users = JSON.parse(localStorage.getItem('admin_users') || '[]');
      jsonOrders.forEach(order => {
        if (order.userId) {
          const userOrders = JSON.parse(localStorage.getItem(`orders_${order.userId}`) || '[]');
          userOrders.push(order);
          localStorage.setItem(`orders_${order.userId}`, JSON.stringify(userOrders));
        }
      });
    } catch (error) {
      console.error('Failed to load orders from JSON:', error);
    }
  }

  /* Render persistent shell */
  Navbar.render();
  Footer.render();

  /* Register routes */
  Router.on('home',    ()       => HomeView.render());
  Router.on('about',   ()       => AboutView.render());
  Router.on('catalog', params  => CatalogView.render(params));
  Router.on('product', params  => ProductView.render(params));
  Router.on('cart',    ()       => CartView.render());
  Router.on('profile', ()       => ProfileView.render());
  Router.on('signin',  ()       => AuthView.renderSignIn());
  Router.on('signup',  ()       => AuthView.renderSignUp());
  Router.on('admin',   params  => AdminView.render(params));

  Router.notFound(view => {
    document.getElementById('main-content').innerHTML = `
      <div style="text-align:center;padding:4rem 1rem">
        <h2 style="font-size:2rem;margin-bottom:1rem">404 — Page not found</h2>
        <p style="color:var(--clr-light);margin-bottom:2rem">
          The route <code>#${view}</code> does not exist.
        </p>
        <a href="#home" class="btn btn-primary">Go Home</a>
      </div>`;
  });

  /* Update active nav link on every route change */
  window.addEventListener('hashchange', () => Navbar._highlightActive?.());

  /* Start router */
  Router.start();
});