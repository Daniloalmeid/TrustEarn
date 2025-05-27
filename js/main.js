// js/main.js
document.addEventListener('DOMContentLoaded', () => {
  console.log("main.js loaded");

  // Initialize wallet state
  let walletAddress = localStorage.getItem('walletAddress') || null;
  updateWalletUI();

  // Update wallet UI across pages
  function updateWalletUI() {
    const connectWalletBtn = document.getElementById('connectWallet');
    if (connectWalletBtn) {
      if (walletAddress) {
        connectWalletBtn.textContent = 'Disconnect';
        connectWalletBtn.classList.add('connected');
        connectWalletBtn.classList.add('btn-secondary'); // Estilo de desconexão
        connectWalletBtn.classList.remove('btn-primary');
      } else {
        connectWalletBtn.textContent = 'Connect Wallet';
        connectWalletBtn.classList.remove('connected');
        connectWalletBtn.classList.remove('btn-secondary');
        connectWalletBtn.classList.add('btn-primary');
      }
      checkReviewedProducts();
    }
  }

  // Wallet Connection/Disconnection
  const connectWalletBtn = document.getElementById('connectWallet');
  if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', () => {
      if (walletAddress) {
        // Disconnect wallet
        walletAddress = null;
        localStorage.removeItem('walletAddress');
        if (window.solana && window.solana.disconnect) {
          window.solana.disconnect();
        }
        alert('Wallet disconnected!');
        updateWalletUI();
      } else {
        // Connect wallet
        if (typeof window.solana !== 'undefined' && window.solana.isPhantom) {
          window.solana.connect()
            .then((resp) => {
              walletAddress = resp.publicKey.toString();
              localStorage.setItem('walletAddress', walletAddress);
              alert(`Connected to Phantom Wallet: ${walletAddress}`);
              updateWalletUI();
            })
            .catch((err) => {
              alert('Failed to connect to Phantom Wallet: ' + err.message);
            });
        } else {
          alert('Please install Phantom Wallet!');
        }
      }
    });
  }

  // Check Reviewed Products
  function checkReviewedProducts() {
    if (!walletAddress) return;
    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
      const productName = card.querySelector('h3').textContent;
      const selectBtn = card.querySelector('.btn-select');
      const hasReviewed = reviews.some(review => review.wallet === walletAddress && review.product === productName);
      if (hasReviewed) {
        selectBtn.classList.add('disabled');
        selectBtn.textContent = 'Already Reviewed';
        selectBtn.removeEventListener('click', toggleReviewForm);
      } else {
        selectBtn.classList.remove('disabled');
        selectBtn.textContent = 'Review This Product';
        selectBtn.addEventListener('click', toggleReviewForm);
      }
    });
  }

  // Toggle Review Form
  function toggleReviewForm(e) {
    e.preventDefault();
    const card = e.target.closest('.product-card');
    const reviewForm = card.querySelector('.review-form');
    const selectBtn = card.querySelector('.btn-select');
    reviewForm.classList.toggle('active');
    selectBtn.textContent = reviewForm.classList.contains('active') ? 'Hide Review' : 'Review This Product';
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
      if (!walletAddress) {
        alert('Please connect your wallet first!');
        return;
      }
      const reviewText = form.querySelector('textarea').value;
      const selectedStars = reviewForm.querySelectorAll('.star.selected').length;
      const selectedThumb = reviewForm.querySelector('.thumb.selected');
      const thumbType = selectedThumb ? (selectedThumb.classList.contains('up') ? 'Positive' : 'Negative') : null;

      if (reviewText && selectedStars > 0 && thumbType) {
        // Check if already reviewed
        const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        if (reviews.some(review => review.wallet === walletAddress && review.product === productName)) {
          alert('You have already reviewed this product!');
          return;
        }

        // Simulate token reward
        const tokensEarned = 10; // 10 DET per review
        const reviewData = {
          wallet: walletAddress,
          product: productName,
          text: reviewText,
          stars: selectedStars,
          thumb: thumbType,
          tokens: tokensEarned,
          timestamp: new Date().toLocaleString()
        };

        // Store review
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
        selectBtn.textContent = 'Already Reviewed';
        selectBtn.classList.add('disabled');
        selectBtn.removeEventListener('click', toggleReviewForm);
      } else {
        alert('Please provide a review, select a star rating, and choose a sentiment (thumbs up or down).');
      }
    });
  });

  // Profile Page: Display Reviews and Token Balance
  const tokenBalanceElement = document.getElementById('tokenBalance');
  const reviewHistoryElement = document.getElementById('reviewHistory');
  const walletAddressElement = document.getElementById('walletAddress');
  if (tokenBalanceElement && reviewHistoryElement && walletAddressElement) {
    walletAddressElement.textContent = walletAddress || 'Not connected';
    const tokenBalance = localStorage.getItem('tokenBalance') || '0';
    tokenBalanceElement.textContent = `${tokenBalance} DET`;

    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    const userReviews = walletAddress ? reviews.filter(review => review.wallet === walletAddress) : [];
    if (userReviews.length > 0) {
      userReviews.forEach(review => {
        const row = document.createElement('tr');
        const stars = '★'.repeat(review.stars) + '☆'.repeat(5 - review.stars);
        row.innerHTML = `
          <td>${review.product}</td>
          <td>${review.text}</td>
          <td><span class="stars">${stars}</span></td>
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

  // Withdraw Button
  const withdrawBtn = document.getElementById('withdrawTokens');
  if (withdrawBtn) {
    withdrawBtn.addEventListener('click', () => {
      alert('Withdrawals are coming soon! Stay tuned for updates.');
    });
  }
});