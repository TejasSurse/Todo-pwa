let db;

// When the page loads
document.addEventListener('DOMContentLoaded', () => {
  initDB();
  document.getElementById('todo-form').addEventListener('submit', addTodo);
});

// Initialize IndexedDB
function initDB() {
  const request = indexedDB.open('todoDB', 1);

  request.onerror = () => {
    console.error('Database failed to open');
  };

  request.onsuccess = () => {
    db = request.result;
    displayTodos(); // Load existing todos
  };

  request.onupgradeneeded = (e) => {
    db = e.target.result;
    const objectStore = db.createObjectStore('todos', { keyPath: 'id', autoIncrement: true });
    objectStore.createIndex('task', 'task', { unique: false });
    objectStore.createIndex('completed', 'completed', { unique: false });
  };
}

// Add a new to-do item
function addTodo(e) {
  e.preventDefault();
  const input = document.getElementById('todo-input');
  const task = input.value.trim();
  if (!task) return;

  const newItem = { task, completed: false };
  const transaction = db.transaction(['todos'], 'readwrite');
  const store = transaction.objectStore('todos');
  store.add(newItem);

  transaction.oncomplete = () => {
    input.value = '';
    displayTodos();
  };
}

// Display all todos
function displayTodos() {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';

  const transaction = db.transaction(['todos'], 'readonly');
  const store = transaction.objectStore('todos');
  const request = store.openCursor();

  request.onsuccess = () => {
    const cursor = request.result;
    if (cursor) {
      const li = document.createElement('li');
      li.className = cursor.value.completed ? 'completed' : '';
      li.textContent = cursor.value.task;

      const actions = document.createElement('div');
      actions.className = 'actions';

      const toggleBtn = document.createElement('button');
      toggleBtn.textContent = cursor.value.completed ? 'Undo' : 'Done';
      toggleBtn.addEventListener('click', () => toggleComplete(cursor.value.id, !cursor.value.completed));

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => deleteTodo(cursor.value.id));

      actions.appendChild(toggleBtn);
      actions.appendChild(deleteBtn);
      li.appendChild(actions);
      list.appendChild(li);

      cursor.continue();
    }
  };
}

// Toggle completion status of a todo
function toggleComplete(id, completed) {
  const transaction = db.transaction(['todos'], 'readwrite');
  const store = transaction.objectStore('todos');
  const request = store.get(id);

  request.onsuccess = () => {
    const data = request.result;
    data.completed = completed;
    store.put(data);
    transaction.oncomplete = () => displayTodos();
  };
}

// Delete a todo
function deleteTodo(id) {
  const transaction = db.transaction(['todos'], 'readwrite');
  const store = transaction.objectStore('todos');
  store.delete(id);
  transaction.oncomplete = () => displayTodos();
}
