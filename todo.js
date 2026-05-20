// todo.js
document.addEventListener('DOMContentLoaded', () => {
    // State management
    let tasks = JSON.parse(localStorage.getItem('todo_tasks')) || [];
    let currentFilter = 'all'; // 'all', 'active', 'completed'
    let draggedTaskIndex = null;

    // DOM Elements
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoDate = document.getElementById('todo-date');
    const todoPriority = document.getElementById('todo-priority');
    const todoList = document.getElementById('todo-list');
    const emptyState = document.getElementById('empty-state');
    const taskCounter = document.getElementById('task-counter');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Initialize application
    init();

    function init() {
        renderTasks();
        
        // Event Listeners
        todoForm.addEventListener('submit', handleAddTask);
        todoList.addEventListener('click', handleTaskActions);
        clearCompletedBtn.addEventListener('click', clearCompletedTasks);
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                setFilter(e.target.dataset.filter);
            });
        });

        // Drag and drop events using event delegation
        todoList.addEventListener('dragstart', handleDragStart);
        todoList.addEventListener('dragover', handleDragOver);
        todoList.addEventListener('drop', handleDrop);
        todoList.addEventListener('dragenter', handleDragEnter);
        todoList.addEventListener('dragleave', handleDragLeave);
    }

    // --- State Mutations ---

    function saveTasks() {
        localStorage.setItem('todo_tasks', JSON.stringify(tasks));
        updateCounter();
        checkEmptyState();
    }

    function addTask(text, date, priority) {
        const newTask = {
            id: Date.now().toString(),
            text: text.trim(),
            completed: false,
            date: date,
            priority: priority,
            createdAt: new Date().toISOString()
        };
        tasks.unshift(newTask); // Add to beginning
        saveTasks();
        renderTasks();
    }

    function toggleTaskComplete(id) {
        tasks = tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
    }

    function deleteTask(id) {
        // Add fade out animation class before removing from state
        const taskEl = document.querySelector(`[data-id="${id}"]`);
        if (taskEl) {
            taskEl.classList.add('removing');
            setTimeout(() => {
                tasks = tasks.filter(task => task.id !== id);
                saveTasks();
                renderTasks();
            }, 300); // Matches CSS transition duration
        } else {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
        }
    }

    function updateTaskText(id, newText) {
        if (!newText.trim()) return;
        tasks = tasks.map(task => 
            task.id === id ? { ...task, text: newText.trim() } : task
        );
        saveTasks();
        renderTasks();
    }

    function clearCompletedTasks() {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
    }

    function setFilter(filter) {
        currentFilter = filter;
        filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        renderTasks();
    }

    // --- DOM Updates ---

    function renderTasks() {
        todoList.innerHTML = '';
        
        let filteredTasks = tasks;
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }

        filteredTasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = `todo-item ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task.id;
            li.dataset.index = index;
            li.draggable = true;

            // Determine priority class
            const priorityClass = `priority-${task.priority}`;
            const priorityIcon = task.priority === 'high' ? 'fa-angles-up' : 
                                 task.priority === 'low' ? 'fa-angles-down' : 'fa-minus';

            li.innerHTML = `
                <div class="todo-drag-handle" aria-label="Drag to reorder" title="Drag to reorder">
                    <i class="fa-solid fa-grip-vertical"></i>
                </div>
                <div class="todo-checkbox">
                    <input type="checkbox" id="check-${task.id}" ${task.completed ? 'checked' : ''}>
                    <label for="check-${task.id}" aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}"></label>
                </div>
                <div class="todo-content">
                    <span class="todo-text" title="Click to edit">${escapeHTML(task.text)}</span>
                    <input type="text" class="todo-edit-input hidden" value="${escapeHTML(task.text)}">
                    <div class="todo-meta">
                        <span class="todo-priority-badge ${priorityClass}">
                            <i class="fa-solid ${priorityIcon}"></i> ${capitalize(task.priority)}
                        </span>
                        ${task.date ? `<span class="todo-date-badge"><i class="fa-regular fa-calendar"></i> ${formatDate(task.date)}</span>` : ''}
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="action-btn edit-btn" aria-label="Edit task" title="Edit">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn delete-btn" aria-label="Delete task" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            
            todoList.appendChild(li);
        });

        checkEmptyState();
        updateCounter();
    }

    function checkEmptyState() {
        const visibleTasks = todoList.children.length;
        if (visibleTasks === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }
    }

    function updateCounter() {
        const activeCount = tasks.filter(task => !task.completed).length;
        taskCounter.textContent = `${activeCount} task${activeCount !== 1 ? 's' : ''} remaining`;
        
        // Show/hide clear completed button
        const completedCount = tasks.length - activeCount;
        clearCompletedBtn.style.display = completedCount > 0 ? 'inline-block' : 'none';
    }

    // --- Event Handlers ---

    function handleAddTask(e) {
        e.preventDefault();
        const text = todoInput.value;
        const date = todoDate.value;
        const priority = todoPriority.value;
        
        if (text.trim()) {
            addTask(text, date, priority);
            todoInput.value = '';
            todoDate.value = '';
            todoPriority.value = 'medium';
            todoInput.focus();
        }
    }

    function handleTaskActions(e) {
        const target = e.target;
        const todoItem = target.closest('.todo-item');
        if (!todoItem) return;
        
        const id = todoItem.dataset.id;

        // Checkbox click
        if (target.matches('input[type="checkbox"]') || target.matches('label')) {
            // Prevent double firing if clicking label
            if (target.matches('input[type="checkbox"]')) {
                toggleTaskComplete(id);
            }
            return;
        }

        // Delete click
        if (target.closest('.delete-btn')) {
            deleteTask(id);
            return;
        }

        // Edit click
        if (target.closest('.edit-btn') || target.matches('.todo-text')) {
            enableEditMode(todoItem, id);
            return;
        }
    }

    function enableEditMode(todoItem, id) {
        const textEl = todoItem.querySelector('.todo-text');
        const inputEl = todoItem.querySelector('.todo-edit-input');
        
        textEl.classList.add('hidden');
        inputEl.classList.remove('hidden');
        inputEl.focus();
        inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length); // cursor to end

        // Handle save on Enter or blur
        const saveEdit = () => {
            const newText = inputEl.value;
            if (newText !== textEl.textContent) {
                updateTaskText(id, newText);
            } else {
                // Just cancel edit
                textEl.classList.remove('hidden');
                inputEl.classList.add('hidden');
            }
        };

        inputEl.addEventListener('blur', saveEdit, { once: true });
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                inputEl.blur();
            } else if (e.key === 'Escape') {
                inputEl.value = textEl.textContent; // reset
                inputEl.blur();
            }
        });
    }

    // --- Drag and Drop Handlers ---
    
    function handleDragStart(e) {
        const item = e.target.closest('.todo-item');
        if (!item) return;
        
        // Only allow drag from the handle
        if (!e.target.closest('.todo-drag-handle')) {
            e.preventDefault();
            return;
        }

        draggedTaskIndex = parseInt(item.dataset.index);
        e.dataTransfer.effectAllowed = 'move';
        // Need to set data for Firefox
        e.dataTransfer.setData('text/plain', item.dataset.id);
        
        setTimeout(() => {
            item.classList.add('dragging');
        }, 0);
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDragEnter(e) {
        e.preventDefault();
        const item = e.target.closest('.todo-item');
        if (item && !item.classList.contains('dragging')) {
            item.classList.add('drag-over');
        }
    }

    function handleDragLeave(e) {
        const item = e.target.closest('.todo-item');
        if (item) {
            item.classList.remove('drag-over');
        }
    }

    function handleDrop(e) {
        e.stopPropagation();
        const item = e.target.closest('.todo-item');
        
        document.querySelectorAll('.todo-item').forEach(el => {
            el.classList.remove('dragging');
            el.classList.remove('drag-over');
        });

        if (item && draggedTaskIndex !== null) {
            const dropIndex = parseInt(item.dataset.index);
            if (draggedTaskIndex !== dropIndex) {
                // Reorder tasks array
                // Note: filtering makes this complex if not viewing 'all'. 
                // We should only allow reordering when viewing 'all', or handle global index map.
                if (currentFilter === 'all') {
                    const draggedTask = tasks[draggedTaskIndex];
                    tasks.splice(draggedTaskIndex, 1);
                    tasks.splice(dropIndex, 0, draggedTask);
                    saveTasks();
                    renderTasks();
                }
            }
        }
        draggedTaskIndex = null;
    }

    // --- Helpers ---

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function formatDate(dateString) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
});
