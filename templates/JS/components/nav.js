// Scroll event for changing nav bar style
const navContainer = document.querySelector('.nav__container');

window.addEventListener('scroll', () => {       
    if (window.scrollY > 50) {                  // If scrolled more than 50px
        navContainer.classList.add('scrolled');
    } else {
        navContainer.classList.remove('scrolled');
    }
});