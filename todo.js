// todo.js
document.addEventListener('DOMContentLoaded', () => {
    // State management
    let tasks = JSON.parse(localStorage.getItem('todo_tasks')) || [];
    let currentFilter = 'all'; // 'all', 'active', 'completed'
    let draggedTaskId = null;

    // DOM Elements
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoDate = document.getElementById('todo-date');
    const todoPriority = document.getElementById('todo-priority');
    const todoCategory = document.getElementById('todo-category');
    const todoList = document.getElementById('todo-list');
    const emptyState = document.getElementById('empty-state');
    const taskCounter = document.getElementById('task-counter');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const todoSearchInput = document.getElementById('todo-search-input');

    // Initialize application
    init();

    function init() {
        updateGreeting();
        renderTasks();
        if (typeof updateDashboardStats === 'function') updateDashboardStats();
        
        // Event Listeners
        todoForm.addEventListener('submit', handleAddTask);
        todoList.addEventListener('click', handleTaskActions);
        clearCompletedBtn.addEventListener('click', clearCompletedTasks);
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                setFilter(e.target.dataset.filter);
            });
        });

        if (todoSearchInput) {
            todoSearchInput.addEventListener('input', () => {
                renderTasks();
            });
        }

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
        if (typeof updateDashboardStats === 'function') updateDashboardStats();
    }

    function addTask(text, date, priority, category) {
        const newTask = {
            id: Date.now().toString(),
            text: text.trim(),
            completed: false,
            date: date,
            priority: priority,
            category: category || 'personal',
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

        if (todoSearchInput && todoSearchInput.value.trim()) {
            const query = todoSearchInput.value.trim().toLowerCase();
            filteredTasks = filteredTasks.filter(task => task.text.toLowerCase().includes(query));
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

            const categoryBadge = task.category ? `<span class="todo-category-badge category-${task.category}"><i class="fa-solid fa-folder"></i> ${capitalize(task.category)}</span>` : '';
            
            // Deadline logic
            let deadlineBadge = '';
            if (task.date && !task.completed) {
                const today = new Date();
                today.setHours(0,0,0,0);
                const dueDate = new Date(task.date);
                dueDate.setHours(0,0,0,0);
                
                const diffTime = dueDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                let deadlineText = '';
                let deadlineClass = '';
                
                if (diffDays < 0) {
                    deadlineText = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays)>1?'s':''}`;
                    deadlineClass = 'deadline-red';
                } else if (diffDays === 0) {
                    deadlineText = 'Due Today';
                    deadlineClass = 'deadline-yellow';
                } else if (diffDays === 1) {
                    deadlineText = 'Due Tomorrow';
                    deadlineClass = 'deadline-yellow';
                } else {
                    deadlineText = `Due in ${diffDays} days`;
                    deadlineClass = 'deadline-green';
                }
                deadlineBadge = `<span class="todo-deadline-badge ${deadlineClass}"><i class="fa-regular fa-clock"></i> ${deadlineText}</span>`;
            } else if (task.date) {
                deadlineBadge = `<span class="todo-date-badge"><i class="fa-regular fa-calendar"></i> ${formatDate(task.date)}</span>`;
            }

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
                        ${categoryBadge}
                        ${deadlineBadge}
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
        const category = todoCategory ? todoCategory.value : 'personal';
        
        if (text.trim()) {
            addTask(text, date, priority, category);
            todoInput.value = '';
            todoDate.value = '';
            todoPriority.value = 'medium';
            if (todoCategory) todoCategory.value = 'personal';
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

        draggedTaskId = item.dataset.id;
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

        if (item && draggedTaskId !== null) {
            const dropTaskId = item.dataset.id;
            if (draggedTaskId !== dropTaskId) {
                // Reorder tasks array
                if (currentFilter === 'all' && !(todoSearchInput && todoSearchInput.value.trim())) {
                    const fromIndex = tasks.findIndex(t => t.id === draggedTaskId);
                    const toIndex = tasks.findIndex(t => t.id === dropTaskId);
                    
                    if (fromIndex !== -1 && toIndex !== -1) {
                        const [draggedTask] = tasks.splice(fromIndex, 1);
                        tasks.splice(toIndex, 0, draggedTask);
                        saveTasks();
                        renderTasks();
                    }
                } else {
                    alert("Drag and drop reordering is only supported when viewing 'All' tasks without active search.");
                }
            }
        }
        draggedTaskId = null;
    }

    // --- Helpers ---

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function formatDate(dateString) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function updateGreeting() {
        const greetingEl = document.getElementById('smart-greeting');
        if (!greetingEl) return;
        const hour = new Date().getHours();
        let greeting = 'Good Evening';
        if (hour < 12) greeting = 'Good Morning';
        else if (hour < 18) greeting = 'Good Afternoon';
        greetingEl.innerHTML = `${greeting}, Sachin 👋`;
    }

    function updateDashboardStats() {
        const totalEl = document.getElementById('stat-total');
        const completedEl = document.getElementById('stat-completed');
        const pendingEl = document.getElementById('stat-pending');
        const productivityEl = document.getElementById('stat-productivity');
        const circle = document.getElementById('progress-ring-circle');

        if (!totalEl) return;

        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const productivity = total === 0 ? 0 : Math.round((completed / total) * 100);

        totalEl.textContent = total;
        completedEl.textContent = completed;
        pendingEl.textContent = pending;
        productivityEl.textContent = `${productivity}%`;

        if (circle) {
            const radius = circle.r.baseVal.value;
            const circumference = radius * 2 * Math.PI;
            const offset = circumference - (productivity / 100) * circumference;
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            circle.style.transition = 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
            circle.style.strokeDashoffset = offset;
        }
    }
});
