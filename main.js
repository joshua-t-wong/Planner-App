// SECTION: SWITCHING BETWEEN TABS
// setting variables
const habitTracker = document.getElementById('habit-tracker');
const todoList = document.getElementById('to-do-list');
const habitTrackerTab = document.getElementById('habit-tracker-tab');
const todoListTab = document.getElementById('to-do-list-tab');

// functions
const hideElement = (element) => {
    element.style.display = 'none';
}

const showElement = (element) => {
    element.style.display = 'block';
}

// event listener
todoListTab.addEventListener('click', () => {
    showElement(todoList);
    hideElement(habitTracker);
})

habitTrackerTab.addEventListener('click', () => {
    showElement(habitTracker);
    hideElement(todoList);
})

// default setting
showElement(habitTracker);
hideElement(todoList);

// SECTION: TO DO LIST
// setting variables
const taskTableBody = document.getElementById('task-table-body');
const taskForm = document.forms['task-form'];
let tasks = [];

// section: creating task objects and adding to table
// createTaskObj
let nextId = 0;
function createTaskObj(name, dueDate) {
    return {
        id: nextId++,
        name,
        dueDate,
        completed: false
    };
}

// date functions
function parseLocalDate(dateStr) {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-');
    return new Date(Number(year), Number(month) - 1, Number(day));
}

function formatDate(dateStr) {
    if (dateStr === '') return 'No due date';

    dateObj = parseLocalDate(dateStr);

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return dateObj.toLocaleDateString(undefined, options);
}

// function: addTaskToTable (create table row, add checkbox and delete interactivity, overdue tasks, append row)
function addTaskToTable(task) {
    // creating row and adding innerHTML
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${task.name}</td>
        <td id="due-date-cell">${formatDate(task.dueDate)}</td>
        <td><i class="fa-regular fa-square checkbox"></i></td>
        <td>
            <!-- <button class="edit-button">Edit</button> -->
            <button class="delete-button">Delete</button>
        </td>
    `

    // on checkbox click
    const checkbox = row.querySelector('.checkbox');
    checkbox.addEventListener('click', () => {
        task.completed = !task.completed;
        checkbox.className = task.completed ?
            'fa-regular fa-square-check checkbox' : 'fa-regular fa-square checkbox';
        saveTasks();
    });


    // on delete button click
    const deleteButton = row.querySelector('.delete-button');
    deleteButton.addEventListener('click', () => {
        removeTask(task.id);
        renderTaskTable();
    })

    // conditional: if task is completed
    if (task.completed) {
        return;
    }

    // conditional: if task is overdue
    function isOverdue(dateStr) {
        const due = parseLocalDate(dateStr);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return due < now;
    }

    if (isOverdue(task.dueDate) && !task.completed) {
        row.querySelector('#due-date-cell').style.color = 'rgb(100, 25, 25)';
    }

    // appending row
    taskTableBody.appendChild(row);
}

// function: renderTable (iterate through tasks and call addTaskToTable() on each)
function renderTaskTable() {
    taskTableBody.innerHTML = '';
    tasks.forEach((task) => {addTaskToTable(task)});
}

// event listener: on submit
taskForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const newTask = createTaskObj(taskForm['task-name'].value, taskForm['task-due-date'].value);
    tasks.push(newTask);
    addTaskToTable(newTask);
    saveTasks();
    
    taskForm.reset();
})

// section: delete
function removeTask(id) {
    const index =  tasks.findIndex((element) => element.id === id);
    if (index !== -1) {
        tasks.splice(index, 1);
        saveTasks();
    }
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

const savedTasks = localStorage.getItem('tasks');
if (savedTasks) {
  tasks = JSON.parse(savedTasks);
  nextId = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 0;
  renderTaskTable();
}

// SECTION: HABIT TRACKER

// date functions
function getTodayStr() {
    return new Date().toISOString().split('T')[0]; // format: YYYY-MM-DD
}

function getNDaysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
}

function getDayName(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
}

function getDateForWeekday(dayName) {
    const today = new Date();
    const todayIndex = today.getDay();
    const dayIdx = daysOfWeek.indexOf(dayName);
    const offset = (dayIdx - todayIndex + 7) % 7;
    const resultDate = new Date();
    resultDate.setDate(today.getDate() + offset);
    return resultDate.toISOString().split('T')[0];
}

// habit factory function
const checkpoints = [1, 3, 7, 21, 30, 60, 90];
function createHabit(name, history=[]) {
    const habit = {
        name,
        streak: 0,
        history,

        checkIn() {
            const today = getTodayStr();
            if (!this.history.includes(today)) {
                this.history.push(today);
                const previousStreak = this.streak;
                this.updateStreak();
                if (checkpoints.includes(this.streak) && this.streak > previousStreak) {
                    alert(`Congrats! You've reached the ${this.streak}-day checkpoint for "${this.name}!`)
                }
            }
        },

        undoCheckIn() {
            const today = getTodayStr();
            const index = this.history.indexOf(today);
            if (index !== -1) {
                this.history.splice(index, 1);
                this.updateStreak();
            }
        },

        updateStreak() {
            const historySet = new Set(this.history); // for fast lookup
            let streak = 0;
            let skipsInARow = 0;

            let currentDate = new Date();

            while (true) {
                const dateStr = currentDate.toISOString().split("T")[0];
                if (historySet.has(dateStr)) {
                    streak++;
                    skipsInARow = 0;
                } else {
                    skipsInARow++;
                    if (skipsInARow === 2) break;
                }

                // go to previous day
                currentDate.setDate(currentDate.getDate() - 1);
            }

            this.streak = streak;
        },
        getNextCheckpoint() {
            for (let cp of checkpoints) {
                if (this.streak < cp) return cp;
            }
            return null;
        }

    };

    return habit;
}

// setting variables and loading habits
let habits = [];
const todaysList = document.getElementById("list");
const habitTableBody = document.getElementById("habit-table-body");
const habitForm = document.forms["habit-form"];
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

loadHabits();

// rendering habits
function renderTodaysHabits() {
    const today = getTodayStr();
    const incompleteHabits = habits.filter(habit => !habit.history.includes(today));

    // Only clear the list if there's nothing to show
    if (incompleteHabits.length === 0) {
        return;
    }

    // Otherwise render the list
    todaysList.innerHTML = "";
    incompleteHabits.forEach(habit => {
        const div = document.createElement("div");
        div.classList.add("habit");
        div.style.cursor = 'pointer';
        div.innerHTML = `<h5>${habit.name}</h5>`;
        div.addEventListener("click", () => {
            habit.checkIn();
            renderAll();
        });
        todaysList.appendChild(div);
    });
}

function renderHabitTable() {    
    habitTableBody.innerHTML = "";

    // updating days (header)
    const todayIndex = new Date().getDay(); // 0 = Sunday
    const rotatedDays = [...daysOfWeek.slice(todayIndex), ...daysOfWeek.slice(0, todayIndex)];

    const headers = document.querySelectorAll("thead th.day");
    headers.forEach((th, i) => {
        th.textContent = rotatedDays[i];
    });

    habits.forEach(habit => {
        habit.updateStreak();

        // create row and first td
        const row = document.createElement("tr");
        const tdName = document.createElement("td");
        tdName.textContent = habit.name;

        // tooltip (showing streak and checkpoint)
        const tooltip = document.createElement("div");
        tooltip.classList.add('tooltip')
        const next = habit.getNextCheckpoint();
        tooltip.innerText = `Streak: ${habit.streak}` + (next ? `\nNext checkpoint in: ${next - habit.streak} day(s)` : `\nYou've passed all checkpoints! 🎉`);

        tdName.addEventListener("mouseenter", () => {
            tooltip.style.display = "block";
        });
        tdName.addEventListener("mouseleave", () => {
            tooltip.style.display = "none";
        });

        tdName.appendChild(tooltip);
        row.appendChild(tdName);

        // checkboxes
        rotatedDays.forEach(day => {
            const date = getDateForWeekday(day);
            const td = document.createElement("td");
            const checked = habit.history.includes(date);
            td.innerHTML = `<i class="fa-regular ${checked ? "fa-square-check" : "fa-square"} checkbox"></i>`;

            const checkbox = td.querySelector('.checkbox');
            checkbox.addEventListener("click", () => {
                if (checked) {
                    habit.history = habit.history.filter(d => d !== date);
                } else {
                    habit.checkIn();
                }
                habit.updateStreak();
                renderAll();
            });
            row.appendChild(td);
        });

        // edit and delete buttons
        const tdActions = document.createElement("td");

        // Edit button
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.className = "edit-btn";
        editBtn.style.marginRight = "8px";
        editBtn.addEventListener("click", () => {
            const newName = prompt("Edit habit name:", habit.name);
            if (newName && newName.trim()) {
                habit.name = newName.trim();
                saveHabits();
                renderAll();
            }
        });

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-btn";
        deleteBtn.addEventListener("click", () => {
            if (confirm(`Are you sure you want to delete "${habit.name}"?`)) {
                const index = habits.indexOf(habit);
                if (index !== -1) {
                    habits.splice(index, 1);
                    saveHabits();
                    renderAll();
                }
            }
        });

        tdActions.appendChild(editBtn);
        tdActions.appendChild(deleteBtn);
        row.appendChild(tdActions);

        // appending everything
        habitTableBody.appendChild(row);
    });
}

function renderAll() {
    renderTodaysHabits();
    renderHabitTable();
    saveHabits();
}

// storage functions
function saveHabits() {
    localStorage.setItem("habits", JSON.stringify(habits));
}

function loadHabits() {
    const stored = JSON.parse(localStorage.getItem("habits")) || [];
    habits = stored.map(data => createHabit(data.name, data.history));
}

// submit handler
habitForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = habitForm["habit-name"].value.trim();
    if (name && !habits.some(h => h.name === name)) {
        const newHabit = createHabit(name);
        habits.push(newHabit);
        habitForm.reset();
        renderAll();
    } else {
        alert('Error: That habit already exists!')
    }
});

// rendering all
renderAll();