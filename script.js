const teamMembers = ['Darryl', 'Desmond', 'Melven', 'Raymond', 'Jwong', 'Firdaus', 'Wei Ren'];
const offDaysLimit = { 'Monday': 3, 'Tuesday': 3, 'Wednesday': 3, 'Thursday': 3, 'Friday': 3, 'Saturday': 4, 'Sunday': 4 };
const schedule = {
    'Monday': [],
    'Tuesday': [],
    'Wednesday': [],
    'Thursday': [],
    'Friday': [],
    'Saturday': [],
    'Sunday': []
};

const maxOffDaysPerMember = 2;
const offDaysForm = document.getElementById('offDaysForm');
const nameSelect = document.getElementById('name');
const offDaysSelect = document.getElementById('offDays');
const scheduleTableBody = document.getElementById('scheduleTable').querySelector('tbody');

// Track how many days each member has taken off
const memberOffDays = {};

// Load the schedule from Firebase
function loadSchedule() {
    const dbRef = ref(database, 'offDaysSchedule/');
    get(child(dbRef)).then((snapshot) => {
        if (snapshot.exists()) {
            const savedSchedule = snapshot.val();
            for (const day in savedSchedule) {
                savedSchedule[day].forEach(member => {
                    schedule[day].push(member);
                    memberOffDays[member] = (memberOffDays[member] || 0) + 1;
                    removeTeamMemberFromTable(member, day);
                });
            }
        } else {
            console.log("No data available");
        }
    }).catch((error) => {
        console.error(error);
    });
}

// Function to reset the schedule
function resetSchedule() {
    for (const day in schedule) {
        schedule[day] = [];
    }

    for (const member of teamMembers) {
        memberOffDays[member] = 0;
    }

    // Clear the Firebase database
    set(ref(database, 'offDaysSchedule'), schedule);
    initializeTable(); // Refresh the table
}

// Check if it’s Sunday after 12 PM Singapore time
function checkAndReset() {
    const now = new Date();
    const options = { timeZone: 'Asia/Singapore', hour: 'numeric', weekday: 'long' };
    const singaporeTime = now.toLocaleString('en-US', options);
    const [day, hours] = singaporeTime.split(", "); // Extract day and hour
    const hour = parseInt(hours); // Convert hour to integer

    if (day === "Sunday" && hour >= 12) { // If it's Sunday and after 12 PM
        resetSchedule();
    }
}

// Run the check every hour
setInterval(checkAndReset, 3600000); // Check every hour

// Handle form submission for selecting off days
offDaysForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const member = nameSelect.value;
    const day = offDaysSelect.value;

    // Check if member has already taken 2 off days
    if (memberOffDays[member] >= maxOffDaysPerMember) {
        alert(`${member} has already taken the maximum of 2 off days.`);
        return;
    }

    // Check if there are enough people working on the selected day
    if (schedule[day].length >= (teamMembers.length - offDaysLimit[day])) {
        alert(`At least ${offDaysLimit[day]} people must be working on ${day}.`);
        return;
    }

    // Allow the off day selection
    schedule[day].push(member);
    memberOffDays[member]++;

    // Remove the member from the table and the dropdown list for the selected day
    removeTeamMemberFromTable(member, day);
    offDaysForm.reset();

    // Save the updated schedule to Firebase
    set(ref(database, 'offDaysSchedule'), schedule);
});

// Remove team member from the schedule table for the selected day
function removeTeamMemberFromTable(member, day) {
    const rows = scheduleTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        if (row.getAttribute('data-name') === member) {
            const dayIndex = getDayColumnIndex(day);
            row.cells[dayIndex].textContent = 'Off';
        }
    });
}

// Get the column index based on the day
function getDayColumnIndex(day) {
    const dayIndexMap = {
        'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 
        'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7
    };
    return dayIndexMap[day];
}

// Initialize the table and dropdown
function initializeTable() {
    scheduleTableBody.innerHTML = ""; // Clear existing rows
    teamMembers.forEach(member => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${member}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>`;
        row.setAttribute('data-name', member);
        scheduleTableBody.appendChild(row);
    });
}

// Populate the dropdown with team members
function populateNameDropdown() {
    teamMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = member;
        option.textContent = member;
        nameSelect.appendChild(option);
    });
}

// Initialize the table and dropdown
initializeTable();
populateNameDropdown();
loadSchedule();
