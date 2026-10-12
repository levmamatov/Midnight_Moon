const slides = document.querySelectorAll('.slider__slide');
const prevBtn = document.getElementById('prevSlide');
const nextBtn = document.getElementById('nextSlide');

if (slides.length > 0) {
    let currentSlide = 0;

    // Функция переключения на конкретный слайд
    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));

        if (index >= slides.length) {
            currentSlide = 0;
        } else if (index < 0) {
            currentSlide = slides.length - 1;
        } else {
            currentSlide = index;
        }

        slides[currentSlide].classList.add('active');
    }

    // Стрелка вправо
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            showSlide(currentSlide + 1);
        });
    }

    // Стрелка влево
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            showSlide(currentSlide - 1);
        });
    }

    // Автослайд
    let autoSlideInterval = setInterval(() => {
        showSlide(currentSlide + 1);
    }, 5000);
    const sliderContainer = document.getElementById('aboutSlider');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
        sliderContainer.addEventListener('mouseleave', () => {
            autoSlideInterval = setInterval(() => showSlide(currentSlide + 1), 5000);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {

    const API_URL = 'https://midnight-moon.onrender.com/api/v1/booking';

    const nameInput = document.getElementById('name');
    if (nameInput){
        nameInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, '');
        });
    }

    // Маска телефона
    const phoneInput = document.getElementById('phone');
    
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let input = e.target.value.replace(/\D/g, '');
            
            if (input.startsWith('7') || input.startsWith('8')) {
                input = input.substring(1);
            }

            let formatted = '+7 ';
            if (input.length > 0) formatted += '(' + input.substring(0, 3);
            if (input.length >= 4) formatted += ') ' + input.substring(3, 6);
            if (input.length >= 7) formatted += '-' + input.substring(6, 8);
            if (input.length >= 9) formatted += '-' + input.substring(8, 10);

            e.target.value = formatted;
        });
    }

    // Валидация
    const checkInInput = document.getElementById('check_in');
    const checkOutInput = document.getElementById('check_out');

    if (checkInInput && checkOutInput) {
        checkInInput.addEventListener('change', () => {
            checkOutInput.min = checkInInput.value;
            if (checkOutInput.value && checkOutInput.value <= checkInInput.value) {
                checkOutInput.value = '';
            }
        });
    }

    // Подстановка домика
    const selectHouseButtons = document.querySelectorAll('.select-house-btn');
    const houseSelectInput = document.getElementById('house_type');

    selectHouseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedHouse = button.getAttribute('data-house');
            if (selectedHouse && houseSelectInput) {
                houseSelectInput.value = selectedHouse;
            }
        });
    });

    // Слайдер
    const slides = document.querySelectorAll('.slider__slide');
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');

    if (slides.length > 0) {
        let currentSlide = 0;

        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove('active'));
            if (index >= slides.length) currentSlide = 0;
            else if (index < 0) currentSlide = slides.length - 1;
            else currentSlide = index;
            slides[currentSlide].classList.add('active');
        }

        if (nextBtn) nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));
        if (prevBtn) prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));

        let autoSlide = setInterval(() => showSlide(currentSlide + 1), 5000);
        const sliderBox = document.getElementById('aboutSlider');
        if (sliderBox) {
            sliderBox.addEventListener('mouseenter', () => clearInterval(autoSlide));
            sliderBox.addEventListener('mouseleave', () => {
                autoSlide = setInterval(() => showSlide(currentSlide + 1), 5000);
            });
        }
    }

    // Отправка на бэк
    const bookingForm = document.getElementById('bookingForm');
    const submitBtn = document.getElementById('submitBtn');
    const formStatus = document.getElementById('formStatus');

    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(bookingForm);
            const name = formData.get('name') || '';
            const phone = formData.get('phone') || '';
            const checkIn = formData.get('check_in') || '';
            const checkOut = formData.get('check_out') || '';
            const comment = formData.get('comment') || '';

            formStatus.className = 'form-status';
            formStatus.style.display = 'none';

            if (name.length > 20){
                formStatus.textContent = '❌ Некорректное имя. Максимальная длина 20';
                formStatus.className = 'form-status error';
                formStatus.style.display = 'block';
                return;
            }

            // Валидация телефона
            const phoneDigits = phone.replace(/\D/g, '');
            if (phoneDigits.length !== 11) {
                formStatus.textContent = '❌ Некорректный номер телефона. Укажите номер в формате +7 (XXX) XXX-XX-XX';
                formStatus.className = 'form-status error';
                formStatus.style.display = 'block';
                return;
            }

            // Валидация дат
            if (checkOut <= checkIn) {
                formStatus.textContent = '❌ Дата выезда должна быть позже даты заезда!';
                formStatus.className = 'form-status error';
                formStatus.style.display = 'block';
                return;
            }

            const checkInYear = parseInt(checkIn.split('-')[0], 10);
            const checkOutYear = parseInt(checkOut.split('-')[0], 10);
            if (checkInYear > 2027 || checkOutYear > 2027) {
                formStatus.textContent = '❌ Заявки на год позже 2027 временно не принимаются онлайн. Пожалуйста, позвоните нам или напишите на почту!';
                formStatus.className = 'form-status error';
                formStatus.style.display = 'block';
                return;
            }

            if (comment.length > 300) {
                formStatus.textContent = '❌ Комментарий слишком длинный (максимум 300 символов).';
                formStatus.className = 'form-status error';
                formStatus.style.display = 'block';
                return;
            }

            const payload = {
                name: formData.get('name'),
                phone: phone,
                house_type: formData.get('house_type'),
                check_in: checkIn,
                check_out: checkOut,
                guests: 2,
                comment: comment || null
            };

            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Отправка... <i class="fa-solid fa-spinner fa-spin"></i></span>';
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok) {
                    const orderNum = Math.floor(1000 + Math.random() * 9000);
                    formStatus.innerHTML = `
                        <div style="text-align: center; padding: 10px;">
                            <i class="fa-solid fa-circle-check" style="font-size: 2rem; color: #81C784; margin-bottom: 8px;"></i>
                            <h4 style="margin-bottom: 5px; color: #EAE7DF;">Заявка №${orderNum} принята в работу!</h4>
                            <p style="font-size: 0.9rem; color: #94A89C;">Мы свяжемся с вами по номеру <strong>${payload.phone}</strong> для подтверждения бронирования.</p>
                        </div>
                    `;
                    formStatus.className = 'form-status success';
                    formStatus.style.display = 'block';
                    bookingForm.reset();
                } else {
                    throw new Error(result.detail || 'Не удалось отправить заявку.');
                }
            } catch (error) {
                console.error('Booking Error:', error);
                formStatus.textContent = `❌ Ошибка: ${error.message || 'Проверьте соединение с сервером.'}`;
                formStatus.className = 'form-status error';
                formStatus.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
});