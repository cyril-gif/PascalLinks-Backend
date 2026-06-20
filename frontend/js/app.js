/**
 * app.js – Updated for Dropdown Selection
 * ------------------------------------------------
 * Manages the purchase flow:
 * - Loads MTN plans into a dropdown
 * - Tracks selected plan
 * - Updates order summary
 * - Handles Paystack payment
 */

document.addEventListener('DOMContentLoaded', () => {
  const planDropdown = document.getElementById('planDropdown');
  const phoneInput = document.getElementById('phone');
  const summaryNetwork = document.getElementById('summaryNetwork');
  const summaryPlan = document.getElementById('summaryPlan');
  const summaryPhone = document.getElementById('summaryPhone');
  const summaryPrice = document.getElementById('summaryPrice');
  const orderSummary = document.getElementById('orderSummary');
  const orderPlaceholder = document.getElementById('orderPlaceholder');
  const buyNowBtn = document.getElementById('buyNowBtn');

  let selectedPlan = null;

  // Format price
  const formatPrice = (price) => price.toFixed(2);

  // Load plans into dropdown
  async function loadPlans() {
    try {
      const data = await window.api.fetchPlans('mtn');
      planDropdown.innerHTML = '<option value="">— Select a package —</option>';
      data.forEach(plan => {
        const option = document.createElement('option');
        option.value = JSON.stringify(plan);
        option.textContent = `${plan.name || plan.package_size} - GHS ${formatPrice(plan.price)}`;
        planDropdown.appendChild(option);
      });
      // Add a small note if no plans
      if (data.length === 0) {
        planDropdown.innerHTML = '<option value="">No plans available</option>';
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      planDropdown.innerHTML = '<option value="">Failed to load plans</option>';
    }
  }

  // Update order summary when dropdown changes
  planDropdown.addEventListener('change', () => {
    const value = planDropdown.value;
    if (!value) {
      selectedPlan = null;
      orderSummary.classList.add('hidden');
      orderPlaceholder.style.display = 'block';
      return;
    }
    selectedPlan = JSON.parse(value);
    updateSummary();
  });

  // Update summary when phone number changes
  phoneInput.addEventListener('input', updateSummary);

  function updateSummary() {
    const phone = phoneInput.value.trim();
    if (!selectedPlan || !phone) {
      orderSummary.classList.add('hidden');
      orderPlaceholder.style.display = 'block';
      return;
    }
    if (!/^0[2357]\d{8}$/.test(phone)) {
      orderSummary.classList.add('hidden');
      orderPlaceholder.style.display = 'block';
      return;
    }
    // Show summary
    summaryNetwork.textContent = 'MTN';
    summaryPlan.textContent = selectedPlan.name || selectedPlan.package_size;
    summaryPhone.textContent = phone;
    summaryPrice.textContent = `GHS ${formatPrice(selectedPlan.price)}`;
    orderSummary.classList.remove('hidden');
    orderPlaceholder.style.display = 'none';
  }

  // Buy Now
  buyNowBtn.addEventListener('click', async () => {
    if (!selectedPlan) {
      alert('Please select a plan.');
      return;
    }
    const phone = phoneInput.value.trim();
    if (!phone) {
      alert('Please enter a phone number.');
      return;
    }
    if (!/^0[2357]\d{8}$/.test(phone)) {
      alert('Please enter a valid Ghana phone number (e.g., 0241234567).');
      return;
    }

    buyNowBtn.disabled = true;
    buyNowBtn.textContent = 'Processing...';

    try {
      const orderData = {
        network: 'mtn',
        package_size: selectedPlan.package_size,
        beneficiary: phone,
      };

      const token = localStorage.getItem('token') || null;
      const response = await window.api.initiateOrder(orderData, token);
      const { orderId, transactionRef, amount, paystackKey } = response;

      const amountInPesewas = Math.round(amount * 100);

      const handler = PaystackPop.setup({
        key: paystackKey,
        email: 'customer@example.com', // consider asking user for email
        amount: amountInPesewas,
        currency: 'GHS',
        ref: transactionRef,
        callback: (resp) => {
          alert('Payment successful! Your order is being processed.');
          window.location.href = `order-status.html?orderId=${orderId}`;
        },
        onClose: () => {
          buyNowBtn.disabled = false;
          buyNowBtn.textContent = 'Buy Now';
        },
      });
      handler.openIframe();
    } catch (error) {
      alert(`Order failed: ${error.message}`);
      buyNowBtn.disabled = false;
      buyNowBtn.textContent = 'Buy Now';
    }
  });

  // Initial load
  loadPlans();
});
