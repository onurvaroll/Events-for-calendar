// State management
let currentPage = 1;
const itemsPerPage = 7;
let activeTab = 'calendars';
let searchTerm = '';
let selectedCalendarId = '';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const calendarFilter = document.getElementById('calendarFilter');
const addButton = document.getElementById('addButton');
const addButtonText = document.getElementById('addButtonText');
const calendarTableBody = document.getElementById('calendarTableBody');
const eventTableBody = document.getElementById('eventTableBody');
const pagination = document.getElementById('pagination');

// Fetch data from server
async function fetchData(endpoint) {
    const response = await fetch(endpoint);
    if (!response.ok) {
        throw new Error('Veri çekme hatası');
    }
    return response.json();
}

// Event Listeners
document.getElementById('adminTabs').addEventListener('shown.bs.tab', (e) => {
    activeTab = e.target.getAttribute('href').substring(1);
    addButtonText.textContent = activeTab === 'calendars' ? 'Yeni Takvim' : 'Yeni Etkinlik';
    
    // Takvim filtresini sadece etkinlikler sekmesinde göster
    const calendarFilterContainer = document.getElementById('calendarFilterContainer');
    if (activeTab === 'events') {
        calendarFilterContainer.style.display = 'block';
    } else {
        calendarFilterContainer.style.display = 'none';
    }

    updateTable();
});

searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase();
    currentPage = 1;
    updateTable();
});

calendarFilter.addEventListener('change', (e) => {
    selectedCalendarId = e.target.value;
    currentPage = 1;
    updateTable();
});

// Table update function
async function updateTable() {
    try {
        const items = activeTab === 'calendars' ? await fetchData('/calendar') : await fetchData('/event');
        const filteredItems = items.filter(item => {
            const matchesSearch = activeTab === 'calendars' 
                ? item.name.toLowerCase().includes(searchTerm)
                : item.title.toLowerCase().includes(searchTerm);
            
            const matchesCalendar = !selectedCalendarId || 
                (activeTab === 'events' ? item.calendarId == selectedCalendarId : true);
            
            return matchesSearch && matchesCalendar;
        });

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedItems = filteredItems.slice(start, end);

        if (activeTab === 'calendars') {
            calendarTableBody.innerHTML = paginatedItems.map(calendar => `
                <tr>
                    <td>${calendar.id}</td>
                    <td>${calendar.name}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary me-2">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            eventTableBody.innerHTML = paginatedItems.map(event => `
                <tr>
                    <td>${event.id}</td>
                    <td>${event.title}</td>
                    <td>${event.calendarId}</td>
                    <td>${new Date(event.startDate).toLocaleDateString('tr-TR')}</td>
                    <td>${new Date(event.finishDate).toLocaleDateString('tr-TR')}</td>
                    <td>${event.startTime.substring(0, 5)}</td>
                    <td>${event.finishTime.substring(0, 5)}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary me-2">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        updatePagination(filteredItems.length);
    } catch (error) {
        console.error('Tablo güncellenirken hata oluştu:', error);
    }
}

// Pagination update function
function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    pagination.innerHTML = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
        ${Array.from({ length: totalPages }, (_, i) => `
            <li class="page-item ${currentPage === i + 1 ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i + 1}">${i + 1}</a>
            </li>
        `).join('')}
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;

    // Add click handlers for pagination
    pagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const newPage = parseInt(e.currentTarget.dataset.page);
            if (newPage !== currentPage && newPage > 0 && newPage <= totalPages) {
                currentPage = newPage;
                updateTable();
            }
        });
    });
}

// Initial render
updateTable();

// Silme butonuna tıklama olayını dinle
document.addEventListener('click', function (e) {
    if (e.target.closest('.btn-outline-danger')) {
        const button = e.target.closest('.btn-outline-danger');
        const row = button.closest('tr');
        const itemId = row.querySelector('td:first-child').textContent.trim(); // İlk sütundaki ID'yi al ve boşlukları temizle
        const itemName = row.querySelector('td:nth-child(2)').textContent.trim(); // İkinci sütundaki adı al
        console.log("Silinecek öğe ID'si:", itemId); // ID'nin doğru alındığını kontrol et
        const confirmDelete = confirm(`${itemName} silmek istediğinizden emin misiniz?`);
        if (confirmDelete) {
            if (activeTab === 'calendars') {
                deleteCalendar(itemId);
            } else if (activeTab === 'events') {
                deleteEvent(itemId);
            }
        }
    }
});

// Takvim silme fonksiyonu
function deleteCalendar(calendarId) {
    fetch('/delete-calendar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: calendarId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Takvim başarıyla silindi!');
            updateTable();
        } else {
            alert('Takvim silinirken bir hata oluştu.');
        }
    })
    .catch(error => console.error('Takvim silinirken hata oluştu:', error));
}

// Etkinlik silme fonksiyonu
function deleteEvent(eventId) {
    fetch('/delete-event', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: eventId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Etkinlik başarıyla silindi!');
            updateTable();
        } else {
            alert('Etkinlik silinirken bir hata oluştu.');
        }
    })
    .catch(error => console.error('Etkinlik silinirken hata oluştu:', error));
}

// Düzenleme butonuna tıklama olayını dinle
document.addEventListener('click', function (e) {
    if (e.target.closest('.btn-outline-primary')) {
        const button = e.target.closest('.btn-outline-primary');
        const row = button.closest('tr');
        const itemId = row.querySelector('td:first-child').textContent.trim();
        console.log("Duzenleme ID:",itemId);

        if (activeTab === 'calendars') {
            openEditCalendarModal(itemId);
        } else if (activeTab === 'events') {
            openEditEventModal(itemId);
        }
    }
});

// Takvim düzenleme modalını aç
function openEditCalendarModal(calendarId) {
    fetch(`/calendar/${calendarId}`)
        .then(response => response.json())
        .then(calendars => {
            if (calendars.length > 0) {
                const calendar = calendars[0]; // İlk elemanı al
                const modalTitle = document.getElementById('editCalendarModalLabel');
                const modalBody = document.getElementById('editCalendarModalBody');
                modalTitle.textContent = 'Takvim Düzenle';
                modalBody.innerHTML = `
                    <form id="editCalendarForm">
                        <div class="mb-3">
                            <label for="calendarName" class="form-label">Takvim Adı</label>
                            <input type="text" class="form-control" id="editCalendarName" value="${calendar.name}" required>
                        </div>
                    </form>
                `;
                const editModal = new bootstrap.Modal(document.getElementById('editCalendarModal'));
                editModal.show();

                // Form gönderildiğinde takvim güncelleme işlemi
                document.getElementById('editCalendarForm').addEventListener('submit', function (e) {
                    e.preventDefault();
                    const updatedCalendarName = document.getElementById('editCalendarName').value;
                    console.log("deneme:",updatedCalendarName);

                    fetch(`/update-calendar/${calendarId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ name: updatedCalendarName })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Takvim başarıyla güncellendi!');
                            editModal.hide();
                            updateTable();
                        } else {
                            alert('Takvim güncellenirken bir hata oluştu.');
                        }
                    })
                    .catch(error => console.error('Takvim güncellenirken hata oluştu:', error));
                });
            } else {
                console.error('Takvim bilgileri alınamadı.');
            }
        })
        .catch(error => console.error('Takvim bilgileri alınırken hata oluştu:', error));
}

// Etkinlik düzenleme modalını aç
function openEditEventModal(eventId) {
    fetch(`/event/${eventId}`)
        .then(response => response.json())
        .then(events => {
            if (events.length > 0) {
                const event = events[0];
                const modalTitle = document.getElementById('editEventModalLabel');
                const modalBody = document.getElementById('editEventModalBody');
                modalTitle.textContent = 'Etkinlik Düzenle';

                // Tarih formatını yyyy-MM-dd şekline dönüştür
                const formatDate = (dateString) => {
                    const date = new Date(dateString);
                    if (isNaN(date.getTime())) {
                        console.error('Geçersiz tarih:', dateString);
                        return ''; // Geçersiz tarih durumunda boş döndür
                    }
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                };

                modalBody.innerHTML = `
                    <form id="editEventForm">
                        <div class="mb-3">
                            <label for="updateEventName" class="form-label">Etkinlik Adı</label>
                            <input type="text" class="form-control" id="updateEventName" value="${event.title}" required>
                        </div>
                        <div class="mb-3">
                            <label for="updateStartDate" class="form-label">Başlangıç Tarihi</label>
                            <input type="date" class="form-control" id="updateStartDate" value="${formatDate(event.startDate)}" required>
                        </div>
                        <div class="mb-3">
                            <label for="updateEndDate" class="form-label">Bitiş Tarihi</label>
                            <input type="date" class="form-control" id="updateEndDate" value="${formatDate(event.finishDate)}" required>
                        </div>
                        <div class="mb-3">
                            <label for="updateStartTime" class="form-label">Başlangıç Saati</label>
                            <input type="time" class="form-control" id="updateStartTime" value="${event.startTime.substring(0, 5)}" required>
                        </div>
                        <div class="mb-3">
                            <label for="updateEndTime" class="form-label">Bitiş Saati</label>
                            <input type="time" class="form-control" id="updateEndTime" value="${event.finishTime.substring(0, 5)}" required>
                        </div>
                        <div class="mb-3">
                            <label for="updateCalendarSelect" class="form-label">Takvim Seç</label>
                            <select class="form-select" id="updateCalendarSelect" required>
                                <!-- Takvim seçenekleri JavaScript ile doldurulacak -->
                            </select>
                        </div>
                    </form>
                `;

                // Takvim seçeneklerini doldur
                loadCalendars(event.calendarId); // Takvim verilerini yükle ve mevcut takvimi seçili yap

                const editModal = new bootstrap.Modal(document.getElementById('editEventModal'));
                editModal.show();

                // Form gönderildiğinde etkinlik güncelleme işlemi
                document.getElementById('editEventForm').addEventListener('submit', function (e) {
                    e.preventDefault();
                    const updatedEventName = document.getElementById('updateEventName').value;
                    const updatedStartDate = document.getElementById('updateStartDate').value;
                    const updatedEndDate = document.getElementById('updateEndDate').value;
                    const updatedStartTime = document.getElementById('updateStartTime').value;
                    const updatedEndTime = document.getElementById('updateEndTime').value;
                    const updatedCalendarId = document.getElementById('updateCalendarSelect').value;

                    fetch(`/update-event/${eventId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            title: updatedEventName,
                            startDate: updatedStartDate,
                            finishDate: updatedEndDate,
                            startTime: updatedStartTime,
                            finishTime: updatedEndTime,
                            calendarId: updatedCalendarId
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Etkinlik başarıyla güncellendi!');
                            editModal.hide();
                            updateTable();
                        } else {
                            alert('Etkinlik güncellenirken bir hata oluştu.');
                        }
                    })
                    .catch(error => console.error('Etkinlik güncellenirken hata oluştu:', error));
                });
            } else {
                console.error('Etkinlik bilgileri alınamadı.');
            }
        })
        .catch(error => console.error('Etkinlik bilgileri alınırken hata oluştu:', error));
}

// Takvim verilerini yükle ve mevcut takviyi seçili yap
function loadCalendars(selectedCalendarId) {
    fetch('/calendar')
        .then(response => response.json())
        .then(calendars => {
            const calendarSelect = document.getElementById('updateCalendarSelect');
            calendarSelect.innerHTML = ''; // Önceki seçenekleri temizle
            calendars.forEach(calendar => {
                const option = document.createElement('option');
                option.value = calendar.id;
                option.textContent = calendar.name;
                if (calendar.id === selectedCalendarId) {
                    option.selected = true; // Mevcut takvim seçili yap
                }
                calendarSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Takvim verileri alınırken hata oluştu:', error));
}

document.addEventListener('DOMContentLoaded', function () {
    const addButton = document.getElementById('addButton');
    const addModal = new bootstrap.Modal(document.getElementById('addModal'));
    const addEventModal = new bootstrap.Modal(document.getElementById('addEventModal'));
    let activeTab = 'calendars'; // Varsayılan aktif sekme

    // Aktif sekmeye göre modal açma
    document.getElementById('adminTabs').addEventListener('shown.bs.tab', (e) => {
        activeTab = e.target.getAttribute('href').substring(1);
    });
    

    // Yeni etkinlik ekleme butonuna tıklama
    addButton.addEventListener('click', () => {
        console.log(activeTab);
        // Aktif sekmeye göre modal açma
        if (activeTab === 'calendars') {
            // Yeni Takvim Modalını Aç
            addModal.show();
        } else if (activeTab === 'events') {
            // Yeni Etkinlik Modalını Aç
            addEventModal.show();
            loadCalendars(); // Takvim verilerini yükle
        }
    });

    // Takvim ekleme
    document.getElementById('addCalendarForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const calendarName = document.getElementById('calendarName').value;

        fetch('/add-calendar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: calendarName }),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert('Takvim başarıyla eklendi.');
                addModal.hide();
                updateTable(); // Tabloyu güncelle
            } else {
                alert('Takvim eklenirken bir hata oluştu.');
            }
        })
        .catch((error) => console.error('Takvim ekleme hatası:', error));
    });

    // Takvim verilerini yükle
    function loadCalendars() {
        fetch('/calendar')
            .then((response) => response.json())
            .then((calendars) => {
                const calendarSelect = document.getElementById('addcalendarSelect');
                calendarSelect.innerHTML = ''; // Önceki seçenekleri temizle
                calendars.forEach((calendar) => {
                    const option = document.createElement('option');
                    option.value = calendar.id;
                    option.textContent = calendar.name;
                    calendarSelect.appendChild(option);
                });
            })
            .catch((error) => console.error('Takvim verileri alınırken hata oluştu:', error));
    }

    // Etkinlik ekleme
    document.getElementById('addEventForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const eventName = document.getElementById('addeventName').value;
        const startDate = document.getElementById('addstartDate').value;
        const finishDate = document.getElementById('addfinishDate').value;
        const startTime = document.getElementById('addstartTime').value;
        const finishTime = document.getElementById('addfinishTime').value;
        const calendarId = document.getElementById('addcalendarSelect').value;

        console.log(eventName);
        console.log(startDate);
        console.log(finishDate);
        console.log(startTime);
        console.log(finishTime);
        console.log(calendarId);

        // Boş alan kontrolü
        if (!eventName || !startDate || !finishDate || !startTime || !finishTime || !calendarId) {
            alert('Lütfen tüm alanları doldurun.');
            return;
        }

        fetch('/add-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: eventName,
                startDate: startDate,
                finishDate: finishDate,
                startTime: startTime,
                finishTime: finishTime,
                calendarId: calendarId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Etkinlik başarıyla eklendi!');
                addEventModal.hide(); // Modalı kapat
                location.reload(); // Sayfayı yenile
            } else {
                alert('Etkinlik eklenirken bir hata oluştu: ' + data.message);
            }
        })
        .catch(error => console.error('Etkinlik eklenirken hata oluştu:', error));
    });

    // Tabloyu güncelleme fonksiyonu (örnek olarak boş bırakıldı)
    function updateTable() {
        console.log('Tablo güncelleniyor...');
        // Burada tabloyu güncelleme işlemleri yapılabilir
    }
});

document.querySelector('.export-calendar').addEventListener('click', () => {
    const calendarId = document.getElementById('calendarDropdown').value; // Seçili takvim ID'sini al

    fetch(`/events/${calendarId}`)
        .then(response => response.json())
        .then(events => {
            let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\n";

            events.forEach(event => {
                const startDate = new Date(event.startDate);
                const finishDate = new Date(event.finishDate);

                icsContent += "BEGIN:VEVENT\n";
                icsContent += `SUMMARY:${event.title}\n`;
                icsContent += `DTSTART:${formatDateToICS(startDate)}\n`;
                icsContent += `DTEND:${formatDateToICS(finishDate)}\n`;
                icsContent += "END:VEVENT\n";
            });

            icsContent += "END:VCALENDAR";

            // Blob oluştur ve indirme işlemi
            const blob = new Blob([icsContent], { type: 'text/calendar' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'calendar.ics';
            a.click();
            URL.revokeObjectURL(url); // URL'yi serbest bırak
        })
        .catch(error => console.error('Etkinlik verileri alınırken hata oluştu:', error));
});

// Tarih formatını ICS formatına dönüştür
function formatDateToICS(date) {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"; // UTC formatında
}
