document.addEventListener('DOMContentLoaded', () => {
    const studentIdInput = document.getElementById('student-id-input');
    const accessBtn = document.getElementById('access-btn');
    const idSection = document.getElementById('id-section');
    const mainContent = document.getElementById('main-content');

    const addTaskBtn = document.getElementById('add-task-btn');
    const finishBtn = document.getElementById('finish-btn');
    const showReportBtn = document.getElementById('show-report-btn');
    const taskInput = document.getElementById('task-input');
    const todoList = document.getElementById('todo-list');
    const inProgressList = document.getElementById('in-progress-list');
    const doneList = document.getElementById('done-list');
    const inputSection = document.getElementById('input-section');
    const reportModal = document.getElementById('report-modal');
    const closeBtn = document.querySelector('.close-btn');
    const reportBody = document.getElementById('report-body');

    let currentStudentId = '';
    const TEACHER_ID = 'PROFESOR123';
    let isTeacher = false;
    
    // Define el orden de las listas para validar el arrastre
    const listOrder = ['todo-list', 'in-progress-list', 'done-list'];

    // Lógica para el acceso de estudiantes/profesor
    accessBtn.addEventListener('click', () => {
        const id = studentIdInput.value.trim();
        if (id !== '') {
            currentStudentId = id;
            if (currentStudentId === TEACHER_ID) {
                isTeacher = true;
                inputSection.classList.add('hidden'); 
            } else {
                isTeacher = false;
                inputSection.classList.remove('hidden');
            }
            idSection.classList.add('hidden');
            mainContent.classList.remove('hidden');
            loadTasks();
        } else {
            alert('Por favor, ingresa un ID para acceder.');
        }
    });

    // Generar un ID de tarea único
    function generateUniqueId() {
        return 'TAREA-' + Date.now().toString().slice(-5) + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();
    }

    // Guardar todas las tareas en el almacenamiento local con el ID del estudiante
    function saveTasks() {
        if (isTeacher) return;

        const lists = document.querySelectorAll('.list');
        const tasks = {};
        lists.forEach(list => {
            const listId = list.id;
            tasks[listId] = [];
            list.querySelectorAll('.card').forEach(card => {
                tasks[listId].push({
                    id: card.getAttribute('data-task-id'),
                    text: card.textContent.replace(card.querySelector('.card-id').textContent, '').trim(),
                    history: JSON.parse(card.getAttribute('data-history') || '[]')
                });
            });
        });
        localStorage.setItem(`trelloTasks-${currentStudentId}`, JSON.stringify(tasks));
    }

    // Cargar las tareas desde el almacenamiento local
    function loadTasks() {
        todoList.innerHTML = `<div class="list-header"><h3>Pendientes</h3></div>`;
        inProgressList.innerHTML = `<div class="list-header"><h3>En curso</h3></div>`;
        doneList.innerHTML = `<div class="list-header"><h3>Hechas</h3></div>`;

        let tasksToLoad = {};

        if (isTeacher) {
            const allStorageKeys = Object.keys(localStorage);
            const studentKeys = allStorageKeys.filter(key => key.startsWith('trelloTasks-') && key !== `trelloTasks-${TEACHER_ID}`);
            
            studentKeys.forEach(key => {
                const studentId = key.replace('trelloTasks-', '');
                const studentTasks = JSON.parse(localStorage.getItem(key));
                
                for (const listId in studentTasks) {
                    if (!tasksToLoad[listId]) {
                        tasksToLoad[listId] = [];
                    }
                    studentTasks[listId].forEach(task => {
                        task.studentId = studentId;
                        tasksToLoad[listId].push(task);
                    });
                }
            });
            document.body.classList.add('teacher-view');
        } else {
            const savedTasks = JSON.parse(localStorage.getItem(`trelloTasks-${currentStudentId}`));
            if (savedTasks) {
                tasksToLoad = savedTasks;
            }
            document.body.classList.remove('teacher-view');
        }

        for (const listId in tasksToLoad) {
            const list = document.getElementById(listId);
            if (list) {
                tasksToLoad[listId].forEach(task => {
                    const newCard = createCard(task.text, task.id, task.history, task.studentId);
                    list.appendChild(newCard);
                });
            }
        }
    }

    // Función para crear una nueva tarjeta
    function createCard(taskText, taskId, taskHistory = [], studentId = null) {
        const newCard = document.createElement('div');
        newCard.classList.add('card');
        if (!isTeacher) {
            newCard.setAttribute('draggable', 'true');
        } else {
            newCard.classList.add('teacher-card');
        }
        newCard.setAttribute('data-task-id', taskId);
        newCard.setAttribute('data-history', JSON.stringify(taskHistory));
        newCard.setAttribute('data-current-list', taskHistory.length > 0 ? taskHistory[taskHistory.length - 1].listId : 'todo-list');

        let cardHtml = `<span class="card-id">${taskId}</span>`;
        if (studentId) {
            cardHtml += `<span class="student-id">Estudiante: ${studentId}</span><br>`;
        }
        cardHtml += `<p>${taskText}</p>`;
        newCard.innerHTML = cardHtml;

        if (!isTeacher) {
            newCard.addEventListener('dragstart', () => {
                newCard.classList.add('dragging');
            });
            newCard.addEventListener('dragend', () => {
                newCard.classList.remove('dragging');
                const newListId = newCard.parentNode.id;
                updateTaskHistory(newCard, newListId);
                saveTasks();
            });
        }
        
        return newCard;
    }

    // Actualizar el historial de una tarea
    function updateTaskHistory(cardElement, newListId) {
        if (isTeacher) return;
        const history = JSON.parse(cardElement.getAttribute('data-history'));
        const now = new Date().toLocaleString();
        const lastEntry = history.length > 0 ? history[history.length - 1] : null;
        if (!lastEntry || lastEntry.listId !== newListId) {
            history.push({ listId: newListId, date: now });
            cardElement.setAttribute('data-history', JSON.stringify(history));
            cardElement.setAttribute('data-current-list', newListId);
        }
    }

    // Evento para agregar una nueva tarea
    addTaskBtn.addEventListener('click', () => {
        const taskText = taskInput.value.trim();
        if (taskText !== '' && currentStudentId !== '') {
            const newId = generateUniqueId();
            const initialHistory = [{ listId: 'todo-list', date: new Date().toLocaleString() }];
            const newCard = createCard(taskText, newId, initialHistory);
            todoList.appendChild(newCard);
            taskInput.value = '';
            saveTasks();
        } else if (currentStudentId === '') {
            alert('Por favor, ingresa tu ID para empezar a agregar tareas.');
        }
    });

    // Evento para ocultar el formulario
    finishBtn.addEventListener('click', () => {
        inputSection.classList.add('hidden');
    });

    // Evento para mostrar el modal de reporte
    showReportBtn.addEventListener('click', () => {
        generateReport();
        reportModal.style.display = 'block';
    });

    // Cierre del modal
    closeBtn.addEventListener('click', () => reportModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === reportModal) {
            reportModal.style.display = 'none';
        }
    });

    // Generar reporte de progreso
    function generateReport() {
        let tasksToReport = {};
        if (isTeacher) {
            const allStorageKeys = Object.keys(localStorage);
            const studentKeys = allStorageKeys.filter(key => key.startsWith('trelloTasks-') && key !== `trelloTasks-${TEACHER_ID}`);
            studentKeys.forEach(key => {
                const studentId = key.replace('trelloTasks-', '');
                tasksToReport[studentId] = JSON.parse(localStorage.getItem(key));
            });
        } else {
            tasksToReport[currentStudentId] = JSON.parse(localStorage.getItem(`trelloTasks-${currentStudentId}`));
        }
        
        reportBody.innerHTML = '';
        let isEmpty = true;

        for (const studentId in tasksToReport) {
            const studentData = tasksToReport[studentId];
            if (!studentData) continue;
            isEmpty = false;

            const studentReportTitle = document.createElement('h3');
            studentReportTitle.textContent = `Reporte de ${studentId}`;
            reportBody.appendChild(studentReportTitle);

            const allTasks = [];
            for (const listId in studentData) allTasks.push(...studentData[listId]);

            if (allTasks.length === 0) {
                const noTasks = document.createElement('p');
                noTasks.textContent = 'Este estudiante no tiene tareas.';
                reportBody.appendChild(noTasks);
            } else {
                allTasks.forEach(task => {
                    const taskReport = document.createElement('div');
                    let reportHtml = `<h4>Tarea: ${task.text} (${task.id})</h4><ul>`;
                    task.history.forEach(entry => {
                        const listName = entry.listId === 'todo-list' ? 'Pendientes' : entry.listId === 'in-progress-list' ? 'En curso' : 'Hechas';
                        reportHtml += `<li>Movida a **${listName}** el ${entry.date}.</li>`;
                    });
                    reportHtml += '</ul><hr>';
                    taskReport.innerHTML = reportHtml;
                    reportBody.appendChild(taskReport);
                });
            }
        }

        if (isEmpty) {
            reportBody.innerHTML = '<p>No hay tareas de estudiantes para mostrar en el reporte.</p>';
        }
    }

    // Lógica para arrastrar y soltar con validación
    const lists = document.querySelectorAll('.list');
    lists.forEach(list => {
        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (isTeacher) return;
            
            const draggingCard = document.querySelector('.dragging');
            const sourceList = draggingCard.parentNode;
            const targetList = list;

            const sourceIndex = listOrder.indexOf(sourceList.id);
            const targetIndex = listOrder.indexOf(targetList.id);

            // Permitir el arrastre solo si el movimiento es hacia adelante (a una lista con un índice mayor)
            if (targetIndex > sourceIndex) {
                const afterElement = getDragAfterElement(list, e.clientY);
                if (afterElement == null) {
                    list.appendChild(draggingCard);
                } else {
                    list.insertBefore(draggingCard, afterElement);
                }
            } else {
                // Cancelar el evento de soltar si el movimiento no está permitido
                e.preventDefault();
            }
        });
    });

    function getDragAfterElement(list, y) {
        const listCards = [...list.querySelectorAll('.card:not(.dragging)')];
        return listCards.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
});
