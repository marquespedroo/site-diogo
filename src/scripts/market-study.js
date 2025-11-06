/**
 * Market Study Module - ImobiTools
 * Handles property valuation using comparative market analysis
 *
 * NOTE: This file requires shared-utils.js to be loaded first
 */

// Use shared utilities from ImobiUtils
const { formatCurrency, showToast, logger, COLORS } = window.ImobiUtils;

// Import Market Study API client
import { marketStudyAPI, APIError } from './market-study-api';

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

      // Get or create user ID
      const userId = sessionStorage.getItem('userId') || 'guest-' + Date.now();
      if (!sessionStorage.getItem('userId')) {
        sessionStorage.setItem('userId', userId);
      }

      // Call Market Study API
      const result = await marketStudyAPI.create({
        userId: userId,
        propertyAddress: {
          street: formData.subjectProperty.address.street,
          number: formData.subjectProperty.address.number,
          neighborhood: formData.subjectProperty.address.neighborhood,
          city: formData.subjectProperty.address.city,
          state: formData.subjectProperty.address.state,
        },
        propertyArea: formData.subjectProperty.area,
        propertyCharacteristics: {
          bedrooms: formData.subjectProperty.characteristics.bedrooms,
          bathrooms: formData.subjectProperty.characteristics.bathrooms,
          parkingSpots: formData.subjectProperty.characteristics.parkingSpots,
        },
        samples: formData.samples.map(s => ({
          address: s.address,
          area: s.area,
          price: s.price,
          characteristics: {
            bedrooms: s.bedrooms,
            bathrooms: s.bathrooms,
            parkingSpots: s.parkingSpots,
          }
        }))
      });

      // Store study ID for PDF generation
      this.currentStudyId = result.id;

      // Display results
      this.displayResults(result.valuation, result.statisticalAnalysis, formData.samples.length);

      // Show success message
      this.showSuccessMessage('Estudo de mercado concluído com sucesso!');

      // Show PDF button
      document.getElementById('btnGeneratePDF').classList.remove('hidden');

    } catch (error) {
      if (error instanceof APIError) {
        showToast(`Erro: ${error.message}`, 'error');
        logger.error('API Error:', error);
      } else {
        showToast('Erro de rede. Tente novamente.', 'error');
        logger.error('Network error:', error);
      }
    } finally {
      this.showLoadingState(false);
    }
  },

  /**
   * Display results from Market Study API response
   * Transforms API response format into UI-compatible format
   */
  displayResults(valuation, statisticalAnalysis, sampleCount) {
    // Transform API response to match existing display format
    const transformedResult = {
      id: this.currentStudyId,
      samples: { length: sampleCount },
      valuations: {
        minValue: {
          name: 'Minimum Value',
          pricePerSqm: valuation.averagePricePerSqm * 0.9,
          totalValue: valuation.minValue,
        },
        averageValue: {
          name: 'Average Value',
          pricePerSqm: valuation.averagePricePerSqm,
          totalValue: valuation.averageValue,
        },
        recommendedValue: {
          name: 'Recommended Value',
          pricePerSqm: valuation.averagePricePerSqm,
          totalValue: valuation.recommendedValue,
        },
        maxValue: {
          name: 'Maximum Value',
          pricePerSqm: valuation.averagePricePerSqm * 1.1,
          totalValue: valuation.maxValue,
        },
      },
    };

    const transformedStats = {
      mean: valuation.averagePricePerSqm,
      median: valuation.averagePricePerSqm, // API doesn't provide median, use average as approximation
      min: valuation.minValue / (valuation.averageValue / valuation.averagePricePerSqm), // Calculate min price per sqm
      max: valuation.maxValue / (valuation.averageValue / valuation.averagePricePerSqm), // Calculate max price per sqm
      stdDev: statisticalAnalysis.standardDeviation,
      cv: statisticalAnalysis.coefficientOfVariation,
      sampleSize: statisticalAnalysis.sampleCount,
      precision: statisticalAnalysis.coefficientOfVariation < 30 ? 'High' : 'Medium',
    };

    // Call existing display methods
    this.displayValuationResults(transformedResult);
    this.displayStatistics(transformedStats);
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
    if (!this.currentStudyId) {
      showToast('Nenhum estudo de mercado para exportar', 'warning');
      return;
    }

    try {
      // Call Market Study API to generate PDF
      await marketStudyAPI.generatePDF(this.currentStudyId);
      showToast('PDF gerado! Verifique a nova aba.', 'success');
    } catch (error) {
      showToast('Erro ao gerar PDF', 'error');
      logger.error('PDF generation error:', error);
    }
  },

  /**
   * Load saved market studies for the current user
   * This is optional - can be used if UI has a "Load Previous" feature
   */
  async loadSavedStudies() {
    try {
      const userId = sessionStorage.getItem('userId');
      if (!userId) {
        logger.info('No userId found, skipping load of saved studies');
        return;
      }

      const response = await marketStudyAPI.list(userId, 10, 0);

      // Log the loaded studies for debugging
      logger.info('Loaded market studies:', response.studies.length);

      // Return studies for potential UI display
      return response.studies;

    } catch (error) {
      if (error instanceof APIError) {
        logger.error('Failed to load market studies:', error.message);
      } else {
        logger.error('Network error loading market studies:', error);
      }
      return [];
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
