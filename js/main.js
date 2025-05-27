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

  // Product Review Forms
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    const selectBtn = card.querySelector('.btn-select');
    const reviewForm = card.querySelector('.review-form');
    const stars = reviewForm.querySelectorAll('.star');
    const form = reviewForm.querySelector('form');
    const productName = card.querySelector('h3').textContent;

    // Toggle Review Form
    selectBtn.addEventListener('click', (e) => {
      e.preventDefault();
      reviewForm.classList.toggle('active');
      selectBtn.textContent = reviewForm.classList.contains('active') ? 'Hide Review' : 'Review This Product';
    });

    // Star Rating
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

    // Review Form Submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const reviewText = form.querySelector('textarea').value;
      const selectedStars = reviewForm.querySelectorAll('.star.selected').length;
      if (reviewText && selectedStars > 0) {
        alert(`Review submitted for ${productName}!\nRating: ${selectedStars} stars\nReview: ${reviewText}`);
        form.reset();
        stars.forEach(s => s.classList.remove('selected'));
        reviewForm.classList.remove('active');
        selectBtn.textContent = 'Review This Product';
      } else {
        alert('Please provide a review and select a rating.');
      }
    });
  });
});