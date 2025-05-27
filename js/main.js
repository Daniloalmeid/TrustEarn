// js/main.js
document.addEventListener('DOMContentLoaded', () => {
  console.log("main.js loaded");

  // Wallet Connection
  const connectWalletBtn = document.getElementById('connectWallet');
  if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', () => {
      if (typeof window.solana !== 'undefined' && window.solana.isPhantom) {
        window.solana.connect()
          .then(() => {
            alert('Connected to Phantom Wallet!');
            connectWalletBtn.textContent = 'Connected';
            connectWalletBtn.classList.add('connected');
            connectWalletBtn.disabled = true;
          })
          .catch((err) => {
            alert('Failed to connect to Phantom Wallet: ' + err.message);
          });
      } else {
        alert('Please install Phantom Wallet!');
      }
    });
  }

  // Product Selection
  const productCards = document.querySelectorAll('.product-card');
  const reviewForm = document.getElementById('reviewForm');
  const reviewFormTitle = document.querySelector('.review-form h2');
  let selectedProduct = '';

  if (productCards.length > 0 && reviewForm) {
    productCards.forEach(card => {
      card.addEventListener('click', () => {
        selectedProduct = card.querySelector('h3').textContent;
        reviewFormTitle.textContent = `Review ${selectedProduct}`;
        reviewForm.classList.add('active');
        // Scroll to form
        reviewForm.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // Star Rating
  const stars = document.querySelectorAll('.star');
  if (stars.length > 0) {
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const rating = star.getAttribute('data-value');
        stars.forEach(s => {
          if (s.getAttribute('data-value') <= rating) {
            s.classList.add('selected');
          } else {
            s.classList.remove('selected');
          }
        });
      });
    });
  }

  // Review Form Submission
  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const reviewText = document.getElementById('reviewText').value;
      const selectedStars = document.querySelectorAll('.star.selected').length;
      if (reviewText && selectedStars > 0 && selectedProduct) {
        alert(`Review submitted for ${selectedProduct}!\nRating: ${selectedStars} stars\nReview: ${reviewText}`);
        reviewForm.reset();
        stars.forEach(s => s.classList.remove('selected'));
        reviewForm.classList.remove('active');
        selectedProduct = '';
      } else {
        alert('Please select a product, provide a review, and select a rating.');
      }
    });
  }
});