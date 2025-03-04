// Route mappings
const routes = {
    "/": "views/home.html",
    "/analytics": "views/analytics.html",
    "/simulation": "views/simulation.html"
};

function initMap() {
    const map = L.map('map').setView([3.139, 101.6869], 12); // Kuala Lumpur center

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Adding marker of KL
    L.marker([3.139, 101.6869]).addTo(map)
        .bindPopup("Example Bus Stop<br>Kuala Lumpur")
        .openPopup();
}


function loadRoute(path) {
    path = path === "/" || path.startsWith("/index") ? "/" : path;

    const route = routes[path] || routes["/"]; 
    fetch(route)
        .then(response => {
            if (!response.ok) throw new Error("Page not found");
            return response.text();
        })
        .then(html => {
            document.getElementById("app-content").innerHTML = html;
            updateActiveNav(path);
            if (path === "/") {
                console.log("Dashboard loaded, attempting to load charts...");
                setTimeout(() => {
                    if (document.getElementById("waitingTimeChart")) {
                        loadCharts();
                    }
                    if (document.getElementById("map")) {
                        initMap(); 
                    }
                }, 500);
            }
        })
        .catch(() => {
            document.getElementById("app-content").innerHTML = "<h2>404 Not Found</h2>";
        });
}

// Function to handle navigation and prevent full-page reload
function navigate(event) {
    event.preventDefault(); 
    const path = event.target.getAttribute("href");

    if (routes[path]) {
        history.pushState({}, "", path); 
        loadRoute(path);
    }
}

// Function to update active navigation item
function updateActiveNav(path) {
    document.querySelectorAll(".sidebar ul li a").forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === path);
    });
}

// Attach event listeners after the DOM loads
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("a[data-route]").forEach(link => {
        link.addEventListener("click", navigate);
    });
    loadRoute(window.location.pathname);
});

// Handle browser back/forward navigation
window.addEventListener("popstate", () => {
    loadRoute(window.location.pathname);
});


// Function to Generate Fake Data
function generateRandomData(min, max, count) {
    return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

// Function to Calculate Average
function calculateAverage(data) {
    return (data.reduce((sum, value) => sum + value, 0) / data.length).toFixed(1);
}

// Function to Generate Fake Data for Scheduled & Actual Headways
function generateFakeBunchingData(numPoints) {
    let scatterData = [];
    let bunchedBuses = 0;
    
    for (let i = 0; i < numPoints; i++) {
        const scheduledHeadway = Math.floor(Math.random() * (15 - 5 + 1)) + 5; // 5 to 15 minutes
        let actualHeadway;

        if (Math.random() < 0.4) { 
            // 40% chance the bus arrives early (bunched)
            actualHeadway = Math.max(1, scheduledHeadway - (Math.random() * 5 + 1)); 
            bunchedBuses++;
        } else {
            // Normal headway
            actualHeadway = scheduledHeadway + Math.floor(Math.random() * 5); // Some variation
        }

        scatterData.push({ x: scheduledHeadway, y: actualHeadway });
    }

    // Calculate Bus Bunching Rate
    const busBunchingRate = ((bunchedBuses / numPoints) * 100).toFixed(1);
    return { scatterData, busBunchingRate };
}



// Load all the charts in the Home Dashboard
function loadCharts() {
    // Getting Current Hour (0 - 23)
    const currentHour = new Date().getHours();

    // Generating Labels (12 AM to Current Hour)
    const labels = [];
    for (let i = 0; i <= currentHour; i++) {
        labels.push(`${i}:00`);
    }

    // Generate Fake Data Only Up to Current Hour
    const waitingTimes = generateRandomData(2, 10, currentHour + 1);
    const headwayDeviation = generateRandomData(1, 10, currentHour + 1);
    const busDelays = generateRandomData(5, 23, currentHour + 1);
    const bunchingData = generateFakeBunchingData(5000);

    // Compute Averages
    const avgWaitingTime = calculateAverage(waitingTimes);
    const avgHeadwayDeviation = calculateAverage(headwayDeviation);
    const avgBusDelay = calculateAverage(busDelays);

    // Find the max values for scaling the y-axis dynamically
    const maxWaitingTime = Math.max(...waitingTimes) + 2; 
    const maxHeadwayDeviation = Math.max(...headwayDeviation) + 1;
    const maxBusDelay = Math.max(...busDelays) + 2;

    document.getElementById("average-bus-waiting-time").innerText = `${avgWaitingTime} mins`;
    document.getElementById("average-headway-deviation").innerText = `${avgHeadwayDeviation} mins`;
    document.getElementById("bus-bunching-rate").innerText = `${bunchingData.busBunchingRate} %`;


    // Create Charts
    const ctx1 = document.getElementById("waitingTimeChart").getContext("2d");
    new Chart(ctx1, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Average Bus Waiting Time (mins)",
                data: waitingTimes,
                backgroundColor: "blue"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: maxWaitingTime 
                }
            }
        }
    });

    const ctx2 = document.getElementById("headwayDeviationChart").getContext("2d");
    new Chart(ctx2, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Headway Deviation (mins)",
                data: headwayDeviation,
                borderColor: "blue",
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: maxHeadwayDeviation 
                }
            }
        }
    });

    const ctx3 = document.getElementById("occupancyChart").getContext("2d");
    new Chart(ctx3, {
        type: "doughnut",
        data: {
            labels: ["Seats Available", "Standing", "Full Capacity"],
            datasets: [{
                label: "Bus Occupancy",
                data: [42, 30, 28],
                backgroundColor: ["green", "yellow", "red"]
            }]
        }
    });

    const ctx4 = document.getElementById("onTimeChart").getContext("2d");
    new Chart(ctx4, {
        type: "pie",
        data: {
            labels: ["On Time", "Late", "Early"],
            datasets: [{
                label: "On-Time Performance",
                data: [87, 8, 5],
                backgroundColor: ["green", "red", "yellow"]
            }]
        }
    });

    const ctx5 = document.getElementById("delayChart").getContext("2d");
    new Chart(ctx5, {
        type: "bar",
        data: {
            labels: ["Route 1", "Route 2", "Route 3", "Route 4", "Route 5"],
            datasets: [{
                label: "Average Delay Time (mins)",
                data: [avgBusDelay, avgBusDelay, avgBusDelay, 22, 12],
                backgroundColor: ["red"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: maxBusDelay 
                }
            }
        }
    });

    const ctx6 = document.getElementById("busBunchingChart").getContext("2d");
    new Chart(ctx6, {
        type: "scatter",
        data: {
            datasets: [{
                label: "Bus Bunching",
                data: bunchingData.scatterData,
                backgroundColor: "red"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Scheduled Headway (mins)"
                    },
                    beginAtZero: true
                },
                y: {
                    title: {
                        display: true,
                        text: "Actual Headway (mins)"
                    },
                    beginAtZero: true
                }
            }
        }
    });
}
