// Global Application State, Authentication Controller, Home Page Router & Command Palette
const AppState = {
    currentUser: null,
    users: [],
    sdgs: {},
    activeTab: 'dashboard', // 'dashboard', 'challenges', 'solutions', 'industry', 'milestones', 'matching', 'analytics'
    selectedSolutionId: null,
    tickerInterval: null,
    currentView: 'home', // 'home' or 'app'

    // Predefined persona profiles with 1-click access
    personas: [
        { 
            id: 1, 
            name: "Ramesh Kumar", 
            role: "CITIZEN", 
            org: "Kisan Agritech Cooperative", 
            desc: "Grassroots farmer lead posting community water & energy problems",
            icon: "user-check",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            color: "blue"
        },
        { 
            id: 4, 
            name: "Aarav Sharma", 
            role: "STUDENT", 
            org: "IIT Bombay Sensor Lab", 
            desc: "IoT & hardware lead building 3D soil sensor prototypes",
            icon: "graduation-cap",
            avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
            color: "emerald"
        },
        { 
            id: 8, 
            name: "Prof. Dr. Arvind Swaminathan", 
            role: "FACULTY", 
            org: "Centre for Sensors & Systems", 
            desc: "Senior faculty advisor endorsing lab prototypes & milestone tests",
            icon: "microscope",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            color: "purple"
        },
        { 
            id: 13, 
            name: "Dr. Sunita Rao (Review Board)", 
            role: "ADMIN", 
            org: "National Innovation Mission", 
            desc: "Review board admin releasing smart escrow CSR grant tranches",
            icon: "shield-check",
            avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
            color: "amber"
        }
    ],

    async init() {
        try {
            // Fetch users and SDGs
            this.users = await API.getUsers();
            this.sdgs = await API.getSdgs();

            // Populate Home Page Role Access Cards
            this.renderHomeRoleCards();

            // Setup navigation & Command Palette
            this.setupTabNavigation();
            this.setupCommandPalette();
            this.setupCardTilt();

            // Animate Home Page Live Telemetry Counters
            this.animateCounter("homePledgedCounter", 133000, "$", "+", 1200);
            this.animateCounter("homeChallengesCounter", 9, "", "", 1000);
            this.animateCounter("homeUniversitiesCounter", 14, "", "+", 1000);
            this.animateCounter("homeBeneficiariesCounter", 2400, "", "+", 1400);

            // Default to Home View
            this.showHomeView();

            if (window.lucide) {
                lucide.createIcons();
            }
        } catch (err) {
            console.error("Initialization failed:", err);
            this.showToast("Failed to initialize platform data", "error");
        }
    },

    // =========================================================================
    // VIEW ROUTING: HOME PAGE vs APP DASHBOARD
    // =========================================================================
    showHomeView() {
        this.currentView = 'home';
        const homeView = document.getElementById("homeView");
        const appView = document.getElementById("appView");

        if (homeView) homeView.classList.remove("hidden");
        if (appView) appView.classList.add("hidden");

        // Initialize 3D Robot & Globe on the Home Page
        setTimeout(() => {
            if (window.ThreeEngine) {
                ThreeEngine.initRobot("robot3dContainer");
                ThreeEngine.initGlobe("homeGlobeContainer");
            }
        }, 150);

        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (window.lucide) lucide.createIcons();
    },

    switchHero3DView(view) {
        const robotView = document.getElementById("heroRobotView");
        const globeView = document.getElementById("heroGlobeView");
        const btnRobot = document.getElementById("btnHeroViewRobot");
        const btnGlobe = document.getElementById("btnHeroViewGlobe");

        if (view === 'robot') {
            if (robotView) robotView.classList.remove("hidden");
            if (globeView) globeView.classList.add("hidden");
            if (btnRobot) {
                btnRobot.classList.add("bg-blue-600", "text-white");
                btnRobot.classList.remove("bg-slate-800", "text-slate-400");
            }
            if (btnGlobe) {
                btnGlobe.classList.remove("bg-blue-600", "text-white");
                btnGlobe.classList.add("bg-slate-800", "text-slate-400");
            }
            setTimeout(() => {
                if (window.ThreeEngine) ThreeEngine.initRobot("robot3dContainer");
            }, 100);
        } else {
            if (robotView) robotView.classList.add("hidden");
            if (globeView) globeView.classList.remove("hidden");
            if (btnGlobe) {
                btnGlobe.classList.add("bg-blue-600", "text-white");
                btnGlobe.classList.remove("bg-slate-800", "text-slate-400");
            }
            if (btnRobot) {
                btnRobot.classList.remove("bg-blue-600", "text-white");
                btnRobot.classList.add("bg-slate-800", "text-slate-400");
            }
            setTimeout(() => {
                if (window.ThreeEngine) ThreeEngine.initGlobe("homeGlobeContainer");
            }, 100);
        }
        if (window.lucide) lucide.createIcons();
    },

    enterRoleDashboard(userId = 4) {
        this.currentView = 'app';
        const homeView = document.getElementById("homeView");
        const appView = document.getElementById("appView");

        if (homeView) homeView.classList.add("hidden");
        if (appView) appView.classList.remove("hidden");

        // Set logged-in user
        const user = this.users.find(u => u.id === userId) || this.users[0];
        this.setCurrentUser(user);

        // Start Live Activity Ticker
        this.startLiveTicker();

        // Switch to primary role dashboard tab
        this.switchTab('dashboard');

        this.showToast(`Entered ${user.role} Dashboard as ${user.name}`, "success");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (window.lucide) lucide.createIcons();
    },

    // =========================================================================
    // SIGN IN & REGISTRATION MODAL CONTROLLERS
    // =========================================================================
    openSignInModal(initialTab = 'quick') {
        this.openModal('signInModal');
        this.switchSignInTab(initialTab);
        this.renderSignInModalPortals();
    },

    switchSignInTab(tabKey) {
        document.querySelectorAll(".signin-tab-btn").forEach(btn => {
            const isActive = btn.getAttribute("data-signintab") === tabKey;
            btn.classList.toggle("bg-blue-600", isActive);
            btn.classList.toggle("text-white", isActive);
            btn.classList.toggle("bg-slate-800", !isActive);
            btn.classList.toggle("text-slate-400", !isActive);
        });

        document.querySelectorAll(".signin-tab-content").forEach(c => {
            c.classList.add("hidden");
        });

        const activeContent = document.getElementById(`signin-tab-${tabKey}`);
        if (activeContent) {
            activeContent.classList.remove("hidden");
            activeContent.classList.add("animate-card-enter");
        }
        if (window.lucide) lucide.createIcons();
    },

    renderSignInModalPortals() {
        const container = document.getElementById("modalQuickPortalsContainer");
        if (!container) return;

        const roleThemes = {
            CITIZEN: { border: "border-blue-500/30 hover:border-blue-400", bg: "from-blue-950/30 to-slate-900", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
            STUDENT: { border: "border-emerald-500/30 hover:border-emerald-400", bg: "from-emerald-950/30 to-slate-900", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
            FACULTY: { border: "border-purple-500/30 hover:border-purple-400", bg: "from-purple-950/30 to-slate-900", badge: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
            ADMIN: { border: "border-amber-500/30 hover:border-amber-400", bg: "from-amber-950/30 to-slate-900", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" }
        };

        container.innerHTML = this.personas.map(p => {
            const theme = roleThemes[p.role] || roleThemes.CITIZEN;
            return `
                <div onclick="AppState.closeModal('signInModal'); AppState.enterRoleDashboard(${p.id});" class="glass-panel p-3.5 rounded-2xl border ${theme.border} bg-gradient-to-r ${theme.bg} flex items-center justify-between cursor-pointer hover:scale-[1.02] transition shadow-md group">
                    <div class="flex items-center gap-3">
                        <img src="${p.avatar}" class="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-sm">
                        <div>
                            <div class="flex items-center gap-2">
                                <h4 class="text-xs font-bold text-white group-hover:text-blue-300 transition">${p.name}</h4>
                                <span class="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${theme.badge}">${p.role}</span>
                            </div>
                            <p class="text-[10px] text-slate-400 mt-0.5">${p.org}</p>
                        </div>
                    </div>
                    <div class="w-7 h-7 rounded-lg bg-blue-600/30 group-hover:bg-blue-600 text-blue-400 group-hover:text-white flex items-center justify-center transition">
                        <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                    </div>
                </div>
            `;
        }).join('');
        if (window.lucide) lucide.createIcons();
    },

    quickFillDemo(role) {
        const matchingUser = this.personas.find(p => p.role === role) || this.personas[0];
        const emailInput = document.getElementById("signInEmailInput");
        const passInput = document.getElementById("signInPasswordInput");
        const roleSelect = document.getElementById("signInRoleSelect");

        if (emailInput) emailInput.value = `${role.toLowerCase()}@impactbridge.org`;
        if (passInput) passInput.value = "password123";
        if (roleSelect) roleSelect.value = role;

        this.showToast(`Pre-filled credentials for ${matchingUser.name} (${role})`, "info");
    },

    handleCredentialsSignIn(event) {
        event.preventDefault();
        const role = document.getElementById("signInRoleSelect") ? document.getElementById("signInRoleSelect").value : "STUDENT";
        const matchingUser = this.users.find(u => u.role === role) || this.users[0];
        this.closeModal('signInModal');
        this.enterRoleDashboard(matchingUser.id);
    },

    handleRegisterAccount(event) {
        event.preventDefault();
        const name = document.getElementById("regNameInput") ? document.getElementById("regNameInput").value.trim() : "New Innovator";
        const role = document.getElementById("regRoleSelect") ? document.getElementById("regRoleSelect").value : "STUDENT";
        const matchingUser = this.users.find(u => u.role === role) || this.users[0];
        this.closeModal('signInModal');
        this.enterRoleDashboard(matchingUser.id);
        this.showToast(`Welcome ${name}! Account initialized as ${role}`, "success");
        this.triggerConfetti();
    },

    renderHomeRoleCards() {
        const container = document.getElementById("homeRoleCardsContainer");
        if (!container) return;

        const roleThemes = {
            CITIZEN: { border: "border-blue-500/30 hover:border-blue-400", bg: "from-blue-950/20 via-slate-900 to-slate-900", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30", btn: "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30" },
            STUDENT: { border: "border-emerald-500/30 hover:border-emerald-400", bg: "from-emerald-950/20 via-slate-900 to-slate-900", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", btn: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30" },
            FACULTY: { border: "border-purple-500/30 hover:border-purple-400", bg: "from-purple-950/20 via-slate-900 to-slate-900", badge: "bg-purple-500/20 text-purple-300 border-purple-500/30", btn: "bg-purple-600 hover:bg-purple-500 shadow-purple-600/30" },
            ADMIN: { border: "border-amber-500/30 hover:border-amber-400", bg: "from-amber-950/20 via-slate-900 to-slate-900", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", btn: "bg-amber-600 hover:bg-amber-500 shadow-amber-600/30" }
        };

        container.innerHTML = this.personas.map((p, idx) => {
            const theme = roleThemes[p.role] || roleThemes.CITIZEN;
            return `
                <div onclick="AppState.enterRoleDashboard(${p.id})" class="glass-panel glass-panel-hover rounded-3xl p-6 border ${theme.border} bg-gradient-to-b ${theme.bg} flex flex-col justify-between cursor-pointer group shadow-xl animate-card-enter" style="animation-delay: ${idx * 0.08}s;">
                    <div>
                        <div class="flex items-center justify-between mb-4">
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${theme.badge}">
                                ${p.role} PORTAL
                            </span>
                            <img src="${p.avatar}" class="w-10 h-10 rounded-2xl object-cover border border-white/20 shadow-md">
                        </div>

                        <h3 class="font-heading text-lg font-black text-white group-hover:text-blue-300 transition">
                            ${p.name}
                        </h3>
                        <p class="text-xs text-blue-400 font-semibold mt-0.5">${p.org}</p>

                        <p class="text-xs text-slate-400 mt-2.5 leading-relaxed line-clamp-2">
                            ${p.desc}
                        </p>
                    </div>

                    <div class="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <span class="text-[11px] font-bold text-slate-300 group-hover:text-white transition">Open Dashboard</span>
                        <div class="w-8 h-8 rounded-xl ${theme.btn} text-white flex items-center justify-center transition-transform group-hover:translate-x-1">
                            <i data-lucide="arrow-right" class="w-4 h-4"></i>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    setCurrentUser(user) {
        this.currentUser = user;
        const nameEl = document.getElementById("currentUserDisplay");
        const roleEl = document.getElementById("currentUserRole");
        const avatarEl = document.getElementById("currentUserAvatar");

        if (nameEl) nameEl.textContent = user.name;
        if (roleEl) roleEl.textContent = `${user.role} • ${user.organization || 'Independent'}`;
        if (avatarEl) {
            avatarEl.src = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`;
        }

        // Populate persona dropdown
        this.renderPersonaSwitcher();
    },

    renderPersonaSwitcher() {
        const container = document.getElementById("personaSwitcherOptions");
        if (!container) return;

        container.innerHTML = this.personas.map(p => `
            <button onclick="AppState.switchPersona(${p.id})" class="w-full text-left px-3.5 py-2.5 text-xs rounded-xl hover:bg-slate-700/60 transition flex items-center justify-between group ${this.currentUser && this.currentUser.id === p.id ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30' : 'text-slate-300'}">
                <div>
                    <p class="font-bold group-hover:text-white">${p.name}</p>
                    <p class="text-[10px] text-slate-400">${p.role} • ${p.org}</p>
                </div>
                ${this.currentUser && this.currentUser.id === p.id ? '<span class="w-2 h-2 rounded-full bg-blue-400 shadow-sm shadow-blue-400"></span>' : ''}
            </button>
        `).join('');
    },

    switchPersona(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            this.setCurrentUser(user);
            this.switchTab('dashboard');
            this.showToast(`Switched to: ${user.name} (${user.role})`, "info");
        }
        const dropdown = document.getElementById("personaDropdown");
        if (dropdown) dropdown.classList.add("hidden");
    },

    setupTabNavigation() {
        const tabBtns = document.querySelectorAll(".tab-btn");
        tabBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const targetTab = btn.getAttribute("data-tab");
                this.switchTab(targetTab);
            });
        });
    },

    switchTab(tabKey) {
        this.activeTab = tabKey;

        // Update tab buttons
        document.querySelectorAll(".tab-btn").forEach(btn => {
            const isActive = btn.getAttribute("data-tab") === tabKey;
            btn.classList.toggle("active", isActive);
            btn.classList.toggle("text-slate-400", !isActive);
            btn.classList.toggle("text-blue-400", isActive);
        });

        // Hide all tab views
        document.querySelectorAll(".tab-content").forEach(view => {
            view.classList.add("hidden");
        });

        // Show selected view
        const activeView = document.getElementById(`tab-${tabKey}`);
        if (activeView) {
            activeView.classList.remove("hidden");
            activeView.classList.add("animate-card-enter");
        }

        // Trigger module load
        if (tabKey === 'dashboard') {
            DashboardsUI.loadCurrentRoleDashboard();
        }
        if (tabKey === 'challenges') ChallengesUI.load();
        if (tabKey === 'solutions') {
            SolutionsUI.load();
            setTimeout(() => {
                if (window.ThreeEngine) ThreeEngine.initCADViewer();
            }, 100);
        }
        if (tabKey === 'industry') IndustryUI.load();
        if (tabKey === 'milestones') {
            MilestonesUI.load();
            setTimeout(() => {
                if (window.ThreeEngine) ThreeEngine.initEscrowVault();
            }, 100);
        }
        if (tabKey === 'matching') MatchingUI.load();
        if (tabKey === 'analytics') AnalyticsUI.load();

        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 150);

        if (window.lucide) {
            lucide.createIcons();
        }
    },

    // Smooth Number Count-Up Animation Helper
    animateCounter(elementOrId, targetValue, prefix = "", suffix = "", duration = 1000) {
        const el = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
        if (!el) return;

        const start = 0;
        const end = parseFloat(targetValue) || 0;
        const isFloat = String(targetValue).includes(".");
        const startTime = performance.now();

        function updateCount(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = start + (end - start) * easeProgress;

            el.textContent = `${prefix}${isFloat ? currentVal.toFixed(1) : Math.round(currentVal).toLocaleString()}${suffix}`;

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            } else {
                el.textContent = `${prefix}${isFloat ? end.toFixed(1) : end.toLocaleString()}${suffix}`;
            }
        }

        requestAnimationFrame(updateCount);
    },

    // Live Innovation Activity Ticker
    startLiveTicker() {
        const tickerEl = document.getElementById("liveInnovationTicker");
        if (!tickerEl) return;

        const pulseEvents = [
            "⚡ IIT Bombay IoT Lab released Field Validation Report for Belagavi Soil Moisture Sensor.",
            "💰 Tata Sustainability CSR Fund pledged $25,000 to Rural Clean Energy Micro-Grid.",
            "🏆 Faculty Endorsement signed by Prof. Arvind Swaminathan for Low-Cost Fluoride Filtration.",
            "🌱 2,400 dryland farmers connected to live automated irrigation telemetry in Belagavi.",
            "🚀 Team HydroMesh unlocked Escrow Milestone Phase 3 ($4,500 released)."
        ];

        let index = 0;
        tickerEl.textContent = pulseEvents[0];

        if (this.tickerInterval) clearInterval(this.tickerInterval);
        this.tickerInterval = setInterval(() => {
            index = (index + 1) % pulseEvents.length;
            tickerEl.style.opacity = '0';
            setTimeout(() => {
                tickerEl.textContent = pulseEvents[index];
                tickerEl.style.opacity = '1';
            }, 300);
        }, 5000);
    },

    // Universal Command Palette (Ctrl+K)
    setupCommandPalette() {
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggleCommandPalette();
            }
            if (e.key === 'Escape') {
                this.closeModal('commandPaletteModal');
            }
        });
    },

    toggleCommandPalette() {
        const modal = document.getElementById("commandPaletteModal");
        if (!modal) return;

        if (modal.classList.contains("hidden")) {
            this.openModal("commandPaletteModal");
            const input = document.getElementById("cmdSearchInput");
            if (input) {
                input.value = "";
                input.focus();
                this.filterCommands("");
            }
        } else {
            this.closeModal("commandPaletteModal");
        }
    },

    filterCommands(query) {
        const list = document.getElementById("cmdSearchResults");
        if (!list) return;

        const q = (query || "").toLowerCase();
        const actions = [
            { icon: "home", title: "Go to Introduction Home Page", subtitle: "Platform overview, 3D globe & ecosystem showcase", action: () => { this.showHomeView(); this.closeModal('commandPaletteModal'); } },
            { icon: "layout-dashboard", title: "Go to My Role Dashboard", subtitle: `Active Role: ${this.currentUser ? this.currentUser.role : 'Guest'}`, action: () => { this.enterRoleDashboard(this.currentUser ? this.currentUser.id : 4); this.closeModal('commandPaletteModal'); } },
            { icon: "compass", title: "1. Crowdsource Challenges Hub", subtitle: "Browse community problems & 3D innovation globe", action: () => { this.enterRoleDashboard(4); this.switchTab('challenges'); this.closeModal('commandPaletteModal'); } },
            { icon: "flask-conical", title: "2. University Innovation Lab", subtitle: "Explore 3D hardware CAD models & student prototypes", action: () => { this.enterRoleDashboard(4); this.switchTab('solutions'); this.closeModal('commandPaletteModal'); } }
        ];

        const filtered = actions.filter(a => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q));

        list.innerHTML = filtered.length > 0 ? filtered.map((item, idx) => `
            <div onclick="AppState.executeCommand(${idx})" class="cmd-item p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/60 cursor-pointer flex items-center justify-between group">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                        <i data-lucide="${item.icon}" class="w-4 h-4"></i>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition">${item.title}</p>
                        <p class="text-[10px] text-slate-400">${item.subtitle}</p>
                    </div>
                </div>
                <i data-lucide="corner-down-left" class="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition"></i>
            </div>
        `).join('') : `
            <div class="py-8 text-center text-xs text-slate-500">No matching commands found.</div>
        `;

        this.currentFilteredCommands = filtered;
        if (window.lucide) lucide.createIcons();
    },

    executeCommand(idx) {
        if (this.currentFilteredCommands && this.currentFilteredCommands[idx]) {
            this.currentFilteredCommands[idx].action();
        }
    },

    // Interactive 3D Card Tilt
    setupCardTilt() {
        document.addEventListener('mousemove', (e) => {
            const card = e.target.closest('.glass-panel-tilt');
            if (!card) return;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            card.style.transform = `perspective(1000px) rotateX(${-y * 0.025}deg) rotateY(${x * 0.025}deg) translateY(-5px)`;
        });

        document.addEventListener('mouseout', (e) => {
            const card = e.target.closest('.glass-panel-tilt');
            if (card) {
                card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
            }
        });
    },

    // Confetti FX trigger
    triggerConfetti() {
        if (window.confetti) {
            confetti({
                particleCount: 80,
                spread: 75,
                origin: { y: 0.7 },
                colors: ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#38bdf8']
            });
        }
    },

    showToast(message, type = "success") {
        const container = document.getElementById("toastContainer");
        if (!container) return;

        const colors = {
            success: "bg-slate-900/95 border-emerald-500/50 text-emerald-300 shadow-emerald-950/50",
            error: "bg-slate-900/95 border-rose-500/50 text-rose-300 shadow-rose-950/50",
            info: "bg-slate-900/95 border-blue-500/50 text-blue-300 shadow-blue-950/50",
            warning: "bg-slate-900/95 border-amber-500/50 text-amber-300 shadow-amber-950/50"
        };

        const icons = {
            success: "check-circle",
            error: "alert-octagon",
            info: "sparkles",
            warning: "alert-triangle"
        };

        const toast = document.createElement("div");
        toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 transform translate-y-4 opacity-0 text-xs font-semibold ${colors[type] || colors.info}`;
        toast.innerHTML = `
            <i data-lucide="${icons[type] || 'info'}" class="w-4 h-4 shrink-0"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();

        // Animate in
        setTimeout(() => {
            toast.classList.remove("translate-y-4", "opacity-0");
        }, 10);

        // Animate out
        setTimeout(() => {
            toast.classList.add("translate-y-4", "opacity-0");
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove("hidden");
            modal.classList.add("flex");
            if (window.lucide) lucide.createIcons();
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add("hidden");
            modal.classList.remove("flex");
        }
    }
};

// =========================================================================
// NOVA AI ROBOTIC CHATBOT ENGINE
// =========================================================================
const NovaChat = {
    voiceEnabled: true,

    init() {
        this.renderInitialGreeting();
    },

    toggleVoice() {
        this.voiceEnabled = !this.voiceEnabled;
        const btn = document.getElementById("btnNovaVoiceToggle");
        if (btn) {
            btn.classList.toggle("text-cyan-400", this.voiceEnabled);
            btn.classList.toggle("text-slate-500", !this.voiceEnabled);
            btn.title = this.voiceEnabled ? "Voice Output: ON" : "Voice Output: OFF";
        }
        AppState.showToast(this.voiceEnabled ? "Nova voice output enabled" : "Nova voice output muted", "info");
        if (window.lucide) lucide.createIcons();
    },

    renderInitialGreeting() {
        const container = document.getElementById("novaChatMessages");
        if (!container) return;

        container.innerHTML = `
            <div class="flex items-start gap-2.5 animate-card-enter">
                <div class="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                    <i data-lucide="bot" class="w-4 h-4"></i>
                </div>
                <div class="glass-panel p-3 rounded-2xl rounded-tl-none border border-cyan-500/30 bg-slate-900/90 text-xs text-slate-200 max-w-[88%] space-y-1.5 shadow-md">
                    <p class="font-bold text-cyan-300">👋 Hello! I am Nova, your AI Robotics Guide.</p>
                    <p class="text-slate-300">Ask me anything about ground challenges, 3D CAD prototypes, CSR grant escrow, or role dashboards!</p>
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    },

    handleFormSubmit(event) {
        event.preventDefault();
        const input = document.getElementById("novaChatInput");
        if (!input) return;
        const query = input.value.trim();
        if (!query) return;
        this.submitMessage(query);
        input.value = "";
    },

    sendQuickPrompt(text) {
        this.submitMessage(text);
    },

    submitMessage(query) {
        const container = document.getElementById("novaChatMessages");
        if (!container) return;

        // 1. Render User Message
        const userHtml = `
            <div class="flex items-start justify-end gap-2.5 animate-card-enter">
                <div class="p-2.5 rounded-2xl rounded-tr-none bg-blue-600 text-white text-xs font-medium max-w-[80%] shadow-md">
                    ${query}
                </div>
                <div class="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <i data-lucide="user" class="w-3.5 h-3.5"></i>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', userHtml);
        container.scrollTop = container.scrollHeight;

        // Trigger robot energetic wave
        if (window.ThreeEngine && ThreeEngine.robot) {
            ThreeEngine.robot.wave(4000);
        }

        // Show thinking indicator
        const thinkingId = "novaThinking_" + Date.now();
        const thinkingHtml = `
            <div id="${thinkingId}" class="flex items-start gap-2.5 animate-card-enter">
                <div class="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                    <i data-lucide="bot" class="w-4 h-4"></i>
                </div>
                <div class="glass-panel px-3 py-2 rounded-2xl rounded-tl-none border border-slate-700 bg-slate-900/90 text-xs text-cyan-400 flex items-center gap-1.5 shadow-sm">
                    <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
                    <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style="animation-delay: 0.15s"></span>
                    <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style="animation-delay: 0.3s"></span>
                    <span class="text-[10px] text-slate-400 ml-1">Analyzing knowledge graph...</span>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', thinkingHtml);
        container.scrollTop = container.scrollHeight;
        if (window.lucide) lucide.createIcons();

        // 2. Generate Intelligent Knowledge Response
        setTimeout(() => {
            const thinkingEl = document.getElementById(thinkingId);
            if (thinkingEl) thinkingEl.remove();

            const replyObj = this.generateBotReply(query);

            const botHtml = `
                <div class="flex items-start gap-2.5 animate-card-enter">
                    <div class="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                        <i data-lucide="bot" class="w-4 h-4"></i>
                    </div>
                    <div class="glass-panel p-3 rounded-2xl rounded-tl-none border border-cyan-500/30 bg-slate-900/90 text-xs text-slate-200 max-w-[88%] space-y-2 shadow-md">
                        <p class="leading-relaxed">${replyObj.text}</p>
                        ${replyObj.actionHtml ? `<div class="pt-1.5 border-t border-slate-800">${replyObj.actionHtml}</div>` : ''}
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', botHtml);
            container.scrollTop = container.scrollHeight;
            if (window.lucide) lucide.createIcons();

            // Speak audio if enabled
            if (this.voiceEnabled && window.ThreeEngine && ThreeEngine.robot) {
                ThreeEngine.robot.speakAudio(replyObj.spokenText || replyObj.text.replace(/<[^>]*>?/gm, ''));
            }
        }, 500);
    },

    generateBotReply(query) {
        const q = query.toLowerCase();

        // 1. Escrow & Milestones
        if (q.includes("escrow") || q.includes("milestone") || q.includes("vault") || q.includes("release") || q.includes("fund")) {
            return {
                text: "ImpactBridge uses a <strong>4-Stage Smart Escrow Model</strong>. Pledged CSR grants ($133,000+ total) are locked in smart contracts and released across 4 phases (20% Feasibility, 30% CAD Twin, 30% Field Pilot, 20% Rollout) upon faculty and community validation.",
                spokenText: "Impact Bridge uses a 4-stage smart contract escrow model. Grants are unlocked in 4 phases upon faculty and ground test verification.",
                actionHtml: `<button onclick="AppState.enterRoleDashboard(4); AppState.switchTab('milestones')" class="px-3 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600 border border-amber-500/40 text-amber-300 hover:text-white text-[11px] font-bold transition flex items-center gap-1.5"><i data-lucide="lock" class="w-3.5 h-3.5"></i> Open Escrow Vault Tracker</button>`
            };
        }

        // 2. 3D CAD & University Hardware Prototypes
        if (q.includes("cad") || q.includes("prototype") || q.includes("hardware") || q.includes("lab") || q.includes("student") || q.includes("hydromesh")) {
            return {
                text: "In our <strong>3D Innovation Lab</strong>, student researchers from 14+ university labs build interactive 3D Hardware Digital Twins. Check out the <em>HydroMesh Soil Moisture Probe</em> with Exploded BOM layers and faculty endorsement stamps.",
                spokenText: "In our 3D Innovation Lab, student researchers build interactive hardware digital twins with exploded BOM inspection.",
                actionHtml: `<button onclick="AppState.enterRoleDashboard(4); AppState.switchTab('solutions')" class="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white text-[11px] font-bold transition flex items-center gap-1.5"><i data-lucide="cpu" class="w-3.5 h-3.5"></i> Explore 3D CAD Lab</button>`
            };
        }

        // 3. Ground Problems & Grassroots Challenges
        if (q.includes("problem") || q.includes("challenge") || q.includes("belagavi") || q.includes("sundarbans") || q.includes("thar") || q.includes("water") || q.includes("farmer")) {
            return {
                text: "There are currently <strong>9 crowdsourced societal challenges</strong> from ground clusters: including <em>Soil Moisture Deficit in Belagavi</em> (2,400 farmers), <em>Water Salinity in Sundarbans</em>, and <em>Solar Micro-Grids in Thar</em>.",
                spokenText: "There are 9 verified societal challenges crowdsourced from ground communities. You can explore them on the 3D globe or problem bank.",
                actionHtml: `<button onclick="AppState.enterRoleDashboard(4); AppState.switchTab('challenges')" class="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600 border border-blue-500/40 text-blue-300 hover:text-white text-[11px] font-bold transition flex items-center gap-1.5"><i data-lucide="compass" class="w-3.5 h-3.5"></i> Browse Problem Bank</button>`
            };
        }

        // 4. CSR Grants & Corporate Industry
        if (q.includes("csr") || q.includes("corporate") || q.includes("industry") || q.includes("sponsor") || q.includes("roi") || q.includes("tax")) {
            return {
                text: "Corporate sponsors (Tata Sustainability, Reliance Green) pledge tax-deductible CSR grants to sponsor student innovation pods. You can use our <strong>CSR ROI Simulator</strong> to project beneficiary reach and carbon offset.",
                spokenText: "Corporate sponsors pledge CSR grants to fund student pods. You can simulate societal impact and ROI with our calculator.",
                actionHtml: `<button onclick="AppState.enterRoleDashboard(4); AppState.switchTab('industry')" class="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 border border-purple-500/40 text-purple-300 hover:text-white text-[11px] font-bold transition flex items-center gap-1.5"><i data-lucide="calculator" class="w-3.5 h-3.5"></i> Simulate CSR Impact ROI</button>`
            };
        }

        // 5. Dashboards / Roles / Personas / Login
        if (q.includes("dashboard") || q.includes("role") || q.includes("login") || q.includes("sign in") || q.includes("citizen") || q.includes("faculty") || q.includes("admin") || q.includes("ramesh") || q.includes("aarav")) {
            return {
                text: "ImpactBridge features 4 dedicated role dashboards: 👨‍🌾 <strong>Citizen</strong> (Ramesh Kumar), 🎓 <strong>Student</strong> (Aarav Sharma), 🔬 <strong>Faculty</strong> (Prof. Arvind Swaminathan), and 🛡️ <strong>Admin</strong> (Dr. Sunita Rao).",
                spokenText: "ImpactBridge features 4 dedicated role dashboards for Citizens, Students, Faculty, and Admins.",
                actionHtml: `<button onclick="AppState.openSignInModal()" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[11px] font-black transition flex items-center gap-1.5 shadow-md"><i data-lucide="key" class="w-3.5 h-3.5"></i> Choose Role & Sign In</button>`
            };
        }

        // 6. Greetings & General
        return {
            text: "Hello! I am your AI Robotics Co-Pilot. I can help you crowdsource ground problems, inspect 3D CAD prototypes, pledge CSR grants, or enter any role dashboard. What would you like to explore?",
            spokenText: "Hello! I am your AI Robotics Co-Pilot. How can I help you make an impact today?",
            actionHtml: `<div class="flex flex-wrap gap-1.5"><button onclick="NovaChat.sendQuickPrompt('Show open ground problems')" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-[10px] font-semibold">🌾 Open Problems</button><button onclick="NovaChat.sendQuickPrompt('How does milestone escrow work?')" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] font-semibold">💰 Milestone Escrow</button><button onclick="AppState.openSignInModal()" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-semibold">🔑 Sign In</button></div>`
        };
    }
};

// Toggle Persona Dropdown
function togglePersonaDropdown() {
    const dropdown = document.getElementById("personaDropdown");
    if (dropdown) {
        dropdown.classList.toggle("hidden");
    }
}

// Close dropdown on outside click
document.addEventListener("click", (e) => {
    const switcher = document.getElementById("personaSwitcherContainer");
    const dropdown = document.getElementById("personaDropdown");
    if (switcher && dropdown && !switcher.contains(e.target)) {
        dropdown.classList.add("hidden");
    }
});

// Boot app on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    AppState.init();
    NovaChat.init();
});

