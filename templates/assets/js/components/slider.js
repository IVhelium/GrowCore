$(document).ready(function() {
    $('.slider').slick({
        infinite: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        variableWidth: true,
        centerMode: true, 
        easing: 'ease',
        autoplay: true,
        autoplaySpeed: 6000,
        pauseOnHover: true,
        pauseOnDotsHover: true,
        touchThreshold: 10,
        arrows: true,
        dots: true
    });
});