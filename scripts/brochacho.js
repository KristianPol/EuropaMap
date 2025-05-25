const form = document.getElementById('taskForm');
const descriptionInput = document.getElementById('description');
const urgencySelect = document.getElementById('urgency');
const importanceSelect = document.getElementById('importance');
const deadlineInput = document.getElementById('deadline');
const user = "admin";

const API_URL = "http://localhost:3000/tasks"; // json-server endpoint

const countrySelect = document.getElementById('countrySelect');
const bucketList = document.getElementById('bucketList');
const countryTitle = document.getElementById('countryTitle');
const addItemForm = document.getElementById('addItemForm');
const newItem = document.getElementById('newItem');

function renderList(country) {
  bucketList.innerHTML = '';
  countryTitle.textContent = countrySelect.options[countrySelect.selectedIndex].text;
  bucketData[country].forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex align-items-center';
    li.innerHTML = `
      <input type="checkbox" class="form-check-input me-2" ${item.done ? 'checked' : ''} onchange="toggleDone('${country}',${idx})">
      <span class="${item.done ? 'text-decoration-line-through text-muted' : ''}">${item.text}</span>
      <button class="btn btn-sm btn-danger ms-auto" onclick="removeItem('${country}',${idx})"><i class="bi bi-trash"></i></button>
    `;
    bucketList.appendChild(li);
  });
}

window.toggleDone = function(country, idx) {
  const itemId = bucketData[country][idx].id;
  bucketData[country][idx].done = !bucketData[country][idx].done;
  fetch(`${API_URL}/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done: bucketData[country][idx].done })
  })
  .then(() => renderList(country));
};

window.removeItem = function(country, idx) {
  const itemId = bucketData[country][idx].id;
  bucketData[country].splice(idx, 1);
  fetch(`${API_URL}/${itemId}`, { method: 'DELETE' })
    .then(() => renderList(country));
};

addItemForm.addEventListener('submit', e => {
  e.preventDefault();
  const country = countrySelect.value;
  const item = { text: newItem.value, done: false, country: country };
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  })
  .then(response => response.json())
  .then(savedItem => {
    if (!bucketData[country]) bucketData[country] = [];
    bucketData[country].push(savedItem);
    newItem.value = '';
    renderList(country);
  });
});

// Initial render
renderList(countrySelect.value);

// Dark mode toggle
function darkModeToggle() {
  document.body.classList.toggle('dark-mode');
  const icon = document.querySelector('.dark-mode-toggle i');
  icon.classList.toggle('bi-moon-fill');
  icon.classList.toggle('bi-sun-fill');
}
