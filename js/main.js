// js/main.js
document.addEventListener('DOMContentLoaded', () => {
  console.log("main.js loaded");

  const connectWalletBtn = document.getElementById('connectWallet');
  if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', () => {
      // Simulate Phantom Wallet connection
      if (typeof window.solana !== 'undefined' && window.solana.isPhantom) {
        window.solana.connect()
          .then(() => {
            alert('Connected to Phantom Wallet!');
            connectWalletBtn.textContent = 'Wallet Connected';
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
});