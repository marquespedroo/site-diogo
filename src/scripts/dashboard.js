/**
 * Dashboard JavaScript - ImobiTools Argon Dashboard
 * Handles all interactive features and chart rendering
 */

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

    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close sidebar when clicking outside on mobile (FIXED: Use remove instead of toggle)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024) {
                if (!sidebar.contains(e.target) && !menuToggle.contains(e.target) && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open'); // Changed from toggle to remove
                }
            }
        });
    }
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

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Calculate max value and scale
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const valueRange = maxValue - minValue;
    const scale = chartHeight / valueRange;

    // Draw grid lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
        const y = padding + (i * chartHeight / 5);
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
        const x = padding + (index * chartWidth / (data.length - 1));
        const y = height - padding - ((value - minValue) * scale);
        points.push({ x, y });
        if (index === 0) {
            ctx.lineTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw line
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
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
    points.forEach(point => {
        ctx.fillStyle = '#667eea';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Draw labels
    ctx.fillStyle = '#8392AB';
    ctx.font = '12px "Open Sans"';
    ctx.textAlign = 'center';

    labels.forEach((label, index) => {
        const x = padding + (index * chartWidth / (labels.length - 1));
        const y = height - padding + 20;
        ctx.fillText(label, x, y);
    });
}

// ===== TODO LIST INTERACTIONS =====
function initTodoList() {
    const todoItems = document.querySelectorAll('.todo-item');

    todoItems.forEach(item => {
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

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const width = entry.target.style.width;
                entry.target.style.width = '0%';
                setTimeout(() => {
                    entry.target.style.width = width;
                }, 100);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    progressBars.forEach(bar => observer.observe(bar));
}

// ===== STAT CARDS ANIMATION =====
function animateStatCards() {
    const statCards = document.querySelectorAll('.stat-card');

    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';

        setTimeout(() => {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 * index);
    });
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
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));

            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Argon Dashboard...');

    initSidebar();
    initSalesChart();
    initTodoList();
    animateProgressBars();
    animateStatCards();
    handleChartResize();
    initSmoothScrolling();

    // Initialize Calculator Module if form exists
    if (document.getElementById('calculatorForm')) {
        CalculatorModule.init();
        console.log('✅ Calculator Module initialized');
    }

    console.log('✅ Dashboard initialized successfully');
});

// ===== UTILITY: Format Currency =====
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// ===== UTILITY: Format Number =====
function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR').format(value);
}

// ===== CALCULATOR MODULE =====
const CalculatorModule = {
    installmentCounters: {
        entry: 0,
        during: 0,
        post: 0
    },

    currentCalculatorId: null,
    userCalculations: [],

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
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const phase = tab.dataset.phase;
                this.switchPhase(phase);
            });
        });
    },

    switchPhase(phase) {
        // Update tabs
        document.querySelectorAll('.phase-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-phase="${phase}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.phase-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${phase}Phase`).classList.add('active');
    },

    initAddInstallmentButtons() {
        const buttons = document.querySelectorAll('.btn-add-installment');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const phase = button.dataset.phase;
                this.addInstallment(phase);
            });
        });
    },

    addInstallment(phase) {
        const installmentId = ++this.installmentCounters[phase];
        const container = document.getElementById(`${phase}Installments`);

        const installmentHTML = `
            <div class="installment-item" data-phase="${phase}" data-id="${installmentId}">
                <div class="form-group">
                    <label>Amount (R$)</label>
                    <input type="number" name="${phase}_amount_${installmentId}" placeholder="10000" min="0" step="100" required>
                </div>
                <div class="form-group">
                    <label>Due Date</label>
                    <input type="date" name="${phase}_date_${installmentId}" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <input type="text" name="${phase}_desc_${installmentId}" placeholder="Payment #${installmentId}" required>
                </div>
                <button type="button" class="btn-remove-installment" onclick="CalculatorModule.removeInstallment('${phase}', ${installmentId})">×</button>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', installmentHTML);
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
        const formData = {
            propertyValue: parseFloat(document.getElementById('propertyValue').value),
            captationPercentage: parseFloat(document.getElementById('captationPercentage').value),
            completionDate: {
                month: parseInt(document.getElementById('completionMonth').value),
                year: parseInt(document.getElementById('completionYear').value)
            },
            habiteSe: parseFloat(document.getElementById('habiteSe').value),
            entryPayments: this.collectPhaseData('entry'),
            duringConstructionPayments: this.collectPhaseData('during'),
            postConstructionPayments: this.collectPhaseData('post')
        };

        return formData;
    },

    collectPhaseData(phase) {
        const phaseName = {
            entry: 'Entry Payments',
            during: 'During Construction',
            post: 'Post-Construction'
        }[phase];

        const installments = [];
        const items = document.querySelectorAll(`[data-phase="${phase}"]`);

        items.forEach(item => {
            const id = item.dataset.id;
            const amount = parseFloat(item.querySelector(`[name="${phase}_amount_${id}"]`)?.value || 0);
            const dueDate = item.querySelector(`[name="${phase}_date_${id}"]`)?.value;
            const description = item.querySelector(`[name="${phase}_desc_${id}"]`)?.value;

            if (amount && dueDate && description) {
                installments.push({
                    id: `${phase}-${id}`,
                    amount,
                    dueDate: new Date(dueDate).toISOString(),
                    description
                });
            }
        });

        return {
            name: phaseName,
            installments
        };
    },

    async handleFormSubmit() {
        try {
            const formData = this.collectFormData();

            // Add userId (for now, use a guest ID)
            const userId = localStorage.getItem('userId') || `guest-${Date.now()}`;
            localStorage.setItem('userId', userId);

            const requestData = {
                userId,
                ...formData
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
            this.showSuccessMessage('Calculation saved successfully!');

        } catch (error) {
            console.error('Error submitting calculation:', error);
            this.showErrorMessage('Failed to save calculation. Please try again.');
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
                percentagePaid
            },
            createdAt: new Date().toISOString()
        };
    },

    calculateTotalPayments(data) {
        let total = 0;

        data.entryPayments.installments.forEach(inst => total += inst.amount);
        data.duringConstructionPayments.installments.forEach(inst => total += inst.amount);
        data.postConstructionPayments.installments.forEach(inst => total += inst.amount);
        total += data.habiteSe;

        return total;
    },

    updateApprovalStatus(result) {
        const { approved, requiredCaptation, actualCaptation, difference, percentagePaid } = result.approvalStatus;

        // Update title and description
        const title = document.getElementById('statusTitle');
        const description = document.getElementById('statusDescription');
        const icon = document.getElementById('statusIcon');
        const card = document.getElementById('approvalStatusCard');

        if (approved) {
            title.textContent = '✓ Approved';
            description.textContent = 'The property financing meets the required captation percentage.';
            card.style.background = 'linear-gradient(135deg, #2dce89 0%, #2dcecc 100%)';
            icon.innerHTML = `
                <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="3" fill="none"/>
                <path d="M20 32l8 8 16-16" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            `;
        } else {
            title.textContent = '✗ Not Approved';
            description.textContent = 'The property financing does not meet the required captation percentage.';
            card.style.background = 'linear-gradient(135deg, #f5365c 0%, #f56036 100%)';
            icon.innerHTML = `
                <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="3" fill="none"/>
                <path d="M22 22l20 20M42 22l-20 20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            `;
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
        const total = this.userCalculations.length;
        const approved = this.userCalculations.filter(c => c.approvalStatus.approved).length;
        const approvalRate = total > 0 ? (approved / total * 100).toFixed(0) : 0;

        const avgPropertyValue = total > 0
            ? this.userCalculations.reduce((sum, c) => sum + c.propertyValue, 0) / total
            : 0;

        const sharedLinks = this.userCalculations.filter(c => c.shortCode).length;

        document.getElementById('totalCalculations').textContent = total;
        document.getElementById('approvedCalculations').textContent = approved;
        document.getElementById('approvalRate').textContent = `${approvalRate}%`;
        document.getElementById('avgPropertyValue').textContent = formatCurrency(avgPropertyValue);
        document.getElementById('sharedLinks').textContent = sharedLinks;
    },

    updateCalculationsTable() {
        const tbody = document.getElementById('calculationsTableBody');

        if (this.userCalculations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <div class="empty-state-content">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <circle cx="24" cy="24" r="20" stroke="#8392AB" stroke-width="2" opacity="0.3"/>
                                <path d="M16 24h16M24 16v16" stroke="#8392AB" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
                            </svg>
                            <p>No calculations yet. Create your first calculation using the form above.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.userCalculations.map(calc => {
            const status = calc.approvalStatus.approved ? 'success' : 'danger';
            const statusText = calc.approvalStatus.approved ? 'APPROVED' : 'REJECTED';
            const date = new Date(calc.createdAt).toLocaleDateString('pt-BR');

            return `
                <tr>
                    <td>${formatCurrency(calc.propertyValue)}</td>
                    <td>${calc.captationPercentage}%</td>
                    <td><span class="badge ${status}">${statusText}</span></td>
                    <td>${calc.approvalStatus.percentagePaid.toFixed(1)}%</td>
                    <td>${date}</td>
                    <td><button class="btn-menu" onclick="CalculatorModule.viewCalculation('${calc.id}')">⋮</button></td>
                </tr>
            `;
        }).join('');
    },

    async generateShareLink() {
        try {
            if (!this.currentCalculatorId) {
                this.showErrorMessage('No calculation to share');
                return;
            }

            // Simulate generating share link
            const shortCode = this.generateShortCode();
            const shareUrl = `${window.location.origin}/c/${shortCode}`;

            // Update current calculation
            const calc = this.userCalculations.find(c => c.id === this.currentCalculatorId);
            if (calc) {
                calc.shortCode = shortCode;
                this.updateStatistics();
            }

            // Show share modal/alert
            this.showShareModal(shareUrl);

        } catch (error) {
            console.error('Error generating share link:', error);
            this.showErrorMessage('Failed to generate share link');
        }
    },

    generateShortCode() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    showShareModal(url) {
        // Create a simple modal
        const modal = document.createElement('div');
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

        modal.innerHTML = `
            <h3 style="margin: 0 0 16px; color: #172B4D;">Shareable Link Generated!</h3>
            <p style="margin: 0 0 16px; color: #8392AB;">Share this link with others to view the calculation:</p>
            <input type="text" value="${url}" readonly style="width: 100%; padding: 12px; border: 1px solid #DEE2E6; border-radius: 8px; margin-bottom: 16px; font-family: monospace;">
            <div style="display: flex; gap: 12px;">
                <button onclick="navigator.clipboard.writeText('${url}'); alert('Link copied!')" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Copy Link</button>
                <button onclick="this.closest('div').parentElement.parentElement.remove()" style="padding: 12px 24px; background: transparent; color: #8392AB; border: 2px solid #DEE2E6; border-radius: 8px; cursor: pointer; font-weight: 600;">Close</button>
            </div>
        `;

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        `;
        overlay.onclick = () => {
            overlay.remove();
            modal.remove();
        };

        document.body.appendChild(overlay);
        document.body.appendChild(modal);
    },

    resetForm() {
        document.getElementById('calculatorForm').reset();

        // Clear all installments
        ['entry', 'during', 'post'].forEach(phase => {
            document.getElementById(`${phase}Installments`).innerHTML = '';
            this.installmentCounters[phase] = 0;
        });

        // Reset approval status
        this.resetApprovalStatus();
        this.currentCalculatorId = null;
    },

    resetApprovalStatus() {
        const card = document.getElementById('approvalStatusCard');
        card.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

        document.getElementById('statusTitle').textContent = 'Waiting for Calculation';
        document.getElementById('statusDescription').textContent = 'Fill out the form and click "Calculate & Save" to see the approval status of your property financing.';
        document.getElementById('statusIcon').innerHTML = `
            <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="3" fill="none"/>
            <path d="M20 32l8 8 16-16" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        `;
        document.getElementById('statusDetails').classList.add('hidden');
        document.getElementById('btnShare').classList.add('hidden');
    },

    loadUserCalculations() {
        // Load from localStorage for demo
        const saved = localStorage.getItem('userCalculations');
        if (saved) {
            this.userCalculations = JSON.parse(saved);
            this.updateStatistics();
            this.updateCalculationsTable();
        }
    },

    saveToLocalStorage() {
        localStorage.setItem('userCalculations', JSON.stringify(this.userCalculations));
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
        this.showToast(message, 'success');
        this.saveToLocalStorage();
    },

    showErrorMessage(message) {
        this.showToast(message, 'error');
    },

    showToast(message, type) {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? '#2dce89' : '#f5365c';

        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 24px;
            background: ${bgColor};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    viewCalculation(id) {
        const calc = this.userCalculations.find(c => c.id === id);
        if (calc) {
            this.currentCalculatorId = id;
            this.updateApprovalStatus(calc);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
};

// Make CalculatorModule globally accessible
window.CalculatorModule = CalculatorModule;

// ===== EXPORT FOR USE IN OTHER SCRIPTS =====
window.dashboardUtils = {
    formatCurrency,
    formatNumber,
    initSalesChart
};
