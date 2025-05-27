// static/js/main.js

// Connect Wallet
async function connectWallet() {
    const connectButton = document.getElementById('connectWallet');
    if (connectButton) {
      connectButton.addEventListener('click', async () => {
        if (window.solana && window.solana.isPhantom) {
          try {
            const response = await window.solana.connect();
            const walletAddress = response.publicKey.toString();
            localStorage.setItem('walletAddress', walletAddress); // Save wallet address
            alert('Wallet connected: ' + walletAddress);
            await fetch('/connect_wallet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ wallet: walletAddress })
            });
          } catch (err) {
            alert('Error connecting wallet: ' + err.message);
          }
        } else {
          alert('Please install Phantom wallet!');
        }
      });
    }
  }
  
  // Submit Review
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      formData.append('user', localStorage.getItem('walletAddress') || 'anonymous'); // Add wallet address
      const response = await fetch('/submit_review', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      alert(result.message);
    });
  }
  
  // Submit Product
  const productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const response = await fetch('/submit_product', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      alert(result.message);
    });
  }
  
  // Approve/Reject Reviews
  async function approveReview(reviewId) {
    const response = await fetch('/approve_review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: reviewId })
    });
    const result = await response.json();
    alert(result.message);
    location.reload();
  }
  
  async function rejectReview(reviewId) {
    const response = await fetch('/reject_review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: reviewId, reason: 'Invalid review' })
    });
    const result = await response.json();
    alert(result.message);
    location.reload();
  }
  
  // Chart for submit-product.html
  if (document.getElementById('statsChart')) {
    const ctx = document.getElementById('statsChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Valid', 'Pending', 'Rejected'],
        datasets: [{
          label: 'Reviews',
          data: [10, 5, 2], // Replace with backend data
          backgroundColor: ['#3A86FF', '#FFD166', '#B388EB']
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
  
  connectWallet();