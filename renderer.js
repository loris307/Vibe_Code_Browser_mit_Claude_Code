class TabManager {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.tabCounter = 0;
        this.homeURL = 'https://www.google.com';
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.createInitialTab();
    }
    
    initializeElements() {
        this.addressBar = document.getElementById('sidebar-address-bar');
        this.backBtn = document.getElementById('back-btn');
        this.forwardBtn = document.getElementById('forward-btn');
        this.refreshBtn = document.getElementById('refresh-btn');
        this.goBtn = document.getElementById('sidebar-go-btn');
        this.homeBtn = document.getElementById('home-btn');
        this.newTabBtn = document.getElementById('new-tab-btn');
        this.tabList = document.getElementById('tab-list');
        this.webviewContainer = document.getElementById('webview-container');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.urlDisplay = document.getElementById('url-display');
        
        // Quick Search Modal Elements
        this.quickSearchModal = document.getElementById('quick-search-modal');
        this.quickSearchInput = document.getElementById('quick-search-input');
        this.quickSearchCancel = document.getElementById('quick-search-cancel');
        this.quickSearchGo = document.getElementById('quick-search-go');
    }
    
    setupEventListeners() {
        this.backBtn.addEventListener('click', () => this.goBack());
        this.forwardBtn.addEventListener('click', () => this.goForward());
        this.refreshBtn.addEventListener('click', () => this.refresh());
        this.goBtn.addEventListener('click', () => this.navigate());
        this.homeBtn.addEventListener('click', () => this.goHome());
        this.newTabBtn.addEventListener('click', () => this.createTab());
        
        this.addressBar.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.navigate();
            }
        });
        
        this.addressBar.addEventListener('focus', () => {
            this.addressBar.select();
        });
        
        // Quick Search Modal Event Listeners
        this.quickSearchCancel.addEventListener('click', () => this.hideQuickSearch());
        this.quickSearchGo.addEventListener('click', () => this.executeQuickSearch());
        
        this.quickSearchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.executeQuickSearch();
            }
        });
        
        // Close modal when clicking backdrop
        this.quickSearchModal.addEventListener('click', (event) => {
            if (event.target === this.quickSearchModal || event.target.classList.contains('modal-backdrop')) {
                this.hideQuickSearch();
            }
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // ⌘ + K (Mac) or Ctrl + K (Windows/Linux) for Quick Search
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                this.showQuickSearch();
            }
            
            // ⌘ + T (Mac) or Ctrl + T (Windows/Linux) for New Tab
            if ((event.metaKey || event.ctrlKey) && event.key === 't') {
                event.preventDefault();
                this.createTab();
            }
            
            // ⌘ + W (Mac) or Ctrl + W (Windows/Linux) for Close Tab
            if ((event.metaKey || event.ctrlKey) && event.key === 'w') {
                event.preventDefault();
                if (this.tabs.length > 1) {
                    this.closeTab(this.activeTabId);
                }
            }
            
            // ⌘ + R (Mac) or Ctrl + R (Windows/Linux) for Refresh
            if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
                event.preventDefault();
                this.refresh();
            }
            
            // Escape to close Quick Search
            if (event.key === 'Escape') {
                this.hideQuickSearch();
            }
        });
    }
    
    showQuickSearch() {
        this.quickSearchModal.classList.remove('hidden');
        this.quickSearchInput.focus();
        this.quickSearchInput.value = '';
        
        // Add bounce animation
        const modal = this.quickSearchModal.querySelector('.modal-bounce');
        modal.style.animation = 'none';
        modal.offsetHeight; // Trigger reflow
        modal.style.animation = null;
    }
    
    hideQuickSearch() {
        this.quickSearchModal.classList.add('hidden');
    }
    
    executeQuickSearch() {
        const query = this.quickSearchInput.value.trim();
        if (query) {
            const validURL = this.isValidURL(query);
            this.createTab(validURL, 'Lädt...');
            this.hideQuickSearch();
        }
    }
    
    createTab(url = this.homeURL, title = 'Neuer Tab') {
        const tabId = `tab-${++this.tabCounter}`;
        
        const tab = {
            id: tabId,
            title: title,
            url: url,
            webview: null,
            element: null
        };
        
        // Create webview
        const webview = document.createElement('webview');
        webview.id = `webview-${tabId}`;
        webview.src = url;
        webview.className = 'w-full h-full hidden';
        webview.setAttribute('allowpopups', 'false');
        
        // Create tab element
        const tabElement = this.createTabElement(tab);
        
        // Setup webview event listeners
        this.setupWebviewListeners(webview, tab);
        
        tab.webview = webview;
        tab.element = tabElement;
        
        this.tabs.push(tab);
        this.tabList.appendChild(tabElement);
        this.webviewContainer.appendChild(webview);
        
        this.switchToTab(tabId);
        
        return tab;
    }
    
    createTabElement(tab) {
        const tabElement = document.createElement('div');
        tabElement.className = 'flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-tab-bg hover:scale-[1.01] hover:shadow-lg animate-slide-in group min-w-0';
        tabElement.dataset.tabId = tab.id;
        
        const indicatorDiv = document.createElement('div');
        indicatorDiv.className = 'flex items-center flex-1 min-w-0 overflow-hidden';
        
        const indicator = document.createElement('div');
        indicator.className = 'w-2.5 h-2.5 bg-gray-500 rounded-full mr-3 flex-shrink-0 transition-all duration-200';
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'text-sm text-gray-300 font-medium group-hover:text-white transition-colors duration-200 truncate block';
        titleSpan.textContent = tab.title;
        titleSpan.style.maxWidth = '180px';
        
        const closeButton = document.createElement('button');
        closeButton.className = 'ml-3 p-1.5 hover:bg-red-500 rounded-lg text-xs flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110';
        closeButton.textContent = '✕';
        closeButton.setAttribute('type', 'button');
        
        indicatorDiv.appendChild(indicator);
        indicatorDiv.appendChild(titleSpan);
        
        tabElement.appendChild(indicatorDiv);
        tabElement.appendChild(closeButton);
        
        // Event listeners
        tabElement.addEventListener('click', (event) => {
            if (event.target !== closeButton) {
                this.switchToTab(tab.id);
            }
        });
        
        closeButton.addEventListener('click', (event) => {
            event.stopPropagation();
            this.closeTab(tab.id);
        });
        
        return tabElement;
    }
    
    setupWebviewListeners(webview, tab) {
        webview.addEventListener('dom-ready', () => {
            this.updateNavigationButtons();
        });
        
        webview.addEventListener('did-start-loading', () => {
            if (tab.id === this.activeTabId) {
                this.loadingIndicator.classList.remove('hidden');
                this.urlDisplay.textContent = '';
            }
            this.updateTabIndicator(tab.id, 'loading');
        });
        
        webview.addEventListener('did-stop-loading', () => {
            if (tab.id === this.activeTabId) {
                this.loadingIndicator.classList.add('hidden');
                this.updateNavigationButtons();
                const currentURL = webview.getURL();
                this.addressBar.value = currentURL;
                this.urlDisplay.textContent = currentURL;
            }
            this.updateTabIndicator(tab.id, 'loaded');
        });
        
        webview.addEventListener('did-navigate', (event) => {
            if (tab.id === this.activeTabId) {
                const currentURL = event.url;
                this.addressBar.value = currentURL;
                this.urlDisplay.textContent = currentURL;
                this.updateNavigationButtons();
            }
            tab.url = event.url;
        });
        
        webview.addEventListener('did-navigate-in-page', (event) => {
            if (tab.id === this.activeTabId) {
                const currentURL = event.url;
                this.addressBar.value = currentURL;
                this.urlDisplay.textContent = currentURL;
                this.updateNavigationButtons();
            }
            tab.url = event.url;
        });
        
        webview.addEventListener('page-title-updated', (event) => {
            tab.title = event.title || 'Unbenannt';
            this.updateTabTitle(tab.id, tab.title);
        });
    }
    
    switchToTab(tabId) {
        // Hide all webviews and update tab styles
        this.tabs.forEach(tab => {
            tab.webview.classList.add('hidden');
            tab.element.classList.remove('bg-tab-active', 'shadow-xl', 'border-tab-active');
            tab.element.classList.add('hover:bg-tab-bg');
            
            // Reset title color
            const titleSpan = tab.element.querySelector('span');
            titleSpan.classList.remove('text-white');
            titleSpan.classList.add('text-gray-300');
        });
        
        // Show active webview and highlight active tab
        const activeTab = this.tabs.find(tab => tab.id === tabId);
        if (activeTab) {
            activeTab.webview.classList.remove('hidden');
            activeTab.element.classList.add('bg-tab-active', 'shadow-xl');
            activeTab.element.classList.remove('hover:bg-tab-bg');
            
            // Highlight active tab title
            const titleSpan = activeTab.element.querySelector('span');
            titleSpan.classList.add('text-white');
            titleSpan.classList.remove('text-gray-300');
            
            this.activeTabId = tabId;
            this.addressBar.value = activeTab.url;
            this.urlDisplay.textContent = activeTab.url;
            this.updateNavigationButtons();
        }
    }
    
    closeTab(tabId) {
        const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) return;
        
        const tab = this.tabs[tabIndex];
        
        // Remove elements
        tab.element.remove();
        tab.webview.remove();
        
        // Remove from array
        this.tabs.splice(tabIndex, 1);
        
        // If this was the active tab, switch to another
        if (this.activeTabId === tabId) {
            if (this.tabs.length > 0) {
                const newActiveTab = this.tabs[Math.max(0, tabIndex - 1)];
                this.switchToTab(newActiveTab.id);
            } else {
                this.createTab();
            }
        }
    }
    
    updateTabTitle(tabId, title) {
        const tab = this.tabs.find(tab => tab.id === tabId);
        if (tab) {
            const titleElement = tab.element.querySelector('span');
            titleElement.textContent = title;
        }
    }
    
    updateTabIndicator(tabId, status) {
        const tab = this.tabs.find(tab => tab.id === tabId);
        if (tab) {
            const indicator = tab.element.querySelector('.w-2');
            if (indicator) {
                indicator.className = 'w-2.5 h-2.5 rounded-full mr-3 flex-shrink-0 transition-all duration-200';
                
                switch (status) {
                    case 'loading':
                        indicator.classList.add('bg-yellow-400', 'animate-pulse');
                        break;
                    case 'loaded':
                        indicator.classList.add('bg-green-400');
                        indicator.classList.remove('animate-pulse');
                        break;
                    default:
                        indicator.classList.add('bg-gray-500');
                        indicator.classList.remove('animate-pulse');
                }
            }
        }
    }
    
    updateNavigationButtons() {
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (activeTab && activeTab.webview) {
            this.backBtn.disabled = !activeTab.webview.canGoBack();
            this.forwardBtn.disabled = !activeTab.webview.canGoForward();
        }
    }
    
    isValidURL(string) {
        try {
            if (!string.includes('://')) {
                string = 'https://' + string;
            }
            new URL(string);
            return string;
        } catch (_) {
            return `https://www.google.com/search?q=${encodeURIComponent(string)}`;
        }
    }
    
    navigate(url = null) {
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (!activeTab) return;
        
        const targetURL = url || this.addressBar.value;
        const validURL = this.isValidURL(targetURL);
        
        activeTab.webview.src = validURL;
        activeTab.url = validURL;
        this.addressBar.value = validURL;
    }
    
    goBack() {
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (activeTab && activeTab.webview.canGoBack()) {
            activeTab.webview.goBack();
        }
    }
    
    goForward() {
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (activeTab && activeTab.webview.canGoForward()) {
            activeTab.webview.goForward();
        }
    }
    
    refresh() {
        const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
        if (activeTab) {
            activeTab.webview.reloadIgnoringCache();
        }
    }
    
    goHome() {
        this.navigate(this.homeURL);
    }
    
    createInitialTab() {
        this.createTab(this.homeURL, 'Google');
    }
}

// Initialize the tab manager when DOM is loaded
let tabManager;
window.addEventListener('DOMContentLoaded', () => {
    tabManager = new TabManager();
});