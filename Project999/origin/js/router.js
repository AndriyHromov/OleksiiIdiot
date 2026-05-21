const Router = (() => {
  const _routes = {};
  let _notFound = null;

  /* Register a route handler */
  function on(pattern, handler) {
    _routes[pattern] = handler;
  }

  /* Set 404 handler */
  function notFound(handler) {
    _notFound = handler;
  }

  /* Parse current hash → { view, params } */
  function _parse() {
    const hash   = window.location.hash.slice(1) || 'home';
    const parts  = hash.split('/');
    const view   = parts[0] || 'home';
    const params = parts.slice(1);
    return { view, params };
  }

  /* Dispatch current route */
  function _dispatch() {
    const { view, params } = _parse();

    if (_routes[view]) {
      _routes[view](params);
    } else if (_notFound) {
      _notFound(view);
    }
  }

  /* Navigate programmatically */
  function navigate(path) {
    window.location.hash = path;
  }

  /* Start listening */
  function start() {
    window.addEventListener('hashchange', _dispatch);
    _dispatch(); // initial load
  }

  return { on, notFound, navigate, start };
})();