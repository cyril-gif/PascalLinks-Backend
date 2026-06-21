/**
 * app.js – Premium Landing Page (Multi‑Network)
 * ------------------------------------------------
 * Loads plans for selected network (MTN, AirtelTigo, Telecel),
 * handles dropdown selection, phone validation, and Paystack payment.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 App started');

  // DOM elements
  const networkTabs = document.querySelectorAll('.network-tab');
  const networkLabel = document.getElementById('networkLabel');
  const planDropdown = document.getElementById('planDropdown');
  const phoneInput = document.getElementById('phone');
  const summaryNetwork = document.getElementById('summaryNetwork');
  const summaryPlan = document.getElementById('summaryPlan');
  const summaryPhone = document.getElementById('summaryPhone');
  const summaryPrice = document.getElementById('summaryPrice');
  const orderSummary = document.getElementById('orderSummary');
  const orderPlaceholder = document.getElementById('orderPlaceholder');
  const buyNowBtn = document.getElementById('buyNowBtn');

  // State
  let currentNetwork = 'mtn';
  let selectedPlan = null;

  // Helper
  const formatPrice = (price) => price.toFixed(2);

  // ----- Load plans for a network -----
  async function loadPlans(network) {
    console.log(`📡 Loading plans for ${network}...`);
    try {
      const data = await window.api.fetchPlans(network);
      console.log(`✅ Plans fetched for ${network}:`, data);
      if (data && data.length > 0) {
        populateDropdown(data);
        // Update network label
        const networkNames = {
          mtn: 'MTN',
          airtel_tigo: 'AirtelTigo',
          telecel: 'Telecel',
          bigtime: 'Bigtime'
        };
        networkLabel.textContent = networkNames[network] + ' packages';
      } else {
        console.warn(`⚠️ No plans for ${network}, using mock data`);
        useMockPlans(network);
      }
    } catch (error) {
      console.error(`❌ Error loading plans for ${network}:`, error);
      useMockPlans(network);
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
    // Reset selected plan
    selectedPlan = null;
    orderSummary.classList.add('hidden');
    orderPlaceholder.style.display = 'block';
  }

  // ----- Mock plans (fallback) -----
  function useMockPlans(network) {
    const mockData = {
      mtn: [
        { package_size: '1GB', price: 4.00, name: '1GB' },
        { package_size: '2GB', price: 8.00, name: '2GB' },
        { package_size: '5GB', price: 20.00, name: '5GB' },
        { package_size: '10GB', price: 39.00, name: '10GB' },
      ],
      airtel_tigo: [
        { package_size: '1GB', price: 3.95, name: '1GB' },
        { package_size: '2GB', price: 8.35, name: '2GB' },
        { package_size: '5GB', price: 19.50, name: '5GB' },
        { package_size: '10GB', price: 38.50, name: '10GB' },
      ],
      telecel: [
        { package_size: '5GB', price: 19.50, name: '5GB' },
        { package_size: '10GB', price: 36.50, name: '10GB' },
        { package_size: '20GB', price: 69.80, name: '20GB' },
      ],
      bigtime: [
        { package_size: '1GB', price: 4.00, name: '1GB' },
        { package_size: '5GB', price: 20.00, name: '5GB' },
      ],
    };
    const plans = mockData[network] || mockData.mtn;
    populateDropdown(plans);
    const names = { mtn: 'MTN', airtel_tigo: 'AirtelTigo', telecel: 'Telecel', bigtime: 'Bigtime' };
    networkLabel.textContent = names[network] + ' packages (mock)';
  }

  // ----- Network tab switching -----
  networkTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      networkTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      currentNetwork = this.dataset.network;
      loadPlans(currentNetwork);
    });
  });

  // ----- Plan change handler -----
  planDropdown.addEventListener('change', function() {
    const value = this.value;
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
  });

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
    summaryNetwork.textContent = currentNetwork.toUpperCase().replace('_', ' ');
    summaryPlan.textContent = selectedPlan.name || selectedPlan.package_size;
    summaryPhone.textContent = phone;
    summaryPrice.textContent = `GHS ${formatPrice(selectedPlan.price)}`;
    orderSummary.classList.remove('hidden');
    orderPlaceholder.style.display = 'none';
  }

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
        network: currentNetwork,
        package_size: selectedPlan.package_size,
        beneficiary: phone,
      };
      console.log('📦 Order data:', orderData);

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

  // ----- Initial load -----
  loadPlans('mtn');
});
