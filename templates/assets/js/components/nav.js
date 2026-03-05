// Scroll event for changing nav bar style
const navContainer = document.querySelector('.nav');

window.addEventListener('scroll', () => {       
    if (window.scrollY > 50) {                  // If scrolled more than 50px
        navContainer.classList.add("nav--scrolled");
    } else {
        navContainer.classList.remove("nav--scrolled");
    }
});