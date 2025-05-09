/**
 * dynaUI组件库 - 组件初始化和交互处理
 */
(function() {
    // 初始化标签页
    function initTabs() {
        document.querySelectorAll('.dyna-tabs').forEach(tabGroup => {
            const tabs = tabGroup.querySelectorAll('.dyna-tab');
            const contents = document.querySelectorAll('.dyna-tab-content');

            tabs.forEach((tab, index) => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');

                    contents.forEach(c => c.classList.remove('active'));
                    contents[index].classList.add('active');
                });
            });
        });
    }

    // 初始化折叠面板
    function initAccordions() {
        document.querySelectorAll('.dyna-accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const accordion = header.parentElement;
                accordion.classList.toggle('active');
            });
        });
    }

    // 初始化下拉菜单
    function initDropdowns() {
        document.querySelectorAll('.dyna-dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = toggle.parentElement;
                dropdown.classList.toggle('active');
            });

            document.addEventListener('click', () => {
                document.querySelectorAll('.dyna-dropdown').forEach(d => {
                    d.classList.remove('active');
                });
            });
        });
    }

    // 初始化所有组件
    function initComponents() {
        initTabs();
        initAccordions();
        initDropdowns();
    }

    // 页面加载完成后初始化
    document.addEventListener('DOMContentLoaded', initComponents);
})();