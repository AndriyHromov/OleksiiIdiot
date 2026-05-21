const ProductView = (() => {

  async function render(params = []) {
    const id   = params[0];
    const main = document.getElementById('main-content');

    main.innerHTML = `<div class="spinner" style="min-height:60vh"></div>`;

    let product;
    try {
      product = await API.getProductById(id);
    } catch (e) {
      main.innerHTML = `<p style="text-align:center;padding:4rem;color:red">
        Failed to load product.</p>`;
      return;
    }

    if (!product) {
      main.innerHTML = `
        <div style="text-align:center;padding:4rem">
          <h2>Product not found</h2>
          <a href="#catalog" class="btn btn-primary" style="margin-top:1rem">
            Back to Catalog
          </a>
        </div>`;
      return;
    }

    /* Badges */
    const discount = product.originalPrice
      ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
    const badges = [
      product.availability.isNew        ? `<span class="badge badge-new">NEW</span>` : '',
      product.availability.isOnSale     ? `<span class="badge badge-sale">-${discount}%</span>` : '',
      product.availability.isBestseller ? `<span class="badge badge-bestseller">BESTSELLER</span>` : '',
    ].join('');

    const notesHTML = product.tastingNotes
      .map(n => `<li class="note-pill">${n}</li>`).join('');

    const priceHTML = product.originalPrice
      ? `<span class="original">$${product.originalPrice.toFixed(2)}</span> $${product.price.toFixed(2)}`
      : `$${product.price.toFixed(2)}`;

    let currentPrice = product.price;
    let currentOriginalPrice = product.originalPrice;
    const productPrices = product.prices || {};

    // Determine packaging options based on category
    let packagingOptions = [];
    if (product.category === "Specialty Coffee") {
      packagingOptions = [
        { value: "250", label: "250 g", priceKey: "250g" },
        { value: "1000", label: "1 kg", priceKey: "1kg" }
      ];
    } else if (product.category === "Craft Syrups") {
      packagingOptions = [
        { value: "250", label: "250 ml", priceKey: "250ml" },
        { value: "1000", label: "1 L", priceKey: "1L" }
      ];
    } else if (product.category === "Premium Tea") {
      packagingOptions = [
        { value: "100", label: "100 g", priceKey: "100g" },
        { value: "500", label: "500 g", priceKey: "500g" }
      ];
    } else {
      // Default fallback
      packagingOptions = [
        { value: "250", label: "250 g", priceKey: "250g" },
        { value: "1000", label: "1 kg", priceKey: "1kg" }
      ];
    }

    const specsHTML = Object.entries(product.specifications)
      .map(([k, v]) => `
        <div class="spec-item">
          <dt>${k.charAt(0).toUpperCase() + k.slice(1)}</dt>
          <dd>${v}</dd>
        </div>`).join('');

    main.innerHTML = `
      <div class="product-detail-page">
        <div class="container">

          <!-- Back button -->
          <button class="product-detail-back" id="back-btn">
            ← Back
          </button>

          <!-- Split: image + info -->
          <div class="product-detail-split"
               itemscope itemtype="https://schema.org/Product">

            <figure>
              <img class="product-detail-img"
                   itemprop="image"
                   src="${product.image}"
                   alt="${product.name}">
            </figure>

            <section class="product-detail-info">
              <div style="display:flex;gap:8px;flex-wrap:wrap">${badges}</div>

              <h1 itemprop="name">${product.name}</h1>

              <p class="product-detail-price"
                 itemprop="offers"
                 itemscope itemtype="https://schema.org/Offer">
                <meta itemprop="priceCurrency" content="UAH">
                <meta itemprop="price" content="${product.price}">
                ${priceHTML}
              </p>

              <ul class="product-detail-notes" aria-label="Tasting notes">
                ${notesHTML}
              </ul>

              <!-- Packaging -->
              <fieldset class="packaging-fieldset">
                <legend>Packaging:</legend>
                <div class="packaging-btns">
                  ${packagingOptions.map((opt, index) => `
                    <input type="radio" id="p${opt.value}" name="pack" value="${opt.value}" class="pack-radio" data-price-key="${opt.priceKey}" ${index === 0 ? 'checked' : ''}>
                    <label for="p${opt.value}" class="pack-label">${opt.label}</label>
                  `).join('')}
                </div>
              </fieldset>

              <!-- Quantity + add to cart -->
              <div class="qty-row">
                <label for="qty-detail">Quantity:</label>
                <input type="number" id="qty-detail"
                       class="qty-input" min="1" value="1">
                <button class="btn btn-primary" id="detail-add-btn">
                  Add to cart
                </button>
              </div>

            </section>
          </div>

          <!-- Description -->
          <section class="product-detail-desc">
            <h2>Description</h2>
            <p itemprop="description">${product.longDescription || product.description}</p>

            ${specsHTML ? `
            <h2 style="margin-top:1.5rem">Specifications</h2>
            <dl class="product-specs">${specsHTML}</dl>` : ''}
          </section>

        </div>
      </div>
    `;

    /* Back button */
    document.getElementById('back-btn')?.addEventListener('click', () => {
      window.history.length > 1 ? window.history.back() : Router.navigate('catalog');
    });

    /* Packaging selection - update price based on weight */
    function updatePrice() {
      const selectedRadio = document.querySelector('.pack-radio:checked');
      if (!selectedRadio) return;
      
      const priceKey = selectedRadio.dataset.priceKey;
      const selectedPack = selectedRadio.value;
      
      currentPrice = productPrices[priceKey] || product.price;
      
      // Calculate original price proportionally if it exists
      if (product.originalPrice && productPrices[priceKey]) {
        const ratio = productPrices[priceKey] / product.price;
        currentOriginalPrice = product.originalPrice * ratio;
      } else {
        currentOriginalPrice = product.originalPrice;
      }

      const priceEl = document.querySelector('.product-detail-price');
      if (priceEl) {
        priceEl.innerHTML = currentOriginalPrice
          ? `<span class="original">$${currentOriginalPrice.toFixed(2)}</span> $${currentPrice.toFixed(2)}`
          : `$${currentPrice.toFixed(2)}`;
        priceEl.querySelector('meta[itemprop="price"]').setAttribute('content', currentPrice);
      }
    }

    document.querySelectorAll('.pack-radio').forEach(radio => {
      radio.addEventListener('change', updatePrice);
    });

    /* Add to cart */
    document.getElementById('detail-add-btn')?.addEventListener('click', () => {
      const qty = parseInt(document.getElementById('qty-detail')?.value) || 1;
      const selectedRadio = document.querySelector('.pack-radio:checked');
      const priceKey = selectedRadio?.dataset.priceKey || Object.keys(productPrices)[0];
      const selectedPack = selectedRadio?.value || '250';
      
      const cartItem = {
        ...product,
        selectedPrice: currentPrice,
        selectedPack: selectedPack,
        priceKey: priceKey
      };
      
      Store.addToCart(cartItem, qty);
      Toast.show(`${product.name} (×${qty}) added to cart!`, 'success');
    });
  }

  return { render };
})();