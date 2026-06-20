/**
 * app.js – Premium Landing Page (with retry)
 * ------------------------------------------------
 * Loads MTN plans, handles selection, phone validation,
 * and Paystack payment. Includes a retry button.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 App started v2');

  const planDropdown = document.getElementById('planDropdown');
  const phoneInput = document.getElementById('phone');
  const summaryPlan = document.getElementById('summaryPlan');
  const summaryPhone = document.getElementById('summaryPhone');
  const summaryPrice = document.getElementById('summaryPrice');
  const orderSummary = document.getElementById('orderSummary');
  const orderPlaceholder = document.getElementById('orderPlaceholder');
  const buyNowBtn = document.getElementById('buyNowBtn');

  let selectedPlan = null;

  // ----- Add a retry button dynamically -----
  const retryBtn = document.createElement('button');
  retryBtn.textContent = '🔄 Retry Loading Plans';
  retryBtn.className = 'btn-primary';
  retryBtn.style.margin = '1rem auto';
  retryBtn.style.display = 'none'; // hidden by default
  retryBtn.style.fontSize = '0.8rem';
  retryBtn.style.padding = '0.4rem 1.2rem';
  // Insert after the dropdown
  planDropdown.parentNode.insertBefore(retryBtn, planDropdown.nextSibling);

  // ----- Format helper -----
  const formatPrice = (price) => price.toFixed(2);

  // ----- Load plans (with retry) -----
  async function loadPlans(showRetry = false) {
    console.log('📡 Loading plans...');
    try {
      const data = await window.api.fetchPlans('mtn');
      console.log('✅ Plans fetched:', data);
      if (data && data.length > 0) {
        populateDropdown(data);
        retryBtn.style.display = 'none';
        return;
      }
      // If data is empty, fallback to mock
      console.warn('⚠️ No plans from API, using mock data');
      useMockPlans();
      retryBtn.style.display = 'none';
    } catch (error) {
      console.error('❌ API error:', error);
      useMockPlans();
      if (showRetry) {
        retryBtn.style.display = 'block';
      } else {
        // First attempt – show retry after a delay
        setTimeout(() => {
          retryBtn.style.display = 'block';
        }, 2000);
      }
    }
  }

  // ----- Populate dropdown -----
  function populateDropdown(plans) {
    planDropdown.innerHTML = '<option value="">— Select a package —</option>';
    plans.forEach(plan => {
      const option = document.createElement('option');
      option.value = JSON.stringify(plan);
      option.textContent = `${plan.name || plan.package_size} - GHS ${formatPrice(plan.price)}`;
      planDropdown.appendChild(option);
    });
    console.log('✅ Dropdown populated with', plans.length, 'plans');
    // Remove old listener and attach fresh one
    planDropdown.removeEventListener('change', onPlanChange);
    planDropdown.addEventListener('change', onPlanChange);
    // Trigger a change to reset state
    planDropdown.dispatchEvent(new Event('change'));
  }

  // ----- Mock plans (from your screenshot) -----
  function useMockPlans() {
    const mockPlans = [
      { package_size: '1GB', price: 3.80, name: '1GB' },
      { package_size: '2GB', price: 7.60, name: '2GB' },
      { package_size: '3GB', price: 11.40, name: '3GB' },
      { package_size: '4GB', price: 15.20, name: '4GB' },
      { package_size: '5GB', price: 19.00, name: '5GB' },
      { package_size: '6GB', price: 22.80, name: '6GB' },
      { package_size: '7GB', price: 26.60, name: '7GB' },
      { package_size: '8GB', price: 30.40, name: '8GB' },
      { package_size: '9GB', price: 34.20, name: '9GB' },
      { package_size: '10GB', price: 38.00, name: '10GB' },
      { package_size: '11GB', price: 41.80, name: '11GB' },
      { package_size: '12GB', price: 45.60, name: '12GB' },
      { package_size: '14GB', price: 53.20, name: '14GB' },
      { package_size: '15GB', price: 57.00, name: '15GB' },
      { package_size: '18GB', price: 68.40, name: '18GB' },
      { package_size: '20GB', price: 75.00, name: '20GB' },
      { package_size: '25GB', price: 94.00, name: '25GB' },
      { package_size: '30GB', price: 113.00, name: '30GB' },
      { package_size: '40GB', price: 145.00, name: '40GB' },
      { package_size: '50GB', price: 180.00, name: '50GB' },
    ];
    console.log('📦 Using mock plans:', mockPlans.length);
    populateDropdown(mockPlans);
  }

  // ----- Plan change handler -----
  function onPlanChange() {
    const value = planDropdown.value;
    console.log('🔄 Dropdown changed, value:', value);
    if (!value) {
      selectedPlan = null;
      orderSummary.classList.add('hidden');
      orderPlaceholder.style.display = 'block';
      return;
    }
    try {
      selectedPlan = JSON.parse(value);
      console.log('✅ Selected plan:', selectedPlan);
      updateSummary();
    } catch (e) {
      console.error('❌ Error parsing plan JSON:', e);
      selectedPlan = null;
      orderSummary.classList.add('hidden');
      orderPlaceholder.style.display = 'block';
    }
  }

  // ----- Phone input -----
  phoneInput.addEventListener('input', updateSummary);

  // ----- Update summary -----
  function updateSummary() {
    const phone = phoneInput.value.trim();
    if (!selectedPlan || !phone || !/^0[2357]\d{8}$/.test(phone)) {
      orderSummary.classList.add('hidden');
      orderPlaceholder.style.display = 'block';
      return;
    }
    summaryPlan.textContent = selectedPlan.name || selectedPlan.package_size;
    summaryPhone.textContent = phone;
    summaryPrice.textContent = `GHS ${formatPrice(selectedPlan.price)}`;
    orderSummary.classList.remove('hidden');
    orderPlaceholder.style.display = 'none';
  }

  // ----- Retry button -----
  retryBtn.addEventListener('click', async () => {
    retryBtn.textContent = '⏳ Loading...';
    retryBtn.disabled = true;
    await loadPlans(true);
    retryBtn.textContent = '🔄 Retry Loading Plans';
    retryBtn.disabled = false;
    retryBtn.style.display = 'none';
  });

  // ----- Buy Now -----
  buyNowBtn.addEventListener('click', async () => {
    if (!selectedPlan) {
      alert('Please select a plan.');
      return;
    }
    const phone = phoneInput.value.trim();
    if (!phone || !/^0[2357]\d{8}$/.test(phone)) {
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
        email: 'customer@example.com',
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

  // ----- Initial load (with retry) -----
  loadPlans(false);
});
