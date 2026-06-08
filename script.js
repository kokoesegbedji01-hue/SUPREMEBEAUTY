const body = document.body;
const cursorGlow = document.querySelector('.cursor-glow');
const themeToggle = document.querySelector('.theme-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const navLinks = document.querySelector('.nav-links');
const revealItems = document.querySelectorAll('.reveal');
const form = document.querySelector('.waitlist-form');

/* Persistent light/dark mode across every page */
const savedTheme = localStorage.getItem('supremeBeautyTheme');
if (savedTheme === 'dark') {
  body.classList.add('dark');
}
if (themeToggle) {
  themeToggle.textContent = body.classList.contains('dark') ? 'Light' : 'Dark';
}

themeToggle?.addEventListener('click', () => {
  body.classList.toggle('dark');
  const newTheme = body.classList.contains('dark') ? 'dark' : 'light';
  localStorage.setItem('supremeBeautyTheme', newTheme);
  themeToggle.textContent = newTheme === 'dark' ? 'Light' : 'Dark';
});

/* Cursor glow */
document.addEventListener('mousemove', (event) => {
  if (cursorGlow) {
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
  }
});

/* Mobile nav */
mobileMenu?.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

/* Reveal on scroll */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.16 });

revealItems.forEach((item) => observer.observe(item));

/* Magnetic buttons */
document.querySelectorAll('.btn').forEach((button) => {
  button.addEventListener('mousemove', (event) => {
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    button.style.transform = `translate(${x * 0.10}px, ${y * 0.14}px) translateY(-3px)`;
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translate(0, 0)';
  });
});

/* Product image tilt */
document.querySelectorAll('.hero-image, .category-card, .brand-strip-image, .page-hero-img').forEach((card) => {
  card.addEventListener('mousemove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 5;
    const rotateX = ((y / rect.height) - 0.5) * -5;
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(900px) rotateX(0) rotateY(0)';
  });
});

/* Real waitlist submission notice.
   The form submits to FormSubmit and emails Jessica.
   Do NOT preventDefault here, because that would stop the email submission. */
form?.addEventListener('submit', () => {
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = 'Submitting...';
    submitButton.disabled = true;
  }
});
