
// Initialize variables (still pretty unfamiliar with how JavaScript works, did it for both when the page loads and at the start of the program)

onBreak = false;
breakTime = 0;
breakStart = 0;
userStatus = "";

// Function to switch between sections in the navbar

function showSection(sectionId) {
    // Removes the currently active section
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    // Replaces it with the new section identified in parameter
    document.getElementById(sectionId).classList.add('active');
}

// Generates the formatting of schedule grid
function generateScheduleGrid() {
    const grid = document.getElementById('scheduleGrid');

    // Add header row
    const headers = ['Time', 'Day 1', 'Day 2', 'Other'];
    headers.forEach(header => {
        const headerCell = document.createElement('div');
        headerCell.className = 'header';
        headerCell.textContent = header;
        grid.appendChild(headerCell);
    });

    const timeIntervals = [];

    for (let hour = 6; hour <= 23; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const endHour = minute + 15 >= 60 ? hour + 1 : hour;
            const endMinute = (minute + 15) % 60;
            const interval = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
            timeIntervals.push(interval);
        }
    }

    timeIntervals.forEach((interval, rowIndex) => {
        const timeCell = document.createElement('div');
        timeCell.className = 'time-label';
        timeCell.textContent = interval;
        grid.appendChild(timeCell);

        for (let day = 0; day < 3; day++) {
            const cell = document.createElement('div');
            cell.className = 'time-slot';
            cell.dataset.row = rowIndex;
            cell.dataset.day = day;

            // Restore saved state
            const key = `schedule-${rowIndex}-${day}`;
            if (localStorage.getItem(key) === 'active') {
                cell.classList.add('active');
            }

            cell.onclick = () => {
                cell.classList.toggle('active');
                localStorage.setItem(key, cell.classList.contains('active') ? 'active' : '');
            };
            grid.appendChild(cell);
        }
    });
}

// Function for Adding Tasks
function addTask() {
    const taskName = document.getElementById('taskName').value;
    const taskTime = document.getElementById('taskTime').value;
    const taskDeadline = document.getElementById('taskDeadline').value;

    if (!taskName || !taskTime || !taskDeadline) {
        alert("Please fill in all fields.");
        return;
    }

    // How the website is able to save it in local storage
    const task = { taskName, taskTime, taskDeadline };
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(tasks));

    renderTasks();
}

// Rendering tasks saved from local storage
function renderTasks() {
    const taskList = document.getElementById('todoList');
    taskList.innerHTML = '';

    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.forEach((task, index) => {
        const taskItem = document.createElement('div');
        taskItem.className = 'todo-item';

        // Adjustment made by me: Reformating the text for each item
        taskItem.innerHTML = `
            <span> <b> ${task.taskName} </b> <br><b>Deadline: ${task.taskDeadline} </b> <br>Estimated Completion Time: ${task.taskTime} mins </span>
            <button onclick="deleteTask(${index})">Delete</button>
        `;
        taskList.appendChild(taskItem);
    });
}

// Closing a task
function deleteTask(index) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.splice(index, 1);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
}


// Handle desktop notification permission
function handleNotificationPermission() {
    const checkbox = document.getElementById("desktopNotifications");

    if (checkbox.checked) {
        localStorage.setItem("notifs", "true");
        if (Notification.permission === "default") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification("Notification: Desktop notifications are now enabled!");
                    playChime()
                    alert("Desktop notifications enabled!");

                } else {
                    checkbox.checked = false;
                    alert("Desktop notifications permission denied.");
                }
            });
        } else if (Notification.permission === "granted") {
            alert("Desktop notifications are already enabled!");
        } else {

            
            alert("Desktop notifications permission has been denied. Please enable it in your browser settings.");
            checkbox.checked = false;
        }
    } else {

        localStorage.setItem("notifs", "false");
        alert("You have opted out of notifications. This website will not send notifications.");
        
    }
}


function loadSettings() {
    const notificationsEnabled = localStorage.getItem("notifs") === 'true';
    document.getElementById("desktopNotifications").checked = notificationsEnabled;
}


// Play chime sound
function playChime() {
    var audio = new Audio('chime.mp3');
    audio.play();
}

// Function to test notification and chime
function testNotification() {
    const checkbox = document.getElementById("desktopNotifications");

    if (checkbox.checked) {
        const notification = new Notification("Test Notification: Desktop notifications are enabled.");
        playChime(); // Play chime sound
    } else {
        alert("Please enable notifications first in your browser settings.");
    }

}

function checkCurrentTimeBlockStatus() {
    const selectedDay = document.getElementById('daySelector').value; // Day 1, Day 2, or Free Day
    const currentTime = getCurrentTimeBlock(); // Current 15-min time block

    if (!currentTime) {
        console.error("Couldn't determine the current time block.");
        return false;
    }

    // Get cells for the current time block
    const scheduleGrid = document.getElementById('scheduleGrid').children;
    let dayColumnIndex;

    // Determine the correct column index based on the selected day
    switch (selectedDay) {
        case 'Day 1':
            dayColumnIndex = 1; // Day 1 column
            break;
        case 'Day 2':
            dayColumnIndex = 2; // Day 2 column
            break;
        default:
            console.error("Invalid day selection.");
            return false;
    }

    // Find the matching row
    for (let i = 4; i < scheduleGrid.length; i += 4) {
        const timeCell = scheduleGrid[i]; // Time label cell
        const selectedDayCell = scheduleGrid[i + dayColumnIndex]; // Selected day's cell
        const otherDayCell = scheduleGrid[i + 3]; // "Other" column cell

        if (timeCell.textContent === currentTime) {
            const isSelectedDayAvailable = !selectedDayCell.classList.contains('active');
            const isOtherDayAvailable = !otherDayCell.classList.contains('active');

            // If both cells are unshaded, the user is available
            if (isSelectedDayAvailable && isOtherDayAvailable) {
                console.log(`Available at ${currentTime}`);
                return "Available";
            } else {
                console.log(`Unavailable at ${currentTime}`);
                return "Unavailable";
            }
        }
    }

    console.error("Time block not found.");
    return false;
}

// Helper function for previous function

function getCurrentTimeBlock() {
    const now = new Date();
    let hour = now.getHours();
    let minute = now.getMinutes();

    // Adjust minutes to nearest 15-min block
    minute = Math.floor(minute / 15) * 15;

    // Format to match the schedule's time format
    const nextHour = minute + 15 >= 60 ? hour + 1 : hour;
    const nextMinute = (minute + 15) % 60;

    const currentTimeBlock = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}-${
        nextHour.toString().padStart(2, '0')
    }:${nextMinute.toString().padStart(2, '0')}`;

    return currentTimeBlock;
}

// All the functions below are ones that I've written myself

function updateTime() {

    const now = new Date();
    let time = now.toLocaleTimeString();

    document.getElementById('currentTime').textContent = time
    checkCurrentTimeBlockStatus()
}

function pushReminder() {

    const now = new Date();
    currentTime = now.getTime();
    // If the user is currently on break, only send a notification once break time is over.
    if (onBreak) {
        if ((currentTime - breakStart) > breakTime) {
            new Notification("Your break time has ended, now get productive :D");
            playChime()
            onBreak = false
        } 
    } else {
        currentStatus = checkCurrentTimeBlockStatus()

        // If the user has just become availble
        if (currentStatus == "Available" && userStatus == "Unavailable") {
            console.log("Please stop spamming notifs", currentStatus, userStatus)
            new Notification("Your schedule indicates that you are free right now. Here are some reminders on what tasks you need to do.");
            playChime()
            taskNotifs();
        }

        currentMinute = now.getMinutes();
        currentSecond = now.getSeconds();
        if (currentMinute == 0 && currentSecond == 0 && currentStatus == "Available") {
            new Notification("It's the start of a new hour! Here are reminders on what to work on!");
            playChime()
            taskNotifs();
        }
    }

    // Updates userStatus to match currentStatus
    userStatus = currentStatus
}

function taskNotifs() {

    let taskList = [];
    let notifMessage = "Tasks to Complete: ";

    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.forEach((task, index) => {

        taskList.push(task.taskName);
    });

    let numTasks = taskList.length; 

    for (let i = 0; i < numTasks - 1; i++) {
      notifMessage += taskList[i] + ", ";

    }

    notifMessage += taskList[numTasks - 1]
    console.log(notifMessage)

    new Notification(notifMessage);
    playChime()
}


function takeBreak(numMins) {
    onBreak = true;
    // Converting the break time from minutes to milliseconds
    breakTime = numMins * 60 * 1000;
    alert("Enjoy your " + numMins + "-minute break! We will not send notifications during this time!")
    const now = new Date();
    breakStart = now.getTime();
    console.log("Break Begins at:", breakStart)
}

function iterateFunc() {

    updateTime()
    pushReminder()
    
}


document.addEventListener('DOMContentLoaded', () => {
    generateScheduleGrid();
    loadSettings();
    renderTasks();
    showSection('todo');
    setInterval(iterateFunc, 1000);

    // Initialize variables

    onBreak = false;
    breakTime = 0;
    breakStart = 0;
    userStatus = checkCurrentTimeBlockStatus();
    

});

