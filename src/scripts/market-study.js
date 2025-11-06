/**
 * Market Study Module - ImobiTools
 * Handles property valuation using comparative market analysis
 *
 * NOTE: This file requires shared-utils.js to be loaded first
 */

// Use shared utilities from ImobiUtils
const { formatCurrency, showToast, logger, COLORS } = window.ImobiUtils;

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

    const sampleDiv = document.createElement('div');
    sampleDiv.className = 'sample-item';
    sampleDiv.dataset.id = sampleId;

    // Create address form group
    const addressGroup = document.createElement('div');
    addressGroup.className = 'form-group';
    const addressLabel = document.createElement('label');
    addressLabel.textContent = 'Endereço';
    const addressInput = document.createElement('input');
    addressInput.type = 'text';
    addressInput.name = `sample_address_${sampleId}`;
    addressInput.placeholder = 'Rua Example, 456, Centro';
    addressInput.required = true;
    addressGroup.appendChild(addressLabel);
    addressGroup.appendChild(addressInput);

    // Create area form group
    const areaGroup = document.createElement('div');
    areaGroup.className = 'form-group';
    const areaLabel = document.createElement('label');
    areaLabel.textContent = 'Área (m²)';
    const areaInput = document.createElement('input');
    areaInput.type = 'number';
    areaInput.name = `sample_area_${sampleId}`;
    areaInput.placeholder = '80';
    areaInput.min = '1';
    areaInput.step = '0.01';
    areaInput.required = true;
    areaGroup.appendChild(areaLabel);
    areaGroup.appendChild(areaInput);

    // Create price form group
    const priceGroup = document.createElement('div');
    priceGroup.className = 'form-group';
    const priceLabel = document.createElement('label');
    priceLabel.textContent = 'Preço (R$)';
    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.name = `sample_price_${sampleId}`;
    priceInput.placeholder = '350000';
    priceInput.min = '0';
    priceInput.step = '1000';
    priceInput.required = true;
    priceGroup.appendChild(priceLabel);
    priceGroup.appendChild(priceInput);

    // Create features form group
    const featuresGroup = document.createElement('div');
    featuresGroup.className = 'form-group';
    const featuresLabel = document.createElement('label');
    featuresLabel.textContent = 'Quartos/Banheiros/Vagas';
    const featuresInput = document.createElement('input');
    featuresInput.type = 'text';
    featuresInput.name = `sample_features_${sampleId}`;
    featuresInput.placeholder = '2/1/1';
    featuresInput.required = true;
    featuresGroup.appendChild(featuresLabel);
    featuresGroup.appendChild(featuresInput);

    // Create remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-remove-installment';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      this.removeSample(sampleId);
    });

    // Append all elements
    sampleDiv.appendChild(addressGroup);
    sampleDiv.appendChild(areaGroup);
    sampleDiv.appendChild(priceGroup);
    sampleDiv.appendChild(featuresGroup);
    sampleDiv.appendChild(removeBtn);

    container.appendChild(sampleDiv);
  },

  removeSample(id) {
    const item = document.querySelector(`.sample-item[data-id="${id}"]`);
    if (item) {
      item.remove();
      this.samples = this.samples.filter((s) => s.id !== id);
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
    // Subject property - Add null checks for DOM elements
    const streetEl = document.getElementById('subjectStreet');
    const numberEl = document.getElementById('subjectNumber');
    const neighborhoodEl = document.getElementById('subjectNeighborhood');
    const cityEl = document.getElementById('subjectCity');
    const stateEl = document.getElementById('subjectState');
    const areaEl = document.getElementById('subjectArea');
    const bedroomsEl = document.getElementById('subjectBedrooms');
    const bathroomsEl = document.getElementById('subjectBathrooms');
    const parkingEl = document.getElementById('subjectParking');

    if (
      !streetEl ||
      !numberEl ||
      !neighborhoodEl ||
      !cityEl ||
      !stateEl ||
      !areaEl ||
      !bedroomsEl ||
      !bathroomsEl ||
      !parkingEl
    ) {
      throw new Error('Required form elements are missing');
    }

    const subjectProperty = {
      address: {
        street: streetEl.value,
        number: numberEl.value,
        neighborhood: neighborhoodEl.value,
        city: cityEl.value,
        state: stateEl.value,
      },
      area: parseFloat(areaEl.value),
      characteristics: {
        bedrooms: parseInt(bedroomsEl.value),
        bathrooms: parseInt(bathroomsEl.value),
        parkingSpots: parseInt(parkingEl.value),
        additionalFeatures: [],
      },
    };

    // Comparable samples
    const samples = [];
    const sampleItems = document.querySelectorAll('.sample-item');

    sampleItems.forEach((item) => {
      const id = item.dataset.id;
      const addressElement = item.querySelector(`[name="sample_address_${id}"]`);
      const areaElement = item.querySelector(`[name="sample_area_${id}"]`);
      const priceElement = item.querySelector(`[name="sample_price_${id}"]`);
      const featuresElement = item.querySelector(`[name="sample_features_${id}"]`);

      if (!addressElement || !areaElement || !priceElement || !featuresElement) {
        logger.warn(`Missing elements for sample ${id}`);
        return;
      }

      const address = addressElement.value;
      const area = parseFloat(areaElement.value);
      const price = parseFloat(priceElement.value);
      const featuresValue = featuresElement.value.trim();

      // Validate features format before splitting
      if (!featuresValue || !featuresValue.includes('/')) {
        logger.warn(
          `Invalid features format for sample ${id}: expected format is "bedrooms/bathrooms/parking" (e.g., "2/1/1")`
        );
        return;
      }

      const features = featuresValue.split('/').map((f) => f.trim());

      // Validate that we have exactly 3 feature values
      if (features.length !== 3) {
        logger.warn(
          `Invalid features format for sample ${id}: expected 3 values separated by "/" (bedrooms/bathrooms/parking)`
        );
        return;
      }

      // Validate that all features are numeric
      if (features.some((f) => isNaN(parseInt(f)))) {
        logger.warn(`Invalid features values for sample ${id}: all values must be numeric`);
        return;
      }

      samples.push({
        id: `sample-${id}`,
        address,
        area: isNaN(area) ? 0 : area,
        price: isNaN(price) ? 0 : price,
        bedrooms: parseInt(features[0]) || 0,
        bathrooms: parseInt(features[1]) || 0,
        parkingSpots: parseInt(features[2]) || 0,
      });
    });

    return {
      subjectProperty,
      samples,
    };
  },

  async handleFormSubmit() {
    try {
      const formData = this.collectFormData();

      // Validate minimum samples
      if (formData.samples.length < 3) {
        this.showErrorMessage(
          'Por favor, adicione pelo menos 3 imóveis comparáveis para avaliação precisa.'
        );
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
      logger.error('Error calculating valuation', error);
      this.showErrorMessage('Falha ao calcular avaliação. Por favor, tente novamente.');
    } finally {
      this.showLoadingState(false);
    }
  },

  async calculateValuation(data) {
    // Simulated valuation logic (will be replaced with real API call)
    const { subjectProperty, samples } = data;

    // Calculate price per m² for each sample
    const pricesPerSqm = samples.map((s) => s.price / s.area);

    // Calculate statistics
    const mean = pricesPerSqm.reduce((a, b) => a + b, 0) / pricesPerSqm.length;
    const sortedPrices = [...pricesPerSqm].sort((a, b) => a - b);
    const median =
      sortedPrices.length % 2 === 0
        ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
        : sortedPrices[Math.floor(sortedPrices.length / 2)];
    const min = Math.min(...pricesPerSqm);
    const max = Math.max(...pricesPerSqm);

    // Calculate standard deviation
    const variance =
      pricesPerSqm.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / pricesPerSqm.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

    // Generate valuations for different property standards
    const valuations = {
      original: {
        name: 'Original',
        pricePerSqm: mean * 0.9,
        totalValue: mean * 0.9 * subjectProperty.area,
      },
      basic: {
        name: 'Basic',
        pricePerSqm: mean * 0.95,
        totalValue: mean * 0.95 * subjectProperty.area,
      },
      renovated: {
        name: 'Renovated',
        pricePerSqm: mean,
        totalValue: mean * subjectProperty.area,
      },
      modernized: {
        name: 'Modernized',
        pricePerSqm: mean * 1.05,
        totalValue: mean * 1.05 * subjectProperty.area,
      },
      highEnd: {
        name: 'High-End',
        pricePerSqm: mean * 1.1,
        totalValue: mean * 1.1 * subjectProperty.area,
      },
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
        precision: cv < 30 ? 'High' : 'Medium',
      },
      createdAt: new Date().toISOString(),
    };
  },

  displayValuationResults(result) {
    const card = document.getElementById('valuationResultsCard');
    const title = document.getElementById('valuationTitle');
    const description = document.getElementById('valuationDescription');
    const details = document.getElementById('valuationDetails');
    const grid = document.getElementById('valuationGrid');
    const btnPDF = document.getElementById('btnGeneratePDF');

    // Check if all required elements exist
    if (!title || !description || !details || !grid || !btnPDF) {
      logger.error('Required DOM elements for valuation results are missing');
      return;
    }

    // Update title and description
    title.textContent = 'Valuation Complete';
    description.textContent = `Based on ${result.samples.length} comparable properties in the area.`;

    // Generate valuation cards safely
    // Clear existing content
    while (grid.firstChild) {
      grid.removeChild(grid.firstChild);
    }

    // Create valuation cards using DOM manipulation
    Object.values(result.valuations).forEach((v) => {
      const card = document.createElement('div');
      card.className = 'valuation-card';

      const h4 = document.createElement('h4');
      h4.textContent = v.name;

      const priceDiv = document.createElement('div');
      priceDiv.className = 'price';
      priceDiv.textContent = formatCurrency(v.totalValue);

      const pricePerSqmDiv = document.createElement('div');
      pricePerSqmDiv.className = 'price-per-sqm';
      pricePerSqmDiv.textContent = `${formatCurrency(v.pricePerSqm)}/m²`;

      card.appendChild(h4);
      card.appendChild(priceDiv);
      card.appendChild(pricePerSqmDiv);
      grid.appendChild(card);
    });

    // Show results and PDF button
    details.classList.remove('hidden');
    btnPDF.classList.remove('hidden');

    this.currentStudyId = result.id;
  },

  displayStatistics(stats) {
    const card = document.getElementById('statisticsCard');
    const grid = document.getElementById('statsGrid');

    // Check if required elements exist
    if (!card || !grid) {
      logger.error('Required DOM elements for statistics are missing');
      return;
    }

    // Clear existing content
    while (grid.firstChild) {
      grid.removeChild(grid.firstChild);
    }

    // Helper function to create a stat item
    const createStatItem = (label, value) => {
      const item = document.createElement('div');
      item.className = 'stat-item';

      const labelDiv = document.createElement('div');
      labelDiv.className = 'label';
      labelDiv.textContent = label;

      const valueDiv = document.createElement('div');
      valueDiv.className = 'value';
      valueDiv.textContent = value;

      item.appendChild(labelDiv);
      item.appendChild(valueDiv);
      return item;
    };

    // Generate statistics cards safely
    grid.appendChild(createStatItem('Mean Price/m²', formatCurrency(stats.mean)));
    grid.appendChild(createStatItem('Median Price/m²', formatCurrency(stats.median)));
    grid.appendChild(createStatItem('Min Price/m²', formatCurrency(stats.min)));
    grid.appendChild(createStatItem('Max Price/m²', formatCurrency(stats.max)));
    grid.appendChild(createStatItem('Std. Deviation', formatCurrency(stats.stdDev)));
    grid.appendChild(createStatItem('Coeff. of Variation', `${stats.cv.toFixed(2)}%`));
    grid.appendChild(createStatItem('Sample Size', String(stats.sampleSize)));
    grid.appendChild(createStatItem('Precision', stats.precision));

    card.style.display = 'block';
  },

  async generatePDF() {
    try {
      if (!this.currentStudyId) {
        this.showErrorMessage('Nenhum estudo de mercado para exportar');
        return;
      }

      this.showLoadingState(true);

      // Simulate PDF generation with timeout handling (will integrate with real API)
      const pdfGeneration = new Promise((resolve) => setTimeout(resolve, 2000));
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PDF generation timeout')), 30000)
      );

      // Race between PDF generation and timeout
      await Promise.race([pdfGeneration, timeout]);

      this.showSuccessMessage('Relatório PDF gerado com sucesso!');

      // In production, this would download the PDF
      // window.open(`/api/market-study/generate-pdf?id=${this.currentStudyId}`, '_blank');
    } catch (error) {
      logger.error('Error generating PDF', error);

      if (error.message === 'PDF generation timeout') {
        this.showErrorMessage(
          'Tempo limite excedido ao gerar relatório PDF. Por favor, tente novamente.'
        );
      } else {
        this.showErrorMessage('Falha ao gerar relatório PDF.');
      }
    } finally {
      this.showLoadingState(false);
    }
  },

  resetForm() {
    document.getElementById('marketStudyForm').reset();

    // Clear samples list safely
    const samplesList = document.getElementById('samplesList');
    while (samplesList.firstChild) {
      samplesList.removeChild(samplesList.firstChild);
    }

    this.sampleCounter = 0;
    this.samples = [];
    this.currentStudyId = null;

    // Reset results display
    document.getElementById('valuationTitle').textContent = 'Waiting for Analysis';
    document.getElementById('valuationDescription').textContent =
      'Fill out the form with property details and comparable samples to generate a professional market study.';
    document.getElementById('valuationDetails').classList.add('hidden');
    document.getElementById('btnGeneratePDF').classList.add('hidden');
    document.getElementById('statisticsCard').style.display = 'none';
  },

  showLoadingState(loading) {
    const submitBtn = document.querySelector('.btn-primary-form');
    if (!submitBtn) return;

    if (loading) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Calculating...';
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Calculate Valuation';
    }
  },

  showSuccessMessage(message) {
    showToast(message, 'success');
  },

  showErrorMessage(message) {
    showToast(message, 'error');
  },
};

// Make MarketStudyModule globally accessible
window.MarketStudyModule = MarketStudyModule;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('marketStudyForm')) {
    MarketStudyModule.init();
  }
});

// ===== GLOBAL ERROR HANDLERS =====
window.addEventListener('error', (event) => {
  logger.error('Uncaught error in market-study.js', {
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
  logger.error('Unhandled promise rejection in market-study.js', {
    reason: event.reason,
    promise: event.promise,
  });
  // Prevent default browser error handling
  event.preventDefault();
});
