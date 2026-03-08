$(document).ready(function() {
    $('.slider').slick({
        infinite: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        variableWidth: true,
        centerMode: true, 
        easing: 'ease',
        autoplay: false,
        autoplaySpeed: 6000,
        pauseOnHover: true,
        pauseOnDotsHover: true,
        touchThreshold: 10,
        arrows: true,
        dots: true
    });
});


// Export function
export function loadSliderBtn() {
    const sliderBtn = document.querySelectorAll(".slider__button");

    sliderBtn.forEach(btn => {
        btn.innerHTML = `
            <a href="#" class="slider__button--link">Learn more</a>
            <img class="slider__button--image" src="assets/images/blocks/slider/arrows/learn-more-button-arrow-32px.webp" alt="">
        `;
    });
}
