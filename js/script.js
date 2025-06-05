/**
 * تطبيق تلاجة الحاج أنور بكر - ملف JavaScript الرئيسي
 * يحتوي على جميع الميزات:
 * 1. إدارة العنابر
 * 2. إدارة العملاء
 * 3. عمليات الإدخال
 * 4. كشف العنابر مع البحث
 * 5. تقسيم العنابر إلى لواطات
 * 6. السايدبار المتجاوب
 * 7. مسح البيانات
 */

// ==================== فئة مساعدة للتخزين المحلي ====================
class StorageHelper {
    static get(key) {
        const data = localStorage.getItem(key);
        if (data) {
            return JSON.parse(data);
        }
        // قيم افتراضية مختلفة حسب نوع البيانات
        return key === 'roomLots' ? {} : []; // rooms and clients are arrays, roomLots is an object
    }

    static set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static update(key, callback) {
        const currentData = this.get(key);
        const newData = callback(currentData);
        this.set(key, newData);
        return newData;
    }
}

// ==================== تهيئة البيانات عند أول استخدام ====================
function initializeStorage() {
    if (!localStorage.getItem('rooms')) {
        StorageHelper.set('rooms', []);
    }
    if (!localStorage.getItem('clients')) {
        StorageHelper.set('clients', []);
    }
    if (!localStorage.getItem('entries')) {
        StorageHelper.set('entries', []);
    }
    if (!localStorage.getItem('roomLots')) {
        StorageHelper.set('roomLots', {});
    }
}

// ==================== السايدبار المتجاوب ====================
function setupMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    const mainContent = document.querySelector('.main-content'); // Get the main content element

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            // Add or remove the 'pushed' class from main-content
            if (mainContent) {
                mainContent.classList.toggle('pushed');
            }
        });

        // Close sidebar when clicking outside it or on a link (for better mobile experience)
        document.addEventListener('click', (event) => {
            // If sidebar is open AND click is NOT on sidebar AND click is NOT on menuToggle
            if (sidebar.classList.contains('open') &&
                !sidebar.contains(event.target) &&
                !menuToggle.contains(event.target)) {
                sidebar.classList.remove('open');
                if (mainContent) {
                    mainContent.classList.remove('pushed');
                }
            }
        });

        // Close sidebar when clicking on any link inside it
        sidebar.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                    if (mainContent) {
                        mainContent.classList.remove('pushed');
                    }
                }
            });
        });
    }
}

// ==================== تمييز العنصر النشط في السايدبار ====================
function highlightActiveLink() {
    const currentPath = window.location.pathname.split('/').pop(); // Get current file name
    const sidebarLinks = document.querySelectorAll('.sidebar ul li a');

    sidebarLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) {
            link.closest('li').classList.add('active');
        } else {
            link.closest('li').classList.remove('active');
        }
    });
}

// ==================== وظائف لوحة التحكم (Dashboard) ====================
function renderDashboardStats() {
    const totalRoomsSpan = document.getElementById('total-rooms');
    const totalClientsSpan = document.getElementById('total-clients');
    const todayEntriesSpan = document.getElementById('today-entries');

    if (totalRoomsSpan) {
        const rooms = StorageHelper.get('rooms');
        totalRoomsSpan.textContent = rooms.length;
    }

    if (totalClientsSpan) {
        const clients = StorageHelper.get('clients');
        totalClientsSpan.textContent = clients.length;
    }

    if (todayEntriesSpan) {
        const entries = StorageHelper.get('entries');
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const todayCount = entries.filter(entry => entry.date === today).length;
        todayEntriesSpan.textContent = todayCount;
    }
}

// ==================== وظائف إدارة العنابر (add-rooms.html) ====================
function setupAddRoomForm() {
    const addRoomForm = document.getElementById('add-room-form');
    if (addRoomForm) {
        addRoomForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const roomName = document.getElementById('room-name').value.trim();
            const floor = document.getElementById('floor').value;

            if (!roomName) {
                alert('الرجاء إدخال اسم العنبر.');
                return;
            }

            const rooms = StorageHelper.get('rooms');
            const newRoom = {
                id: Date.now().toString(), // Unique ID
                name: roomName,
                floor: floor,
                capacity: 0, // Initial capacity (bags)
                status: 'available' // available or occupied
            };
            rooms.push(newRoom);
            StorageHelper.set('rooms', rooms);

            alert('تم إضافة العنبر بنجاح!');
            addRoomForm.reset();
        });
    }
}

// ==================== وظائف العملاء (clients.html) ====================
function renderClientsTable() {
    const clientsTableBody = document.querySelector('#clients-table tbody');
    if (!clientsTableBody) return;

    clientsTableBody.innerHTML = '';
    const clients = StorageHelper.get('clients');

    clients.forEach(client => {
        const row = clientsTableBody.insertRow();
        row.insertCell().textContent = client.name;
        row.insertCell().textContent = client.phone1;
        row.insertCell().textContent = client.phone2 || 'لا يوجد';

        const actionsCell = row.insertCell();
        const editButton = document.createElement('button');
        editButton.innerHTML = '<i class="fas fa-edit"></i> تعديل';
        editButton.classList.add('btn-primary', 'btn-small');
        editButton.onclick = () => openEditClientModal(client.id);
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fas fa-trash"></i> حذف';
        deleteButton.classList.add('btn-danger', 'btn-small');
        deleteButton.onclick = () => deleteClient(client.id);
        actionsCell.appendChild(deleteButton);
    });
}

function setupAddClientForm() {
    const addClientForm = document.getElementById('add-client-form');
    const showAddClientFormBtn = document.getElementById('show-add-client-form-btn');
    const cancelClientBtn = document.getElementById('cancel-client-btn');
    const clientFormContainer = document.getElementById('client-form-container');

    if (showAddClientFormBtn) {
        showAddClientFormBtn.addEventListener('click', () => {
            clientFormContainer.style.display = 'block';
            addClientForm.reset();
            addClientForm.dataset.editing = 'false'; // Reset editing state
            document.getElementById('client-form-title').textContent = 'إضافة عميل جديد';
            document.getElementById('save-client-btn').innerHTML = '<i class="fas fa-save"></i> حفظ العميل';
        });
    }

    if (cancelClientBtn) {
        cancelClientBtn.addEventListener('click', () => {
            clientFormContainer.style.display = 'none';
        });
    }

    if (addClientForm) {
        addClientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('client-name').value.trim();
            const phone1 = document.getElementById('phone1').value.trim();
            const phone2 = document.getElementById('phone2').value.trim();
            const isEditing = addClientForm.dataset.editing === 'true';
            const clientId = addClientForm.dataset.clientId;

            if (!name || !phone1) {
                alert('الرجاء إدخال اسم العميل ورقم التليفون 1 على الأقل.');
                return;
            }

            if (isEditing) {
                StorageHelper.update('clients', (clients) =>
                    clients.map(c => c.id === clientId ? { ...c, name, phone1, phone2 } : c)
                );
                alert('تم تحديث العميل بنجاح!');
            } else {
                const newClient = {
                    id: Date.now().toString(),
                    name,
                    phone1,
                    phone2
                };
                StorageHelper.update('clients', (clients) => {
                    clients.push(newClient);
                    return clients;
                });
                alert('تم إضافة العميل بنجاح!');
            }

            clientFormContainer.style.display = 'none';
            renderClientsTable();
        });
    }
}

function openEditClientModal(clientId) {
    const clientFormContainer = document.getElementById('client-form-container');
    const addClientForm = document.getElementById('add-client-form');
    const clientFormTitle = document.getElementById('client-form-title');
    const saveClientBtn = document.getElementById('save-client-btn');

    const clients = StorageHelper.get('clients');
    const clientToEdit = clients.find(c => c.id === clientId);

    if (clientToEdit) {
        clientFormContainer.style.display = 'block';
        clientFormTitle.textContent = 'تعديل بيانات العميل';
        saveClientBtn.innerHTML = '<i class="fas fa-save"></i> تحديث العميل';

        document.getElementById('client-name').value = clientToEdit.name;
        document.getElementById('phone1').value = clientToEdit.phone1;
        document.getElementById('phone2').value = clientToEdit.phone2;

        addClientForm.dataset.editing = 'true';
        addClientForm.dataset.clientId = clientId;
    }
}

function deleteClient(clientId) {
    if (confirm('هل أنت متأكد أنك تريد حذف هذا العميل؟')) {
        StorageHelper.update('clients', (clients) => clients.filter(c => c.id !== clientId));
        // Optionally, check if any entries are linked to this client and warn/delete them
        alert('تم حذف العميل بنجاح!');
        renderClientsTable();
    }
}


// ==================== وظائف الإدخال (entry.html) ====================
function populateEntryFormDropdowns() {
    const clientSelect = document.getElementById('client');
    const roomSelect = document.getElementById('room');

    if (clientSelect) {
        const clients = StorageHelper.get('clients');
        clientSelect.innerHTML = '<option value="">اختر العميل</option>';
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            clientSelect.appendChild(option);
        });
    }

    if (roomSelect) {
        const rooms = StorageHelper.get('rooms');
        roomSelect.innerHTML = '<option value="">اختر العنبر</option>';
        rooms.forEach(room => {
            // Only show available rooms for new entries
            if (room.status === 'available' || room.id === roomSelect.dataset.selectedRoomId) { // Allow editing if room is already selected
                const option = document.createElement('option');
                option.value = room.id;
                option.textContent = `${room.name} (الدور ${room.floor})`;
                roomSelect.appendChild(option);
            }
        });
    }
}

function setupEntryForm() {
    const entryForm = document.getElementById('entry-form');
    if (entryForm) {
        entryForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const date = document.getElementById('entry-date').value;
            const bags = parseInt(document.getElementById('bags').value);
            const weight = parseFloat(document.getElementById('weight').value);
            const clientId = document.getElementById('client').value;
            const roomId = document.getElementById('room').value;
            const threadColor = document.getElementById('thread-color').value.trim();
            const notes = document.getElementById('notes').value.trim();

            if (!date || isNaN(bags) || bags <= 0 || isNaN(weight) || weight <= 0 || !clientId || !roomId) {
                alert('الرجاء تعبئة جميع الحقول الإلزامية بشكل صحيح (التاريخ، عدد الشكاير، الوزن، العميل، العنبر).');
                return;
            }

            const clients = StorageHelper.get('clients');
            const rooms = StorageHelper.get('rooms');
            const clientName = clients.find(c => c.id === clientId)?.name;
            const roomName = rooms.find(r => r.id === roomId)?.name;

            if (!clientName || !roomName) {
                alert('العميل أو العنبر المحدد غير موجود.');
                return;
            }

            const newEntry = {
                id: Date.now().toString(),
                date,
                bags,
                weight,
                clientId,
                clientName,
                roomId,
                roomName,
                threadColor,
                notes
            };

            StorageHelper.update('entries', (entries) => {
                entries.push(newEntry);
                return entries;
            });

            // Update room status to 'occupied' and capacity
            StorageHelper.update('rooms', (rooms) => {
                return rooms.map(room => {
                    if (room.id === roomId) {
                        const currentLots = StorageHelper.get('roomLots')[roomId] || [];
                        const currentRoomBags = currentLots.reduce((sum, lot) => sum + lot.bags, 0);
                        const newCapacity = currentRoomBags + bags;

                        return {
                            ...room,
                            status: 'occupied',
                            capacity: newCapacity // Sum of bags from entries + existing lots
                        };
                    }
                    return room;
                });
            });

            alert('تم حفظ الإدخال بنجاح!');
            entryForm.reset();
            populateEntryFormDropdowns(); // Re-populate to reflect updated room statuses
        });
    }
}

// ==================== وظائف كشف العنابر (report.html) ====================
function renderReportTable() {
    const reportTableBody = document.querySelector('#report-table tbody');
    const filterRoomSelect = document.getElementById('filter-room');
    const filterClientSelect = document.getElementById('filter-client');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const totalBagsSpan = document.getElementById('total-bags');
    const totalWeightSpan = document.getElementById('total-weight');

    if (!reportTableBody) return; // Exit if not on report page

    const entries = StorageHelper.get('entries');
    const rooms = StorageHelper.get('rooms');
    const clients = StorageHelper.get('clients');

    // Populate filter dropdowns if on report page
    if (filterRoomSelect) {
        filterRoomSelect.innerHTML = '<option value="">كل العنابر</option>';
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.id;
            option.textContent = room.name;
            filterRoomSelect.appendChild(option);
        });
    }

    if (filterClientSelect) {
        filterClientSelect.innerHTML = '<option value="">كل العملاء</option>';
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            filterClientSelect.appendChild(option);
        });
    }

    // Filter function
    const applyFilters = () => {
        reportTableBody.innerHTML = '';
        let filteredEntries = entries;

        const selectedRoomId = filterRoomSelect ? filterRoomSelect.value : '';
        const selectedClientId = filterClientSelect ? filterClientSelect.value : '';
        const startDate = startDateInput ? startDateInput.value : '';
        const endDate = endDateInput ? endDateInput.value : '';

        if (selectedRoomId) {
            filteredEntries = filteredEntries.filter(entry => entry.roomId === selectedRoomId);
        }
        if (selectedClientId) {
            filteredEntries = filteredEntries.filter(entry => entry.clientId === selectedClientId);
        }
        if (startDate) {
            filteredEntries = filteredEntries.filter(entry => entry.date >= startDate);
        }
        if (endDate) {
            filteredEntries = filteredEntries.filter(entry => entry.date <= endDate);
        }

        let currentTotalBags = 0;
        let currentTotalWeight = 0;

        filteredEntries.forEach(entry => {
            const row = reportTableBody.insertRow();
            row.insertCell().textContent = entry.date;
            row.insertCell().textContent = entry.clientName;
            row.insertCell().textContent = entry.roomName;
            row.insertCell().textContent = entry.bags;
            row.insertCell().textContent = entry.weight.toFixed(2); // Format weight
            row.insertCell().textContent = entry.threadColor || 'لا يوجد';
            row.insertCell().textContent = entry.notes || 'لا يوجد';

            const actionsCell = row.insertCell();
            const editButton = document.createElement('button');
            editButton.innerHTML = '<i class="fas fa-edit"></i> تعديل';
            editButton.classList.add('btn-primary', 'btn-small');
            editButton.onclick = () => openEditEntryModal(entry.id);
            actionsCell.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<i class="fas fa-trash"></i> حذف';
            deleteButton.classList.add('btn-danger', 'btn-small');
            deleteButton.onclick = () => deleteEntry(entry.id);
            actionsCell.appendChild(deleteButton);

            currentTotalBags += entry.bags;
            currentTotalWeight += entry.weight;
        });

        if (totalBagsSpan) totalBagsSpan.textContent = currentTotalBags;
        if (totalWeightSpan) totalWeightSpan.textContent = currentTotalWeight.toFixed(2);
    };

    // Attach event listeners for filters
    if (document.getElementById('apply-filters-btn')) {
        document.getElementById('apply-filters-btn').addEventListener('click', applyFilters);
    }
    // Initial render
    applyFilters();

    // Setup Print Button
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            const printContents = document.querySelector('.form-container').innerHTML; // Or the table itself
            const originalContents = document.body.innerHTML;

            document.body.innerHTML = printContents; // Temporarily change body for printing
            window.print(); // Print
            document.body.innerHTML = originalContents; // Restore original content
            location.reload(); // Reload to re-attach event listeners etc.
        });
    }
}

function openEditEntryModal(entryId) {
    const entries = StorageHelper.get('entries');
    const entryToEdit = entries.find(entry => entry.id === entryId);

    if (!entryToEdit) {
        alert('الإدخال غير موجود.');
        return;
    }

    // Create a modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.classList.add('modal-overlay');

    modalOverlay.innerHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-edit"></i> تعديل الإدخال</h3>
            <form id="edit-entry-form">
                <div class="form-group">
                    <label for="edit-entry-date">التاريخ:</label>
                    <input type="date" id="edit-entry-date" value="${entryToEdit.date}" required>
                </div>
                <div class="form-group">
                    <label for="edit-bags">عدد الشكاير:</label>
                    <input type="number" id="edit-bags" min="1" value="${entryToEdit.bags}" required>
                </div>
                <div class="form-group">
                    <label for="edit-weight">الوزن (طن):</label>
                    <input type="number" id="edit-weight" step="0.01" min="0.01" value="${entryToEdit.weight}" required>
                </div>
                <div class="form-group">
                    <label for="edit-client">اسم العميل:</label>
                    <select id="edit-client" required></select>
                </div>
                <div class="form-group">
                    <label for="edit-room">اسم العنبر:</label>
                    <select id="edit-room" required></select>
                </div>
                <div class="form-group">
                    <label for="edit-thread-color">لون الخيط:</label>
                    <input type="text" id="edit-thread-color" value="${entryToEdit.threadColor || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-notes">ملاحظات:</label>
                    <textarea id="edit-notes" rows="3">${entryToEdit.notes || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary"><i class="fas fa-save"></i> حفظ التعديلات</button>
                    <button type="button" class="btn-secondary" id="cancel-edit-entry"><i class="fas fa-times"></i> إلغاء</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    // Populate dropdowns in the modal
    const editClientSelect = document.getElementById('edit-client');
    const editRoomSelect = document.getElementById('edit-room');

    const clients = StorageHelper.get('clients');
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        if (client.id === entryToEdit.clientId) {
            option.selected = true;
        }
        editClientSelect.appendChild(option);
    });

    const rooms = StorageHelper.get('rooms');
    rooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.id;
        option.textContent = `${room.name} (الدور ${room.floor})`;
        if (room.id === entryToEdit.roomId) {
            option.selected = true;
        }
        editRoomSelect.appendChild(option);
    });


    // Handle form submission inside modal
    document.getElementById('edit-entry-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const updatedDate = document.getElementById('edit-entry-date').value;
        const updatedBags = parseInt(document.getElementById('edit-bags').value);
        const updatedWeight = parseFloat(document.getElementById('edit-weight').value);
        const updatedClientId = document.getElementById('edit-client').value;
        const updatedRoomId = document.getElementById('edit-room').value;
        const updatedThreadColor = document.getElementById('edit-thread-color').value.trim();
        const updatedNotes = document.getElementById('edit-notes').value.trim();

        if (!updatedDate || isNaN(updatedBags) || updatedBags <= 0 || isNaN(updatedWeight) || updatedWeight <= 0 || !updatedClientId || !updatedRoomId) {
            alert('الرجاء تعبئة جميع الحقول الإلزامية بشكل صحيح.');
            return;
        }

        const updatedClientName = clients.find(c => c.id === updatedClientId)?.name;
        const updatedRoomName = rooms.find(r => r.id === updatedRoomId)?.name;

        // Find the original entry to get old room and bags for capacity correction
        const originalEntry = entries.find(entry => entry.id === entryId);
        const oldRoomId = originalEntry.roomId;
        const oldBags = originalEntry.bags;

        StorageHelper.update('entries', (allEntries) => {
            return allEntries.map(entry => {
                if (entry.id === entryId) {
                    return {
                        ...entry,
                        date: updatedDate,
                        bags: updatedBags,
                        weight: updatedWeight,
                        clientId: updatedClientId,
                        clientName: updatedClientName,
                        roomId: updatedRoomId,
                        roomName: updatedRoomName,
                        threadColor: updatedThreadColor,
                        notes: updatedNotes
                    };
                }
                return entry;
            });
        });

        // Update room capacities if room or bags changed
        if (oldRoomId !== updatedRoomId || oldBags !== updatedBags) {
            StorageHelper.update('rooms', (allRooms) => {
                return allRooms.map(room => {
                    if (room.id === oldRoomId) { // Decrease old room capacity
                        return { ...room, capacity: room.capacity - oldBags };
                    }
                    if (room.id === updatedRoomId) { // Increase new room capacity
                        return { ...room, capacity: room.capacity + updatedBags, status: 'occupied' };
                    }
                    return room;
                }).map(room => {
                    // Check if old room is now empty and set status to available
                    if (room.id === oldRoomId && room.capacity <= 0) {
                        return { ...room, status: 'available', capacity: 0 };
                    }
                    return room;
                });
            });
        }


        modalOverlay.remove();
        alert('تم تحديث الإدخال بنجاح!');
        renderReportTable(); // Re-render table to reflect changes
    });

    document.getElementById('cancel-edit-entry').addEventListener('click', () => {
        modalOverlay.remove();
    });
}

function deleteEntry(entryId) {
    if (confirm('هل أنت متأكد أنك تريد حذف هذا الإدخال؟')) {
        const entries = StorageHelper.get('entries');
        const entryToDelete = entries.find(entry => entry.id === entryId);

        if (entryToDelete) {
            const roomId = entryToDelete.roomId;
            const bagsToDelete = entryToDelete.bags;

            StorageHelper.update('entries', (allEntries) => allEntries.filter(entry => entry.id !== entryId));

            // Decrease room capacity and potentially change status
            StorageHelper.update('rooms', (allRooms) => {
                return allRooms.map(room => {
                    if (room.id === roomId) {
                        const newCapacity = room.capacity - bagsToDelete;
                        return {
                            ...room,
                            capacity: Math.max(0, newCapacity), // Capacity cannot go below 0
                            status: newCapacity <= 0 ? 'available' : room.status // Change to available if empty
                        };
                    }
                    return room;
                });
            });
            alert('تم حذف الإدخال بنجاح!');
            renderReportTable();
        }
    }
}


// ==================== وظائف حالة العنابر (rooms-status.html) ====================
function renderRoomsStatusGrid() {
    const roomsGrid = document.getElementById('rooms-grid');
    const floorFilter = document.getElementById('floor-filter');
    const statusFilter = document.getElementById('status-filter');
    if (!roomsGrid) return; // Exit if not on rooms-status page

    const rooms = StorageHelper.get('rooms');

    const applyFilters = () => {
        roomsGrid.innerHTML = '';
        let filteredRooms = rooms;

        const selectedFloor = floorFilter ? floorFilter.value : '';
        const selectedStatus = statusFilter ? statusFilter.value : '';

        if (selectedFloor) {
            filteredRooms = filteredRooms.filter(room => room.floor === selectedFloor);
        }
        if (selectedStatus) {
            filteredRooms = filteredRooms.filter(room => room.status === selectedStatus);
        }

        if (filteredRooms.length === 0) {
            roomsGrid.innerHTML = '<p class="no-results">لا توجد عنابر مطابقة للمعايير المحددة.</p>';
            return;
        }

        filteredRooms.sort((a, b) => {
            // Sort by floor, then by room name
            if (a.floor !== b.floor) {
                return parseInt(a.floor) - parseInt(b.floor);
            }
            return a.name.localeCompare(b.name);
        });

        filteredRooms.forEach(room => {
            const roomCard = document.createElement('div');
            roomCard.classList.add('room-card', room.status);
            roomCard.dataset.roomId = room.id;
            roomCard.onclick = () => window.location.href = `room-division.html?id=${room.id}`;

            roomCard.innerHTML = `
                <h3>${room.name}</h3>
                <p>الدور: ${room.floor}</p>
                <p>الشكاير: ${room.capacity || 0}</p>
                <span class="status">${room.status === 'available' ? 'متاح' : 'مشغول'}</span>
            `;
            roomsGrid.appendChild(roomCard);
        });
    };

    // Attach event listeners
    if (floorFilter) floorFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    // Initial render
    applyFilters();
}

// ==================== وظائف تقسيم العنابر (room-division.html) ====================
function setupRoomDivisionPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id');

    if (!roomId) {
        alert('لم يتم تحديد رقم العنبر.');
        window.location.href = 'rooms-status.html'; // Redirect if no room ID
        return;
    }

    const rooms = StorageHelper.get('rooms');
    const currentRoom = rooms.find(room => room.id === roomId);

    if (!currentRoom) {
        alert('العنبر غير موجود.');
        window.location.href = 'rooms-status.html';
        return;
    }

    document.getElementById('room-name-display').textContent = currentRoom.name;
    document.getElementById('room-floor-display').textContent = currentRoom.floor;
    document.getElementById('room-status-display').textContent = currentRoom.status === 'available' ? 'متاح' : 'مشغول';
    document.getElementById('room-capacity-display').textContent = currentRoom.capacity || 0;

    renderRoomLots(roomId);
    setupAddLotForm(roomId);
}

function renderRoomLots(roomId) {
    const lotsList = document.getElementById('lots-list');
    if (!lotsList) return;

    lotsList.innerHTML = '';
    const roomLots = StorageHelper.get('roomLots');
    const lots = roomLots[roomId] || [];

    if (lots.length === 0) {
        lotsList.innerHTML = '<tr><td colspan="3">لا توجد لواطات لهذا العنبر بعد.</td></tr>';
        return;
    }

    lots.forEach(lot => {
        const row = lotsList.insertRow();
        row.insertCell().textContent = lot.number;
        row.insertCell().textContent = lot.bags;

        const actionsCell = row.insertCell();
        const editButton = document.createElement('button');
        editButton.innerHTML = '<i class="fas fa-edit"></i> تعديل';
        editButton.classList.add('btn-primary', 'btn-small');
        editButton.onclick = () => openEditLotModal(roomId, lot.id);
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fas fa-trash"></i> حذف';
        deleteButton.classList.add('btn-danger', 'btn-small');
        deleteButton.onclick = () => deleteLot(roomId, lot.id);
        actionsCell.appendChild(deleteButton);
    });
}

function setupAddLotForm(roomId) {
    const addLotForm = document.getElementById('add-lot-form');
    if (addLotForm) {
        addLotForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const lotNumber = parseInt(document.getElementById('lot-number').value);
            const lotBags = parseInt(document.getElementById('lot-bags').value);

            if (isNaN(lotNumber) || lotNumber <= 0 || isNaN(lotBags) || lotBags <= 0) {
                alert('الرجاء إدخال رقم اللوط وعدد الشكاير بشكل صحيح.');
                return;
            }

            const roomLots = StorageHelper.get('roomLots');
            const currentLots = roomLots[roomId] || [];

            // Check for duplicate lot number
            if (currentLots.some(lot => lot.number === lotNumber)) {
                alert('رقم اللوط هذا موجود بالفعل في العنبر. الرجاء إدخال رقم مختلف.');
                return;
            }

            const newLot = {
                id: Date.now().toString(),
                number: lotNumber,
                bags: lotBags
            };

            currentLots.push(newLot);
            roomLots[roomId] = currentLots;
            StorageHelper.set('roomLots', roomLots);

            updateRoomCapacity(roomId); // Update room's total capacity
            renderRoomLots(roomId); // Re-render lots table
            addLotForm.reset();
            alert('تم إضافة اللوط بنجاح!');
        });
    }
}

function openEditLotModal(currentRoomId, lotId) {
    const roomLots = StorageHelper.get('roomLots');
    const lots = roomLots[currentRoomId] || [];
    const lotToEdit = lots.find(lot => lot.id === lotId);

    if (!lotToEdit) {
        alert('اللوط غير موجود.');
        return;
    }

    const modalOverlay = document.createElement('div');
    modalOverlay.classList.add('modal-overlay');

    modalOverlay.innerHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-edit"></i> تعديل اللوط</h3>
            <form id="edit-lot-form">
                <div class="form-group">
                    <label for="edit-lot-number">رقم اللوط:</label>
                    <input type="number" id="edit-lot-number" min="1" value="${lotToEdit.number}" required>
                </div>
                <div class="form-group">
                    <label for="edit-lot-bags">عدد الشكاير:</label>
                    <input type="number" id="edit-lot-bags" min="1" value="${lotToEdit.bags}" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary"><i class="fas fa-save"></i> حفظ التعديلات</button>
                    <button type="button" class="btn-secondary" id="cancel-edit-lot"><i class="fas fa-times"></i> إلغاء</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    document.getElementById('edit-lot-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const updatedLotNumber = parseInt(document.getElementById('edit-lot-number').value);
        const updatedLotBags = parseInt(document.getElementById('edit-lot-bags').value);

        if (isNaN(updatedLotNumber) || updatedLotNumber <= 0 || isNaN(updatedLotBags) || updatedLotBags <= 0) {
            alert('الرجاء إدخال رقم اللوط وعدد الشكاير بشكل صحيح.');
            return;
        }

        // Check for duplicate lot number, excluding the current lot being edited
        if (lots.some(lot => lot.number === updatedLotNumber && lot.id !== lotId)) {
            alert('رقم اللوط هذا موجود بالفعل في العنبر. الرجاء إدخال رقم مختلف.');
            return;
        }

        StorageHelper.update('roomLots', (allRoomLots) => {
            allRoomLots[currentRoomId] = (allRoomLots[currentRoomId] || []).map(lot =>
                lot.id === lotId ? { ...lot, number: updatedLotNumber, bags: updatedLotBags } : lot
            );
            return allRoomLots;
        });

        updateRoomCapacity(currentRoomId);
        modalOverlay.remove();
        renderRoomLots(currentRoomId);
        alert('تم تحديث اللوط بنجاح');
    });

    document.getElementById('cancel-edit-lot').addEventListener('click', () =>
        modalOverlay.remove()
    );
}


function deleteLot(roomId, lotId) {
    if (confirm('هل أنت متأكد أنك تريد حذف هذا اللوط؟')) {
        StorageHelper.update('roomLots', (roomLots) => {
            roomLots[roomId] = (roomLots[roomId] || []).filter(lot => lot.id !== lotId);
            return roomLots;
        });
        updateRoomCapacity(roomId); // Recalculate room capacity
        renderRoomLots(roomId);
        alert('تم حذف اللوط بنجاح!');
    }
}

function updateRoomCapacity(roomId) {
    const totalBags = StorageHelper.get('roomLots')[roomId]?.reduce(
        (sum, lot) => sum + lot.bags, 0
    ) || 0;

    StorageHelper.update('rooms', (rooms) =>
        rooms.map(room =>
            room.id === roomId ? {
                ...room,
                capacity: totalBags,
                status: totalBags > 0 ? 'occupied' : 'available'
            } : room
        )
    );

    // If on room-division page, update display
    const roomCapacityDisplay = document.getElementById('room-capacity-display');
    const roomStatusDisplay = document.getElementById('room-status-display');
    if (roomCapacityDisplay) {
        roomCapacityDisplay.textContent = totalBags;
    }
    if (roomStatusDisplay) {
        roomStatusDisplay.textContent = totalBags > 0 ? 'مشغول' : 'متاح';
    }
}


// ==================== زر مسح البيانات ====================
function setupClearDataButton() {
    const clearDataBtn = document.getElementById('clear-data-btn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            if (confirm('هل أنت متأكد أنك تريد مسح جميع البيانات (العنابر، العملاء، الإدخالات، اللواطات)؟ هذا الإجراء لا يمكن التراجع عنه.')) {
                localStorage.clear();
                alert('تم مسح جميع البيانات بنجاح!');
                window.location.reload(); // Reload the page to reset the application
            }
        });
    }
}

// ==================== تهيئة التطبيق عند تحميل DOM ====================
document.addEventListener('DOMContentLoaded', function() {
    // 1. تهيئة البيانات الأساسية في localStorage
    initializeStorage();

    // 2. تفعيل القائمة المنسدلة للشاشات الصغيرة
    setupMobileMenu();

    // 3. تمييز العنصر النشط في السايدبار
    highlightActiveLink();

    // 4. تحميل وعرض البيانات عند الحاجة (اعتمادًا على الصفحة الحالية)
    if (document.getElementById('total-rooms')) {
        renderDashboardStats();
    }
    if (document.getElementById('add-room-form')) {
        setupAddRoomForm();
    }
    if (document.getElementById('clients-table')) {
        setupAddClientForm(); // Setup form for adding/editing clients
        renderClientsTable();
    }
    if (document.getElementById('entry-form')) {
        populateEntryFormDropdowns();
        setupEntryForm();
    }
    if (document.getElementById('report-table')) {
        renderReportTable(); // This function also sets up filters
    }
    if (document.getElementById('rooms-grid')) {
        renderRoomsStatusGrid(); // This function also sets up filters
    }
    if (window.location.pathname.includes('room-division.html')) {
        setupRoomDivisionPage();
    }

    // 5. إعداد زر مسح البيانات (إذا كان موجودًا في الصفحة)
    setupClearDataButton();
});