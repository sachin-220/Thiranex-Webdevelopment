// theme.js
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('theme-toggle');
    const root = document.documentElement;
    const currentTheme = localStorage.getItem('theme') || 'dark';

    // Set initial theme
    root.setAttribute('data-theme', currentTheme);
    updateButtonText(currentTheme);

    toggleBtn.addEventListener('click', () => {
        const newTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateButtonText(newTheme);
    });

    function updateButtonText(theme) {
        if (theme === 'light') {
            toggleBtn.innerHTML = '🌙 Dark Mode';
        } else {
            toggleBtn.innerHTML = '☀️ Light Mode';
        }
    }
});
