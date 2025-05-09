const DynaApp = (() => {
    const state = {
        strings: {},
        currentPanel: 0,
        dom: {}
    };

    const DOM = {
        cacheById(ids) {
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) state.dom[id] = el;
            });
        },
        cacheBySelector(selectorMap) {
            Object.entries(selectorMap).forEach(([key, selector]) => {
                const els = document.querySelectorAll(selector);
                if (els.length) state.dom[key] = els;
            });
        },
        init() {
            this.cacheById([
                'navItems', 'buttonContainer', 'demo-select', 'taskList',
                'addTaskBtn', 'newTaskInput', 'demoModal', 'openModalBtn',
                'container', 'showInfoToast', 'showSuccessToast', 'showWarningToast',
                'cancelModal', 'confirmModal'
            ]);
            this.cacheBySelector({
                bottomNavItems: '.dyna-bottom-nav-item',
                panels: '.dyna--panel',
                modalClose: '.dyna-modal-close',
                toastContainer: '.dyna-toast-container'
            });
        }
    };

    const I18n = {
        async loadStrings() {
            try {
                const res = await fetch('strings.json');
                if (!res.ok) throw 0;
                state.strings = await res.json();
                return true;
            } catch {
                return false;
            }
        },
        getValue(path) {
            return path?.split('.').reduce((obj, key) =>
                obj && obj[key] !== undefined ? obj[key] : '', state.strings);
        },
        getIndexedValue(path) {
            const m = path?.match(/(.*)\[(\d+)\]$/);
            if (m) {
                const arr = this.getValue(m[1]);
                const idx = +m[2];
                return Array.isArray(arr) && idx < arr.length ? arr[idx] : '';
            }
            return '';
        },
        applyStrings() {
            document.title = this.getValue('app.title');
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.content = this.getValue('app.description');
            [
                { s: '[data-text]', a: 'data-text', m: this.getValue.bind(this) },
                { s: '[data-text-index]', a: 'data-text-index', m: this.getIndexedValue.bind(this) },
                { s: '[data-placeholder]', a: 'data-placeholder', m: this.getValue.bind(this), p: 'placeholder' }
            ].forEach(({s, a, m, p = 'textContent'}) => {
                document.querySelectorAll(s).forEach(el => {
                    el[p] = m(el.getAttribute(a));
                });
            });
        }
    };

    const ContentGenerator = {
        generateAll() {
            this.generateNavigation();
            this.generateButtons();
            this.generateSelectOptions();
            this.generateTaskList();
        },
        generateNavigation() {
            const navItems = I18n.getValue('nav.items');
            const navContainer = state.dom.navItems;
            if (!navContainer || !navItems?.length) return;
            navContainer.innerHTML = '';
            const navGroups = [
                { title: "设计", items: navItems.slice(0, 2) },
                { title: "组件", items: navItems.slice(2, 5) },
                { title: "交互", items: navItems.slice(5) }
            ];
            navGroups.forEach((group, i) => {
                const section = document.createElement('div');
                section.className = 'dyna-section';
                section.innerHTML = `<div class="dyna-section-title">${group.title}</div>`;
                group.items.forEach((item, j) => {
                    const a = document.createElement('a');
                    a.href = `#section${i * 100 + j}`;
                    a.className = 'dyna-node' + (i === 0 && j === 0 ? ' active' : '');
                    a.textContent = item;
                    a.setAttribute('role', 'menuitem');
                    section.appendChild(a);
                });
                navContainer.appendChild(section);
                if (i < navGroups.length - 1) {
                    const sep = document.createElement('div');
                    sep.className = 'dyna-separator';
                    navContainer.appendChild(sep);
                }
            });
        },
        generateButtons() {
            const types = I18n.getValue('sections.buttons.types');
            const btns = ['', 'logic', 'data', 'action'];
            const c = state.dom.buttonContainer;
            if (!c || !types?.length) return;
            c.innerHTML = '';
            types.forEach((t, i) => {
                const b = document.createElement('button');
                b.className = `dyna-btn ${btns[i] || ''}`.trim();
                b.textContent = t;
                c.appendChild(b);
            });
        },
        generateSelectOptions() {
            const select = state.dom['demo-select'];
            if (!select) return;
            const placeholder = I18n.getValue('sections.forms.select_placeholder');
            const options = I18n.getValue('sections.forms.select_options');
            if (!options?.length) return;
            select.innerHTML = '';
            select.appendChild(new Option(placeholder || '请选择一个选项', ''));
            options.forEach((t, i) => select.appendChild(new Option(t, `option-${i}`)));
        },
        generateTaskList() {
            const tasks = I18n.getValue('sections.tasks.items');
            const taskList = state.dom.taskList;
            if (!taskList || !tasks?.length) return;
            taskList.innerHTML = '';
            tasks.forEach((task, i) => taskList.appendChild(this.createTaskElement(task, i)));
        },
        createTaskElement(task, i) {
            const taskId = `task${i + 1}`;
            const item = document.createElement('div');
            item.className = 'task-item dyna-flex dyna-justify-between';
            item.setAttribute('role', 'listitem');
            const statusClass = task.status === '已完成' ? 'logic' :
                task.status === '进行中' ? 'data' : 'action';
            item.innerHTML = `
                <div class="dyna-flex dyna-align-center">
                    <input type="checkbox" id="${taskId}" class="dyna-checkbox" ${task.status === '已完成' ? 'checked' : ''}>
                    <label for="${taskId}">${task.text}</label>
                </div>
                <span class="dyna-tag ${statusClass}">${task.status}</span>
            `;
            return item;
        }
    };

    const EventHandler = {
        setupTaskAddition() {
            const { addTaskBtn, newTaskInput, taskList } = state.dom;
            if (!addTaskBtn || !newTaskInput || !taskList) return;
            const addTask = () => {
                const text = newTaskInput.value.trim();
                if (!text) return;
                const newTask = { text, status: I18n.getValue('sections.tasks.new_task') || '新任务' };
                const idx = taskList.children.length;
                taskList.appendChild(ContentGenerator.createTaskElement(newTask, idx));
                newTaskInput.value = '';
                taskList.lastChild.querySelector('.dyna-checkbox').focus();
            };
            addTaskBtn.onclick = addTask;
            newTaskInput.onkeypress = e => e.key === 'Enter' && addTask();
            taskList.onchange = e => {
                if (e.target.classList.contains('dyna-checkbox')) {
                    const tag = e.target.closest('.task-item').querySelector('.dyna-tag');
                    if (e.target.checked) {
                        tag.className = 'dyna-tag logic';
                        tag.textContent = '已完成';
                    } else {
                        tag.className = 'dyna-tag action';
                        tag.textContent = I18n.getValue('sections.tasks.new_task') || '新任务';
                    }
                }
            };
        },
        setupModal() {
            const modal = state.dom.demoModal;
            if (!modal) return;
            let openModalBtn = state.dom.openModalBtn;
            if (!openModalBtn) {
                const modalSection = document.querySelector('.data-core');
                if (!modalSection) return;
                openModalBtn = document.createElement('button');
                openModalBtn.id = 'openModalBtn';
                openModalBtn.className = 'dyna-btn action';
                openModalBtn.textContent = I18n.getValue('sections.modal.button') || '打开对话框';
                openModalBtn.style.marginTop = '20px';
                modalSection.appendChild(openModalBtn);
                state.dom.openModalBtn = openModalBtn;
            }
            const closeModalBtn = modal.querySelector('.dyna-modal-close');
            const { cancelModal, confirmModal } = state.dom;
            const toggleModal = show => {
                modal.style.display = show ? 'flex' : 'none';
                modal.setAttribute('aria-hidden', !show);
                document.body.classList[show ? 'add' : 'remove']('modal-open');
                if (show) {
                    state.lastFocus = document.activeElement;
                    setTimeout(() => closeModalBtn.focus(), 50);
                } else if (state.lastFocus) {
                    state.lastFocus.focus();
                }
            };
            [[openModalBtn, 'click', () => toggleModal(true)],
                [closeModalBtn, 'click', () => toggleModal(false)],
                [cancelModal, 'click', () => toggleModal(false)],
                [confirmModal, 'click', () => { this.showToast('操作已确认', 'success'); toggleModal(false); }],
                [modal, 'click', e => { if (e.target === modal) toggleModal(false); }]
            ].forEach(([el, evt, fn]) => el && el.addEventListener(evt, fn));
            modal.addEventListener('keydown', e => e.key === 'Escape' && toggleModal(false));
        },

        setupNavigation() {
            const { container, bottomNavItems: navItems, panels } = state.dom;
            if (!container || !navItems?.length || !panels?.length) return;
            const goToPanel = idx => {
                idx = Math.max(0, Math.min(idx, panels.length - 1));
                state.currentPanel = idx;
                navItems.forEach((item, i) => {
                    item.classList.toggle('active', i === idx);
                    item.setAttribute('aria-selected', i === idx ? 'true' : 'false');
                });
                panels[idx].scrollIntoView({ behavior: 'smooth', inline: 'start' });
            };
            document.querySelector('.dyna-bottom-nav').addEventListener('click', e => {
                if (e.target.classList.contains('dyna-bottom-nav-item')) {
                    const idx = Array.from(navItems).indexOf(e.target);
                    if (idx >= 0) goToPanel(idx);
                }
            });
            document.querySelector('.dyna-bottom-nav').addEventListener('keydown', e => {
                if (e.target.classList.contains('dyna-bottom-nav-item') && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    const idx = Array.from(navItems).indexOf(e.target);
                    if (idx >= 0) goToPanel(idx);
                }
            });
            new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const idx = Array.from(panels).indexOf(entry.target);
                        if (idx !== state.currentPanel) {
                            state.currentPanel = idx;
                            navItems.forEach((item, i) => {
                                item.classList.toggle('active', i === idx);
                                item.setAttribute('aria-selected', i === idx ? 'true' : 'false');
                            });
                        }
                    }
                });
            }, { root: container, threshold: 0.7 }).observeAll?.(panels) || panels.forEach(p => new IntersectionObserver(() => {}, { root: container, threshold: 0.7 }).observe(p));
        },
        setupNavigationHighlight() {
            document.addEventListener('click', e => {
                if (e.target.classList.contains('dyna-node')) {
                    document.querySelectorAll('.dyna-node').forEach(n => {
                        n.classList.remove('active');
                        n.setAttribute('aria-selected', 'false');
                    });
                    e.target.classList.add('active');
                    e.target.setAttribute('aria-selected', 'true');
                }
            });
        },
        setupToast() {
            const toastContainer = document.querySelector('.dyna-toast-container');
            if (!toastContainer) return;
            document.addEventListener('click', e => {
                const id = e.target.id;
                if (id === 'showInfoToast') this.showToast('这是一条信息提示', 'info');
                else if (id === 'showSuccessToast') this.showToast('操作已成功完成', 'success');
                else if (id === 'showWarningToast') this.showToast('请注意，有潜在风险', 'warning');
            });
        },
        showToast(message, type) {
            const toastContainer = document.querySelector('.dyna-toast-container');
            if (!toastContainer) return;
            const toast = document.createElement('div');
            toast.className = `dyna-toast ${type}`;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'polite');
            toast.textContent = message;
            toastContainer.appendChild(toast);
            toast.animate([{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 300, fill: 'forwards', easing: 'ease-out' });
            setTimeout(() => {
                toast.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards', easing: 'ease-in' }).onfinish = () => toast.remove();
            }, 3000);
        },
        setupTabs() {
            document.querySelectorAll('.dyna-tabs').forEach(tabSet => {
                const tabs = tabSet.querySelectorAll('.dyna-tab');
                const contents = Array.from(tabSet.parentNode.querySelectorAll('.dyna-tab-content'));
                tabs.forEach((tab, i) => {
                    tab.onclick = () => {
                        tabs.forEach(t => t.classList.remove('active'));
                        tab.classList.add('active');
                        tabs.forEach(t => t.setAttribute('aria-selected', t === tab ? 'true' : 'false'));
                        contents.forEach((c, j) => {
                            c.classList.toggle('active', j === i);
                            c.hidden = j !== i;
                        });
                    };
                    tab.onkeydown = e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), tab.click());
                });
            });
        },
        setupAccordion() {
            document.querySelectorAll('.dyna-accordion').forEach(accordion => {
                const header = accordion.querySelector('.dyna-accordion-header');
                const body = accordion.querySelector('.dyna-accordion-body');
                if (!header || !body) return;
                const setState = expanded => {
                    body.style.maxHeight = expanded ? body.scrollHeight + 'px' : '0';
                    body.style.opacity = expanded ? '1' : '0';
                    body.style.visibility = expanded ? 'visible' : 'hidden';
                    body.hidden = !expanded;
                    header.setAttribute('aria-expanded', expanded);
                    accordion.classList.toggle('active', expanded);
                };
                setState(accordion.classList.contains('active'));
                header.onclick = () => setState(!accordion.classList.contains('active'));
                header.onkeydown = e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), header.click());
            });
        }
    };

    return {
        init: async function() {
            DOM.init();
            if (await I18n.loadStrings()) {
                I18n.applyStrings();
                ContentGenerator.generateAll();
                EventHandler.setupTaskAddition();
                EventHandler.setupModal();
                EventHandler.setupNavigation();
                EventHandler.setupNavigationHighlight();
                EventHandler.setupToast();
                EventHandler.setupTabs();
                EventHandler.setupAccordion();
                console.log('DynaCore UI Demo 初始化完成');
            }
        }
    };
})();

document.addEventListener('DOMContentLoaded', DynaApp.init);// demo.js

document.querySelectorAll('.dyna-accordion-header').forEach(header => {
  header.addEventListener('click', function () {
    const parent = header.parentElement;
    const body = parent.querySelector('.dyna-accordion-body');
    const expanded = header.getAttribute('aria-expanded') === 'true';

    // 关闭所有面板
    document.querySelectorAll('.dyna-accordion').forEach(acc => {
      acc.classList.remove('active');
      const accHeader = acc.querySelector('.dyna-accordion-header');
      const accBody = acc.querySelector('.dyna-accordion-body');
      accHeader.setAttribute('aria-expanded', 'false');
      accBody.hidden = true;
    });

    // 如果之前是关闭的，则展开当前
    if (!expanded) {
      parent.classList.add('active');
      header.setAttribute('aria-expanded', 'true');
      body.hidden = false;
    }
  });
});

// 页面加载时，确保已激活的面板展开
document.querySelectorAll('.dyna-accordion.active').forEach(acc => {
  const header = acc.querySelector('.dyna-accordion-header');
  const body = acc.querySelector('.dyna-accordion-body');
  header.setAttribute('aria-expanded', 'true');
  body.hidden = false;
});