// js/main.js
document.addEventListener('DOMContentLoaded', () => {
  console.log("=== main.js Loaded ===");

  // Initialize wallet state
  let walletAddress = localStorage.getItem('walletAddress') || null;
  updateWalletUI();
  updateStakedTokens();
  updateProfilePage();

  // Update wallet UI across pages
  function updateWalletUI() {
    const connectWalletBtn = document.getElementById('connectWallet');
    if (connectWalletBtn) {
      if (walletAddress) {
        connectWalletBtn.textContent = 'Desconectar';
        connectWalletBtn.classList.add('connected');
        connectWalletBtn.classList.add('btn-secondary');
        connectWalletBtn.classList.remove('btn-primary');
      } else {
        connectWalletBtn.textContent = 'Conectar Carteira';
        connectWalletBtn.classList.remove('connected');
        connectWalletBtn.classList.remove('btn-secondary');
        connectWalletBtn.classList.add('btn-primary');
      }
      checkReviewedProducts();
    }
  }

  // Get user data by wallet address
  function getUserData(walletAddress) {
    const walletsData = JSON.parse(localStorage.getItem('walletsData') || '{}');
    return walletsData[walletAddress] || { balance: 0, reviews: [], stakes: [] };
  }

  // Save user data by wallet address
  function saveUserData(walletAddress, data) {
    const walletsData = JSON.parse(localStorage.getItem('walletsData') || '{}');
    walletsData[walletAddress] = data;
    localStorage.setItem('walletsData', JSON.stringify(walletsData));
  }

  // Clear wallet address without deleting user data
  function clearWalletAddress() {
    localStorage.removeItem('walletAddress');
  }

  // Wallet Connection/Disconnection
  const connectWalletBtn = document.getElementById('connectWallet');
  if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', () => {
      if (walletAddress) {
        // Disconnect wallet
        walletAddress = null;
        clearWalletAddress();
        alert('Carteira desconectada!');
        updateWalletUI();
        updateStakedTokens();
        updateProfilePage();
      } else {
        // Connect wallet
        if (typeof window.solana !== 'undefined' && window.solana.isPhantom) {
          window.solana.connect()
            .then((resp) => {
              walletAddress = resp.publicKey.toString();
              localStorage.setItem('walletAddress', walletAddress);
              const userData = getUserData(walletAddress);
              if (!userData.balance && !userData.reviews && !userData.stakes) {
                userData.balance = 0;
                userData.reviews = [];
                userData.stakes = [];
                saveUserData(walletAddress, userData);
              }
              alert(`Conectado à Phantom Wallet: ${walletAddress}`);
              updateWalletUI();
              updateStakedTokens();
              updateProfilePage();
            })
            .catch((err) => {
              console.error('Erro ao conectar:', err);
              alert('Falha ao conectar à Phantom Wallet: ' + err.message);
            });
        } else {
          alert('Por favor, instale a Phantom Wallet!');
          window.open('https://phantom.app/', '_blank');
        }
      }
    });
  }

  // Check reviewed products
  function checkReviewedProducts() {
    if (!walletAddress) return;
    const userData = getUserData(walletAddress);
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
      const productName = card.querySelector('h3').textContent;
      const selectBtn = card.querySelector('.btn-select');
      const hasReviewed = userData.reviews.some(review => review.product === productName);
      if (hasReviewed && selectBtn) {
        selectBtn.classList.add('disabled');
        selectBtn.textContent = '✓ Já Avaliado';
        selectBtn.removeEventListener('click', toggleReviewForm);
      } else if (selectBtn) {
        selectBtn.classList.remove('disabled');
        selectBtn.textContent = 'Avaliar Produto';
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
    if (reviewForm && selectBtn) {
      reviewForm.classList.toggle('active');
      selectBtn.textContent = reviewForm.classList.contains('active') ? 'Ocultar Avaliação' : 'Avaliar Produto';
    }
  }

  // Update staked tokens
  function updateStakedTokens() {
    const stakedTokensElement = document.getElementById('stakedTokens');
    const stakeReleaseDateElement = document.getElementById('stakeReleaseDate');
    const stakeRewardsElement = document.getElementById('stakeRewards');
    if (stakedTokensElement && stakeReleaseDateElement && stakeRewardsElement) {
      if (!walletAddress) {
        stakedTokensElement.textContent = '0.00 DET';
        stakeReleaseDateElement.textContent = 'N/A';
        stakeRewardsElement.textContent = '0.00 DET';
        return;
      }

      const userData = getUserData(walletAddress);
      const now = new Date();
      let totalStaked = 0;
      let latestReleaseDate = null;
      let totalRewards = 0;

      // Process stakes
      const updatedStakes = [];
      userData.stakes.forEach(stake => {
        const stakeDate = new Date(stake.date);
        const releaseDate = new Date(stakeDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 dias
        if (isNaN(releaseDate.getTime())) {
          console.error('Data de stake inválida:', stake.date);
          return;
        }
        if (now >= releaseDate) {
          // Release stake
          userData.balance += stake.amount + (stake.amount * 0.5); // +50%
          console.log(`Stake liberado: ${stake.amount.toFixed(2)} DET + ${(stake.amount * 0.5).toFixed(2)} DET`);
        } else {
          updatedStakes.push(stake);
          totalStaked += stake.amount;
          totalRewards += stake.amount * 0.5;
          if (!latestReleaseDate || releaseDate > latestReleaseDate) {
            latestReleaseDate = releaseDate;
          }
        }
      });

      userData.stakes = updatedStakes;
      saveUserData(walletAddress, userData);

      stakedTokensElement.textContent = `${totalStaked.toFixed(2)} DET`;
      stakeReleaseDateElement.textContent = latestReleaseDate ? latestReleaseDate.toLocaleDateString('pt-BR') : 'N/A';
      stakeRewardsElement.textContent = `${totalRewards.toFixed(2)} DET`;
    }
  }

  // Product Review Forms
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    const selectBtn = card.querySelector('.btn-select');
    const reviewForm = card.querySelector('.review-form');
    const form = reviewForm ? reviewForm.querySelector('form') : null;
    if (!form || !selectBtn) return;

    // Star Rating
    const stars = form.querySelectorAll('.star');
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
    const thumbs = form.querySelectorAll('.thumb');
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
        alert('Por favor, conecte sua carteira primeiro!');
        return;
      }

      const productName = card.querySelector('h3').textContent;
      const reviewText = form.querySelector('textarea').value.trim();
      const selectedStars = form.querySelectorAll('.star.selected').length;
      const selectedThumb = form.querySelector('.thumb.selected');
      const thumbType = selectedThumb ? (selectedThumb.classList.contains('up') ? 'Positivo' : 'Negativo') : null;

      // Validation
      if (!reviewText || reviewText.length < 10) {
        alert('Por favor, escreva uma avaliação com pelo menos 10 caracteres.');
        return;
      }
      if (selectedStars === 0) {
        alert('Por favor, selecione uma classificação por estrelas.');
        return;
      }
      if (!thumbType) {
        alert('Por favor, selecione um sentimento (polegar para cima ou para baixo).');
        return;
      }

      // Check if already reviewed
      const userData = getUserData(walletAddress);
      if (userData.reviews.some(review => review.product === productName)) {
        alert('Você já avaliou este produto!');
        return;
      }

      // Token reward
      const tokensEarned = 10; // 10 DET per review
      const stakeAmount = tokensEarned * 0.1; // 10% to stake
      const availableTokens = tokensEarned - stakeAmount; // 90% to balance

      // Store review
      const reviewData = {
        product: productName,
        text: reviewText,
        stars: selectedStars,
        thumb: thumbType,
        tokens: tokensEarned,
        timestamp: new Date().toLocaleString('pt-BR')
      };
      userData.reviews.push(reviewData);

      // Update balance
      userData.balance += availableTokens;

      // Store stake
      userData.stakes.push({
        amount: stakeAmount,
        date: new Date().toISOString()
      });

      saveUserData(walletAddress, userData);

      alert(`Avaliação enviada para ${productName}!\nClassificação: ${selectedStars} estrelas\nSentimento: ${thumbType}\nAvaliação: ${reviewText}\nTokens Ganhos: ${tokensEarned.toFixed(2)} DET\nStaked: ${stakeAmount.toFixed(2)} DET (90 dias, 50% de retorno)`);

      form.reset();
      stars.forEach(s => s.classList.remove('selected'));
      thumbs.forEach(t => t.classList.remove('selected'));
      reviewForm.classList.remove('active');
      selectBtn.textContent = '✓ Já Avaliado';
      selectBtn.classList.add('disabled');
      selectBtn.removeEventListener('click', toggleReviewForm);

      updateStakedTokens();
      updateProfilePage();
    });
  });

  // Update Profile Page
  function updateProfilePage() {
    const tokenBalanceElement = document.getElementById('tokenBalance');
    const reviewHistoryElement = document.getElementById('reviewHistory');
    const walletAddressElement = document.getElementById('walletAddress');
    if (tokenBalanceElement && reviewHistoryElement && walletAddressElement) {
      walletAddressElement.textContent = walletAddress || 'Não conectado';
      if (!walletAddress) {
        tokenBalanceElement.textContent = '0.00 DET';
        reviewHistoryElement.innerHTML = '<tr><td colspan="6">Nenhuma avaliação ainda.</td></tr>';
        return;
      }

      const userData = getUserData(walletAddress);
      tokenBalanceElement.textContent = `${userData.balance.toFixed(2)} DET`;

      reviewHistoryElement.innerHTML = '';
      if (userData.reviews.length > 0) {
        userData.reviews.forEach(review => {
          const row = document.createElement('tr');
          const stars = '★'.repeat(review.stars) + '☆'.repeat(5 - review.stars);
          row.innerHTML = `
            <td>${review.product}</td>
            <td>${review.text}</td>
            <td><span class="stars">${stars}</span></td>
            <td><i class="fas fa-thumbs-${review.thumb === 'Positivo' ? 'up thumb-up' : 'down thumb-down'}"></i></td>
            <td>${review.tokens.toFixed(2)}</td>
            <td>${review.timestamp}</td>
          `;
          reviewHistoryElement.appendChild(row);
        });
      } else {
        reviewHistoryElement.innerHTML = '<tr><td colspan="6">Nenhuma avaliação ainda.</td></tr>';
      }
    }
  }

  // Withdraw Button
  const withdrawBtn = document.getElementById('withdrawTokens');
  if (withdrawBtn) {
    withdrawBtn.addEventListener('click', () => {
      alert('Saques estarão disponíveis em breve! Fique ligado para atualizações.');
    });
  }
});