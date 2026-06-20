/**
 * app.js – Premium Landing Page (Debug Version)
 * ------------------------------------------------
 * Loads MTN plans, handles selection, phone validation,
 * and Paystack payment. Includes fallback to mock data.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 App started');

  const planDropdown = document.getElementById('planDropdown');
  const phoneInput = document.getElementById('phone');
  // Only these three summary elements exist in the HTML
  const summaryPlan = document.getElementById('summaryPlan');
  const summaryPhone = document.getElementById('summaryPhone');
  const summaryPrice = document.getElementById('summaryPrice');
  const orderSummary = document.getElementById('orderSummary');
  const orderPlaceholder = document.getElementById('orderPlaceholder');
  const buyNowBtn = document.getElementById('buyNowBtn');

  let selectedPlan = null;

  const formatPrice = (price) => price.toFixed(2);

  // ----- Load plans (with fallback) -----
  async function loadPlans() {
    console.log('📡 Loading plans...');
    try {
      const data = await window.api.fetchPlans('mtn');
      console.log('✅ Plans fetched:', data);
      if (data && data.length > 0) {
        populateDropdown(data);
      } else {
        console.warn('⚠️ No plans from API, using mock data');
        useMockPlans();
      }
    } catch (error) {
      console.error('❌ API error, using mock data:', error);
      useMockPlans();
    }
  }

  function populateDropdown(plans) {
    planDropdown.innerHTML = '<option value="">— Select a package —</option>';
    plans.forEach(plan => {
      const option = document.createElement('option');
      option.value = JSON.stringify(plan);
      option.textContent = `${plan.name || plan.package_size} - GHS ${formatPrice(plan.price)}`;
      planDropdown.appendChild(option);
    });
    console.log('✅ Dropdown populated with', plans.length, 'plans');
    // Attach change event after options are added
    planDropdown.addEventListener('change', onPlanChange);
  }

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
      console.log('⛔ No plan selected');
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

  // ----- Phone input handler -----
  phoneInput.addEventListener('input', function() {
    console.log('📞 Phone input changed:', this.value);
    updateSummary();
  });

  // ----- Update summary (no summaryNetwork) -----
  function updateSummary() {
    const phone = phoneInput.value.trim();
    console.log('📝 updateSummary called, selectedPlan:', selectedPlan, 'phone:', phone);

    if (!selectedPlan) {
      orderSummary.classList.add('hidden');
      orderPlaceholder.style.display = 'block';
      console.log('⛔ No plan, hiding summary');
      return;
    }
    if (!phone) {
      orderSummary.classList.add('hidden');
      orderPlaceholder.style.display = 'block';
      console.log('⛔ No phone, hiding summary');
      return;
    }
    if (!/^0[2357]\d{8}$/.test(phone)) {
      orderSummary.classList.add('hidden');
      orderPlaceholder.style.display = 'block';
      console.log('⛔ Invalid phone format');
      return;
    }

    // Show summary – no summaryNetwork element, so we skip it
    summaryPlan.textContent = selectedPlan.name || selectedPlan.package_size;
    summaryPhone.textContent = phone;
    summaryPrice.textContent = `GHS ${formatPrice(selectedPlan.price)}`;
    orderSummary.classList.remove('hidden');
    orderPlaceholder.style.display = 'none';
    console.log('✅ Summary shown');
  }

  // ----- Buy Now -----
  buyNowBtn.addEventListener('click', async () => {
    console.log('🛒 Buy Now clicked');
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
      console.log('📦 Order data:', orderData);

      const token = localStorage.getItem('token') || null;
      const response = await window.api.initiateOrder(orderData, token);
      console.log('✅ Order initiated:', response);

      const { orderId, transactionRef, amount, paystackKey } = response;
      const amountInPesewas = Math.round(amount * 100);
      console.log('💳 Paystack amount:', amountInPesewas, 'pesewas');

      const handler = PaystackPop.setup({
        key: paystackKey,
        email: 'customer@example.com', // Replace with user email if available
        amount: amountInPesewas,
        currency: 'GHS',
        ref: transactionRef,
        callback: (resp) => {
          console.log('✅ Payment successful:', resp);
          alert('Payment successful! Your order is being processed.');
          window.location.href = `order-status.html?orderId=${orderId}`;
        },
        onClose: () => {
          console.log('❌ Payment popup closed');
          buyNowBtn.disabled = false;
          buyNowBtn.textContent = 'Buy Now';
        },
      });
      handler.openIframe();
    } catch (error) {
      console.error('❌ Order failed:', error);
      alert(`Order failed: ${error.message}`);
      buyNowBtn.disabled = false;
      buyNowBtn.textContent = 'Buy Now';
    }
  });

  // ----- Initial load -----
  loadPlans();
});
