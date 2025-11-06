/**
 * Projects Table Module - ImobiTools
 * Handles multi-agent real estate projects database
 *
 * NOTE: This file requires shared-utils.js to be loaded first
 */

// Use shared utilities from ImobiUtils
const { formatCurrency, showToast, COLORS } = window.ImobiUtils;

const ProjectsTableModule = {
  units: [],
  filteredUnits: [],

  init() {
    this.loadDemoData();
    this.initFilterButtons();
    this.initActionButtons();
    this.updateStatistics();
    this.renderTable();
  },

  loadDemoData() {
    // Demo units
    this.units = [
      {
        id: 1,
        tower: 'A',
        number: '101',
        area: 85.5,
        price: 450000,
        parking: '2',
        origin: 'real',
        status: 'available',
      },
      {
        id: 2,
        tower: 'A',
        number: '102',
        area: 92.3,
        price: 520000,
        parking: '2',
        origin: 'real',
        status: 'sold',
      },
      {
        id: 3,
        tower: 'A',
        number: '201',
        area: 85.5,
        price: 465000,
        parking: '2',
        origin: 'permutante',
        status: 'available',
      },
      {
        id: 4,
        tower: 'B',
        number: '101',
        area: 78.2,
        price: 420000,
        parking: '1',
        origin: 'real',
        status: 'reserved',
      },
      {
        id: 5,
        tower: 'B',
        number: '102',
        area: 78.2,
        price: 430000,
        parking: '1',
        origin: 'real',
        status: 'available',
      },
    ];
    this.filteredUnits = [...this.units];
  },

  initFilterButtons() {
    const btnFilter = document.getElementById('btnFilter');
    const btnClearFilters = document.getElementById('btnClearFilters');
    const searchInput = document.getElementById('searchInput');

    if (btnFilter) {
      btnFilter.addEventListener('click', () => {
        this.applyFilters();
      });
    }

    if (btnClearFilters) {
      btnClearFilters.addEventListener('click', () => {
        this.clearFilters();
      });
    }

    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchUnits(e.target.value);
      });
    }
  },

  initActionButtons() {
    const btnAddUnit = document.getElementById('btnAddUnit');
    const btnExportCSV = document.getElementById('btnExportCSV');
    const btnImportCSV = document.getElementById('btnImportCSV');

    if (btnAddUnit) {
      btnAddUnit.addEventListener('click', () => {
        this.showAddUnitModal();
      });
    }

    if (btnExportCSV) {
      btnExportCSV.addEventListener('click', () => {
        this.exportToCSV();
      });
    }

    if (btnImportCSV) {
      btnImportCSV.addEventListener('click', () => {
        this.showImportModal();
      });
    }
  },

  applyFilters() {
    const filterStatus = document.getElementById('filterStatus');
    const filterOrigin = document.getElementById('filterOrigin');
    const filterTower = document.getElementById('filterTower');

    const status = filterStatus ? filterStatus.value : '';
    const origin = filterOrigin ? filterOrigin.value : '';
    const tower = filterTower ? filterTower.value.toLowerCase() : '';

    this.filteredUnits = this.units.filter((unit) => {
      const statusMatch = !status || unit.status === status;
      const originMatch = !origin || unit.origin === origin;
      const towerMatch = !tower || unit.tower.toLowerCase().includes(tower);

      return statusMatch && originMatch && towerMatch;
    });

    this.renderTable();
    this.updateStatistics();
  },

  clearFilters() {
    const filterStatus = document.getElementById('filterStatus');
    const filterOrigin = document.getElementById('filterOrigin');
    const filterTower = document.getElementById('filterTower');
    const searchInput = document.getElementById('searchInput');

    if (filterStatus) filterStatus.value = '';
    if (filterOrigin) filterOrigin.value = '';
    if (filterTower) filterTower.value = '';
    if (searchInput) searchInput.value = '';

    this.filteredUnits = [...this.units];
    this.renderTable();
    this.updateStatistics();
  },

  searchUnits(query) {
    if (!query) {
      this.filteredUnits = [...this.units];
    } else {
      const lowerQuery = query.toLowerCase();
      this.filteredUnits = this.units.filter(
        (unit) =>
          unit.tower.toLowerCase().includes(lowerQuery) ||
          unit.number.toLowerCase().includes(lowerQuery)
      );
    }

    this.renderTable();
    this.updateStatistics();
  },

  renderTable() {
    const tbody = document.getElementById('unitsTableBody');

    // Clear existing content
    while (tbody.firstChild) {
      tbody.removeChild(tbody.firstChild);
    }

    if (this.filteredUnits.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 9;
      td.className = 'empty-state';

      const div = document.createElement('div');
      div.className = 'empty-state-content';

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
      p.textContent = 'No units found. Try adjusting your filters.';

      div.appendChild(svg);
      div.appendChild(p);
      td.appendChild(div);
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    this.filteredUnits.forEach((unit) => {
      const pricePerSqm = unit.area > 0 ? unit.price / unit.area : 0;
      const tr = document.createElement('tr');

      // Tower column
      const tdTower = document.createElement('td');
      const strong = document.createElement('strong');
      strong.textContent = String(unit.tower);
      tdTower.appendChild(strong);
      tr.appendChild(tdTower);

      // Number column
      const tdNumber = document.createElement('td');
      tdNumber.textContent = String(unit.number);
      tr.appendChild(tdNumber);

      // Area column
      const tdArea = document.createElement('td');
      tdArea.textContent = `${unit.area.toFixed(2)} m²`;
      tr.appendChild(tdArea);

      // Price column
      const tdPrice = document.createElement('td');
      tdPrice.className = 'valor-destaque';
      tdPrice.textContent = formatCurrency(unit.price);
      tr.appendChild(tdPrice);

      // Price per sqm column
      const tdPricePerSqm = document.createElement('td');
      tdPricePerSqm.textContent = `${formatCurrency(pricePerSqm)}/m²`;
      tr.appendChild(tdPricePerSqm);

      // Parking column
      const tdParking = document.createElement('td');
      tdParking.textContent = String(unit.parking);
      tr.appendChild(tdParking);

      // Origin column
      const tdOrigin = document.createElement('td');
      const originBadge = document.createElement('span');
      originBadge.className = `origin-badge ${unit.origin}`;
      originBadge.textContent = unit.origin === 'real' ? '✓ Real' : '⟳ Permutante';
      tdOrigin.appendChild(originBadge);
      tr.appendChild(tdOrigin);

      // Status column
      const tdStatus = document.createElement('td');
      const statusSpan = document.createElement('span');
      statusSpan.className = `unit-status ${unit.status}`;
      statusSpan.textContent = String(unit.status);
      tdStatus.appendChild(statusSpan);
      tr.appendChild(tdStatus);

      // Actions column
      const tdActions = document.createElement('td');
      const button = document.createElement('button');
      button.className = 'btn-menu';
      button.textContent = '⋮';
      button.addEventListener('click', () => this.editUnit(unit.id));
      tdActions.appendChild(button);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    });
  },

  updateStatistics() {
    const total = this.units.length;
    const available = this.units.filter((u) => u.status === 'available').length;
    const sold = this.units.filter((u) => u.status === 'sold').length;
    const totalValue = this.units.reduce((sum, u) => sum + u.price, 0);

    const availableRate = total > 0 ? ((available / total) * 100).toFixed(1) : 0;
    const soldRate = total > 0 ? ((sold / total) * 100).toFixed(1) : 0;

    // Add null checks for stat elements
    const totalUnitsEl = document.getElementById('totalUnits');
    const availableUnitsEl = document.getElementById('availableUnits');
    const soldUnitsEl = document.getElementById('soldUnits');
    const totalValueEl = document.getElementById('totalValue');
    const availableRateEl = document.getElementById('availableRate');
    const soldRateEl = document.getElementById('soldRate');

    if (totalUnitsEl) totalUnitsEl.textContent = total;
    if (availableUnitsEl) availableUnitsEl.textContent = available;
    if (soldUnitsEl) soldUnitsEl.textContent = sold;
    if (totalValueEl) totalValueEl.textContent = formatCurrency(totalValue);
    if (availableRateEl) availableRateEl.textContent = `${availableRate}%`;
    if (soldRateEl) soldRateEl.textContent = `${soldRate}%`;
  },

  editUnit(id) {
    const unit = this.units.find((u) => u.id === id);
    if (unit) {
      alert(
        `Editar unidade: ${unit.tower}-${unit.number}\n\nEste recurso abrirá um modal de edição.`
      );
    }
  },

  showAddUnitModal() {
    alert(
      'O recurso Adicionar Unidade abrirá um formulário modal para criar novas unidades.\n\nEste recurso será integrado com a API backend.'
    );
  },

  showImportModal() {
    alert(
      'O recurso Importar CSV permitirá upload em massa de unidades.\n\nFormato suportado: Torre, Unidade, Área, Preço, Vagas, Origem, Status'
    );
  },

  exportToCSV() {
    const headers = [
      'Torre',
      'Unidade',
      'Área (m²)',
      'Preço',
      'Preço/m²',
      'Vagas',
      'Origem',
      'Status',
    ];
    const rows = this.filteredUnits.map((unit) => {
      // Fix division by zero risk
      const pricePerSqm = unit.area > 0 ? unit.price / unit.area : 0;
      return [
        unit.tower,
        unit.number,
        unit.area.toFixed(2),
        unit.price.toFixed(2),
        pricePerSqm.toFixed(2),
        unit.parking,
        unit.origin,
        unit.status,
      ];
    });

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `units_export_${Date.now()}.csv`;
    a.click();

    // Revoke URL after a delay to ensure download starts
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);

    showToast('CSV exportado com sucesso!', 'success');
  },
};

// Make globally accessible
window.ProjectsTableModule = ProjectsTableModule;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('unitsTableBody')) {
    ProjectsTableModule.init();
  }
});

// ===== GLOBAL ERROR HANDLERS =====
window.addEventListener('error', (event) => {
  console.error('Uncaught error in projects-table.js', {
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
  console.error('Unhandled promise rejection in projects-table.js', {
    reason: event.reason,
    promise: event.promise,
  });
  // Prevent default browser error handling
  event.preventDefault();
});
