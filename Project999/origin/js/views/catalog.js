const CatalogView = (() => {
  const PER_PAGE = 12;
  let _allProducts = [];
  let _filtered    = [];
  let _currentPage = 1;
  let _currentCat  = 'all';
  let _currentSort = 'popular';
  let _searchQuery = '';

  /* ---- Build product card (shared markup) ---- */
  function _card(p, highlight = '') {
    const discount = p.originalPrice
      ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
    const badges = [
      p.availability.isNew        ? `<span class="badge badge-new">NEW</span>` : '',
      p.availability.isOnSale     ? `<span class="badge badge-sale">-${discount}%</span>` : '',
      p.availability.isBestseller ? `<span class="badge badge-bestseller">BESTSELLER</span>` : '',
    ].join('');

    const notesHTML = p.tastingNotes
      .map(n => `<li class="note-pill">${_hl(n, highlight)}</li>`)
      .join('');

    const priceHTML = p.originalPrice
      ? `<span class="original">$${p.originalPrice.toFixed(2)}</span>$${p.price.toFixed(2)}`
      : `$${p.price.toFixed(2)}`;

    return `
      <article class="product-card"
               data-id="${p.id}"
               tabindex="0" role="button"
               aria-label="${p.name}">
        <div class="product-card-badges">${badges}</div>
        <img class="product-card-img" src="${p.image}"
             alt="${p.name}" loading="lazy">
        <div class="product-card-body">
          <h3 class="product-card-name">${_hl(p.name, highlight)}</h3>
          <ul class="product-card-notes">${notesHTML}</ul>
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

  /* Highlight search term in text */
  function _hl(text, query) {
    if (!query) return text;
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(re, `<mark class="search-hl">$1</mark>`);
  }

  /* ---- Filter + sort pipeline ---- */
  function _process() {
    let list = [..._allProducts];

    /* Category */
    if (_currentCat !== 'all')
      list = list.filter(p => p.category === _currentCat);

    /* Search */
    if (_searchQuery) {
      const q = _searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.tastingNotes.some(n => n.toLowerCase().includes(q)) ||
        (p.metadata?.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    /* Sort */
    switch (_currentSort) {
      case 'price-low':  list.sort((a, b) => a.price - b.price);           break;
      case 'price-high': list.sort((a, b) => b.price - a.price);           break;
      case 'rating':     list.sort((a, b) => b.metadata.rating - a.metadata.rating); break;
      default: break; /* popularity — original order */
    }

    _filtered = list;
    _currentPage = 1;
  }

  /* ---- Render grid ---- */
  function _renderGrid() {
    const grid = document.querySelector('.catalog-grid');
    if (!grid) return;

    const start = (_currentPage - 1) * PER_PAGE;
    const page  = _filtered.slice(start, start + PER_PAGE);

    if (page.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <p>No products found.</p>
          <button class="btn btn-outline" id="clear-search">Clear filters</button>
        </div>`;
      document.getElementById('clear-search')?.addEventListener('click', _clearFilters);
    } else {
      grid.innerHTML = page.map(p => _card(p, _searchQuery)).join('');
      _attachCardHandlers(grid);
    }

    _renderPagination();
  }

  /* ---- Pagination ---- */
  function _renderPagination() {
    const nav = document.querySelector('.pagination');
    if (!nav) return;
    const totalPages = Math.ceil(_filtered.length / PER_PAGE);
    if (totalPages <= 1) { nav.innerHTML = ''; return; }

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn ${i === _currentPage ? 'active' : ''}"
                       aria-current="${i === _currentPage}"
                       data-page="${i}">${i}</button>`;
    }
    nav.innerHTML = html;
    nav.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _currentPage = Number(btn.dataset.page);
        _renderGrid();
        document.querySelector('.catalog-hero')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  /* ---- Handlers ---- */
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
          // Add default packaging info
          const cartItem = {
            ...product,
            selectedPrice: product.price,
            selectedPack: _getDefaultPackValue(product.category),
            priceKey: _getDefaultPriceKey(product.category)
          };
          Store.addToCart(cartItem);
          Toast.show(`${product.name} added!`, 'success');
        }
      });
    });
  }

  function _getDefaultPackValue(category) {
    if (category === "Specialty Coffee") return "250";
    if (category === "Craft Syrups") return "250";
    if (category === "Premium Tea") return "100";
    return "250";
  }

  function _getDefaultPriceKey(category) {
    if (category === "Specialty Coffee") return "250g";
    if (category === "Craft Syrups") return "250ml";
    if (category === "Premium Tea") return "100g";
    return "250g";
  }

  function _attachControlHandlers() {
    /* Search */
    const searchInput = document.getElementById('catalog-search');
    let debounceTimer;
    searchInput?.addEventListener('input', e => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        _searchQuery = e.target.value.trim();
        _process();
        _renderGrid();
      }, 300);
    });

    /* Category tabs */
    document.querySelectorAll('.cat-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _currentCat = btn.dataset.cat;
        _process(); _renderGrid();
      });
    });

    /* Sort */
    document.getElementById('sort-select')?.addEventListener('change', e => {
      _currentSort = e.target.value;
      _process(); _renderGrid();
    });

    /* Search button */
    document.getElementById('search-btn')?.addEventListener('click', () => {
      const val = document.getElementById('catalog-search')?.value.trim() || '';
      _searchQuery = val;
      _process(); _renderGrid();
    });
  }

  function _clearFilters() {
    _currentCat  = 'all';
    _currentSort = 'popular';
    _searchQuery = '';
    document.getElementById('catalog-search').value = '';
    document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
    document.querySelector('.cat-tab[data-cat="all"]')?.classList.add('active');
    _process(); _renderGrid();
  }

  /* ---- Main render ---- */
  async function render(params = []) {
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <!-- Hero -->
      <section class="catalog-hero" aria-labelledby="cat-title">
        <div class="container" style="position:relative;z-index:1">
          <span class="deco-circle"></span>
          <p class="meta-tag">ORIGIN COLLECTION</p>
          <h1 id="cat-title" class="heading-xl">The Collection</h1>
          <p class="lead">
            Explore our finest selection of specialty coffees, 
            craft syrups, and premium teas.
          </p>
        </div>
      </section>

      <!-- Controls -->
      <div class="container">
        <div class="catalog-controls">
          <div class="search-row">
            <input class="form-control"
                   type="search"
                   id="catalog-search"
                   placeholder="Search by name, taste, or tag…"
                   aria-label="Search products"
                   value="${_searchQuery}">
            <button class="btn btn-primary" id="search-btn">Search</button>
          </div>

          <div class="filter-row">
            <div class="filter-group">
              <span id="cat-label">Category:</span>
              <nav aria-labelledby="cat-label" style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="tab-btn cat-tab ${_currentCat==='all'?'active':''}"
                        data-cat="all">All</button>
                <button class="tab-btn cat-tab ${_currentCat==='Specialty Coffee'?'active':''}"
                        data-cat="Specialty Coffee">Coffee</button>
                <button class="tab-btn cat-tab ${_currentCat==='Craft Syrups'?'active':''}"
                        data-cat="Craft Syrups">Syrups</button>
                <button class="tab-btn cat-tab ${_currentCat==='Premium Tea'?'active':''}"
                        data-cat="Premium Tea">Tea</button>
              </nav>
            </div>

            <div class="sort-group">
              <label for="sort-select">Sort by:</label>
              <select class="sort-select" id="sort-select">
                <option value="popular"   ${_currentSort==='popular'   ?'selected':''}>Popularity</option>
                <option value="price-low" ${_currentSort==='price-low' ?'selected':''}>Price: Low → High</option>
                <option value="price-high"${_currentSort==='price-high'?'selected':''}>Price: High → Low</option>
                <option value="rating"    ${_currentSort==='rating'    ?'selected':''}>Rating</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Grid -->
        <section class="catalog-section" aria-label="Products">
          <div class="catalog-grid" role="list"></div>
          <nav class="pagination" aria-label="Pages"></nav>
        </section>
      </div>
    `;

    /* Load data */
    try {
      _allProducts = await API.getProducts();
      /* Pre-filter if params passed: e.g. #catalog/coffee */
      if (params[0]) _currentCat = params[0];
      _process();
      _renderGrid();
      _attachControlHandlers();
    } catch (e) {
      document.querySelector('.catalog-grid').innerHTML =
        `<p style="color:red;grid-column:1/-1">Failed to load products.</p>`;
    }
  }

  return { render };
})();