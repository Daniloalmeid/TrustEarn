// js/main.js
document.addEventListener('DOMContentLoaded', () => {
  console.log("=== main.js Loaded ===");

  // Initialize wallet state
  let walletAddress = localStorage.getItem('walletAddress') || null;
  updateWalletUI();
  updateStakedTokens();
  updateProfilePage();
  loadProducts();

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

  // Load products dynamically
  function loadProducts() {
    const productList = document.querySelector('.product-list');
    if (!productList) return;

    // Clear existing cards
    productList.innerHTML = '';

    // Default products
    const defaultProducts = [
      {
        name: 'Smartphone X',
        description: 'Smartphone de alto desempenho com câmera avançada e suporte a 5G.',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
        category: 'Eletrônicos',
        wallet: 'default',
        timestamp: new Date().toLocaleString('pt-BR')
      },
      {
        name: 'Headphone Pro',
        description: 'Fones sem fio com cancelamento de ruído e bateria de longa duração.',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
        category: 'Eletrônicos',
        wallet: 'default',
        timestamp: new Date().toLocaleString('pt-BR')
      },
      {
        name: 'Smartwatch Z',
        description: 'Rastreador fitness com monitor de batimentos e design elegante.',
        image: 'https://images.unsplash.com/photo-1618384887924-16ec33fab9ef',
        category: 'Acessórios',
        wallet: 'default',
        timestamp: new Date().toLocaleString('pt-BR')
      },
      {
        name: 'Laptop Ultra',
        description: 'Laptop poderoso para jogos e produtividade com tela de alta resolução.',
        image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1',
        category: 'Eletrônicos',
        wallet: 'default',
        timestamp: new Date().toLocaleString('pt-BR')
      }
    ];

    // Load user-submitted products
    const userProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const allProducts = [...defaultProducts, ...userProducts];

    // Render products
    allProducts.forEach((product, index) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <div class="content">
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <button class="btn-select">Avaliar Produto</button>
        </div>
        <div class="review-form">
          <h4>Avaliar ${product.name}</h4>
          <form>
            <div class="form-group">
              <label for="reviewText${index + 1}">Sua Avaliação</label>
              <textarea id="reviewText${index + 1}" rows="3" placeholder="Compartilhe suas impressões..." required></textarea>
            </div>
            <div class="form-group">
              <label>Classificação</label>
              <div class="star-rating">
                <span class="star" data-value="1">★</span>
                <span class="star" data-value="2">★</span>
                <span class="star" data-value="3">★</span>
                <span class="star" data-value="4">★</span>
                <span class="star" data-value="5">★</span>
              </div>
            </div>
            <div class="form-group">
              <label>Sentimento</label>
              <div class="thumb-rating">
                <i class="fas fa-thumbs-up thumb up"></i>
                <i class="fas fa-thumbs-down thumb down"></i>
              </div>
            </div>
            <button type="submit" class="btn-submit">Enviar Avaliação</button>
          </form>
        </div>
      `;
      productList.appendChild(card);
    });

    // Reattach event listeners
    checkReviewedProducts();
    attachReviewFormListeners();
  }

  // Attach listeners to review forms
  function attachReviewFormListeners() {
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
  }

  // Product Review Forms
  attachReviewFormListeners();

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

  // Submit Product Form
  const submitProductForm = document.getElementById('submitProductForm');
  if (submitProductForm) {
    submitProductForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!walletAddress) {
        showMessage('Por favor, conecte sua carteira primeiro!', 'error');
        return;
      }

      const name = document.getElementById('productName').value.trim();
      const description = document.getElementById('productDescription').value.trim();
      const image = document.getElementById('productImage').value.trim();
      const category = document.getElementById('productCategory').value;

      // Validation
      if (!name) {
        showMessage('Por favor, informe o nome do produto.', 'error');
        return;
      }
      if (!description || description.length < 10) {
        showMessage('A descrição deve ter pelo menos 10 caracteres.', 'error');
        return;
      }
      if (!image) {
        showMessage('Por favor, informe uma URL de imagem.', 'error');
        return;
      }
      if (!category) {
        showMessage('Por favor, selecione uma categoria.', 'error');
        return;
      }

      // Check if image is valid
      const isImageValid = await isValidImageUrl(image);
      if (!isImageValid) {
        showMessage('A URL fornecida não é uma imagem válida.', 'error');
        return;
      }

      // Save product
      const productData = {
        name,
        description,
        image,
        category,
        wallet: walletAddress,
        timestamp: new Date().toLocaleString('pt-BR')
      };

      const products = JSON.parse(localStorage.getItem('products') || '[]');
      products.push(productData);
      localStorage.setItem('products', JSON.stringify(products));

      showMessage('Produto enviado com sucesso!', 'success');
      submitProductForm.reset();
      loadProducts(); // Refresh evaluate.html if open
    });
  }

  // Show message
  function showMessage(text, type) {
    const messageElement = document.getElementById('formMessage');
    if (messageElement) {
      messageElement.textContent = text;
      messageElement.className = `message ${type}`;
      setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = 'message';
      }, 3000);
    } else {
      alert(text);
    }
  }

  // Validate image URL by attempting to load it
  function isValidImageUrl(url) {
    return new Promise((resolve) => {
      try {
        // Check if URL is syntactically valid
        new URL(url);
        // Test if it's an image
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
        // Timeout after 5 seconds
        setTimeout(() => resolve(false), 5000);
      } catch (_) {
        resolve(false);
      }
    });
  }
});