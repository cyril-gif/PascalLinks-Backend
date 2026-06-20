/**
 * app.js
 * ------------------------------------------------
 * Main frontend logic for the data bundle purchase flow.
 * Handles network selection (MTN only), plan fetching, phone input,
 * order summary, and Paystack payment integration.
 */

document.addEventListener('DOMContentLoaded', () => {
  const networkBtns = document.querySelectorAll('.network-btn');
  const planListEl = document.getElementById('planList');
  const phoneInput = document.getElementById('phone');
  const summaryNetwork = document.getElementById('summaryNetwork');
  const summaryPlan = document.getElementById('summaryPlan');
  const summaryPhone = document.getElementById('summaryPhone');
  const summaryPrice = document.getElementById('summaryPrice');
  const orderSummary = document.getElementById('orderSummary');
  const buyNowBtn = document.getElementById('buyNowBtn');

  let selectedNetwork = 'mtn';
  let selectedPlan = null;
  let currentPlans = [];

  const formatPrice = (price) => price.toFixed(2);

  async function loadPlans(network) {
    planListEl.innerHTML = '<p class="loading">Loading plans...</p>';
    try {
      const data = await window.api.fetchPlans(network);
      currentPlans = data;
      renderPlans(currentPlans);
    } catch (error) {
      planListEl.innerHTML = `<p class="error">Failed to load plans: ${error.message}</p>`;
    }
  }

  function renderPlans(plans) {
    if (!plans || plans.length === 0) {
      planListEl.innerHTML = '<p>No plans available for this network.</p>';
      return;
    }
    planListEl.innerHTML = plans.map(plan => `
      <div class="plan-card" data-plan='${JSON.stringify(plan)}'>
        <div class="plan-name">${plan.name || plan.package_size}</div>
        <div class="plan-size">${plan.size || ''}</div>
        <div class="plan-price">GHS ${formatPrice(plan.price)}</div>
      </div>
    `).join('');

    document.querySelectorAll('.plan-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedPlan = JSON.parse(card.dataset.plan);
        updateSummary();
      });
    });
  }

  function updateSummary() {
    const phone = phoneInput.value.trim();
    if (!selectedPlan || !phone) {
      orderSummary.classList.add('hidden');
      return;
    }
    if (!/^0[2357]\d{8}$/.test(phone)) {
      orderSummary.classList.add('hidden');
      return;
    }
    summaryNetwork.textContent = selectedNetwork.toUpperCase();
    summaryPlan.textContent = selectedPlan.name || selectedPlan.package_size;
    summaryPhone.textContent = phone;
    summaryPrice.textContent = formatPrice(selectedPlan.price); // base price (will be overwritten by backend response)
    orderSummary.classList.remove('hidden');
  }

  networkBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      networkBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedNetwork = btn.dataset.network;
      selectedPlan = null;
      orderSummary.classList.add('hidden');
      loadPlans(selectedNetwork);
    });
  });

  phoneInput.addEventListener('input', updateSummary);

  buyNowBtn.addEventListener('click', async () => {
    if (!selectedPlan || !phoneInput.value.trim()) {
      alert('Please select a plan and enter a phone number.');
      return;
    }
    const phone = phoneInput.value.trim();
    if (!/^0[2357]\d{8}$/.test(phone)) {
      alert('Please enter a valid Ghana phone number (e.g., 0241234567).');
      return;
    }

    buyNowBtn.disabled = true;
    buyNowBtn.textContent = 'Processing...';

    try {
      const orderData = {
        network: selectedNetwork,
        package_size: selectedPlan.package_size,
        beneficiary: phone,
      };
      const response = await window.api.initiateOrder(orderData);
      const { orderId, transactionRef, amount, paystackKey, accessCode } = response;

      // Use the `amount` from the backend (selling price after markup)
      const amountInPesewas = Math.round(amount * 100);

      const handler = PaystackPop.setup({
        key: paystackKey,
        email: 'customer@example.com', // prompt user for email if needed
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
  loadPlans(selectedNetwork);
});
