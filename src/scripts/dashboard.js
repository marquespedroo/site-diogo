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

    console.log('✅ Dashboard initialized successfully');
});

// ===== UTILITY: Format Currency =====
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// ===== UTILITY: Format Number =====
function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value);
}

// ===== EXPORT FOR USE IN OTHER SCRIPTS =====
window.dashboardUtils = {
    formatCurrency,
    formatNumber,
    initSalesChart
};
