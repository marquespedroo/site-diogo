# Implementation Specification for Cash Flow Calculator & Financing Simulator

**Created**: 2025-11-06
**Purpose**: Provide exact specifications for implementing two independent features

---

## 🎯 CRITICAL RULES

1. **DO NOT CHANGE LOGIC** - Copy all JavaScript logic exactly as-is from source files
2. **DO NOT INVENT COMPONENTS** - Use only existing structures documented here
3. **DO NOT GUESS** - Read the actual files to verify all references
4. **MAINTAIN CALCULATIONS** - All formulas must remain identical
5. **PRESERVE INPUT METHODS** - Keep all input fields, validations, and UX patterns

---

## 📐 Page Template Structure

### Required HTML Structure (from index.html and market-study.html)

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[PAGE TITLE] - ImobiTools</title>

    <!-- SEO Meta Tags -->
    <meta name="description" content="[DESCRIPTION]">
    <link rel="canonical" href="https://imobitools.vercel.app/[PAGE].html">

    <!-- Open Graph Tags -->
    <meta property="og:title" content="[PAGE TITLE] - ImobiTools">
    <meta property="og:description" content="[DESCRIPTION]">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://imobitools.vercel.app/[PAGE].html">
    <meta property="og:image" content="https://imobitools.vercel.app/assets/og-image.png">

    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Roboto:wght@700&display=swap" rel="stylesheet">

    <!-- Styles -->
    <link rel="stylesheet" href="/src/styles/dashboard.css">
</head>
<body>
    <!-- Skip to content link for accessibility -->
    <a href="#main-content" class="skip-link" style="position: absolute; left: -9999px; z-index: 9999; padding: 1rem; background: #667eea; color: white; text-decoration: none; border-radius: 4px;">Pular para o conteúdo principal</a>

    <!-- SIDEBAR (see below) -->

    <!-- MAIN CONTENT (see below) -->

    <!-- AUTH SCRIPT (see below) -->
</body>
</html>
```

---

## 🔧 Sidebar Navigation Structure

### Exact Sidebar HTML (MANDATORY - DO NOT MODIFY)

```html
<aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
        <div class="logo-container">
            <svg class="logo-icon" width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="Logo ImobiTools">
                <circle cx="16" cy="16" r="15" fill="url(#argon-gradient)"/>
                <rect x="7" y="8" width="4" height="12" rx="1" fill="white" opacity="0.9"/>
                <rect x="13" y="10" width="4" height="10" rx="1" fill="white" opacity="0.8"/>
                <rect x="19" y="6" width="4" height="14" rx="1" fill="white"/>
                <defs>
                    <linearGradient id="argon-gradient" x1="0" y1="0" x2="32" y2="32">
                        <stop offset="0%" stop-color="#667eea"/>
                        <stop offset="100%" stop-color="#764ba2"/>
                    </linearGradient>
                </defs>
            </svg>
            <h1 class="logo-text">ImobiTools</h1>
        </div>
        <button class="sidebar-collapse-btn" id="sidebarCollapseBtn" aria-label="Toggle sidebar">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M13 6L8 10L13 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
    </div>

    <nav class="sidebar-nav">
        <div class="nav-header">FERRAMENTAS</div>

        <div class="nav-section">
            <a href="/index.html" class="nav-btn-secondary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M2 2h5v5H2V2zm0 7h5v5H2V9zm7-7h5v5H9V2zm0 7h5v5H9V9z"/>
                </svg>
                <span>Calculadora de Imóveis</span>
            </a>

            <a href="/cash-flow-calculator.html" class="nav-btn-secondary [ADD-ACTIVE-CLASS-IF-CURRENT]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M2 2h12v2H2V2zm0 4h12v2H2V6zm0 4h12v2H2v-2zm0 4h12v2H2v-2z"/>
                </svg>
                <span>Calculadora de Fluxo</span>
            </a>

            <a href="/financing-simulator.html" class="nav-btn-secondary [ADD-ACTIVE-CLASS-IF-CURRENT]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M1 4h14v8H1V4zm2 2v4h10V6H3z"/>
                </svg>
                <span>Simulador de Financiamento</span>
            </a>

            <a href="/market-study.html" class="nav-btn-secondary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M3 3h10a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z"/>
                </svg>
                <span>Estudo de Mercado</span>
            </a>

            <a href="/projects-table.html" class="nav-btn-secondary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z"/>
                </svg>
                <span>Tabela de Empreendimentos</span>
            </a>
        </div>
    </nav>
</aside>
```

**INSTRUCTION**: Replace `[ADD-ACTIVE-CLASS-IF-CURRENT]` with `active` only for the current page.

---

## 🎨 Design System Tokens (from dashboard.css)

### MANDATORY CSS Variables to Use

```css
/* Colors */
--primary: #172b4d;
--secondary: #8392ab;
--success: #2dce89;
--danger: #f5365c;
--warning: #fb6340;
--info: #11cdef;
--white: #ffffff;
--gray-100: #f6f9fc;
--gray-200: #e9ecef;
--gray-300: #dee2e6;
--gray-400: #ced4da;
--gray-500: #718096;
--gray-600: #8898aa;
--gray-700: #525f7f;
--gray-800: #32325d;
--gray-900: #212529;

/* Gradient colors */
--gradient-primary: #677AE5;
--gradient-success: linear-gradient(135deg, #2dce89 0%, #2dcecc 100%);
--gradient-info: linear-gradient(135deg, #11cdef 0%, #1171ef 100%);
--gradient-warning: linear-gradient(135deg, #fb6340 0%, #fbb140 100%);
--gradient-danger: linear-gradient(135deg, #f5365c 0%, #f56036 100%);

/* Spacing */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;

/* Border radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 20px;

/* Shadows */
--shadow-sm: 0px 3px 10px rgba(0, 0, 0, 0.12);
--shadow-md: 0px 8px 20px rgba(0, 0, 0, 0.12);
--shadow-lg: 0px 12px 40px rgba(0, 0, 0, 0.15);

/* Fonts */
--font-primary: 'Open Sans', sans-serif;
--font-secondary: 'Roboto', sans-serif;
```

---

## 📋 Main Content Structure

```html
<main class="main-content" id="main-content">
    <!-- Top Header -->
    <header class="top-header">
        <div class="header-left">
            <nav class="breadcrumb" aria-label="Navegação estrutural">
                <a href="index.html" class="breadcrumb-link breadcrumb-home" aria-label="Início">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                        <path d="M7 1L1 7h2v5h3V9h2v3h3V7h2L7 1z"/>
                    </svg>
                </a>
                <span class="breadcrumb-separator">/</span>
                <a href="#ferramentas" class="breadcrumb-link">Ferramentas</a>
                <span class="breadcrumb-separator">/</span>
                <span class="breadcrumb-current">[PAGE NAME]</span>
            </nav>
            <h2 class="page-title">[PAGE NAME]</h2>
            <button class="menu-toggle" id="menu-toggle" aria-label="Abrir menu de navegação">
                <svg width="21" height="16" viewBox="0 0 21 16" fill="currentColor" aria-hidden="true">
                    <rect width="21" height="2" rx="1"/>
                    <rect y="7" width="21" height="2" rx="1"/>
                    <rect y="14" width="21" height="2" rx="1"/>
                </svg>
            </button>
        </div>

        <div class="header-right">
            <div class="header-actions-wrapper">
                <div class="search-box">
                    <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path d="M11.7 10.3l3.6 3.6-1.4 1.4-3.6-3.6a6 6 0 111.4-1.4zM6 10a4 4 0 100-8 4 4 0 000 8z"/>
                    </svg>
                    <input type="text" placeholder="Digite aqui..." class="search-input" aria-label="Pesquisar">
                </div>

                <div id="auth-container">
                    <a href="/login.html" id="authButton" class="sign-in-link" role="button">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                            <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm0 2c-3 0-6 1.5-6 3v1h12v-1c0-1.5-3-3-6-3z"/>
                        </svg>
                        <span>Entrar</span>
                    </a>
                </div>

                <div class="icon-buttons-group">
                    <button class="icon-btn" aria-label="Configurações">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                            <path d="M8 10a2 2 0 100-4 2 2 0 000 4z"/>
                            <path d="M13.5 8c0-.3 0-.6-.1-.9l1.3-1-1-1.7-1.5.6c-.4-.3-.8-.6-1.3-.8L10.5 2h-2l-.4 1.6c-.5.2-.9.5-1.3.8l-1.5-.6-1 1.7 1.3 1c-.1.3-.1.6-.1.9s0 .6.1.9l-1.3 1 1 1.7 1.5-.6c.4.3.8.6 1.3.8l.4 1.6h2l.4-1.6c.5-.2.9-.5 1.3-.8l1.5.6 1-1.7-1.3-1c.1-.3.1-.6.1-.9z"/>
                        </svg>
                    </button>

                    <button class="icon-btn" aria-label="Notificações">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                            <path d="M8 2a4 4 0 00-4 4v3l-1 2h10l-1-2V6a4 4 0 00-4-4zm0 12a2 2 0 01-2-2h4a2 2 0 01-2 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- PAGE SPECIFIC CONTENT GOES HERE -->
    <div class="content-grid">
        <!-- Feature implementation -->
    </div>
</main>
```

---

## 🔐 Authentication Script (MANDATORY - DO NOT MODIFY)

```html
<script src="/src/scripts/shared-utils.js"></script>
<script type="module">
    import { auth } from '/src/scripts/auth.js';

    // Initialize auth
    auth.initAuth();

    // Sidebar collapse functionality
    document.getElementById('sidebarCollapseBtn')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('collapsed');
    });

    // Mobile menu toggle
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('mobile-open');
    });
</script>
```

---

## 📦 Source Files for Implementation

### Cash Flow Calculator
**Source**: `/home/user/site-diogo/features-html/calculadorafluxo.html`
**Target**: `/home/user/site-diogo/cash-flow-calculator.html`

### Financing Simulator
**Source**: `/home/user/site-diogo/features-html/Simulador de Financiamento.html`
**Target**: `/home/user/site-diogo/financing-simulator.html`

---

## ✅ Implementation Checklist

### For Each Feature:

1. **Read source HTML file completely**
2. **Extract all JavaScript logic** (copy entire `<script>` sections)
3. **Extract all CSS** (inline styles)
4. **Create new HTML file** with template structure above
5. **Insert sidebar navigation** (exact copy from specification)
6. **Insert main content structure** (header + breadcrumb)
7. **Adapt original feature content** to fit within `.content-grid`
8. **Convert inline styles to use CSS variables** from dashboard.css
9. **Preserve all calculations, validations, and logic**
10. **Add authentication script** at bottom
11. **Test all functionality**

---

## 🚫 PROHIBITED ACTIONS

1. ❌ DO NOT modify any calculation formulas
2. ❌ DO NOT change input field types, names, or IDs
3. ❌ DO NOT remove any validation logic
4. ❌ DO NOT alter the data flow or state management
5. ❌ DO NOT create new components not in this spec
6. ❌ DO NOT invent new CSS classes outside dashboard.css
7. ❌ DO NOT modify the sidebar structure
8. ❌ DO NOT change the authentication integration

---

## 📝 Notes

- **All existing files are in**: `/home/user/site-diogo/`
- **Read files before implementing**: Use Read tool to verify all references
- **CSS is centralized**: Use `/src/styles/dashboard.css` variables
- **Auth is centralized**: Use `/src/scripts/auth.js` module
- **Utilities exist**: Use `/src/scripts/shared-utils.js` if needed

---

**END OF SPECIFICATION**
