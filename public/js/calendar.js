const calendar = document.querySelector(".calendar"),
  date = document.querySelector(".date"),
  daysContainer = document.querySelector(".days"),
  prev = document.querySelector(".prev"),
  next = document.querySelector(".next"),
  todayBtn = document.querySelector(".today-btn"),
  gotoBtn = document.querySelector(".goto-btn"),
  dateInput = document.querySelector(".date-input"),
  eventDay = document.querySelector(".event-day"),
  eventDate = document.querySelector(".event-date"),
  eventsContainer = document.querySelector(".events"),
  addEventBtn = document.querySelector(".add-event"),
  addEventWrapper = document.querySelector(".add-event-wrapper "),
  addEventCloseBtn = document.querySelector(".close "),
  addEventTitle = document.querySelector(".event-name "),
  addEventFrom = document.querySelector(".event-time-from "),
  addEventTo = document.querySelector(".event-time-to "),
  addEventSubmit = document.querySelector(".add-event-btn ");

let today = new Date();
let activeDay;
let month = today.getMonth();
let year = today.getFullYear();

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

document.addEventListener("DOMContentLoaded", function () {
  // Takvimleri yükle
  fetch("/calendar")
    .then((response) => response.json())
    .then((calendars) => {
      const dropdown = document.getElementById("calendarDropdown");
      calendars.forEach((calendar) => {
        const option = document.createElement("option");
        option.value = calendar.id;
        option.textContent = calendar.name;
        dropdown.appendChild(option);
      });
    })
    .catch((error) =>
      console.error("Takvim verileri alınırken hata oluştu:", error)
    );

  // Takvim seçildiğinde etkinlikleri yükle
  document
    .getElementById("calendarDropdown")
    .addEventListener("change", function () {
      const calendarId = this.value;
      getEvents(calendarId);
    });

  // Takvim başlatma ve olay dinleyicilerini ekleme
  initCalendar();
  addListner();

  // Takvimi dışarı aktarma butonuna tıklama olayı
  document
    .querySelector(".export-calendar")
    .addEventListener("click", exportCalendar);
});

//function to add days in days with class day and prev-date next-date on previous month and next month days and active on today
function initCalendar(calendarId) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const prevLastDay = new Date(year, month, 0);
  const prevDays = prevLastDay.getDate();
  const lastDate = lastDay.getDate();
  const day = firstDay.getDay();
  const nextDays = 7 - lastDay.getDay() - 1;

  date.innerHTML = months[month] + " " + year;

  let days = "";

  for (let x = day; x > 0; x--) {
    days += `<div class="day prev-date">${prevDays - x + 1}</div>`;
  }

  for (let i = 1; i <= lastDate; i++) {
    if (
      i === today.getDate() &&
      year === today.getFullYear() &&
      month === today.getMonth()
    ) {
      activeDay = i;
      getActiveDay(i);
      updateEvents(i);
      days += `<div class="day today active">${i}</div>`;
    } else {
      days += `<div class="day">${i}</div>`;
    }
  }

  for (let j = 1; j <= nextDays; j++) {
    days += `<div class="day next-date">${j}</div>`;
  }
  daysContainer.innerHTML = days;

  // Günleri yükledikten sonra olay dinleyicilerini ekle
  addListner();

  // Günleri yükledikten sonra etkinlikleri güncelle
  updateEvents(calendarId);
}

//function to add month and year on prev and next button
function prevMonth() {
  month--;
  if (month < 0) {
    month = 11;
    year--;
  }
  initCalendar();
}

function nextMonth() {
  month++;
  if (month > 11) {
    month = 0;
    year++;
  }
  initCalendar();
}

prev.addEventListener("click", prevMonth);
next.addEventListener("click", nextMonth);

//function to add active on day
function addListner() {
  const days = document.querySelectorAll(".day");
  days.forEach((day) => {
    day.addEventListener("click", (e) => {
      const calendarId = document.getElementById("calendarDropdown").value;
      const dayNumber = Number(e.target.innerHTML);
      getActiveDay(dayNumber);
      updateEvents(calendarId, dayNumber);
      activeDay = dayNumber;
      //remove active
      days.forEach((day) => {
        day.classList.remove("active");
      });
      //if clicked prev-date or next-date switch to that month
      if (e.target.classList.contains("prev-date")) {
        prevMonth();
        //add active to clicked day after month is changed
        setTimeout(() => {
          const days = document.querySelectorAll(".day");
          days.forEach((day) => {
            if (
              !day.classList.contains("prev-date") &&
              day.innerHTML === e.target.innerHTML
            ) {
              day.classList.add("active");
            }
          });
        }, 100);
      } else if (e.target.classList.contains("next-date")) {
        nextMonth();
        //add active to clicked day after month is changed
        setTimeout(() => {
          const days = document.querySelectorAll(".day");
          days.forEach((day) => {
            if (
              !day.classList.contains("next-date") &&
              day.innerHTML === e.target.innerHTML
            ) {
              day.classList.add("active");
            }
          });
        }, 100);
      } else {
        e.target.classList.add("active");
      }
    });
  });
}

dateInput.addEventListener("input", (e) => {
  dateInput.value = dateInput.value.replace(/[^0-9/]/g, "");
  if (dateInput.value.length === 2) {
    dateInput.value += "/";
  }
  if (dateInput.value.length > 7) {
    dateInput.value = dateInput.value.slice(0, 7);
  }
  if (e.inputType === "deleteContentBackward") {
    if (dateInput.value.length === 3) {
      dateInput.value = dateInput.value.slice(0, 2);
    }
  }
});

gotoBtn.addEventListener("click", gotoDate);

function gotoDate() {
  console.log("here");
  const dateArr = dateInput.value.split("/");
  if (dateArr.length === 2) {
    if (dateArr[0] > 0 && dateArr[0] < 13 && dateArr[1].length === 4) {
      month = dateArr[0] - 1;
      year = dateArr[1];
      initCalendar();
      return;
    }
  }
  alert("Invalid Date");
}

//function get active day day name and date and update eventday eventdate
function getActiveDay(date) {
  const day = new Date(year, month, date);
  const dayName = day.toString().split(" ")[0];
  eventDay.innerHTML = dayName;
  eventDate.innerHTML = date + " " + months[month] + " " + year;
}

//function update events when a day is active
function updateEvents(calendarId, day) {
  fetch(`/events/${calendarId}`)
    .then((response) => response.json())
    .then((events) => {
      const eventsContainer = document.getElementById("eventsContainer");
      let eventsHTML = "";
      const selectedDate = new Date(year, month, day);

      const days = document.querySelectorAll(".day");
      days.forEach((dayElement) => {
        const dayNumber = Number(dayElement.innerHTML);
        const currentDate = new Date(year, month, dayNumber);
        const hasEvent = events.some((event) => {
          const eventStartDate = new Date(event.startDate);
          const eventFinishDate = new Date(event.finishDate);
          return (
            currentDate >= eventStartDate && currentDate <= eventFinishDate
          );
        });

        if (hasEvent) {
          dayElement.classList.add("event-day");
        } else {
          dayElement.classList.remove("event-day");
        }
      });

      const eventsForDay = events.filter((event) => {
        const eventStartDate = new Date(event.startDate);
        const eventFinishDate = new Date(event.finishDate);
        return (
          selectedDate >= eventStartDate && selectedDate <= eventFinishDate
        );
      });

      if (eventsForDay.length > 0) {
        eventsForDay.forEach((event) => {
          const startDate = new Date(event.startDate);
          const finishDate = new Date(event.finishDate);

          const startDateString = startDate.toLocaleString("tr-TR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });

          const finishDateString = finishDate.toLocaleString("tr-TR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });

          eventsHTML += `<div class="event">
                        <div class="title">
                            <i class="fas fa-circle"></i>
                            <h3 class="event-title">${event.title}</h3>
                        </div>
                        <div class="event-time">
                            <span class="event-time">${startDateString} - ${finishDateString}</span>
                        </div>
                    </div>`;
        });
      } else {
        eventsHTML = `<div class="no-event">
                    <h3>No Events</h3>
                </div>`;
      }
      eventsContainer.innerHTML = eventsHTML;
    })
    .catch((error) =>
      console.error("Etkinlik verileri alınırken hata oluştu:", error)
    );
}

//allow 50 chars in eventtitle
addEventTitle.addEventListener("input", (e) => {
  addEventTitle.value = addEventTitle.value.slice(0, 60);
});

//allow only time in eventtime from and to
addEventFrom.addEventListener("input", (e) => {
  addEventFrom.value = addEventFrom.value.replace(/[^0-9:]/g, "");
  if (addEventFrom.value.length === 2) {
    addEventFrom.value += ":";
  }
  if (addEventFrom.value.length > 5) {
    addEventFrom.value = addEventFrom.value.slice(0, 5);
  }
});

addEventTo.addEventListener("input", (e) => {
  addEventTo.value = addEventTo.value.replace(/[^0-9:]/g, "");
  if (addEventTo.value.length === 2) {
    addEventTo.value += ":";
  }
  if (addEventTo.value.length > 5) {
    addEventTo.value = addEventTo.value.slice(0, 5);
  }
});

//function to add event to eventsArr
addEventSubmit.addEventListener("click", () => {
  consteventTitle = addEventTitle.value;
  const eventTimeFrom = addEventFrom.value;
  const eventTimeTo = addEventTo.value;
  if (eventTitle === "" || eventTimeFrom === "" || eventTimeTo === "") {
    alert("Please fill all the fields");
    return;
  }

  const newEvent = {
    title: eventTitle,
    startDate: eventTimeFrom,
    finishDate: eventTimeTo,
    calendarId: document.getElementById("calendarDropdown").value,
  };

  fetch("/add-event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newEvent),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Event added successfully");
        updateEvents(activeDay);
      } else {
        alert("Failed to add event");
      }
    })
    .catch((error) => console.error("Error adding event:", error));
});

//function to delete event when clicked on event
eventsContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("event")) {
    if (confirm("Are you sure you want to delete this event?")) {
      const eventTitle = e.target.children[0].children[1].innerHTML;
      const calendarId = document.getElementById("calendarDropdown").value;

      fetch(`/delete-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: eventTitle, calendarId: calendarId }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            alert("Event deleted successfully");
            updateEvents(activeDay);
          } else {
            alert("Failed to delete event");
          }
        })
        .catch((error) => console.error("Error deleting event:", error));
    }
  }
});

//function to save events in local storage
function saveEvents() {
  localStorage.setItem("events", JSON.stringify(eventsArr));
}

//function to get events from local storage
function getEvents(calendarId) {
  fetch(`/events/${calendarId}`)
    .then((response) => response.json())
    .then((events) => {
      const eventsContainer = document.getElementById("eventsContainer");
      let eventsHTML = "";
      if (events.length > 0) {
        events.forEach((event) => {
          const startDate = new Date(event.startDate);
          const finishDate = new Date(event.finishDate);

          // Tarih ve saatleri yerel saat dilimine göre formatla
          const startDateString = startDate.toLocaleString("tr-TR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });

          const finishDateString = finishDate.toLocaleString("tr-TR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });

          eventsHTML += `<div class="event">
                      <div class="title">
                          <i class="fas fa-circle"></i>
                          <h3 class="event-title">${event.title}</h3>
                      </div>
                      <div class="event-time">
                          <span class="event-time">${startDateString} - ${finishDateString}</span>
                      </div>
                  </div>`;
        });
      } else {
        eventsHTML = `<div class="no-event">
                  <h3>No Events</h3>
              </div>`;
      }
      eventsContainer.innerHTML = eventsHTML;
    })
    .catch((error) =>
      console.error("Etkinlik verileri alınırken hata oluştu:", error)
    );
}

function convertTime(time) {
  //convert time to 24 hour format
  let timeArr = time.split(":");
  let timeHour = timeArr[0];
  let timeMin = timeArr[1];
  let timeFormat = timeHour >= 12 ? "PM" : "AM";
  timeHour = timeHour % 12 || 12;
  time = timeHour + ":" + timeMin + " " + timeFormat;
  return time;
}

function exportCalendar() {
  const calendarId = document.getElementById("calendarDropdown").value;
  fetch(`/events/${calendarId}`)
    .then((response) => response.json())
    .then((events) => {
      let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\n";

      events.forEach((event) => {
        const startDate = new Date(event.startDate);
        const finishDate = new Date(event.finishDate);

        icsContent += "BEGIN:VEVENT\n";
        icsContent += `SUMMARY:${event.title}\n`;
        icsContent += `DTSTART:${formatDateToICS(startDate)}\n`;
        icsContent += `DTEND:${formatDateToICS(finishDate)}\n`;
        icsContent += "END:VEVENT\n";
      });

      icsContent += "END:VCALENDAR";

      const blob = new Blob([icsContent], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "calendar.ics";
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch((error) =>
      console.error("Etkinlik verileri alınırken hata oluştu:", error)
    );
}

function formatDateToICS(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}
