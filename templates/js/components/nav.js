// Scroll event for changing nav bar style
const navContainer = document.querySelector('.nav');

window.addEventListener('scroll', () => {       
    if (window.scrollY > 50) {                  // If scrolled more than 50px
        navContainer.classList.add("nav--scrolled");
    } else {
        navContainer.classList.remove("nav--scrolled");
    }
});


// Export function
export function loadNav() {
    document.getElementById("nav").innerHTML = `
        <div class="nav__logo">GrowCore</div>
        <div class="nav__content">
            <div class="nav__menu">
                <a href="#home" class="nav__link nav__link--active">Home</a>
                <a href="#about" class="nav__link">About Us</a>
                <a href="pages/shop.html" class="nav__link">Products</a>
                <a href="pages/forum.html" class="nav__link">Forum</a>
            </div>
            <a href="#" class="nav__link user__avatar"><img class="user__avatar" src="assets/images/blocks/nav/user-icons-64px.webp"></a>
        </div>
    `;


    // Nav link active Event
    const links = document.querySelectorAll('.nav__link');

    links.forEach(link => {
        link.addEventListener('click', () => {
            // Delete class for all elements
            links.forEach(element => element.classList.remove('nav__link--active'));

            link.classList.add('nav__link--active');
        });
    });
}