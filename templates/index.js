
// Variables
const aboutUsSection = document.querySelector('.about__us__container');
const servicesSection = document.querySelector('.services__container');

// Scroll event for changing nav bar style
const navContainer = document.querySelector('.nav__container');

window.addEventListener('scroll', () => {       
    if (window.scrollY > 50) {                  // If scrolled more than 50px
        navContainer.classList.add('scrolled');
    } else {
        navContainer.classList.remove('scrolled');            
    }
});


document.addEventListener('DOMContentLoaded', () => {
    // Set CSS variable --index
    setIndexVariables('.about__us__text', '--about_us-index');         // Set index for about__us__text
    setIndexVariables('.services__text', '--services-index');          // Set index for services__text

    // Scroll-triggered animation
    scrollTriggeredAnimation(aboutUsSection, 'animate-active', 0.20);   // Scroll-triggered animation for About Us section
    scrollTriggeredAnimation(servicesSection, 'animate-active', 0.40);  // Scroll-triggered animation for Services section
});



//--- Functions ---//

// Set CSS variables for indexing
function setIndexVariables(className, variableName) {
    document.querySelectorAll(className).forEach((el, index) => {
        el.style.setProperty(variableName, index + 1);   // set style property --index
    });
}

// Scroll-triggered animation
function scrollTriggeredAnimation(sectionClass, activeClass, thresholdValue) {
    if (sectionClass) 
    {
        const observerOption = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(activeClass);
                    observerOption.unobserve(entry.target);
                }
            });
        }, {
            threshold: thresholdValue
        });

        observerOption.observe(sectionClass);
    }
}