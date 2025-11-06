/**
 * Dashboard JavaScript - ImobiTools Argon Dashboard
 * Handles all interactive features and chart rendering
 *
 * NOTE: This file requires shared-utils.js to be loaded first
 */

// Use shared utilities from ImobiUtils
const { formatCurrency, formatNumber, showToast, logger, COLORS, CHART_CONFIG } = window.ImobiUtils;

// ===== UTILITY FUNCTIONS =====
function toggleSubmenu(buttonId, submenuId) {
  const button = document.getElementById(buttonId);
  const submenu = document.getElementById(submenuId);
  const arrow = button.querySelector('.arrow-icon');

  if (submenu) {
    button.addEventListener('click', () => {
      submenu.classList.toggle('show');
      arrow.classList.toggle('rotated');
    });
  }
}

// ===== SIDEBAR NAVIGATION =====
function initSidebar() {
  // Toggle submenus (FIXED: Only call for existing submenus)
  toggleSubmenu('dashboards-toggle', 'dashboards-submenu');
  // Note: Other menu items don't have submenus yet, so we don't call toggleSubmenu
  // When adding more submenus, add them here like:
  // toggleSubmenu('pages-toggle', 'pages-submenu');

  // Sidebar collapse functionality
  const collapseBtn = document.getElementById('sidebarCollapseBtn');
  const sidebar = document.getElementById('sidebar');

  if (collapseBtn && sidebar) {
    // Load saved state from localStorage
    try {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState === 'true') {
        sidebar.classList.add('collapsed');
      }
    } catch (error) {
      logger.warn('Could not load sidebar state from localStorage', error);
    }

    collapseBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');

      // Save state to localStorage
      try {
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
      } catch (error) {
        logger.warn('Could not save sidebar state to localStorage', error);
      }

      // Trigger window resize to update any responsive elements
      window.dispatchEvent(new Event('resize'));
    });
  }

  // Mobile menu toggle
  const menuToggle = document.getElementById('menu-toggle');

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile (FIXED: Use remove instead of toggle)
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024) {
        if (
          !sidebar.contains(e.target) &&
          !menuToggle.contains(e.target) &&
          sidebar.classList.contains('open')
        ) {
          sidebar.classList.remove('open'); // Changed from toggle to remove
        }
      }
    });
  }
}

// ===== BREADCRUMB NAVIGATION =====
function initBreadcrumb() {
  // Handle breadcrumb navigation
  const breadcrumbLinks = document.querySelectorAll('.breadcrumb-link');

  breadcrumbLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');

      // Handle "Ferramentas" link - open sidebar on mobile or highlight tools section
      if (href === '#ferramentas') {
        e.preventDefault();

        const sidebar = document.getElementById('sidebar');

        // On mobile, open the sidebar
        if (window.innerWidth <= 1024 && sidebar) {
          sidebar.classList.add('open');

          // Scroll to the tools section in sidebar
          const toolsSection = sidebar.querySelector('.nav-header');
          if (toolsSection) {
            toolsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          // On desktop, just highlight the tools section in sidebar
          const toolsSection = sidebar?.querySelector('.nav-section');
          if (toolsSection) {
            // Add a temporary highlight effect
            toolsSection.style.transition = 'background-color 0.3s ease';
            toolsSection.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';

            setTimeout(() => {
              toolsSection.style.backgroundColor = '';
            }, 1000);
          }
        }

        logger.info('Breadcrumb: Navigated to Ferramentas section');
      }
      // For other links, allow default navigation
    });
  });

  logger.info('Breadcrumb navigation initialized');
}

// ===== SALES CHART =====
function initSalesChart() {
  const canvas = document.getElementById('salesChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  // FIXED: Added 'Mar' to match 10 data points with 10 labels
  const data = [280, 350, 420, 390, 450, 480, 520, 490, 550, 580];
  const labels = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Calculate dimensions
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  canvas.width = width;
  canvas.height = height;

  const padding = CHART_CONFIG.PADDING;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculate max value and scale
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const valueRange = maxValue - minValue;
  const scale = chartHeight / valueRange;

  // Draw grid lines
  ctx.strokeStyle = COLORS.BORDER;
  ctx.lineWidth = 1;

  for (let i = 0; i <= CHART_CONFIG.GRID_LINES; i++) {
    const y = padding + (i * chartHeight) / CHART_CONFIG.GRID_LINES;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  // Draw gradient fill
  const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
  gradient.addColorStop(0, 'rgba(102, 126, 234, 0.6)');
  gradient.addColorStop(0.5, 'rgba(102, 126, 234, 0.3)');
  gradient.addColorStop(1, 'rgba(102, 126, 234, 0.0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);

  const points = [];
  data.forEach((value, index) => {
    const x = padding + (index * chartWidth) / (data.length - 1);
    const y = height - padding - (value - minValue) * scale;
    points.push({ x, y });
    ctx.lineTo(x, y);
  });

  ctx.lineTo(width - padding, height - padding);
  ctx.closePath();
  ctx.fill();

  // Draw line
  ctx.strokeStyle = COLORS.PRIMARY;
  ctx.lineWidth = CHART_CONFIG.LINE_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      // Smooth curve
      const prevPoint = points[index - 1];
      const midX = (prevPoint.x + point.x) / 2;
      ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, midX, (prevPoint.y + point.y) / 2);
      ctx.quadraticCurveTo(point.x, point.y, point.x, point.y);
    }
  });
  ctx.stroke();

  // Draw points
  points.forEach((point) => {
    ctx.fillStyle = COLORS.PRIMARY;
    ctx.beginPath();
    ctx.arc(point.x, point.y, CHART_CONFIG.POINT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Draw labels
  ctx.fillStyle = COLORS.TEXT_MUTED;
  ctx.font = '12px "Open Sans"';
  ctx.textAlign = 'center';

  labels.forEach((label, index) => {
    const x = padding + (index * chartWidth) / (labels.length - 1);
    const y = height - padding + 20;
    ctx.fillText(label, x, y);
  });
}

// ===== TODO LIST INTERACTIONS =====
function initTodoList() {
  const todoItems = document.querySelectorAll('.todo-item');

  todoItems.forEach((item) => {
    const checkbox = item.querySelector('input[type="checkbox"]');

    if (checkbox) {
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          item.classList.add('checked');
        } else {
          item.classList.remove('checked');
        }
      });
    }
  });
}

// ===== PROGRESS ANIMATIONS =====
function animateProgressBars() {
  const progressBars = document.querySelectorAll('.progress-fill');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const width = entry.target.style.width;
          entry.target.style.width = '0%';
          setTimeout(() => {
            entry.target.style.width = width;
          }, 100);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  progressBars.forEach((bar) => observer.observe(bar));
}

// ===== RESPONSIVE CHART RESIZE =====
function handleChartResize() {
  let resizeTimeout;

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      initSalesChart();
    }, 250);
  });
}

// ===== SMOOTH SCROLLING =====
function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));

      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initBreadcrumb();
  initSalesChart();
  initTodoList();
  animateProgressBars();
  handleChartResize();
  initSmoothScrolling();

  // Initialize Calculator Module if form exists
  if (document.getElementById('calculatorForm') && typeof CalculatorModule !== 'undefined') {
    CalculatorModule.init();
  }
});

// ===== CALCULATOR MODULE =====
const CalculatorModule = {
  installmentCounters: {
    entry: 0,
    during: 0,
    post: 0,
  },

  currentCalculatorId: null,
  userCalculations: [],
  currentModal: null, // Track open modal to prevent memory leaks

  init() {
    this.initPhaseTabs();
    this.initAddInstallmentButtons();
    this.initFormSubmit();
    this.initResetButton();
    this.initShareButton();
    this.loadUserCalculations();
  },

  initPhaseTabs() {
    const tabs = document.querySelectorAll('.phase-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const phase = tab.dataset.phase;
        this.switchPhase(phase);
      });
    });
  },

  switchPhase(phase) {
    // Update tabs
    document.querySelectorAll('.phase-tab').forEach((tab) => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-phase="${phase}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.phase-content').forEach((content) => {
      content.classList.remove('active');
    });
    document.getElementById(`${phase}Phase`).classList.add('active');
  },

  initAddInstallmentButtons() {
    const buttons = document.querySelectorAll('.btn-add-installment');
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const phase = button.dataset.phase;
        this.addInstallment(phase);
      });
    });
  },

  addInstallment(phase) {
    const installmentId = ++this.installmentCounters[phase];
    const container = document.getElementById(`${phase}Installments`);

    const installmentDiv = document.createElement('div');
    installmentDiv.className = 'installment-item';
    installmentDiv.dataset.phase = phase;
    installmentDiv.dataset.id = installmentId;

    // Create form group for amount
    const amountGroup = document.createElement('div');
    amountGroup.className = 'form-group';
    const amountLabel = document.createElement('label');
    amountLabel.textContent = 'Valor (R$)';
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.name = `${phase}_amount_${installmentId}`;
    amountInput.placeholder = '10000';
    amountInput.min = '0';
    amountInput.step = '100';
    amountInput.required = true;
    amountGroup.appendChild(amountLabel);
    amountGroup.appendChild(amountInput);

    // Create form group for date
    const dateGroup = document.createElement('div');
    dateGroup.className = 'form-group';
    const dateLabel = document.createElement('label');
    dateLabel.textContent = 'Data de Vencimento';
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.name = `${phase}_date_${installmentId}`;
    dateInput.required = true;
    dateGroup.appendChild(dateLabel);
    dateGroup.appendChild(dateInput);

    // Create form group for description
    const descGroup = document.createElement('div');
    descGroup.className = 'form-group';
    const descLabel = document.createElement('label');
    descLabel.textContent = 'Descrição';
    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.name = `${phase}_desc_${installmentId}`;
    descInput.placeholder = `Pagamento #${installmentId}`;
    descInput.required = true;
    descGroup.appendChild(descLabel);
    descGroup.appendChild(descInput);

    // Create remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-remove-installment';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      this.removeInstallment(phase, installmentId);
    });

    // Append all elements to installmentDiv
    installmentDiv.appendChild(amountGroup);
    installmentDiv.appendChild(dateGroup);
    installmentDiv.appendChild(descGroup);
    installmentDiv.appendChild(removeBtn);

    container.appendChild(installmentDiv);
  },

  removeInstallment(phase, id) {
    const item = document.querySelector(`[data-phase="${phase}"][data-id="${id}"]`);
    if (item) {
      item.remove();
    }
  },

  initFormSubmit() {
    const form = document.getElementById('calculatorForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleFormSubmit();
    });
  },

  initResetButton() {
    const resetBtn = document.getElementById('btnReset');
    resetBtn.addEventListener('click', () => {
      this.resetForm();
    });
  },

  initShareButton() {
    const shareBtn = document.getElementById('btnShare');
    shareBtn.addEventListener('click', async () => {
      await this.generateShareLink();
    });
  },

  collectFormData() {
    // Parse and validate numeric inputs
    const propertyValue = parseFloat(document.getElementById('propertyValue').value);
    const captationPercentage = parseFloat(document.getElementById('captationPercentage').value);
    const completionMonth = parseInt(document.getElementById('completionMonth').value);
    const completionYear = parseInt(document.getElementById('completionYear').value);
    const habiteSe = parseFloat(document.getElementById('habiteSe').value);

    // Validate boundary conditions
    if (isNaN(propertyValue) || propertyValue <= 0) {
      throw new Error('Valor do imóvel deve ser maior que zero');
    }
    if (isNaN(captationPercentage) || captationPercentage < 0 || captationPercentage > 100) {
      throw new Error('Porcentagem de captação deve estar entre 0 e 100');
    }
    if (isNaN(completionMonth) || completionMonth < 1 || completionMonth > 12) {
      throw new Error('Mês de conclusão deve estar entre 1 e 12');
    }
    if (isNaN(completionYear) || completionYear < 2000 || completionYear > 2100) {
      throw new Error('Ano de conclusão inválido');
    }
    if (isNaN(habiteSe) || habiteSe < 0) {
      throw new Error('Valor do Habite-se não pode ser negativo');
    }

    const formData = {
      propertyValue,
      captationPercentage,
      completionDate: {
        month: completionMonth,
        year: completionYear,
      },
      habiteSe,
      entryPayments: this.collectPhaseData('entry'),
      duringConstructionPayments: this.collectPhaseData('during'),
      postConstructionPayments: this.collectPhaseData('post'),
    };

    return formData;
  },

  collectPhaseData(phase) {
    const phaseName = {
      entry: 'Pagamentos de Entrada',
      during: 'Durante Obra',
      post: 'Pós-Obra',
    }[phase];

    const installments = [];
    const items = document.querySelectorAll(`[data-phase="${phase}"]`);

    items.forEach((item) => {
      const id = item.dataset.id;
      const amountElement = item.querySelector(`[name="${phase}_amount_${id}"]`);
      const dueDateElement = item.querySelector(`[name="${phase}_date_${id}"]`);
      const descriptionElement = item.querySelector(`[name="${phase}_desc_${id}"]`);

      const amount = amountElement ? parseFloat(amountElement.value) || 0 : 0;
      const dueDate = dueDateElement?.value;
      const description = descriptionElement?.value;

      if (amount && dueDate && description) {
        installments.push({
          id: `${phase}-${id}`,
          amount,
          dueDate: new Date(dueDate).toISOString(),
          description,
        });
      }
    });

    return {
      name: phaseName,
      installments,
    };
  },

  async handleFormSubmit() {
    try {
      const formData = this.collectFormData();

      // Add userId (for now, use a guest ID with random component to prevent race conditions)
      let userId;
      try {
        userId = localStorage.getItem('userId');
        if (!userId) {
          const array = new Uint8Array(5);
          crypto.getRandomValues(array);
          const randomPart = Array.from(array, (byte) => byte.toString(36))
            .join('')
            .substring(0, 7);
          userId = `guest-${Date.now()}-${randomPart}`;
          localStorage.setItem('userId', userId);
        }
      } catch (error) {
        // Fallback if localStorage is not available
        logger.warn('localStorage not available, using temporary guest ID');
        const array = new Uint8Array(5);
        crypto.getRandomValues(array);
        const randomPart = Array.from(array, (byte) => byte.toString(36))
          .join('')
          .substring(0, 7);
        userId = `guest-${Date.now()}-${randomPart}`;
      }

      const requestData = {
        userId,
        ...formData,
      };

      // Show loading state
      this.showLoadingState(true);

      // Make API call (simulated for now - will integrate with real API)
      const result = await this.saveCalculation(requestData);

      // Update UI
      this.updateApprovalStatus(result);
      this.currentCalculatorId = result.id;
      this.userCalculations.unshift(result);
      this.updateStatistics();
      this.updateCalculationsTable();

      // Show success message
      this.showSuccessMessage('Cálculo salvo com sucesso!');
    } catch (error) {
      logger.error('Error submitting calculation', error);
      this.showErrorMessage('Falha ao salvar cálculo. Por favor, tente novamente.');
    } finally {
      this.showLoadingState(false);
    }
  },

  async saveCalculation(data) {
    // Simulate API call for now
    // In production, this will call: await calculatorAPI.create(data);

    // Calculate approval status
    const requiredCaptation = data.propertyValue * (data.captationPercentage / 100);
    const actualCaptation = this.calculateTotalPayments(data);
    const difference = actualCaptation - requiredCaptation;
    const percentagePaid = (actualCaptation / requiredCaptation) * 100;
    const approved = actualCaptation >= requiredCaptation;

    return {
      id: `calc-${Date.now()}`,
      ...data,
      approvalStatus: {
        approved,
        requiredCaptation,
        actualCaptation,
        difference,
        percentagePaid,
      },
      createdAt: new Date().toISOString(),
    };
  },

  calculateTotalPayments(data) {
    let total = 0;

    data.entryPayments.installments.forEach((inst) => (total += inst.amount));
    data.duringConstructionPayments.installments.forEach((inst) => (total += inst.amount));
    data.postConstructionPayments.installments.forEach((inst) => (total += inst.amount));
    total += data.habiteSe;

    return total;
  },

  updateApprovalStatus(result) {
    const { approved, requiredCaptation, actualCaptation, difference, percentagePaid } =
      result.approvalStatus;

    // Update title and description
    const title = document.getElementById('statusTitle');
    const description = document.getElementById('statusDescription');
    const icon = document.getElementById('statusIcon');
    const card = document.getElementById('approvalStatusCard');

    if (approved) {
      title.textContent = '✓ Aprovado';
      description.textContent =
        'O financiamento do imóvel atende à porcentagem de captação necessária.';
      card.style.background = `linear-gradient(135deg, ${COLORS.SUCCESS} 0%, #2dcecc 100%)`;

      // Clear existing icon content
      while (icon.firstChild) {
        icon.removeChild(icon.firstChild);
      }

      // Create SVG elements safely
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '32');
      circle.setAttribute('cy', '32');
      circle.setAttribute('r', '28');
      circle.setAttribute('stroke', 'currentColor');
      circle.setAttribute('stroke-width', '3');
      circle.setAttribute('fill', 'none');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M20 32l8 8 16-16');
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', '3');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');

      icon.appendChild(circle);
      icon.appendChild(path);
    } else {
      title.textContent = '✗ Não Aprovado';
      description.textContent =
        'O financiamento do imóvel não atende à porcentagem de captação necessária.';
      card.style.background = `linear-gradient(135deg, ${COLORS.DANGER} 0%, #f56036 100%)`;

      // Clear existing icon content
      while (icon.firstChild) {
        icon.removeChild(icon.firstChild);
      }

      // Create SVG elements safely
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '32');
      circle.setAttribute('cy', '32');
      circle.setAttribute('r', '28');
      circle.setAttribute('stroke', 'currentColor');
      circle.setAttribute('stroke-width', '3');
      circle.setAttribute('fill', 'none');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M22 22l20 20M42 22l-20 20');
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', '3');
      path.setAttribute('stroke-linecap', 'round');

      icon.appendChild(circle);
      icon.appendChild(path);
    }

    // Update metrics
    document.getElementById('requiredCaptation').textContent = formatCurrency(requiredCaptation);
    document.getElementById('actualCaptation').textContent = formatCurrency(actualCaptation);
    document.getElementById('difference').textContent = formatCurrency(Math.abs(difference));
    document.getElementById('percentagePaid').textContent = `${percentagePaid.toFixed(2)}%`;

    // Show details and share button
    document.getElementById('statusDetails').classList.remove('hidden');
    document.getElementById('btnShare').classList.remove('hidden');
  },

  updateStatistics() {
    // Stats cards removed from dashboard - function kept for compatibility
  },

  updateCalculationsTable() {
    const tbody = document.getElementById('calculationsTableBody');

    if (this.userCalculations.length === 0) {
      // Clear existing content
      while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
      }

      // Create empty state row
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.className = 'empty-state';

      const div = document.createElement('div');
      div.className = 'empty-state-content';

      // Create SVG
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '48');
      svg.setAttribute('height', '48');
      svg.setAttribute('viewBox', '0 0 48 48');
      svg.setAttribute('fill', 'none');

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '24');
      circle.setAttribute('cy', '24');
      circle.setAttribute('r', '20');
      circle.setAttribute('stroke', COLORS.TEXT_MUTED);
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('opacity', '0.3');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M16 24h16M24 16v16');
      path.setAttribute('stroke', COLORS.TEXT_MUTED);
      path.setAttribute('stroke-width', '2');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('opacity', '0.3');

      svg.appendChild(circle);
      svg.appendChild(path);

      const p = document.createElement('p');
      p.textContent = 'No calculations yet. Create your first calculation using the form above.';

      div.appendChild(svg);
      div.appendChild(p);
      td.appendChild(div);
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    // Clear existing content
    while (tbody.firstChild) {
      tbody.removeChild(tbody.firstChild);
    }
    this.userCalculations.forEach((calc) => {
      const status = calc.approvalStatus.approved ? 'success' : 'danger';
      const statusText = calc.approvalStatus.approved ? 'APPROVED' : 'REJECTED';
      const date = new Date(calc.createdAt).toLocaleDateString('pt-BR');

      const row = document.createElement('tr');

      // Property Value column
      const tdValue = document.createElement('td');
      tdValue.textContent = formatCurrency(calc.propertyValue);
      row.appendChild(tdValue);

      // Captation Percentage column
      const tdCaptation = document.createElement('td');
      tdCaptation.textContent = `${calc.captationPercentage}%`;
      row.appendChild(tdCaptation);

      // Status column
      const tdStatus = document.createElement('td');
      const statusBadge = document.createElement('span');
      statusBadge.className = `badge ${status}`;
      statusBadge.textContent = statusText;
      tdStatus.appendChild(statusBadge);
      row.appendChild(tdStatus);

      // Percentage Paid column
      const tdPercentage = document.createElement('td');
      tdPercentage.textContent = `${calc.approvalStatus.percentagePaid.toFixed(1)}%`;
      row.appendChild(tdPercentage);

      // Date column
      const tdDate = document.createElement('td');
      tdDate.textContent = date;
      row.appendChild(tdDate);

      // Actions column
      const tdActions = document.createElement('td');
      const menuBtn = document.createElement('button');
      menuBtn.className = 'btn-menu';
      menuBtn.textContent = '⋮';
      menuBtn.addEventListener('click', () => {
        this.viewCalculation(calc.id);
      });
      tdActions.appendChild(menuBtn);
      row.appendChild(tdActions);

      tbody.appendChild(row);
    });
  },

  async generateShareLink() {
    try {
      if (!this.currentCalculatorId) {
        this.showErrorMessage('Nenhum cálculo para compartilhar');
        return;
      }

      // Simulate generating share link
      const shortCode = this.generateShortCode();
      const shareUrl = `${window.location.origin}/c/${shortCode}`;

      // Update current calculation
      const calc = this.userCalculations.find((c) => c.id === this.currentCalculatorId);
      if (calc) {
        calc.shortCode = shortCode;
        this.updateStatistics();
      }

      // Show share modal/alert
      this.showShareModal(shareUrl);
    } catch (error) {
      logger.error('Error generating share link', error);
      this.showErrorMessage('Falha ao gerar link de compartilhamento');
    }
  },

  generateShortCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(6);
    crypto.getRandomValues(array);

    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(array[i] % chars.length);
    }
    return code;
  },

  showShareModal(url) {
    // Clean up any existing modal to prevent memory leaks
    if (this.currentModal) {
      this.currentModal.cleanup();
    }

    // Create a simple modal
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 32px;
            border-radius: 12px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.2);
            z-index: 10000;
            min-width: 400px;
        `;

    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.value = url;
    urlInput.readOnly = true;
    urlInput.style.cssText = `width: 100%; padding: 12px; border: 1px solid ${COLORS.BORDER}; border-radius: 8px; margin-bottom: 16px; font-family: monospace;`;

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copiar Link';
    copyBtn.style.cssText = `flex: 1; padding: 12px; background: linear-gradient(135deg, ${COLORS.PRIMARY} 0%, ${COLORS.SECONDARY} 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;`;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Fechar';
    closeBtn.style.cssText = `padding: 12px 24px; background: transparent; color: ${COLORS.TEXT_MUTED}; border: 2px solid ${COLORS.BORDER}; border-radius: 8px; cursor: pointer; font-weight: 600;`;

    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.cssText = 'display: flex; gap: 12px;';
    buttonsDiv.appendChild(copyBtn);
    buttonsDiv.appendChild(closeBtn);

    const heading = document.createElement('h3');
    heading.style.cssText = `margin: 0 0 16px; color: ${COLORS.TEXT_PRIMARY};`;
    heading.textContent = 'Link Compartilhável Gerado!';

    const description = document.createElement('p');
    description.style.cssText = `margin: 0 0 16px; color: ${COLORS.TEXT_MUTED};`;
    description.textContent = 'Compartilhe este link com outros para visualizar o cálculo:';

    modal.appendChild(heading);
    modal.appendChild(description);
    modal.appendChild(urlInput);
    modal.appendChild(buttonsDiv);

    const overlay = document.createElement('div');
    overlay.className = 'share-modal-overlay';
    overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        `;

    // Cleanup function to remove modal and event listeners
    const cleanup = () => {
      copyBtn.removeEventListener('click', handleCopy);
      closeBtn.removeEventListener('click', handleClose);
      overlay.removeEventListener('click', handleClose);
      if (overlay.parentNode) {
        overlay.remove();
      }
      if (modal.parentNode) {
        modal.remove();
      }
      this.currentModal = null; // Clear reference
    };

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copiado!');
      } catch (err) {
        logger.error('Failed to copy', err);
      }
    };

    const handleClose = () => {
      cleanup();
    };

    // Add event listeners
    copyBtn.addEventListener('click', handleCopy);
    closeBtn.addEventListener('click', handleClose);
    overlay.addEventListener('click', handleClose);

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    // Store modal reference with cleanup function
    this.currentModal = { modal, overlay, cleanup };
  },

  resetForm() {
    document.getElementById('calculatorForm').reset();

    // Clear all installments safely
    ['entry', 'during', 'post'].forEach((phase) => {
      const container = document.getElementById(`${phase}Installments`);
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      this.installmentCounters[phase] = 0;
    });

    // Reset approval status
    this.resetApprovalStatus();
    this.currentCalculatorId = null;
  },

  resetApprovalStatus() {
    const card = document.getElementById('approvalStatusCard');
    card.style.background = `linear-gradient(135deg, ${COLORS.PRIMARY} 0%, ${COLORS.SECONDARY} 100%)`;

    document.getElementById('statusTitle').textContent = 'Waiting for Calculation';
    document.getElementById('statusDescription').textContent =
      'Fill out the form and click "Calculate & Save" to see the approval status of your property financing.';

    // Reset icon safely
    const icon = document.getElementById('statusIcon');
    while (icon.firstChild) {
      icon.removeChild(icon.firstChild);
    }

    // Create SVG elements
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '32');
    circle.setAttribute('cy', '32');
    circle.setAttribute('r', '28');
    circle.setAttribute('stroke', 'currentColor');
    circle.setAttribute('stroke-width', '3');
    circle.setAttribute('fill', 'none');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M20 32l8 8 16-16');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '3');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');

    icon.appendChild(circle);
    icon.appendChild(path);

    document.getElementById('statusDetails').classList.add('hidden');
    document.getElementById('btnShare').classList.add('hidden');
  },

  loadUserCalculations() {
    // Load from localStorage for demo
    try {
      const saved = localStorage.getItem('userCalculations');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate parsed data is an array
        if (Array.isArray(parsed)) {
          this.userCalculations = parsed;
          this.updateStatistics();
          this.updateCalculationsTable();
        } else {
          logger.warn('Invalid userCalculations data in localStorage');
          this.userCalculations = [];
        }
      }
    } catch (error) {
      logger.error('Error loading userCalculations from localStorage', error);
      this.userCalculations = [];
    }
  },

  saveToLocalStorage() {
    try {
      localStorage.setItem('userCalculations', JSON.stringify(this.userCalculations));
    } catch (error) {
      logger.error('Error saving to localStorage', error);

      // Handle quota exceeded error specifically
      if (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014) {
        this.showErrorMessage(
          'Armazenamento local cheio. Por favor, exporte seus dados e limpe alguns cálculos antigos.'
        );
      } else {
        this.showErrorMessage('Falha ao salvar dados localmente');
      }
    }
  },

  showLoadingState(loading) {
    const submitBtn = document.querySelector('.btn-primary-form');
    if (loading) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Calculating...';
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Calculate & Save';
    }
  },

  showSuccessMessage(message) {
    showToast(message, 'success');
    this.saveToLocalStorage();
  },

  showErrorMessage(message) {
    showToast(message, 'error');
  },

  viewCalculation(id) {
    const calc = this.userCalculations.find((c) => c.id === id);
    if (calc) {
      this.currentCalculatorId = id;
      this.updateApprovalStatus(calc);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
};

// Make CalculatorModule globally accessible
window.CalculatorModule = CalculatorModule;

// ===== EXPORT FOR USE IN OTHER SCRIPTS =====
window.dashboardUtils = {
  formatCurrency,
  formatNumber,
  initSalesChart,
};

// ===== GLOBAL ERROR HANDLERS =====
window.addEventListener('error', (event) => {
  logger.error('Uncaught error in dashboard.js', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  });
  // Prevent default browser error handling for better UX
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection in dashboard.js', {
    reason: event.reason,
    promise: event.promise,
  });
  // Prevent default browser error handling
  event.preventDefault();
});
