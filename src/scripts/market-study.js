/**
 * Market Study Module - ImobiTools
 * Handles property valuation using comparative market analysis
 */

const MarketStudyModule = {
    sampleCounter: 0,
    samples: [],
    currentStudyId: null,

    init() {
        this.initAddSampleButton();
        this.initFormSubmit();
        this.initResetButton();
        this.initPDFButton();
    },

    initAddSampleButton() {
        const btn = document.getElementById('btnAddSample');
        btn.addEventListener('click', () => {
            this.addSample();
        });
    },

    addSample() {
        const sampleId = ++this.sampleCounter;
        const container = document.getElementById('samplesList');

        const sampleHTML = `
            <div class="sample-item" data-id="${sampleId}">
                <div class="form-group">
                    <label>Endereço</label>
                    <input type="text" name="sample_address_${sampleId}" placeholder="Rua Example, 456, Centro" required>
                </div>
                <div class="form-group">
                    <label>Área (m²)</label>
                    <input type="number" name="sample_area_${sampleId}" placeholder="80" min="1" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Preço (R$)</label>
                    <input type="number" name="sample_price_${sampleId}" placeholder="350000" min="0" step="1000" required>
                </div>
                <div class="form-group">
                    <label>Quartos/Banheiros/Vagas</label>
                    <input type="text" name="sample_features_${sampleId}" placeholder="2/1/1" required>
                </div>
                <button type="button" class="btn-remove-installment" onclick="MarketStudyModule.removeSample(${sampleId})">×</button>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', sampleHTML);
    },

    removeSample(id) {
        const item = document.querySelector(`.sample-item[data-id="${id}"]`);
        if (item) {
            item.remove();
            this.samples = this.samples.filter(s => s.id !== id);
        }
    },

    initFormSubmit() {
        const form = document.getElementById('marketStudyForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmit();
        });
    },

    initResetButton() {
        const btn = document.getElementById('btnResetMarketStudy');
        btn.addEventListener('click', () => {
            this.resetForm();
        });
    },

    initPDFButton() {
        const btn = document.getElementById('btnGeneratePDF');
        btn.addEventListener('click', async () => {
            await this.generatePDF();
        });
    },

    collectFormData() {
        // Subject property
        const subjectProperty = {
            address: {
                street: document.getElementById('subjectStreet').value,
                number: document.getElementById('subjectNumber').value,
                neighborhood: document.getElementById('subjectNeighborhood').value,
                city: document.getElementById('subjectCity').value,
                state: document.getElementById('subjectState').value
            },
            area: parseFloat(document.getElementById('subjectArea').value),
            characteristics: {
                bedrooms: parseInt(document.getElementById('subjectBedrooms').value),
                bathrooms: parseInt(document.getElementById('subjectBathrooms').value),
                parkingSpots: parseInt(document.getElementById('subjectParking').value),
                additionalFeatures: []
            }
        };

        // Comparable samples
        const samples = [];
        const sampleItems = document.querySelectorAll('.sample-item');

        sampleItems.forEach(item => {
            const id = item.dataset.id;
            const address = item.querySelector(`[name="sample_address_${id}"]`).value;
            const area = parseFloat(item.querySelector(`[name="sample_area_${id}"]`).value);
            const price = parseFloat(item.querySelector(`[name="sample_price_${id}"]`).value);
            const features = item.querySelector(`[name="sample_features_${id}"]`).value.split('/');

            samples.push({
                id: `sample-${id}`,
                address,
                area,
                price,
                bedrooms: parseInt(features[0]) || 0,
                bathrooms: parseInt(features[1]) || 0,
                parkingSpots: parseInt(features[2]) || 0
            });
        });

        return {
            subjectProperty,
            samples
        };
    },

    async handleFormSubmit() {
        try {
            const formData = this.collectFormData();

            // Validate minimum samples
            if (formData.samples.length < 3) {
                this.showErrorMessage('Por favor, adicione pelo menos 3 imóveis comparáveis para avaliação precisa.');
                return;
            }

            this.showLoadingState(true);

            // Simulate market study calculation (will integrate with real API)
            const result = await this.calculateValuation(formData);

            // Update UI
            this.displayValuationResults(result);
            this.displayStatistics(result.statistics);

            // Show success message
            this.showSuccessMessage('Estudo de mercado concluído com sucesso!');

        } catch (error) {
            console.error('Error calculating valuation:', error);
            this.showErrorMessage('Falha ao calcular avaliação. Por favor, tente novamente.');
        } finally {
            this.showLoadingState(false);
        }
    },

    async calculateValuation(data) {
        // Simulated valuation logic (will be replaced with real API call)
        const { subjectProperty, samples } = data;

        // Calculate price per m² for each sample
        const pricesPerSqm = samples.map(s => s.price / s.area);

        // Calculate statistics
        const mean = pricesPerSqm.reduce((a, b) => a + b, 0) / pricesPerSqm.length;
        const sortedPrices = [...pricesPerSqm].sort((a, b) => a - b);
        const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
        const min = Math.min(...pricesPerSqm);
        const max = Math.max(...pricesPerSqm);

        // Calculate standard deviation
        const variance = pricesPerSqm.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / pricesPerSqm.length;
        const stdDev = Math.sqrt(variance);
        const cv = (stdDev / mean) * 100;

        // Generate valuations for different property standards
        const valuations = {
            original: {
                name: 'Original',
                pricePerSqm: mean * 0.9,
                totalValue: mean * 0.9 * subjectProperty.area
            },
            basic: {
                name: 'Basic',
                pricePerSqm: mean * 0.95,
                totalValue: mean * 0.95 * subjectProperty.area
            },
            renovated: {
                name: 'Renovated',
                pricePerSqm: mean,
                totalValue: mean * subjectProperty.area
            },
            modernized: {
                name: 'Modernized',
                pricePerSqm: mean * 1.05,
                totalValue: mean * 1.05 * subjectProperty.area
            },
            highEnd: {
                name: 'High-End',
                pricePerSqm: mean * 1.1,
                totalValue: mean * 1.1 * subjectProperty.area
            }
        };

        return {
            id: `study-${Date.now()}`,
            subjectProperty,
            samples,
            valuations,
            statistics: {
                mean,
                median,
                min,
                max,
                stdDev,
                cv,
                sampleSize: samples.length,
                precision: cv < 30 ? 'High' : 'Medium'
            },
            createdAt: new Date().toISOString()
        };
    },

    displayValuationResults(result) {
        const card = document.getElementById('valuationResultsCard');
        const title = document.getElementById('valuationTitle');
        const description = document.getElementById('valuationDescription');
        const details = document.getElementById('valuationDetails');
        const grid = document.getElementById('valuationGrid');
        const btnPDF = document.getElementById('btnGeneratePDF');

        // Update title and description
        title.textContent = 'Valuation Complete';
        description.textContent = `Based on ${result.samples.length} comparable properties in the area.`;

        // Generate valuation cards
        grid.innerHTML = Object.values(result.valuations).map(v => `
            <div class="valuation-card">
                <h4>${v.name}</h4>
                <div class="price">${this.formatCurrency(v.totalValue)}</div>
                <div class="price-per-sqm">${this.formatCurrency(v.pricePerSqm)}/m²</div>
            </div>
        `).join('');

        // Show results and PDF button
        details.classList.remove('hidden');
        btnPDF.classList.remove('hidden');

        this.currentStudyId = result.id;
    },

    displayStatistics(stats) {
        const card = document.getElementById('statisticsCard');
        const grid = document.getElementById('statsGrid');

        // Generate statistics cards
        grid.innerHTML = `
            <div class="stat-item">
                <div class="label">Mean Price/m²</div>
                <div class="value">${this.formatCurrency(stats.mean)}</div>
            </div>
            <div class="stat-item">
                <div class="label">Median Price/m²</div>
                <div class="value">${this.formatCurrency(stats.median)}</div>
            </div>
            <div class="stat-item">
                <div class="label">Min Price/m²</div>
                <div class="value">${this.formatCurrency(stats.min)}</div>
            </div>
            <div class="stat-item">
                <div class="label">Max Price/m²</div>
                <div class="value">${this.formatCurrency(stats.max)}</div>
            </div>
            <div class="stat-item">
                <div class="label">Std. Deviation</div>
                <div class="value">${this.formatCurrency(stats.stdDev)}</div>
            </div>
            <div class="stat-item">
                <div class="label">Coeff. of Variation</div>
                <div class="value">${stats.cv.toFixed(2)}%</div>
            </div>
            <div class="stat-item">
                <div class="label">Sample Size</div>
                <div class="value">${stats.sampleSize}</div>
            </div>
            <div class="stat-item">
                <div class="label">Precision</div>
                <div class="value">${stats.precision}</div>
            </div>
        `;

        card.style.display = 'block';
    },

    async generatePDF() {
        try {
            if (!this.currentStudyId) {
                this.showErrorMessage('Nenhum estudo de mercado para exportar');
                return;
            }

            this.showLoadingState(true);

            // Simulate PDF generation (will integrate with real API)
            await new Promise(resolve => setTimeout(resolve, 2000));

            this.showSuccessMessage('Relatório PDF gerado com sucesso!');

            // In production, this would download the PDF
            // window.open(`/api/market-study/generate-pdf?id=${this.currentStudyId}`, '_blank');

        } catch (error) {
            console.error('Error generating PDF:', error);
            this.showErrorMessage('Falha ao gerar relatório PDF.');
        } finally {
            this.showLoadingState(false);
        }
    },

    resetForm() {
        document.getElementById('marketStudyForm').reset();
        document.getElementById('samplesList').innerHTML = '';
        this.sampleCounter = 0;
        this.samples = [];
        this.currentStudyId = null;

        // Reset results display
        document.getElementById('valuationTitle').textContent = 'Waiting for Analysis';
        document.getElementById('valuationDescription').textContent = 'Fill out the form with property details and comparable samples to generate a professional market study.';
        document.getElementById('valuationDetails').classList.add('hidden');
        document.getElementById('btnGeneratePDF').classList.add('hidden');
        document.getElementById('statisticsCard').style.display = 'none';
    },

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    },

    showLoadingState(loading) {
        const submitBtn = document.querySelector('.btn-primary-form');
        if (loading) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Calculating...';
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Calculate Valuation';
        }
    },

    showSuccessMessage(message) {
        this.showToast(message, 'success');
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
    }
};

// Make MarketStudyModule globally accessible
window.MarketStudyModule = MarketStudyModule;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('marketStudyForm')) {
        MarketStudyModule.init();
        console.log('✅ Market Study Module initialized');
    }
});
