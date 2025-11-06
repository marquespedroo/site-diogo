/**
 * Projects Table Module - ImobiTools
 * Handles multi-agent real estate projects database
 *
 * NOTE: This file requires shared-utils.js to be loaded first
 */

// Use shared utilities from ImobiUtils
const { formatCurrency, showToast, COLORS, logger } = window.ImobiUtils;

// Import Projects API
import { projectsAPI, APIError } from './projects-api.js';

const ProjectsTableModule = {
  units: [],
  filteredUnits: [],

  async init() {
    await this.loadUnits();
    this.initFilterButtons();
    this.initActionButtons();
    this.updateStatistics();
    this.renderTable();
  },

  async loadUnits() {
    try {
      // Get or create default project
      const projectId = sessionStorage.getItem('currentProjectId') || await this.getOrCreateDefaultProject();

      const response = await projectsAPI.listUnits({
        projectId: projectId,
        limit: 100,
        offset: 0,
      });

      // Map API response to display format
      this.units = response.units.map(u => ({
        id: u.id,
        tower: u.tower,
        number: u.number,
        area: u.area,
        price: u.price,
        parking: u.parkingSpots,
        origin: u.origin,
        status: u.status,
      }));

      this.filteredUnits = [...this.units];

      logger.info('Loaded units:', this.units.length);

    } catch (error) {
      if (error instanceof APIError) {
        showToast(`Erro ao carregar unidades: ${error.message}`, 'error');
        logger.error('API Error:', error);
      } else {
        showToast('Erro de rede. Tente novamente.', 'error');
        logger.error('Network error:', error);
      }
      this.units = [];
      this.filteredUnits = [];
    }
  },

  async getOrCreateDefaultProject() {
    const userId = sessionStorage.getItem('userId') || 'guest-' + Date.now();
    sessionStorage.setItem('userId', userId);

    try {
      // Try to get existing projects
      const response = await projectsAPI.listProjects({ userId, limit: 1 });

      if (response.projects.length > 0) {
        const projectId = response.projects[0].id;
        sessionStorage.setItem('currentProjectId', projectId);
        return projectId;
      }

      // Create default project if none exists
      const project = await projectsAPI.createProject({
        userId,
        name: 'Meu Projeto',
        location: { city: 'São Paulo', neighborhood: 'Centro', state: 'SP' },
        description: 'Projeto padrão',
      });

      sessionStorage.setItem('currentProjectId', project.id);
      return project.id;

    } catch (error) {
      logger.error('Failed to get/create project:', error);
      throw error;
    }
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
      btnAddUnit.addEventListener('click', async () => {
        // Show prompts to collect unit data (replace with proper modal in future)
        const tower = prompt('Torre:');
        const number = prompt('Número:');
        const area = parseFloat(prompt('Área (m²):') || '0');
        const price = parseFloat(prompt('Preço (R$):') || '0');
        const parking = prompt('Vagas de estacionamento:');
        const origin = prompt('Origem (real/permutante):');

        if (!tower || !number || !area || !price || !origin) {
          showToast('Preencha todos os campos', 'warning');
          return;
        }

        if (origin !== 'real' && origin !== 'permutante') {
          showToast('Origem deve ser "real" ou "permutante"', 'warning');
          return;
        }

        try {
          const projectId = sessionStorage.getItem('currentProjectId');

          await projectsAPI.createUnit({
            projectId,
            tower,
            number,
            area,
            price,
            parkingSpots: parking || '0',
            origin: origin,
            status: 'available',
          });

          showToast('Unidade adicionada com sucesso!', 'success');

          // Reload table
          await this.loadUnits();
          this.renderTable();
          this.updateStatistics();

        } catch (error) {
          if (error instanceof APIError) {
            showToast(`Erro: ${error.message}`, 'error');
          } else {
            showToast('Erro ao adicionar unidade', 'error');
          }
          logger.error('Create unit error:', error);
        }
      });
    }

    if (btnExportCSV) {
      btnExportCSV.addEventListener('click', async () => {
        try {
          const projectId = sessionStorage.getItem('currentProjectId');
          const blob = await projectsAPI.exportUnitsCSV(projectId);

          // Download file
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `units-${projectId}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          showToast('CSV exportado com sucesso!', 'success');

        } catch (error) {
          showToast('Erro ao exportar CSV', 'error');
          logger.error('Export error:', error);
        }
      });
    }

    if (btnImportCSV) {
      btnImportCSV.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';

        input.onchange = async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          try {
            const projectId = sessionStorage.getItem('currentProjectId');
            const result = await projectsAPI.importUnitsCSV(projectId, file);

            showToast(`${result.added} unidades importadas!`, 'success');

            if (result.errors.length > 0) {
              logger.warn('Import errors:', result.errors);
              showToast(`${result.errors.length} erros encontrados. Verifique o console.`, 'warning');
            }

            // Reload table
            await this.loadUnits();
            this.renderTable();
            this.updateStatistics();

          } catch (error) {
            showToast('Erro ao importar CSV', 'error');
            logger.error('Import error:', error);
          }
        };

        input.click();
      });
    }
  },

  async applyFilters() {
    const filterStatus = document.getElementById('filterStatus');
    const filterOrigin = document.getElementById('filterOrigin');
    const filterTower = document.getElementById('filterTower');

    const status = filterStatus ? filterStatus.value : '';
    const origin = filterOrigin ? filterOrigin.value : '';
    const tower = filterTower ? filterTower.value : '';

    try {
      const projectId = sessionStorage.getItem('currentProjectId');

      const response = await projectsAPI.listUnits({
        projectId,
        status: status || undefined,
        origin: origin || undefined,
        tower: tower || undefined,
        limit: 100,
        offset: 0,
      });

      // Map API response to display format
      this.units = response.units.map(u => ({
        id: u.id,
        tower: u.tower,
        number: u.number,
        area: u.area,
        price: u.price,
        parking: u.parkingSpots,
        origin: u.origin,
        status: u.status,
      }));

      this.filteredUnits = [...this.units];
      this.renderTable();
      this.updateStatistics();

    } catch (error) {
      showToast('Erro ao aplicar filtros', 'error');
      logger.error('Filter error:', error);
    }
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

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'action-btn delete';
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.title = 'Excluir unidade';
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Deseja realmente excluir esta unidade?')) return;

        try {
          const projectId = sessionStorage.getItem('currentProjectId');
          await projectsAPI.deleteUnit(projectId, unit.id);

          showToast('Unidade excluída com sucesso!', 'success');

          // Reload table
          await this.loadUnits();
          this.renderTable();
          this.updateStatistics();

        } catch (error) {
          showToast('Erro ao excluir unidade', 'error');
          logger.error('Delete error:', error);
        }
      });

      tdActions.appendChild(deleteBtn);
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
