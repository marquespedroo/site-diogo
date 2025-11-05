/**
 * Projects Table Module - ImobiTools
 * Handles multi-agent real estate projects database
 */

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
            { id: 1, tower: 'A', number: '101', area: 85.5, price: 450000, parking: '2', origin: 'real', status: 'available' },
            { id: 2, tower: 'A', number: '102', area: 92.3, price: 520000, parking: '2', origin: 'real', status: 'sold' },
            { id: 3, tower: 'A', number: '201', area: 85.5, price: 465000, parking: '2', origin: 'permutante', status: 'available' },
            { id: 4, tower: 'B', number: '101', area: 78.2, price: 420000, parking: '1', origin: 'real', status: 'reserved' },
            { id: 5, tower: 'B', number: '102', area: 78.2, price: 430000, parking: '1', origin: 'real', status: 'available' },
        ];
        this.filteredUnits = [...this.units];
    },

    initFilterButtons() {
        document.getElementById('btnFilter').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('btnClearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Search input
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchUnits(e.target.value);
        });
    },

    initActionButtons() {
        document.getElementById('btnAddUnit').addEventListener('click', () => {
            this.showAddUnitModal();
        });

        document.getElementById('btnExportCSV').addEventListener('click', () => {
            this.exportToCSV();
        });

        document.getElementById('btnImportCSV').addEventListener('click', () => {
            this.showImportModal();
        });
    },

    applyFilters() {
        const status = document.getElementById('filterStatus').value;
        const origin = document.getElementById('filterOrigin').value;
        const tower = document.getElementById('filterTower').value.toLowerCase();

        this.filteredUnits = this.units.filter(unit => {
            const statusMatch = !status || unit.status === status;
            const originMatch = !origin || unit.origin === origin;
            const towerMatch = !tower || unit.tower.toLowerCase().includes(tower);

            return statusMatch && originMatch && towerMatch;
        });

        this.renderTable();
        this.updateStatistics();
    },

    clearFilters() {
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterOrigin').value = '';
        document.getElementById('filterTower').value = '';
        document.getElementById('searchInput').value = '';

        this.filteredUnits = [...this.units];
        this.renderTable();
        this.updateStatistics();
    },

    searchUnits(query) {
        if (!query) {
            this.filteredUnits = [...this.units];
        } else {
            const lowerQuery = query.toLowerCase();
            this.filteredUnits = this.units.filter(unit =>
                unit.tower.toLowerCase().includes(lowerQuery) ||
                unit.number.toLowerCase().includes(lowerQuery)
            );
        }

        this.renderTable();
        this.updateStatistics();
    },

    renderTable() {
        const tbody = document.getElementById('unitsTableBody');

        if (this.filteredUnits.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <div class="empty-state-content">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <circle cx="24" cy="24" r="20" stroke="#8392AB" stroke-width="2" opacity="0.3"/>
                                <path d="M16 24h16M24 16v16" stroke="#8392AB" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
                            </svg>
                            <p>No units found. Try adjusting your filters.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredUnits.map(unit => {
            const pricePerSqm = unit.price / unit.area;
            return `
                <tr>
                    <td><strong>${unit.tower}</strong></td>
                    <td>${unit.number}</td>
                    <td>${unit.area.toFixed(2)} m²</td>
                    <td class="valor-destaque">${this.formatCurrency(unit.price)}</td>
                    <td>${this.formatCurrency(pricePerSqm)}/m²</td>
                    <td>${unit.parking}</td>
                    <td>
                        <span class="origin-badge ${unit.origin}">
                            ${unit.origin === 'real' ? '✓ Real' : '⟳ Permutante'}
                        </span>
                    </td>
                    <td>
                        <span class="unit-status ${unit.status}">${unit.status}</span>
                    </td>
                    <td>
                        <button class="btn-menu" onclick="ProjectsTableModule.editUnit(${unit.id})">⋮</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    updateStatistics() {
        const total = this.units.length;
        const available = this.units.filter(u => u.status === 'available').length;
        const sold = this.units.filter(u => u.status === 'sold').length;
        const totalValue = this.units.reduce((sum, u) => sum + u.price, 0);

        const availableRate = total > 0 ? ((available / total) * 100).toFixed(1) : 0;
        const soldRate = total > 0 ? ((sold / total) * 100).toFixed(1) : 0;

        document.getElementById('totalUnits').textContent = total;
        document.getElementById('availableUnits').textContent = available;
        document.getElementById('soldUnits').textContent = sold;
        document.getElementById('totalValue').textContent = this.formatCurrency(totalValue);
        document.getElementById('availableRate').textContent = `${availableRate}%`;
        document.getElementById('soldRate').textContent = `${soldRate}%`;
    },

    editUnit(id) {
        const unit = this.units.find(u => u.id === id);
        if (unit) {
            alert(`Editar unidade: ${unit.tower}-${unit.number}\n\nEste recurso abrirá um modal de edição.`);
        }
    },

    showAddUnitModal() {
        alert('O recurso Adicionar Unidade abrirá um formulário modal para criar novas unidades.\n\nEste recurso será integrado com a API backend.');
    },

    showImportModal() {
        alert('O recurso Importar CSV permitirá upload em massa de unidades.\n\nFormato suportado: Torre, Unidade, Área, Preço, Vagas, Origem, Status');
    },

    exportToCSV() {
        const headers = ['Torre', 'Unidade', 'Área (m²)', 'Preço', 'Preço/m²', 'Vagas', 'Origem', 'Status'];
        const rows = this.filteredUnits.map(unit => {
            const pricePerSqm = unit.price / unit.area;
            return [
                unit.tower,
                unit.number,
                unit.area.toFixed(2),
                unit.price.toFixed(2),
                pricePerSqm.toFixed(2),
                unit.parking,
                unit.origin,
                unit.status
            ];
        });

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `units_export_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        this.showSuccessMessage('CSV exportado com sucesso!');
    },

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    },

    showSuccessMessage(message) {
        this.showToast(message, 'success');
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
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }
};

// Make globally accessible
window.ProjectsTableModule = ProjectsTableModule;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('unitsTableBody')) {
        ProjectsTableModule.init();
        console.log('✅ Projects Table Module initialized');
    }
});
