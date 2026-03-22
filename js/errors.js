function showError(msg) {
  const b = document.getElementById('errorBanner');
  b.textContent = msg;
  b.style.display = 'block';
  setTimeout(() => {
    b.style.display = 'none';
  }, 5000);
}
