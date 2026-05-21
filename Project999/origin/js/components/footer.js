const Footer = (() => {
  function render() {
    document.getElementById('site-footer').innerHTML = `
      <div class="container">
        <div class="footer-grid">

          <section class="footer-brand">
            <h2>Origin</h2>
            <p>Curated coffees, rare teas and crafted experiences.
               From single-origin farms to your cup.</p>
            <small class="copyright">&copy; ${new Date().getFullYear()} ORIGIN. All rights reserved.</small>
          </section>

          <section class="footer-col" aria-labelledby="ft-team">
            <h3 id="ft-team">Development team</h3>
            <ul>
              <li>Gavrylenko Oleksiy</li>
              <li>Gromov Andriy</li>
              <li>Seniv Kateryna</li>
            </ul>
          </section>

          <section class="footer-col" aria-labelledby="ft-support">
            <h3 id="ft-support">Support &amp; Info</h3>
            <address>
              <p>Ivano-Frankivsk, Ukraine</p>
              <p><a href="tel:+380000000000">+380 (XX) XXX XX XX</a></p>
              <a href="#privacy">Privacy policy</a>
            </address>
          </section>

        </div>
      </div>
    `;
  }

  return { render };
})();