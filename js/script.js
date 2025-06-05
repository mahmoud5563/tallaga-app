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
 * 8. التحكم اليدوي في حالة العنبر (متاح/مشغول)
 */

// ==================== فئة مساعدة للتخزين المحلي ====================
class StorageHelper {
    static get(key) {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error(`Error parsing localStorage key "${key}":`, e);
                // ارجع قيمة افتراضية في حالة وجود خطأ في تحليل البيانات
                return key === 'roomLots' ? {} : [];
            }
        }
        // قيم افتراضية مختلفة حسب نوع البيانات
        return key === 'roomLots' ? {} : [];
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
    // تهيئة roomLots إذا لم تكن موجودة، لتجنب الأخطاء
    if (!localStorage.getItem('roomLots')) {
        StorageHelper.set('roomLots', {});
    }
}

// ==================== السايدبار المتجاوب ====================
function setupMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    const mainContent = document.querySelector('.main-content');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            if (mainContent) {
                mainContent.classList.toggle('pushed');
            }
        });

        document.addEventListener('click', (event) => {
            if (sidebar.classList.contains('open') &&
                !sidebar.contains(event.target) &&
                !menuToggle.contains(event.target)) {
                sidebar.classList.remove('open');
                if (mainContent) {
                    mainContent.classList.remove('pushed');
                }
            }
        });

        // إغلاق السايدبار عند النقر على رابط (لتحسين تجربة الموبايل)
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
    const currentPath = window.location.pathname.split('/').pop();
    const sidebarLinks = document.querySelectorAll('.sidebar ul li a');

    sidebarLinks.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop(); // تأكد من مقارنة اسم الملف فقط
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
        const today = new Date().toISOString().slice(0, 10);
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
            // تحقق من عدم وجود عنبر بنفس الاسم والدور بالفعل (اختياري)
            if (rooms.some(room => room.name === roomName && room.floor === floor)) {
                alert('يوجد عنبر بنفس الاسم والدور بالفعل.');
                return;
            }

            const newRoom = {
                id: Date.now().toString(), // معرف فريد للعنبر
                name: roomName,
                floor: floor,
                capacity: 0, // السعة التلقائية (عدد الشكاير) من الإدخالات
                totalWeight: 0, // الوزن الكلي التلقائي من الإدخالات
                status: 'available', // الحالة التلقائية (تعتمد على capacity)
                manualStatus: 'available' // الحالة اليدوية: متاح أو مشغول، ولها الأولوية في العرض
            };
            rooms.push(newRoom);
            StorageHelper.set('rooms', rooms);

            alert('تم إضافة العنبر بنجاح!');
            addRoomForm.reset();
            renderDashboardStats(); // تحديث إحصائيات لوحة التحكم

            // تحديث عرض العنابر في صفحة حالة العنابر إذا كانت مرئية
            if (document.getElementById('rooms-grid')) {
                renderRoomsStatusGrid();
            }
            // تحديث عرض العنابر في جدول صفحة إضافة العنابر
            renderAddRoomsTable();

            // تحديث قوائم اختيار العنبر في صفحات الإدخال والتقارير إذا كانت موجودة
            populateEntryFormDropdowns();
            renderReportTable();
            renderRoomsList(); // إذا كنت تستخدم صفحة تقسيم العنابر
        });
    }
}

// دالة لعرض العنابر في جدول صفحة إضافة العنابر
function renderAddRoomsTable() {
    const roomsTableBody = document.querySelector('#rooms-table tbody');
    if (!roomsTableBody) return;

    roomsTableBody.innerHTML = '';
    const rooms = StorageHelper.get('rooms');

    if (rooms.length === 0) {
        roomsTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">لا توجد عنابر مضافة بعد.</td></tr>';
        return;
    }

    rooms.forEach(room => {
        const row = roomsTableBody.insertRow();
        row.insertCell().textContent = room.name;
        row.insertCell().textContent = `الدور ${room.floor}`;

        const actionsCell = row.insertCell();
        const editButton = document.createElement('button');
        editButton.innerHTML = '<i class="fas fa-edit"></i> تعديل';
        editButton.classList.add('btn-primary', 'btn-small');
        editButton.onclick = () => openEditRoomModal(room.id);
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fas fa-trash"></i> حذف';
        deleteButton.classList.add('btn-danger', 'btn-small');
        deleteButton.onclick = () => deleteRoom(room.id);
        actionsCell.appendChild(deleteButton);
    });
}

function openEditRoomModal(roomId) {
    const roomToEdit = StorageHelper.get('rooms').find(room => room.id === roomId);
    if (!roomToEdit) {
        alert('العنبر غير موجود.');
        return;
    }

    const modal = document.getElementById('edit-room-modal');
    const editRoomNameInput = document.getElementById('edit-room-name');
    const editFloorSelect = document.getElementById('edit-floor');
    const editRoomIdInput = document.getElementById('edit-room-id');

    editRoomNameInput.value = roomToEdit.name;
    editFloorSelect.value = roomToEdit.floor;
    editRoomIdInput.value = roomToEdit.id; // لتخزين معرف العنبر الذي يتم تعديله

    modal.style.display = 'flex'; // إظهار المودال

    // إزالة أي مستمعي أحداث سابقين لتجنب التكرار
    const editRoomForm = document.getElementById('edit-room-form');
    // لكي نضمن إزالة المستمعين القدامى، من الأفضل استخدام دالة مسماة أو cloneNode(true)
    // هنا، سنعيد تعيين onsubmit و onclick فقط
    editRoomForm.onsubmit = null;
    document.getElementById('cancel-edit-room-btn').onclick = null;


    // إضافة مستمع حدث الحفظ للمودال
    editRoomForm.onsubmit = function(e) {
        e.preventDefault();
        
        const updatedRoomName = editRoomNameInput.value.trim();
        const updatedFloor = editFloorSelect.value;
        const roomIdToUpdate = editRoomIdInput.value;

        if (!updatedRoomName) {
            alert('الرجاء إدخال اسم العنبر.');
            return;
        }

        // التحقق من عدم وجود عنبر آخر بنفس الاسم والدور (باستثناء العنبر الذي يتم تعديله)
        const rooms = StorageHelper.get('rooms');
        if (rooms.some(room => room.name === updatedRoomName && room.floor === updatedFloor && room.id !== roomIdToUpdate)) {
            alert('يوجد عنبر آخر بنفس الاسم والدور بالفعل.');
            return;
        }

        StorageHelper.update('rooms', (rooms) =>
            rooms.map(room =>
                room.id === roomIdToUpdate ? { ...room, name: updatedRoomName, floor: updatedFloor } : room
            )
        );

        modal.style.display = 'none'; // إخفاء المودال
        alert('تم تحديث العنبر بنجاح!');
        renderAddRoomsTable(); // تحديث عرض الجدول في صفحة إضافة العنابر
        if (document.getElementById('rooms-grid')) {
            renderRoomsStatusGrid(); // تحديث عرض العنابر في صفحة حالة العنابر
        }
        populateEntryFormDropdowns(); // تحديث قوائم العنبر في صفحات أخرى
        renderReportTable();
        renderRoomsList(); // لتحديث قائمة العنابر في تقسيم اللواطات
    };

    // إضافة مستمع حدث الإلغاء للمودال
    document.getElementById('cancel-edit-room-btn').onclick = () => {
        modal.style.display = 'none'; // إخفاء المودال
    };
}


function deleteRoom(roomId) {
    if (confirm('هل أنت متأكد أنك تريد حذف هذا العنبر؟ سيتم حذف جميع إدخالاته المتعلقة به.')) {
        // حذف العنبر نفسه
        StorageHelper.update('rooms', (rooms) => rooms.filter(room => room.id !== roomId));

        // حذف الإدخالات المتعلقة بهذا العنبر
        StorageHelper.update('entries', (entries) => entries.filter(entry => entry.roomId !== roomId));

        // حذف اللواطات المتعلقة بهذا العنبر (إذا كنت تستخدمها)
        StorageHelper.update('roomLots', (roomLots) => {
            const newRoomLots = { ...roomLots };
            delete newRoomLots[roomId];
            return newRoomLots;
        });


        alert('تم حذف العنبر وجميع إدخالاته ولواطاته بنجاح!');
        renderAddRoomsTable(); // تحديث عرض الجدول في صفحة إضافة العنابر
        renderDashboardStats(); // تحديث إحصائيات لوحة التحكم
        if (document.getElementById('rooms-grid')) {
            renderRoomsStatusGrid(); // تحديث عرض العنابر في صفحة حالة العنابر
        }
        populateEntryFormDropdowns(); // تحديث قوائم العنبر في صفحات أخرى
        renderReportTable();
        renderRoomsList(); // لتحديث قائمة العنابر في تقسيم اللواطات
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
            addClientForm.dataset.editing = 'false';
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

            // التحقق من تكرار رقم التليفون 1 (اختياري)
            const clients = StorageHelper.get('clients');
            if (clients.some(c => c.phone1 === phone1 && c.id !== clientId)) {
                alert('يوجد عميل آخر مسجل بنفس رقم التليفون 1.');
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
            renderDashboardStats();
            populateEntryFormDropdowns(); // تحديث قائمة العملاء في صفحة الإدخال
            renderReportTable(); // تحديث قائمة العملاء في صفحة التقارير
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
    if (confirm('هل أنت متأكد أنك تريد حذف هذا العميل؟ سيتم حذف جميع إدخالاته المتعلقة بالعنابر.')) {
        StorageHelper.update('clients', (clients) => clients.filter(c => c.id !== clientId));

        // حذف الإدخالات المتعلقة بهذا العميل
        const entries = StorageHelper.get('entries');
        const affectedRooms = new Set(); // لتتبع العنابر التي تأثرت لحساب سعتها لاحقًا
        entries.filter(entry => entry.clientId === clientId).forEach(entry => affectedRooms.add(entry.roomId));

        StorageHelper.update('entries', (entries) => entries.filter(entry => entry.clientId !== clientId));

        // إعادة حساب سعة العنابر المتأثرة
        affectedRooms.forEach(roomId => updateRoomCapacity(roomId));

        alert('تم حذف العميل وجميع إدخالاته بنجاح!');
        renderClientsTable();
        renderDashboardStats();
        populateEntryFormDropdowns(); // تحديث قوائم العملاء في صفحات أخرى
        renderReportTable();
        if (document.getElementById('rooms-grid')) {
            renderRoomsStatusGrid(); // تحديث عرض حالة العنابر
        }
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
            const option = document.createElement('option');
            option.value = room.id;
            // يمكن إضافة الحالة التلقائية أو اليدوية للعنبر هنا للمساعدة في الاختيار
            const displayStatus = room.manualStatus || room.status;
            option.textContent = `${room.name} (الدور ${room.floor}) - (${displayStatus === 'available' ? 'متاح' : 'مشغول'})`;
            roomSelect.appendChild(option);
        });
    }
}

function setupEntryForm() {
    const entryForm = document.getElementById('entry-form');
    if (entryForm) {
        entryForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const date = document.getElementById('entry-date').value;
            const bags = parseInt(document.getElementById('number-of-bags').value);
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

            // تحديث سعة العنبر والوزن الكلي (تلقائياً)
            updateRoomCapacity(roomId);

            alert('تم حفظ الإدخال بنجاح!');
            entryForm.reset();
            populateEntryFormDropdowns();
            renderDashboardStats();
            renderReportTable();
            if (document.getElementById('rooms-grid')) {
                renderRoomsStatusGrid(); // تحديث عرض حالة العنابر
            }
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

    if (!reportTableBody) return;

    const entries = StorageHelper.get('entries');
    const rooms = StorageHelper.get('rooms');
    const clients = StorageHelper.get('clients');

    // ملء فلاتر العنابر والعملاء
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

        // فرز الإدخالات حسب التاريخ (أحدث أولاً)
        filteredEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

        filteredEntries.forEach(entry => {
            const row = reportTableBody.insertRow();
            row.insertCell().textContent = entry.date;
            row.insertCell().textContent = entry.clientName;
            row.insertCell().textContent = entry.roomName;
            row.insertCell().textContent = entry.bags;
            row.insertCell().textContent = entry.weight.toFixed(2);
            row.insertCell().textContent = entry.threadColor || 'لا يوجد';
            row.insertCell().textContent = entry.notes || 'لا يوجد';

            const actionsCell = row.insertCell();
            actionsCell.classList.add('actions-cell'); // أضف كلاس لتسهيل إخفائها للطباعة
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

    if (document.getElementById('apply-filters-btn')) {
        document.getElementById('apply-filters-btn').addEventListener('click', applyFilters);
    }
    applyFilters(); // تطبيق الفلاتر عند تحميل الصفحة لأول مرة

    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            // إخفاء الأزرار والإجراءات غير الضرورية للطباعة
            const originalActions = document.querySelectorAll('#report-table .actions-cell, #report-table .btn-primary, #report-table .btn-danger');
            originalActions.forEach(el => el.style.display = 'none');
            const originalFilters = document.querySelector('.filters');
            if (originalFilters) originalFilters.style.display = 'none';
            const originalPrintBtn = document.getElementById('print-btn');
            if (originalPrintBtn) originalPrintBtn.style.display = 'none';
            const originalSummary = document.querySelector('.report-summary');
            if (originalSummary) originalSummary.style.display = 'none';


            window.print(); // طباعة الصفحة

            // إعادة إظهار العناصر بعد الطباعة
            originalActions.forEach(el => el.style.display = '');
            if (originalFilters) originalFilters.style.display = '';
            if (originalPrintBtn) originalPrintBtn.style.display = '';
            if (originalSummary) originalSummary.style.display = '';

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
        const displayStatus = room.manualStatus || room.status; // عرض الحالة اليدوية أو التلقائية
        option.textContent = `${room.name} (الدور ${room.floor}) - (${displayStatus === 'available' ? 'متاح' : 'مشغول'})`;
        if (room.id === entryToEdit.roomId) {
            option.selected = true;
        }
        editRoomSelect.appendChild(option);
    });


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

        const originalEntry = entries.find(entry => entry.id === entryId);
        const oldRoomId = originalEntry.roomId; // العنبر القديم قبل التعديل

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

        // إعادة حساب سعة العنبر القديم والعنبر الجديد إذا تم تغيير العنبر
        if (oldRoomId !== updatedRoomId) {
            updateRoomCapacity(oldRoomId);
            updateRoomCapacity(updatedRoomId);
        } else {
            // فقط تحديث سعة العنبر إذا تغيرت عدد الشكاير أو الوزن
            if (originalEntry.bags !== updatedBags || originalEntry.weight !== updatedWeight) {
                updateRoomCapacity(updatedRoomId);
            }
        }

        modalOverlay.remove();
        alert('تم تحديث الإدخال بنجاح!');
        renderReportTable();
        renderDashboardStats();
        if (document.getElementById('rooms-grid')) {
            renderRoomsStatusGrid();
        }
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

            StorageHelper.update('entries', (allEntries) => allEntries.filter(entry => entry.id !== entryId));

            // إعادة حساب سعة العنبر المتأثر
            updateRoomCapacity(roomId);

            alert('تم حذف الإدخال بنجاح!');
            renderReportTable();
            renderDashboardStats();
            if (document.getElementById('rooms-grid')) {
                renderRoomsStatusGrid();
            }
        }
    }
}

// ==================== وظائف حالة العنابر (rooms-status.html) ====================
function renderRoomsStatusGrid() {
    const roomsGrid = document.getElementById('rooms-grid');
    const floorFilter = document.getElementById('floor-filter');
    const statusFilter = document.getElementById('status-filter');

    if (!roomsGrid) return;

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
            // تصفية بناءً على manualStatus إذا كانت موجودة، وإلا فاستخدم status التلقائي
            filteredRooms = filteredRooms.filter(room => (room.manualStatus || room.status) === selectedStatus);
        }

        if (filteredRooms.length === 0) {
            roomsGrid.innerHTML = '<p class="no-results">لا توجد عنابر مطابقة للمعايير المحددة.</p>';
            return;
        }

        // فرز العنابر حسب الدور ثم الاسم
        filteredRooms.sort((a, b) => {
            if (a.floor !== b.floor) {
                return parseInt(a.floor) - parseInt(b.floor);
            }
            return a.name.localeCompare(b.name);
        });

        filteredRooms.forEach(room => {
            // استخدم manualStatus للعرض إذا كانت موجودة، وإلا فاستخدم status التلقائي
            const displayStatus = room.manualStatus || room.status;

            const roomCard = document.createElement('div');
            roomCard.classList.add('room-card', displayStatus); // أضف الكلاس المناسب للحالة (available/occupied)
            roomCard.dataset.roomId = room.id; // لتحديد العنبر عند النقر

            roomCard.innerHTML = `
                <h3>${room.name}</h3>
                <p>الدور: ${room.floor}</p>
                <p>الشكاير: ${room.capacity || 0}</p>
                <p>الأطنان: ${room.totalWeight ? room.totalWeight.toFixed(2) : 0}</p>
                <button class="toggle-status-btn btn-${displayStatus === 'available' ? 'success' : 'danger'}" data-room-id="${room.id}">
                    <i class="fas fa-${displayStatus === 'available' ? 'check-circle' : 'times-circle'}"></i> 
                    ${displayStatus === 'available' ? 'تحديد كمشغول' : 'تحديد كمتاح'}
                </button>
            `;
            roomsGrid.appendChild(roomCard);
        });

        // إضافة مستمعي الأحداث لأزرار تبديل الحالة بعد إضافة البطاقات
        document.querySelectorAll('.toggle-status-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const roomId = event.currentTarget.dataset.roomId;
                toggleRoomManualStatus(roomId);
            });
        });
    };

    // استمع لتغييرات الفلاتر لتحديث العرض
    if (floorFilter) floorFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    applyFilters(); // طبق الفلاتر عند تحميل الصفحة لأول مرة
}

// ==================== وظيفة تحديث سعة العنبر والوزن الكلي (تلقائيًا من الإدخالات) ====================
function updateRoomCapacity(roomId) {
    const entries = StorageHelper.get('entries');

    const roomEntries = entries.filter(entry => entry.roomId === roomId);

    // حساب إجمالي عدد الشكاير لهذا العنبر
    const totalBags = roomEntries.reduce((sum, entry) => sum + entry.bags, 0);

    // حساب إجمالي الوزن لهذا العنبر
    const totalWeight = roomEntries.reduce((sum, entry) => sum + entry.weight, 0);

    StorageHelper.update('rooms', (rooms) =>
        rooms.map(room => {
            if (room.id === roomId) {
                return {
                    ...room,
                    capacity: totalBags,
                    totalWeight: totalWeight, // حفظ الوزن الكلي
                    status: totalBags > 0 ? 'occupied' : 'available' // الحالة التلقائية بناءً على الشكاير
                };
            }
            return room;
        })
    );
    // تحديث شبكة العنابر لتعكس التغييرات إذا كنا في صفحة حالة العنابر
    if (document.getElementById('rooms-grid')) {
        renderRoomsStatusGrid();
    }
    // تحديث جدول العنابر في صفحة إضافة العنابر (إن وجدت)
    if (document.getElementById('rooms-table')) {
        renderAddRoomsTable();
    }
    // تحديث قائمة العنابر في تقسيم اللواطات (إن وجدت)
    if (document.getElementById('rooms-list')) {
        renderRoomsList();
    }
}

// ==================== وظيفة تبديل الحالة اليدوية للعنبر ====================
function toggleRoomManualStatus(roomId) {
    StorageHelper.update('rooms', (rooms) =>
        rooms.map(room => {
            if (room.id === roomId) {
                // تبديل manualStatus
                const currentManualStatus = room.manualStatus || room.status; // استخدم manualStatus إن وجدت، وإلا الحالة التلقائية
                const newManualStatus = currentManualStatus === 'available' ? 'occupied' : 'available';
                return {
                    ...room,
                    manualStatus: newManualStatus // تحديث الحالة اليدوية
                };
            }
            return room;
        })
    );
    // بعد التحديث، أعد عرض الشبكة لتعكس التغيير
    renderRoomsStatusGrid();
    alert('تم تغيير حالة العنبر يدويًا بنجاح!');
}


// ==================== وظائف تقسيم العنابر إلى لواطات (room-division.html) ====================
// ملاحظة: هذه الوظائف منفصلة عن نظام الإدخالات (entry.html) وتحسب السعة بشكل مختلف
let currentRoomId = null; // لتتبع العنبر الحالي الذي يتم تقسيم لوياته

function renderRoomDivisionPage() {
    const roomsListDiv = document.getElementById('rooms-list');
    const lotsSection = document.getElementById('lots-section');

    if (!roomsListDiv || !lotsSection) return; // تأكد أننا في الصفحة الصحيحة

    // إخفاء قسم اللواطات مبدئياً
    lotsSection.style.display = 'none';
    renderRoomsList();
}

function renderRoomsList() {
    const roomsListDiv = document.getElementById('rooms-list');
    if (!roomsListDiv) return;

    roomsListDiv.innerHTML = '<h3><i class="fas fa-boxes"></i> اختر عنبرًا لتقسيمه:</h3>';
    const rooms = StorageHelper.get('rooms');
    
    if (rooms.length === 0) {
        roomsListDiv.innerHTML += '<p class="no-results">لا توجد عنابر مضافة بعد.</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.classList.add('room-selection-list');
    rooms.forEach(room => {
        const li = document.createElement('li');
        const displayStatus = room.manualStatus || room.status;
        li.innerHTML = `
            <span>${room.name} (الدور ${room.floor}) - ${room.capacity || 0} شيكارة - ${room.totalWeight ? room.totalWeight.toFixed(2) : 0} طن (${displayStatus === 'available' ? 'متاح' : 'مشغول'})</span>
            <button class="btn-primary btn-small" data-room-id="${room.id}">عرض اللواطات</button>
        `;
        li.querySelector('button').addEventListener('click', () => showLotsForRoom(room.id, room.name));
        ul.appendChild(li);
    });
    roomsListDiv.appendChild(ul);
}

function showLotsForRoom(roomId, roomName) {
    currentRoomId = roomId;
    const lotsSection = document.getElementById('lots-section');
    const currentRoomNameSpan = document.getElementById('current-room-name');
    const backToRoomsBtn = document.getElementById('back-to-rooms-btn');

    if (lotsSection && currentRoomNameSpan && backToRoomsBtn) {
        currentRoomNameSpan.textContent = roomName;
        lotsSection.style.display = 'block';
        document.getElementById('rooms-list').style.display = 'none'; // إخفاء قائمة العنابر

        renderRoomLots(roomId);

        backToRoomsBtn.onclick = () => {
            lotsSection.style.display = 'none';
            document.getElementById('rooms-list').style.display = 'block';
            currentRoomId = null;
            renderRoomsList(); // إعادة عرض قائمة العنابر
        };
    }
}

function renderRoomLots(roomId) {
    const lotsList = document.getElementById('lots-list');
    const addLotForm = document.getElementById('add-lot-form');
    if (!lotsList || !addLotForm) return;

    lotsList.innerHTML = '';
    const roomLots = StorageHelper.get('roomLots');
    const lots = roomLots[roomId] || [];

    if (lots.length === 0) {
        // إذا لم يكن هناك لواطات، اعرض رسالة في صف واحد
        const row = lotsList.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 3; // دمج الخلايا لتغطية عرض الجدول
        cell.style.textAlign = 'center';
        cell.textContent = 'لا توجد لواطات لهذا العنبر بعد.';
    } else {
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

    // إضافة مستمع حدث الحفظ للوط
    addLotForm.onsubmit = function(e) {
        e.preventDefault();
        addLot(roomId);
    };
}

function addLot(roomId) {
    const lotNumberInput = document.getElementById('lot-number');
    const lotBagsInput = document.getElementById('lot-bags');

    const lotNumber = lotNumberInput.value.trim();
    const lotBags = parseInt(lotBagsInput.value);

    if (!lotNumber || isNaN(lotBags) || lotBags <= 0) {
        alert('الرجاء إدخال رقم اللوط وعدد الشكاير بشكل صحيح.');
        return;
    }

    const roomLots = StorageHelper.get('roomLots');
    const lots = roomLots[roomId] || [];

    // التحقق من تكرار رقم اللوط
    if (lots.some(lot => lot.number === lotNumber)) {
        alert('هذا اللوط موجود بالفعل في هذا العنبر.');
        return;
    }

    const newLot = {
        id: Date.now().toString(), // معرف فريد للوط
        number: lotNumber,
        bags: lotBags
    };

    lots.push(newLot);
    roomLots[roomId] = lots; // تحديث قائمة اللواطات لهذا العنبر
    StorageHelper.set('roomLots', roomLots);

    // تحديث سعة العنبر بناءً على اللواطات (هذه الوظيفة منفصلة عن سعة الإدخال)
    updateRoomCapacityFromLots(roomId);

    alert('تم إضافة اللوط بنجاح!');
    lotNumberInput.value = ''; // مسح حقل رقم اللوط
    lotBagsInput.value = '';   // مسح حقل عدد الشكاير
    renderRoomLots(roomId);
    renderRoomsList(); // لتحديث عرض السعة في قائمة العنابر الرئيسية (صفحة التقسيم)
}

function deleteLot(roomId, lotId) {
    if (confirm('هل أنت متأكد أنك تريد حذف هذا اللوط؟')) {
        StorageHelper.update('roomLots', (roomLots) => {
            if (roomLots[roomId]) {
                roomLots[roomId] = roomLots[roomId].filter(lot => lot.id !== lotId);
            }
            updateRoomCapacityFromLots(roomId); // إعادة حساب سعة العنبر بعد الحذف
            return roomLots;
        });
        alert('تم حذف اللوط بنجاح!');
        renderRoomLots(roomId);
        renderRoomsList(); // لتحديث عرض السعة في قائمة العنابر الرئيسية (صفحة التقسيم)
    }
}

function openEditLotModal(roomId, lotId) {
    const roomLots = StorageHelper.get('roomLots');
    const lots = roomLots[roomId] || [];
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
                    <input type="text" id="edit-lot-number" value="${lotToEdit.number}" required>
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

        const updatedLotNumber = document.getElementById('edit-lot-number').value.trim();
        const updatedLotBags = parseInt(document.getElementById('edit-lot-bags').value);

        if (!updatedLotNumber || isNaN(updatedLotBags) || updatedLotBags <= 0) {
            alert('الرجاء إدخال رقم اللوط وعدد الشكاير بشكل صحيح.');
            return;
        }

        // التحقق من تكرار رقم اللوط الجديد (باستثناء اللوط الحالي نفسه)
        if (lots.some(lot => lot.number === updatedLotNumber && lot.id !== lotId)) {
            alert('هذا اللوط موجود بالفعل في هذا العنبر.');
            return;
        }

        StorageHelper.update('roomLots', (allRoomLots) => {
            if (allRoomLots[roomId]) {
                allRoomLots[roomId] = allRoomLots[roomId].map(lot =>
                    lot.id === lotId ? { ...lot, number: updatedLotNumber, bags: updatedLotBags } : lot
                );
            }
            updateRoomCapacityFromLots(roomId); // تحديث سعة العنبر بعد التعديل
            return allRoomLots;
        });

        modalOverlay.remove();
        alert('تم تحديث اللوط بنجاح!');
        renderRoomLots(roomId);
        renderRoomsList(); // لتحديث عرض السعة في قائمة العنابر الرئيسية (صفحة التقسيم)
    });

    document.getElementById('cancel-edit-lot').addEventListener('click', () => {
        modalOverlay.remove();
    });
}

// وظيفة منفصلة لحساب السعة والوزن بناءً على اللواطات (لصفحة تقسيم العنابر)
function updateRoomCapacityFromLots(roomId) {
    const roomLots = StorageHelper.get('roomLots');
    const lots = roomLots[roomId] || [];

    const totalBagsFromLots = lots.reduce((sum, lot) => sum + lot.bags, 0);

    // افتراض: متوسط وزن الشيكارة 50 كجم = 0.05 طن (يمكنك تعديل هذا الافتراض أو جعله مدخلًا)
    const assumedWeightPerBagTon = 0.05; // على سبيل المثال، 50 كجم = 0.05 طن
    const totalWeightFromLots = totalBagsFromLots * assumedWeightPerBagTon;

    StorageHelper.update('rooms', (rooms) =>
        rooms.map(room => {
            if (room.id === roomId) {
                // تحديث capacity و totalWeight فقط بناءً على اللواطات
                // لا نغير manualStatus هنا، ولا status التلقائي المستند على إدخالات `entry.html`
                return {
                    ...room,
                    capacity: totalBagsFromLots,
                    totalWeight: totalWeightFromLots,
                    // Note: 'status' field is managed by entries, not by lots
                    // If you want room-division to affect status, you'd need more complex logic.
                };
            }
            return room;
        })
    );
    // إذا كانت صفحة rooms-status مفتوحة، قم بتحديثها أيضًا (لكن ستظهر السعة من الإدخالات)
    if (document.getElementById('rooms-grid')) {
        renderRoomsStatusGrid();
    }
    // تحديث جدول العنابر في صفحة إضافة العنابر (إن وجدت)
    if (document.getElementById('rooms-table')) {
        renderAddRoomsTable();
    }
}


// ==================== وظائف مسح البيانات ====================
function clearAllData() {
    if (confirm('هل أنت متأكد أنك تريد مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء!')) {
        localStorage.clear();
        initializeStorage(); // إعادة تهيئة التخزين بعد المسح
        alert('تم مسح جميع البيانات بنجاح!');
        window.location.reload(); // إعادة تحميل الصفحة لتطبيق التغييرات
    }
}

// ==================== تهيئة التطبيق عند تحميل DOM بالكامل ====================
document.addEventListener('DOMContentLoaded', function() {
    initializeStorage(); // تهيئة التخزين عند بدء التطبيق
    setupMobileMenu(); // إعداد قائمة الموبايل
    highlightActiveLink(); // تمييز الرابط النشط في السايدبار
    renderDashboardStats(); // عرض الإحصائيات في لوحة التحكم

    // استدعاء الدوال الخاصة بكل صفحة بناءً على وجود عناصرها في الـ DOM
    if (document.getElementById('add-room-form')) {
        setupAddRoomForm();
        renderAddRoomsTable(); // استدعاء الدالة الجديدة لعرض العنابر في add-rooms.html
    }

    if (document.getElementById('clients-table')) {
        renderClientsTable();
        setupAddClientForm();
    }

    if (document.getElementById('entry-form')) {
        populateEntryFormDropdowns();
        setupEntryForm();
    }

    if (document.getElementById('report-table')) {
        renderReportTable();
    }

    if (document.getElementById('rooms-grid')) {
        renderRoomsStatusGrid();
    }
    
    // دوال تقسيم العنابر
    if (document.getElementById('rooms-list') && document.getElementById('lots-section')) {
        renderRoomDivisionPage();
    }

    if (document.getElementById('clear-data-btn')) {
        document.getElementById('clear-data-btn').addEventListener('click', clearAllData);
    }
});