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

// ==================== تهيئة التطبيق ====================
document.addEventListener('DOMContentLoaded', function() {
    // 1. تهيئة البيانات الأساسية
    initializeStorage();
    
    // 2. تفعيل القائمة المنسدلة للشاشات الصغيرة
    setupMobileMenu();
    
    // 3. تمييز العنصر النشط في السايدبار
    highlightActiveMenu();
    
    // 4. تهيئة الصفحة الحالية
    const currentPage = window.location.pathname.split('/').pop();
    initializePage(currentPage);
    
    // 5. تهيئة وظيفة مسح البيانات
    setupDataClearing();
});

// ==================== دوال التهيئة ====================
function initializeStorage() {
    const defaults = {
        'rooms': [],
        'clients': [],
        'entries': [],
        'roomLots': {}
    };

    Object.entries(defaults).forEach(([key, value]) => {
        if (!StorageHelper.get(key)) {
            StorageHelper.set(key, value);
        }
    });
}

function highlightActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.sidebar a').forEach(link => {
        const linkPage = link.getAttribute('href');
        link.parentElement.classList.toggle('active', linkPage === currentPage);
    });
}

function initializePage(page) {
    const pageHandlers = {
        'index.html': setupDashboard,
        'add-rooms.html': setupAddRooms,
        'clients.html': setupClients,
        'entry.html': setupEntry,
        'rooms-status.html': setupRoomsStatus,
        'report.html': setupReport,
        'room-division.html': setupRoomDivision
    };

    if (pageHandlers[page]) {
        pageHandlers[page]();
    }
}

// ==================== القائمة المنسدلة للشاشات الصغيرة ====================
function setupMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (!menuToggle || !sidebar) return;

    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        sidebar.classList.toggle('open'); // ← بدل active بـ open
    });
    
    document.addEventListener('click', () => sidebar.classList.remove('open')); // ← هنا كمان
    sidebar.addEventListener('click', e => e.stopPropagation());
}


// ==================== وظيفة مسح البيانات ====================
function setupDataClearing() {
    const clearDataBtn = document.getElementById('clear-data-btn');
    if (!clearDataBtn) return;

    clearDataBtn.addEventListener('click', function() {
        if (confirm('⚠️ هل أنت متأكد أنك تريد مسح جميع البيانات؟ سيتم حذف كل البيانات ولا يمكن استرجاعها!')) {
            // مسح جميع البيانات مع الاحتفاظ بالهيكل
            const defaults = {
                'rooms': [],
                'clients': [],
                'entries': [],
                'roomLots': {}
            };
            
            Object.entries(defaults).forEach(([key, value]) => {
                StorageHelper.set(key, value);
            });
            
            alert('تم مسح جميع البيانات بنجاح');
            location.reload();
        }
    });
}

// ==================== وظائف الصفحة الرئيسية ====================
function setupDashboard() {
    updateDashboardStats();

    function updateDashboardStats() {
        const stats = {
            'total-rooms': StorageHelper.get('rooms').length,
            'total-clients': StorageHelper.get('clients').length,
            'today-entries': StorageHelper.get('entries').filter(
                e => e.date === new Date().toISOString().split('T')[0]
            ).length,
            'total-bags-lots': Object.values(StorageHelper.get('roomLots')).flat().reduce(
                (sum, lot) => sum + lot.bags, 0
            )
        };

        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }
}

// ==================== وظائف صفحة إضافة العنابر ====================
function setupAddRooms() {
    const addRoomForm = document.getElementById('add-room-form');
    if (!addRoomForm) return;

    addRoomForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const roomName = document.getElementById('room-name').value.trim();
        const floor = document.getElementById('floor').value;
        
        if (!roomName || !floor) {
            alert('الرجاء إدخال جميع البيانات المطلوبة');
            return;
        }
        
        StorageHelper.update('rooms', (rooms) => [
            ...rooms,
            {
                id: Date.now().toString(),
                name: roomName,
                floor: floor,
                status: 'available',
                client: null,
                entryDate: null,
                capacity: 0
            }
        ]);
        
        alert('تم إضافة العنبر بنجاح');
        addRoomForm.reset();
    });
}

// ==================== وظائف صفحة العملاء ====================
function setupClients() {
    const elements = {
        form: document.getElementById('client-form'),
        addBtn: document.getElementById('add-client-btn'),
        formContainer: document.getElementById('client-form-container'),
        cancelBtn: document.getElementById('cancel-client-btn'),
        table: document.getElementById('clients-table')?.querySelector('tbody')
    };

    if (!elements.table) return;

    // عرض/إخفاء النموذج
    if (elements.addBtn && elements.formContainer) {
        elements.addBtn.addEventListener('click', () => 
            elements.formContainer.style.display = 'block'
        );
        elements.cancelBtn.addEventListener('click', () => {
            elements.formContainer.style.display = 'none';
            elements.form.reset();
        });
    }

    // إضافة عميل جديد
    if (elements.form) {
        elements.form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const clientData = {
                name: document.getElementById('client-name').value.trim(),
                phone1: document.getElementById('phone1').value.trim(),
                phone2: document.getElementById('phone2').value.trim()
            };
            
            if (!clientData.name || !clientData.phone1) {
                alert('الرجاء إدخال اسم العميل ورقم التليفون الأول على الأقل');
                return;
            }
            
            StorageHelper.update('clients', (clients) => [
                ...clients,
                {
                    id: Date.now().toString(),
                    ...clientData
                }
            ]);
            
            alert('تم إضافة العميل بنجاح');
            elements.form.reset();
            elements.formContainer.style.display = 'none';
            renderClientsTable();
        });
    }

    renderClientsTable();

    function renderClientsTable() {
        const clients = StorageHelper.get('clients');
        elements.table.innerHTML = '';
        
        clients.forEach(client => {
            const row = elements.table.insertRow();
            
            row.insertCell(0).textContent = client.name;
            row.insertCell(1).textContent = client.phone1;
            row.insertCell(2).textContent = client.phone2 || '-';
            
            const actionsCell = row.insertCell(3);
            actionsCell.innerHTML = `
                <button class="btn-edit-client btn-primary" data-id="${client.id}">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn-delete-client btn-danger" data-id="${client.id}">
                    <i class="fas fa-trash"></i> حذف
                </button>
            `;
        });

        setupClientActions();
    }

    function setupClientActions() {
        document.querySelectorAll('.btn-delete-client').forEach(btn => {
            btn.addEventListener('click', function() {
                const clientId = this.getAttribute('data-id');
                if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
                    StorageHelper.update('clients', (clients) => 
                        clients.filter(c => c.id !== clientId)
                    );
                    renderClientsTable();
                }
            });
        });

        document.querySelectorAll('.btn-edit-client').forEach(btn => {
            btn.addEventListener('click', function() {
                const clientId = this.getAttribute('data-id');
                editClient(clientId);
            });
        });
    }

    function editClient(clientId) {
        const client = StorageHelper.get('clients').find(c => c.id === clientId);
        if (!client) return;

        const editForm = `
            <div class="edit-form-container">
                <h3><i class="fas fa-user-edit"></i> تعديل العميل</h3>
                <form id="edit-client-form">
                    <div class="form-group">
                        <label for="edit-client-name">اسم العميل:</label>
                        <input type="text" id="edit-client-name" value="${client.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-phone1">رقم التليفون 1:</label>
                        <input type="tel" id="edit-phone1" value="${client.phone1}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-phone2">رقم التليفون 2:</label>
                        <input type="tel" id="edit-phone2" value="${client.phone2 || ''}">
                    </div>
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-save"></i> حفظ
                    </button>
                    <button type="button" id="cancel-edit-client" class="btn-secondary">
                        <i class="fas fa-times"></i> إلغاء
                    </button>
                </form>
            </div>
        `;

        const editContainer = document.createElement('div');
        editContainer.className = 'edit-overlay';
        editContainer.innerHTML = editForm;
        document.body.appendChild(editContainer);

        document.getElementById('edit-client-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const updatedClient = {
                ...client,
                name: document.getElementById('edit-client-name').value.trim(),
                phone1: document.getElementById('edit-phone1').value.trim(),
                phone2: document.getElementById('edit-phone2').value.trim() || ''
            };

            StorageHelper.update('clients', (clients) => 
                clients.map(c => c.id === clientId ? updatedClient : c)
            );

            editContainer.remove();
            renderClientsTable();
            alert('تم تحديث بيانات العميل بنجاح');
        });

        document.getElementById('cancel-edit-client').addEventListener('click', () => 
            editContainer.remove()
        );
    }
}

// ==================== وظائف صفحة الإدخال ====================
function setupEntry() {
    const entryForm = document.getElementById('entry-form');
    if (!entryForm) return;

    const selects = {
        client: document.getElementById('client'),
        room: document.getElementById('room')
    };

    populateSelects();

    entryForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            bagsCount: document.getElementById('bags-count').value,
            weight: document.getElementById('weight').value,
            clientId: selects.client.value,
            roomId: selects.room.value,
            threadColor: document.getElementById('thread-color').value.trim(),
            notes: document.getElementById('notes').value.trim()
        };
        
        if (!formData.bagsCount || !formData.weight || !formData.clientId || !formData.roomId) {
            alert('الرجاء إدخال جميع البيانات المطلوبة');
            return;
        }
        
        const client = StorageHelper.get('clients').find(c => c.id === formData.clientId);
        const room = StorageHelper.get('rooms').find(r => r.id === formData.roomId);
        
        if (!client || !room) {
            alert('حدث خطأ في البيانات، الرجاء المحاولة مرة أخرى');
            return;
        }
        
        // تحديث حالة العنبر
        StorageHelper.update('rooms', (rooms) => 
            rooms.map(r => 
                r.id === formData.roomId ? {
                    ...r,
                    status: 'occupied',
                    client: formData.clientId,
                    entryDate: new Date().toISOString().split('T')[0]
                } : r
            )
        );
        
        // إضافة سجل الإدخال
        StorageHelper.update('entries', (entries) => [
            ...entries,
            {
                id: Date.now().toString(),
                date: new Date().toISOString().split('T')[0],
                clientId: formData.clientId,
                clientName: client.name,
                roomId: formData.roomId,
                roomName: room.name,
                bagsCount: parseInt(formData.bagsCount),
                weight: parseFloat(formData.weight),
                threadColor: formData.threadColor || '-',
                notes: formData.notes || '-'
            }
        ]);
        
        alert('تم تسجيل الإدخال بنجاح');
        entryForm.reset();
        populateSelects();
    });

    function populateSelects() {
        populateSelect('clients', selects.client, 'اختر العميل');
        populateSelect('rooms', selects.room, 'اختر العنبر', true);
    }

    function populateSelect(dataKey, selectElement, defaultText, filterAvailable = false) {
        const data = StorageHelper.get(dataKey);
        selectElement.innerHTML = `<option value="">${defaultText}</option>`;
        
        const filteredData = filterAvailable ? 
            data.filter(item => item.status === 'available') : data;
            
        filteredData.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = dataKey === 'rooms' ? 
                `${item.name} (الدور ${item.floor})` : item.name;
            selectElement.appendChild(option);
        });
    }
}

// ==================== وظائف صفحة العنابر المتاحة ====================
function setupRoomsStatus() {
    const elements = {
        grid: document.getElementById('rooms-grid'),
        floorFilter: document.getElementById('floor-filter'),
        statusFilter: document.getElementById('status-filter')
    };

    if (!elements.grid) return;

    renderRoomsGrid();

    if (elements.floorFilter) elements.floorFilter.addEventListener('change', renderRoomsGrid);
    if (elements.statusFilter) elements.statusFilter.addEventListener('change', renderRoomsGrid);

    function renderRoomsGrid() {
        const rooms = StorageHelper.get('rooms');
        const clients = StorageHelper.get('clients');
        const entries = StorageHelper.get('entries');
        const roomLots = StorageHelper.get('roomLots');
        
        // تطبيق الفلاتر
        const filters = {
            floor: elements.floorFilter?.value,
            status: elements.statusFilter?.value
        };
        
        const filteredRooms = rooms.filter(room => 
            (!filters.floor || room.floor === filters.floor) &&
            (!filters.status || room.status === filters.status)
        );
        
        elements.grid.innerHTML = '';
        
        filteredRooms.forEach(room => {
            const roomCard = document.createElement('div');
            roomCard.className = `room-card ${room.status}`;
            
            // معلومات العميل إذا كان العنبر مشغولاً
            let clientInfo = '';
            let lastUsed = '';
            let lotsInfo = '';
            
            if (room.status === 'occupied') {
                const client = clients.find(c => c.id === room.client);
                clientInfo = client ? `<p><i class="fas fa-user"></i> العميل: ${client.name}</p>` : '';
                
                const roomEntries = entries.filter(e => e.roomId === room.id);
                if (roomEntries.length > 0) {
                    lastUsed = `<p><i class="fas fa-calendar-alt"></i> تاريخ الحجز: ${room.entryDate}</p>`;
                }
            }
            
            // معلومات اللواطات
            if (roomLots[room.id]?.length > 0) {
                const totalBags = roomLots[room.id].reduce((sum, lot) => sum + lot.bags, 0);
                lotsInfo = `
                    <p><i class="fas fa-boxes"></i> اللواطات: ${roomLots[room.id].length}</p>
                    <p><i class="fas fa-shopping-bag"></i> إجمالي الشكاير: ${totalBags}</p>
                `;
            }
            
            roomCard.innerHTML = `
                <div class="room-header">
                    <h3>${room.name}</h3>
                    <span class="status-badge">${room.status === 'available' ? 'متاح' : 'مشغول'}</span>
                </div>
                <div class="room-details">
                    <p><i class="fas fa-layer-group"></i> الدور: ${room.floor}</p>
                    ${clientInfo}
                    ${lastUsed}
                    ${lotsInfo}
                </div>
                <div class="room-actions">
                    <button class="btn-toggle-status ${room.status === 'available' ? 'btn-primary' : 'btn-danger'}" 
                            data-id="${room.id}" 
                            data-status="${room.status}">
                        <i class="fas ${room.status === 'available' ? 'fa-lock' : 'fa-unlock'}"></i>
                        ${room.status === 'available' ? 'احجز العنبر' : 'تحرير العنبر'}
                    </button>
                </div>
            `;
            
            elements.grid.appendChild(roomCard);
        });

        // أحداث تغيير حالة العنبر
        document.querySelectorAll('.btn-toggle-status').forEach(btn => {
            btn.addEventListener('click', function() {
                const roomId = this.getAttribute('data-id');
                const newStatus = this.getAttribute('data-status') === 'available' ? 'occupied' : 'available';
                
                StorageHelper.update('rooms', (rooms) => 
                    rooms.map(room => 
                        room.id === roomId ? {
                            ...room,
                            status: newStatus,
                            client: newStatus === 'available' ? null : room.client,
                            entryDate: newStatus === 'available' ? null : (room.entryDate || new Date().toISOString().split('T')[0])
                        } : room
                    )
                );
                
                renderRoomsGrid();
            });
        });
    }
}

// ==================== وظائف صفحة كشف العنابر ====================
function setupReport() {
    const elements = {
        table: document.getElementById('report-table')?.querySelector('tbody'),
        todayBtn: document.getElementById('today-btn'),
        filterBtn: document.getElementById('filter-btn'),
        fromDate: document.getElementById('from-date'),
        toDate: document.getElementById('to-date'),
        totalBags: document.getElementById('total-bags'),
        totalWeight: document.getElementById('total-weight'),
        clientSearch: document.getElementById('client-search'),
        searchClientBtn: document.getElementById('search-client-btn'),
        resetSearchBtn: document.getElementById('reset-search-btn')
    };

    if (!elements.table) return;

    // حالة البحث الحالية
    const searchState = {
        term: '',
        startDate: null,
        endDate: null
    };

    // تعيين تاريخ اليوم كقيمة افتراضية
    const today = new Date().toISOString().split('T')[0];
    if (elements.fromDate) elements.fromDate.value = today;
    if (elements.toDate) elements.toDate.value = today;

    renderReport();

    // الأحداث
    if (elements.todayBtn) {
        elements.todayBtn.addEventListener('click', () => {
            searchState.startDate = today;
            searchState.endDate = today;
            searchState.term = '';
            renderReport();
        });
    }

    if (elements.filterBtn) {
        elements.filterBtn.addEventListener('click', () => {
            if (!elements.fromDate.value || !elements.toDate.value) {
                alert('الرجاء تحديد تاريخ البداية والنهاية');
                return;
            }
            searchState.startDate = elements.fromDate.value;
            searchState.endDate = elements.toDate.value;
            searchState.term = '';
            renderReport();
        });
    }

    if (elements.searchClientBtn) {
        elements.searchClientBtn.addEventListener('click', () => {
            searchState.term = elements.clientSearch.value.trim();
            searchState.startDate = null;
            searchState.endDate = null;
            renderReport();
        });
    }

    if (elements.resetSearchBtn) {
        elements.resetSearchBtn.addEventListener('click', () => {
            elements.clientSearch.value = '';
            elements.fromDate.value = today;
            elements.toDate.value = today;
            searchState.term = '';
            searchState.startDate = null;
            searchState.endDate = null;
            renderReport();
        });
    }

    function renderReport() {
        let entries = StorageHelper.get('entries');
        
        // تطبيق الفلترة
        entries = entries.filter(entry => {
            const matchesDate = !searchState.startDate || !searchState.endDate || 
                (entry.date >= searchState.startDate && entry.date <= searchState.endDate);
            
            const matchesSearch = !searchState.term || 
                entry.clientName.toLowerCase().includes(searchState.term.toLowerCase());
            
            return matchesDate && matchesSearch;
        });
        
        // عرض النتائج
        elements.table.innerHTML = '';
        
        if (entries.length === 0) {
            const row = elements.table.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 8;
            cell.textContent = 'لا توجد نتائج';
            cell.style.textAlign = 'center';
            cell.style.padding = '20px';
        } else {
            entries.forEach(entry => {
                const row = elements.table.insertRow();
                
                row.insertCell(0).textContent = entry.date;
                row.insertCell(1).textContent = entry.clientName;
                row.insertCell(2).textContent = entry.roomName;
                row.insertCell(3).textContent = entry.bagsCount;
                row.insertCell(4).textContent = entry.weight;
                row.insertCell(5).textContent = entry.threadColor;
                row.insertCell(6).textContent = entry.notes;
                
                const actionsCell = row.insertCell(7);
                actionsCell.innerHTML = `
                    <button class="btn-edit-entry btn-primary" data-id="${entry.id}">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn-delete-entry btn-danger" data-id="${entry.id}">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                `;
            });
        }
        
        // حساب الإجماليات
        const sumBags = entries.reduce((sum, entry) => sum + entry.bagsCount, 0);
        const sumWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
        
        if (elements.totalBags) elements.totalBags.textContent = sumBags;
        if (elements.totalWeight) elements.totalWeight.textContent = sumWeight.toFixed(2);
        
        // إعداد أحداث التعديل والحذف
        setupEntryActions();
    }

    function setupEntryActions() {
        // حذف الإدخال
        document.querySelectorAll('.btn-delete-entry').forEach(btn => {
            btn.addEventListener('click', function() {
                const entryId = this.getAttribute('data-id');
                if (!confirm('هل أنت متأكد من حذف هذا الإدخال؟')) return;
                
                StorageHelper.update('entries', (entries) => 
                    entries.filter(e => e.id !== entryId)
                );
                
                // تحرير العنبر إذا كان محجوزاً
                const entry = StorageHelper.get('entries').find(e => e.id === entryId);
                if (entry) {
                    StorageHelper.update('rooms', (rooms) => 
                        rooms.map(room => 
                            room.id === entry.roomId ? {
                                ...room,
                                status: 'available',
                                client: null,
                                entryDate: null
                            } : room
                        )
                    );
                }
                
                renderReport();
                alert('تم حذف الإدخال بنجاح');
            });
        });

        // تعديل الإدخال
        document.querySelectorAll('.btn-edit-entry').forEach(btn => {
            btn.addEventListener('click', function() {
                const entryId = this.getAttribute('data-id');
                editEntry(entryId);
            });
        });
    }

    function editEntry(entryId) {
        const entry = StorageHelper.get('entries').find(e => e.id === entryId);
        if (!entry) return;

        const editForm = `
            <div class="edit-form-container">
                <h3><i class="fas fa-edit"></i> تعديل الإدخال</h3>
                <form id="edit-entry-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-bags-count">عدد الشكاير:</label>
                            <input type="number" id="edit-bags-count" value="${entry.bagsCount}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-weight">الوزن بالطن:</label>
                            <input type="number" step="0.01" id="edit-weight" value="${entry.weight}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="edit-thread-color">لون الخيط:</label>
                        <input type="text" id="edit-thread-color" value="${entry.threadColor}">
                    </div>
                    <div class="form-group">
                        <label for="edit-notes">ملاحظات:</label>
                        <textarea id="edit-notes" rows="3">${entry.notes}</textarea>
                    </div>
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-save"></i> حفظ
                    </button>
                    <button type="button" id="cancel-edit-entry" class="btn-secondary">
                        <i class="fas fa-times"></i> إلغاء
                    </button>
                </form>
            </div>
        `;

        const editContainer = document.createElement('div');
        editContainer.className = 'edit-overlay';
        editContainer.innerHTML = editForm;
        document.body.appendChild(editContainer);

        document.getElementById('edit-entry-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const updatedEntry = {
                ...entry,
                bagsCount: parseInt(document.getElementById('edit-bags-count').value),
                weight: parseFloat(document.getElementById('edit-weight').value),
                threadColor: document.getElementById('edit-thread-color').value.trim(),
                notes: document.getElementById('edit-notes').value.trim()
            };

            StorageHelper.update('entries', (entries) => 
                entries.map(e => e.id === entryId ? updatedEntry : e)
            );

            editContainer.remove();
            renderReport();
            alert('تم تحديث الإدخال بنجاح');
        });

        document.getElementById('cancel-edit-entry').addEventListener('click', () => 
            editContainer.remove()
        );
    }
}

// ==================== وظائف صفحة تقسيم العنابر ====================
function setupRoomDivision() {
    const elements = {
        roomsList: document.getElementById('rooms-list'),
        roomDetails: document.getElementById('room-details'),
        backBtn: document.getElementById('back-to-rooms'),
        addLotForm: document.getElementById('add-lot-form'),
        lotsList: document.getElementById('lots-list'),
        selectedRoomName: document.getElementById('selected-room-name')
    };

    if (!elements.roomsList) return;

    let currentRoomId = null;

    renderRoomsList();

    // الأحداث
    if (elements.backBtn) {
        elements.backBtn.addEventListener('click', () => {
            elements.roomsList.style.display = 'grid';
            elements.roomDetails.style.display = 'none';
        });
    }

    if (elements.addLotForm) {
        elements.addLotForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const lotNumber = document.getElementById('lot-number').value;
            const lotBags = document.getElementById('lot-bags').value;
            
            if (!currentRoomId || !lotNumber || !lotBags) {
                alert('الرجاء إدخال جميع البيانات المطلوبة');
                return;
            }
            
            StorageHelper.update('roomLots', (roomLots) => {
                if (!roomLots[currentRoomId]) {
                    roomLots[currentRoomId] = [];
                }
                
                // منع تكرار رقم اللوط
                if (roomLots[currentRoomId].some(lot => lot.number == lotNumber)) {
                    alert('رقم اللوط موجود بالفعل!');
                    return roomLots;
                }
                
                roomLots[currentRoomId].push({
                    id: Date.now().toString(),
                    number: parseInt(lotNumber),
                    bags: parseInt(lotBags)
                });
                
                // تحديث سعة العنبر
                updateRoomCapacity(currentRoomId);
                
                return roomLots;
            });
            
            alert('تم إضافة اللوط بنجاح');
            this.reset();
            renderRoomLots(currentRoomId);
        });
    }

    function renderRoomsList() {
        const rooms = StorageHelper.get('rooms');
        const roomLots = StorageHelper.get('roomLots');
        
        elements.roomsList.innerHTML = '';
        
        rooms.forEach(room => {
            const roomCard = document.createElement('div');
            roomCard.className = 'room-card-division';
            roomCard.dataset.roomId = room.id;
            
            // إحصائيات اللواطات
            const lots = roomLots[room.id] || [];
            const totalBags = lots.reduce((sum, lot) => sum + lot.bags, 0);
            
            roomCard.innerHTML = `
                <h3>${room.name}</h3>
                <p><i class="fas fa-layer-group"></i> الدور: ${room.floor}</p>
                <p><i class="fas fa-boxes"></i> عدد اللواطات: ${lots.length}</p>
                <p><i class="fas fa-shopping-bag"></i> إجمالي الشكاير: ${totalBags}</p>
                ${room.capacity ? `<p><i class="fas fa-weight-hanging"></i> السعة القصوى: ${room.capacity} شيكارة</p>` : ''}
            `;
            
            roomCard.addEventListener('click', () => 
                showRoomDetails(room.id, room.name)
            );
            
            elements.roomsList.appendChild(roomCard);
        });
    }

    function showRoomDetails(roomId, roomName) {
        currentRoomId = roomId;
        elements.roomsList.style.display = 'none';
        elements.roomDetails.style.display = 'block';
        elements.selectedRoomName.textContent = `${roomName} - اللواطات`;
        elements.addLotForm.setAttribute('data-room-id', roomId);
        renderRoomLots(roomId);
    }

    function renderRoomLots(roomId) {
        const lots = StorageHelper.get('roomLots')[roomId] || [];
        elements.lotsList.innerHTML = '';
        
        if (lots.length === 0) {
            const row = elements.lotsList.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 3;
            cell.textContent = 'لا توجد لواطات مسجلة لهذا العنبر';
            cell.style.textAlign = 'center';
            return;
        }
        
        // ترتيب اللواطات حسب الرقم
        [...lots].sort((a, b) => a.number - b.number).forEach(lot => {
            const row = elements.lotsList.insertRow();
            
            row.insertCell(0).textContent = lot.number;
            row.insertCell(1).textContent = lot.bags;
            
            const actionsCell = row.insertCell(2);
            actionsCell.className = 'lot-actions';
            actionsCell.innerHTML = `
                <button class="btn-edit-lot btn-primary" data-lot-id="${lot.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete-lot btn-danger" data-lot-id="${lot.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        });
        
        setupLotActions();
    }

    function setupLotActions() {
        // حذف اللوط
        document.querySelectorAll('.btn-delete-lot').forEach(btn => {
            btn.addEventListener('click', function() {
                const lotId = this.getAttribute('data-lot-id');
                if (!confirm('هل أنت متأكد من حذف هذا اللوط؟')) return;
                
                StorageHelper.update('roomLots', (roomLots) => {
                    roomLots[currentRoomId] = roomLots[currentRoomId].filter(lot => lot.id !== lotId);
                    updateRoomCapacity(currentRoomId);
                    return roomLots;
                });
                
                renderRoomLots(currentRoomId);
                renderRoomsList();
                alert('تم حذف اللوط بنجاح');
            });
        });
        
        // تعديل اللوط
        document.querySelectorAll('.btn-edit-lot').forEach(btn => {
            btn.addEventListener('click', function() {
                const lotId = this.getAttribute('data-lot-id');
                editLot(lotId);
            });
        });
    }

    function editLot(lotId) {
        const lot = StorageHelper.get('roomLots')[currentRoomId].find(l => l.id === lotId);
        if (!lot) return;

        const editForm = `
            <div class="edit-form-container">
                <h3><i class="fas fa-edit"></i> تعديل اللوط رقم ${lot.number}</h3>
                <form id="edit-lot-form">
                    <div class="form-group">
                        <label for="edit-lot-number">رقم اللوط:</label>
                        <input type="number" id="edit-lot-number" value="${lot.number}" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-lot-bags">عدد الشكاير:</label>
                        <input type="number" id="edit-lot-bags" value="${lot.bags}" min="1" required>
                    </div>
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-save"></i> حفظ
                    </button>
                    <button type="button" id="cancel-edit-lot" class="btn-secondary">
                        <i class="fas fa-times"></i> إلغاء
                    </button>
                </form>
            </div>
        `;

        const editContainer = document.createElement('div');
        editContainer.className = 'edit-overlay';
        editContainer.innerHTML = editForm;
        document.body.appendChild(editContainer);

        document.getElementById('edit-lot-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const updatedLot = {
                ...lot,
                number: parseInt(document.getElementById('edit-lot-number').value),
                bags: parseInt(document.getElementById('edit-lot-bags').value)
            };

            StorageHelper.update('roomLots', (roomLots) => {
                roomLots[currentRoomId] = roomLots[currentRoomId].map(l => 
                    l.id === lotId ? updatedLot : l
                );
                updateRoomCapacity(currentRoomId);
                return roomLots;
            });

            editContainer.remove();
            renderRoomLots(currentRoomId);
            renderRoomsList();
            alert('تم تحديث اللوط بنجاح');
        });

        document.getElementById('cancel-edit-lot').addEventListener('click', () => 
            editContainer.remove()
        );
    }

    function updateRoomCapacity(roomId) {
        const totalBags = StorageHelper.get('roomLots')[roomId]?.reduce(
            (sum, lot) => sum + lot.bags, 0
        ) || 0;
        
        StorageHelper.update('rooms', (rooms) => 
            rooms.map(room => 
                room.id === roomId ? { ...room, capacity: totalBags } : room
            )
        );
    }
}