/**
 * app.js – Premium Landing Page (Multi‑Provider)
 * ------------------------------------------------
 * Loads plans for selected network + provider,
 * handles dropdown selection, name, phone validation,
 * Paystack payment, and order tracking.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 App started');

  // ----- DOM elements -----
  const networkTabs = document.querySelectorAll('.network-tab');
  const networkLabel = document.getElementById('networkLabel');
  const planDropdown = document.getElementById('planDropdown');
  const customerNameInput = document.getElementById('customerName');
  const phoneInput = document.getElementById('phone');
  const summaryNetwork = document.getElementById('summaryNetwork');
  const summaryProvider = document.getElementById('summaryProvider');
  const summaryPlan = document.getElementById('summaryPlan');
  const summaryName = document.getElementById('summaryName');
  const summaryPhone = document.getElementById('summaryPhone');
  const summaryPrice = document.getElementById('summaryPrice');
  const orderSummary = document.getElementById('orderSummary');
  const orderPlaceholder = document.getElementById('orderPlaceholder');
  const buyNowBtn = document.getElementById('buyNowBtn');

  // ----- State -----
  let currentNetwork = 'mtn';
  let currentProvider = 'datamart';
  let selectedPlan = null;

  // Helper
  const formatPrice = (price) => price.toFixed(2);

  // ----- Load plans for network + provider -----
  async function loadPlans(network, provider) {
    console.log(`📡 Loading plans for ${network} (${provider})...`);
    try {
      const data = await window.api.fetchPlans(network, provider);
      console.log(`✅ Plans fetched:`, data);
      if (data && data.length > 0) {
        populateDropdown(data);
        const networkNames = {
          'mtn': 'MTN',
          'airtel_tigo': 'AirtelTigo',
          'telecel': 'Telecel'
        };
        networkLabel.textContent = networkNames[network] + ' packages';
      } else {
        console.warn('⚠️ No plans, using mock data');
        useMockPlans(network, provider);
      }
    } catch (error) {
      console.error('❌ Error loading plans:', error);
      useMockPlans(network, provider);
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
    selectedPlan = null;
    orderSummary.classList.add('hidden');
    orderPlaceholder.style.display = 'block';
  }

  // ----- Mock plans (fallback) -----
  function useMockPlans(network, provider) {
    const mockData = {
      'mtn_datamart': [
        { package_size: '1GB', price: 4.90, name: '1GB' },
        { package_size: '2GB', price: 9.80, name: '2GB' },
        { package_size: '5GB', price: 24.50, name: '5GB' },
        { package_size: '10GB', price: 47.75, name: '10GB' },
      ],
      'mtn_gigsgrid': [
        { package_size: '1GB', price: 4.70, name: '1GB' },
        { package_size: '2GB', price: 9.40, name: '2GB' },
        { package_size: '5GB', price: 23.50, name: '5GB' },
        { package_size: '10GB', price: 47.00, name: '10GB' },
      ],
      'airtel_tigo_datamart': [
        { package_size: '1GB', price: 4.84, name: '1GB' },
        { package_size: '2GB', price: 10.23, name: '2GB' },
        { package_size: '5GB', price: 23.89, name: '5GB' },
      ],
      'telecel_datamart': [
        { package_size: '5GB', price: 23.89, name: '5GB' },
        { package_size: '10GB', price: 44.71, name: '10GB' },
        { package_size: '20GB', price: 85.50, name: '20GB' },
      ]
    };
    const key = `${network}_${provider}`;
    const plans = mockData[key] || mockData['mtn_datamart'];
    populateDropdown(plans);
    const networkNames = { mtn: 'MTN', airtel_tigo: 'AirtelTigo', telecel: 'Telecel' };
    networkLabel.textContent = networkNames[network] + ' packages (mock)';
  }

  // ----- Network tab switching -----
  networkTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      networkTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      currentNetwork = this.dataset.network;
      currentProvider = this.dataset.provider;
      loadPlans(currentNetwork, currentProvider);
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
      console.error('❌ Error parsing plan:', e);
      selectedPlan = null;
      orderSummary.classList.add('hidden');
      orderPlaceholder.style.display = 'block';
    }
  });

  // ----- Name input -----
  customerNameInput.addEventListener('input', updateSummary);

  // ----- Phone input -----
  phoneInput.addEventListener('input', updateSummary);

  // ----- Update summary (now with name) -----
  function updateSummary() {
    const name = customerNameInput.value.trim();
    const phone = phoneInput.value.trim();
    if (!selectedPlan || !name || !phone || !/^0\d{9}$/.test(phone)) {
      orderSummary.classList.add('hidden');
      orderPlaceholder.style.display = 'block';
      return;
    }
    summaryNetwork.textContent = currentNetwork.toUpperCase().replace('_', ' ');
    summaryProvider.textContent = currentProvider === 'datamart' ? 'DataMart' : 'Gigsgrid';
    summaryPlan.textContent = selectedPlan.name || selectedPlan.package_size;
    summaryName.textContent = name;
    summaryPhone.textContent = phone;
    summaryPrice.textContent = `GHS ${formatPrice(selectedPlan.price)}`;
    orderSummary.classList.remove('hidden');
    orderPlaceholder.style.display = 'none';
  }

  // ----- Buy Now -----
  buyNowBtn.addEventListener('click', async () => {
    const name = customerNameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!selectedPlan) {
      alert('Please select a plan.');
      return;
    }
    if (!name) {
      alert('Please enter your full name.');
      return;
    }
    if (!phone || !/^0\d{9}$/.test(phone)) {
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
        customerName: name,
        provider: currentProvider,
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

  // ===== TRACK ORDER LOGIC =====
  const trackTabs = document.querySelectorAll('.track-tab');
  const trackInput = document.getElementById('trackInput');
  const trackLabel = document.getElementById('trackLabel');
  const trackBtn = document.getElementById('trackBtn');
  const trackResult = document.getElementById('trackResult');
  let searchType = 'phone';

  trackTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      trackTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      searchType = this.dataset.search;
      const labels = {
        phone: 'Enter phone number (e.g., 0241234567)',
        reference: 'Enter order reference (e.g., PAY-123456)',
        orderId: 'Enter order ID'
      };
      trackLabel.textContent = labels[searchType];
      const placeholders = {
        phone: 'e.g., 0241234567',
        reference: 'e.g., PAY-123456',
        orderId: 'e.g., 67a1b2c3d4e5f6g7h8i9j0k1'
      };
      trackInput.placeholder = placeholders[searchType];
      trackInput.value = '';
      trackResult.classList.add('hidden');
    });
  });

  trackBtn.addEventListener('click', trackOrder);
  trackInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') trackOrder();
  });

  async function trackOrder() {
    const query = trackInput.value.trim();
    if (!query) {
      alert('Please enter a value to search.');
      return;
    }
    trackBtn.disabled = true;
    trackBtn.textContent = 'Searching...';

    try {
      let url = '';
      if (searchType === 'phone') {
        url = `/api/orders/by-phone?phone=${encodeURIComponent(query)}`;
      } else if (searchType === 'reference') {
        url = `/api/orders/by-reference?reference=${encodeURIComponent(query)}`;
      } else if (searchType === 'orderId') {
        url = `/api/orders/${query}`;
      }

      const token = localStorage.getItem('token') || null;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url, { headers });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}...`);
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Order not found');
      }

      const orders = Array.isArray(data) ? data : [data];
      displayTrackResults(orders);
    } catch (error) {
      trackResult.classList.remove('hidden');
      trackResult.innerHTML = `
        <div class="error-msg">
          <p>❌ ${error.message}</p>
          <small>Please try again with a different search term.</small>
        </div>
      `;
    } finally {
      trackBtn.disabled = false;
      trackBtn.textContent = 'Track Order';
    }
  }

  function displayTrackResults(orders) {
    trackResult.classList.remove('hidden');
    if (orders.length === 0) {
      trackResult.innerHTML = `
        <div class="no-orders">
          <p>🔍 No orders found</p>
          <small>Try searching with a different term.</small>
        </div>
      `;
      return;
    }

    let html = '';
    orders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString('en-GH', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
      const statusClass = order.status.replace('_', '-');
      const statusDisplay = order.status.replace('_', ' ').toUpperCase();

      html += `
        <div class="track-order-item">
          <div class="order-info">
            <span class="order-plan">${order.package_size} · ${order.network.toUpperCase()} (${order.provider || '?'})</span>
            <span class="order-detail">👤 ${order.customerName || 'N/A'} · 📞 ${order.beneficiary} · ${date}</span>
            <span class="order-detail" style="font-size:0.7rem;color:#adb5bd;">ID: ${order._id}</span>
          </div>
          <span class="order-status status-${order.status}">${statusDisplay}</span>
        </div>
      `;
    });
    trackResult.innerHTML = html;
  }

  // ----- Initial load -----
  loadPlans('mtn', 'datamart');
});
