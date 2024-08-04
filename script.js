document.addEventListener('DOMContentLoaded', () => {
    const app = {
        isAdmin: false,
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear(),
        events: {},
        pendingEvents: {},

        init() {
            this.loadEvents();
            this.setupMonthSelector();
            this.setupColorPickers();
            this.setupAdminLogin();
            this.renderCalendar();
        },

        loadEvents() {
            const savedEvents = localStorage.getItem('calendarEvents');
            if (savedEvents) {
                this.events = JSON.parse(savedEvents);
            }
        },

        saveEvents() {
            localStorage.setItem('calendarEvents', JSON.stringify(this.events));
        },

        setupMonthSelector() {
            const selector = document.getElementById('month-selector');
            const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
            months.forEach((month, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = month;
                selector.appendChild(option);
            });
            selector.value = this.currentMonth;
            selector.addEventListener('change', (e) => {
                this.currentMonth = parseInt(e.target.value);
                this.renderCalendar();
            });
        },

        setupColorPickers() {
            document.getElementById('bg-color').addEventListener('change', (e) => {
                document.body.style.backgroundColor = e.target.value;
            });
            document.getElementById('font-color').addEventListener('change', (e) => {
                document.body.style.color = e.target.value;
            });
        },

        setupAdminLogin() {
            document.getElementById('login-btn').addEventListener('click', () => {
                const password = document.getElementById('admin-password').value;
                if (password === 'admin123') { // 這裡設置管理員密碼
                    this.isAdmin = true;
                    alert('管理員登入成功！');
                    this.renderCalendar();
                    this.showAdminControls();
                } else {
                    alert('密碼錯誤！');
                }
            });
        },

        showAdminControls() {
            const adminControls = document.createElement('div');
            adminControls.id = 'admin-controls';
            adminControls.innerHTML = `
                <button id="publish-btn">發佈所有待發佈事件</button>
                <button id="logout-btn">登出</button>
            `;
            document.body.appendChild(adminControls);

            document.getElementById('publish-btn').addEventListener('click', () => this.publishEvents());
            document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        },

        logout() {
            this.isAdmin = false;
            document.getElementById('admin-controls').remove();
            this.renderCalendar();
        },

        renderCalendar() {
            const calendar = document.getElementById('calendar');
            calendar.innerHTML = '';
            const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
            const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
            
            // 添加星期標題
            const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            weekdays.forEach(day => {
                const dayHeader = document.createElement('div');
                dayHeader.classList.add('calendar-header');
                dayHeader.textContent = day;
                calendar.appendChild(dayHeader);
            });
            
            // 添加空白格子直到月份的第一天
            for (let i = 0; i < firstDay; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.classList.add('calendar-day', 'empty');
                calendar.appendChild(emptyDay);
            }
            
            for (let i = 1; i <= daysInMonth; i++) {
                const dayElement = document.createElement('div');
                dayElement.classList.add('calendar-day');
                dayElement.innerHTML = `<strong>${i}</strong>`;
                
                const dateKey = `${this.currentYear}-${this.currentMonth + 1}-${i}`;
                if (this.events[dateKey]) {
                    this.events[dateKey].forEach((event, index) => {
                        const eventElement = document.createElement('div');
                        eventElement.classList.add('event');
                        eventElement.textContent = event.description;
                        
                        if (this.isAdmin) {
                            eventElement.onclick = () => this.editEvent(dateKey, index);
                            eventElement.oncontextmenu = (e) => {
                                e.preventDefault();
                                this.deleteEvent(dateKey, index);
                            };
                        }
                        
                        dayElement.appendChild(eventElement);
                    });
                }

                if (this.isAdmin) {
                    if (this.pendingEvents[dateKey]) {
                        this.pendingEvents[dateKey].forEach((event, index) => {
                            const eventElement = document.createElement('div');
                            eventElement.classList.add('event', 'pending');
                            eventElement.textContent = `[待發佈] ${event.description}`;
                            eventElement.onclick = () => this.editPendingEvent(dateKey, index);
                            eventElement.oncontextmenu = (e) => {
                                e.preventDefault();
                                this.deletePendingEvent(dateKey, index);
                            };
                            dayElement.appendChild(eventElement);
                        });
                    }

                    const addButton = document.createElement('button');
                    addButton.textContent = '+';
                    addButton.onclick = () => this.addEvent(dateKey);
                    dayElement.appendChild(addButton);
                }

                calendar.appendChild(dayElement);
            }
        },

        addEvent(date) {
            const description = prompt('請輸入事件描述:');
            if (description) {
                if (!this.pendingEvents[date]) {
                    this.pendingEvents[date] = [];
                }
                this.pendingEvents[date].push({ description });
                this.renderCalendar();
            }
        },

        editEvent(date, index) {
            const event = this.events[date][index];
            const newDescription = prompt('請輸入新的事件描述:', event.description);
            
            if (newDescription) {
                this.events[date][index] = { description: newDescription };
                this.saveEvents();
                this.renderCalendar();
            }
        },

        editPendingEvent(date, index) {
            const event = this.pendingEvents[date][index];
            const newDescription = prompt('請輸入新的事件描述:', event.description);
            
            if (newDescription) {
                this.pendingEvents[date][index] = { description: newDescription };
                this.renderCalendar();
            }
        },

        deleteEvent(date, index) {
            if (confirm('確定要刪除這個事件嗎？')) {
                this.events[date].splice(index, 1);
                if (this.events[date].length === 0) {
                    delete this.events[date];
                }
                this.saveEvents();
                this.renderCalendar();
            }
        },

        deletePendingEvent(date, index) {
            if (confirm('確定要刪除這個待發佈事件嗎？')) {
                this.pendingEvents[date].splice(index, 1);
                if (this.pendingEvents[date].length === 0) {
                    delete this.pendingEvents[date];
                }
                this.renderCalendar();
            }
        },

        publishEvents() {
            for (let date in this.pendingEvents) {
                if (!this.events[date]) {
                    this.events[date] = [];
                }
                this.events[date] = this.events[date].concat(this.pendingEvents[date]);
            }
            this.pendingEvents = {};
            this.saveEvents();
            this.renderCalendar();
            alert('所有待發佈事件已發佈！');
        }
    };

    app.init();
});
