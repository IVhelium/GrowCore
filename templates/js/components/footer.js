// Export function
export function loadFooter() {
    document.getElementById("footer").innerHTML = `
        <div class="footer__content" id="contact">
            <form action="" method="post" class="footer__form">
                <h2 class="footer__title">Contact Us</h2>
                <div class="footer__inputs">
                    <input type="text" name="Name" class="footer__input" id="Name" placeholder="Your Name">
                    <input type="email" name="Email" class="footer__input" id="Email" placeholder="Your Email">
                </div>
                <textarea name="Message" class="footer__textarea" id="Message" cols="30" rows="10" placeholder="Your Message"></textarea>
                <button type="submit" name="Send" class="footer__input footer__submit" id="Send">Send Message</button>
            </form>

            <div class="footer__section">
                <div class="footer__columns">
                    <div class="footer__column foter__column--nav">
                        <h4 class="footer__heading">Navigation</h4>
                        <a href="#home">Home</a>
                        <a href="#about">About Us</a>
                        <a href="HTML/shop.html">Shop</a>
                        <a href="HTML/forum.html">Forum</a>
                    </div>

                    <div class="footer__column footer__column--social">
                        <h4 class="footer__heading">Follow Me</h4>
                        <div class="footer__social">
                            <a href="#" target="_blank" rel="noopener noreferrer"><img src="assets/images/icons/contact/GitHub-Icon-32px.png" alt="GitHub"></a>
                            <a href="#" target="_blank" rel="noopener noreferrer"><img src="assets/images/icons/contact/LinkedIn-Icon-32px.png" alt="LinkedIn"></a>
                            <a href="#" target="_blank" rel="noopener noreferrer"><img src="assets/images/icons/contact/YouTube-Icon-32px.png" alt="YouTube"></a>
                            <a href="#" target="_blank" rel="noopener noreferrer"><img src="assets/images/icons/contact/TikTok-Icon-32px.png"  alt="TikTok"></a>
                            <a href="#" target="_blank" rel="noopener noreferrer"><img src="assets/images/icons/contact/Instagram-Icon-32px.png" alt="Instagram"></a>
                            <a href="#" target="_blank" rel="noopener noreferrer"><img src="assets/images/icons/contact/Facebook-Icon-32px.png" alt="Facebook"></a>
                            <a href="#" target="_blank" rel="noopener noreferrer"><img src="assets/images/icons/contact/Telegram-Icon-32px.png" alt="Telegram"></a>
                            <a href="#" target="_blank" rel="noopener noreferrer"><img src="assets/images/icons/contact/Whatsapp-Icon-32px.png" alt="WhatsApp"></a>
                        </div>
                    </div>

                    <div class="footer__column footer__column--contact">
                        <h4 class="footer__heading">Get In Touch</h4>
                        <p>Email: <a href="mailto:chortick069&#64;gmail&#46;com">chortik069@gmail.com</a></p>
                        <p>Phone: <a href="tel:+1234567890">+1 (234) 567-890</a></p>
                    </div>
                </div>

                <div class="footer__copy">
                    <p>&copy;2025 GrowCore - Always growing</p>
                </div>
            </div>
        </div>
        <div class="footer__privacy">
            
        </div>
    `;
}
