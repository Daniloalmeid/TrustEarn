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
    const thumbs = reviewForm.querySelectorAll('.thumb');
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

    // Thumb Rating
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        thumbs.forEach(t => t.classList.remove('selected'));
        thumb.classList.add('selected');
      });
    });

    // Review Form Submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const reviewText = form.querySelector('textarea').value;
      const selectedStars = reviewForm.querySelectorAll('.star.selected').length;
      const selectedThumb = reviewForm.querySelector('.thumb.selected');
      const thumbType = selectedThumb ? (selectedThumb.classList.contains('up') ? 'Positive' : 'Negative') : null;

      if (reviewText && selectedStars > 0 && thumbType) {
        // Simulate token reward
        const tokensEarned = 10; // 10 DET per review
        const reviewData = {
          product: productName,
          text: reviewText,
          stars: selectedStars,
          thumb: thumbType,
          tokens: tokensEarned,
          timestamp: new Date().toLocaleString()
        };

        // Store review in localStorage
        let reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        reviews.push(reviewData);
        localStorage.setItem('reviews', JSON.stringify(reviews));

        // Update token balance
        let tokenBalance = parseInt(localStorage.getItem('tokenBalance') || '0');
        tokenBalance += tokensEarned;
        localStorage.setItem('tokenBalance', tokenBalance);

        alert(`Review submitted for ${productName}!\nRating: ${selectedStars} stars\nSentiment: ${thumbType}\nReview: ${reviewText}\nTokens Earned: ${tokensEarned} DET`);
        form.reset();
        stars.forEach(s => s.classList.remove('selected'));
        thumbs.forEach(t => t.classList.remove('selected'));
        reviewForm.classList.remove('active');
        selectBtn.textContent = 'Review This Product';
      } else {
        alert('Please provide a review, select a star rating, and choose a sentiment (thumbs up or down).');
      }
    });
  });

  // Profile Page: Display Reviews and Token Balance
  const tokenBalanceElement = document.getElementById('tokenBalance');
  const reviewHistoryElement = document.getElementById('reviewHistory');
  if (tokenBalanceElement && reviewHistoryElement) {
    const tokenBalance = localStorage.getItem('tokenBalance') || '0';
    tokenBalanceElement.textContent = `${tokenBalance} DET`;

    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    if (reviews.length > 0) {
      reviews.forEach(review => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${review.product}</td>
          <td>${review.text}</td>
          <td>${review.stars}</td>
          <td><i class="fas fa-thumbs-${review.thumb === 'Positive' ? 'up thumb-up' : 'down thumb-down'}"></i></td>
          <td>${review.tokens}</td>
          <td>${review.timestamp}</td>
        `;
        reviewHistoryElement.appendChild(row);
      });
    } else {
      reviewHistoryElement.innerHTML = '<tr><td colspan="6">No reviews yet.</td></tr>';
    }
  }
});