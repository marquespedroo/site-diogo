// ImobiTools Dashboard - Main JavaScript
// Progressive Enhancement for interactive features

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('ImobiTools Dashboard initialized');

  // Add any interactive features here
  initializeSearchBar();
  initializeNavigation();
});

// Search functionality
function initializeSearchBar() {
  const searchInput = document.querySelector('input[type="search"]');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      console.log('Search query:', e.target.value);
      // Implement search logic here
    });
  }
}

// Navigation interactions
function initializeNavigation() {
  const navItems = document.querySelectorAll('[data-name="Menu icon"], [data-name="Icon"]');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      // Remove active state from all items
      navItems.forEach(nav => nav.classList.remove('bg-black-200'));
      navItems.forEach(nav => nav.classList.add('bg-white'));

      // Add active state to clicked item
      e.currentTarget.classList.remove('bg-white');
      e.currentTarget.classList.add('bg-black-200');

      console.log('Navigation item clicked');
    });
  });
}
