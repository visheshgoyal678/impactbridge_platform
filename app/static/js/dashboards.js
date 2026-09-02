// Dedicated 4 Role Dashboards Module (Citizen, Student, Faculty, Admin)
const DashboardsUI = {
    async loadCurrentRoleDashboard() {
        if (!AppState.currentUser) return;
        const role = AppState.currentUser.role;

        // Hide all 4 role dashboard containers
        document.querySelectorAll(".role-dashboard-content").forEach(el => el.classList.add("hidden"));

        if (role === 'CITIZEN') {
            await this.renderCitizenDashboard();
        } else if (role === 'STUDENT') {
            await this.renderStudentDashboard();
        } else if (role === 'FACULTY') {
            await this.renderFacultyDashboard();
        } else if (role === 'ADMIN' || role === 'INDUSTRY') {
            await this.renderAdminDashboard();
        } else {
            await this.renderCitizenDashboard();
        }

        if (window.lucide) lucide.createIcons();
    },

    // =========================================================================
    // 1. CITIZEN / GRASSROOTS LEADER DASHBOARD
    // =========================================================================
    async renderCitizenDashboard() {
        const container = document.getElementById("dashboard-citizen");
        if (!container) return;
        container.classList.remove("hidden");

        const [challenges, activities] = await Promise.all([
            API.getChallenges(),
            API.getActivityFeed()
        ]);

        const userChallenges = challenges.filter(c => c.creator_id === AppState.currentUser.id || c.location?.includes("Belagavi") || c.location?.includes("Kisan"));
        const displayChallenges = userChallenges.length > 0 ? userChallenges : challenges.slice(0, 3);

        container.innerHTML = `
            <div class="space-y-6 animate-card-enter">
                <!-- Welcome Banner -->
                <div class="glass-panel p-6 rounded-3xl border border-blue-900/40 bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <img src="${AppState.currentUser.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}" class="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500/50 shadow-lg shadow-blue-500/20">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    Grassroots Citizen Portal
                                </span>
                                <span class="pulse-live-indicator text-[11px] text-emerald-400 font-bold">Community Active</span>
                            </div>
                            <h2 class="text-xl font-bold text-white mt-1">Namaste, ${AppState.currentUser.name}</h2>
                            <p class="text-xs text-slate-400">${AppState.currentUser.organization || 'Kisan Agritech Cooperative'} • Grassroots Problem Submitter</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <button onclick="AppState.openModal('createChallengeModal')" class="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5 animate-shimmer">
                            <i data-lucide="plus-circle" class="w-4 h-4"></i> Post Urgent Ground Problem
                        </button>
                    </div>
                </div>

                <!-- Citizen Stats Cards -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-slate-800">
                        <span class="text-slate-400 text-xs font-medium">My Submitted Problems</span>
                        <h3 class="text-2xl font-black text-white mt-1">${displayChallenges.length} Active</h3>
                        <p class="text-[10px] text-blue-400 mt-1">Tracked by university labs</p>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-slate-800">
                        <span class="text-slate-400 text-xs font-medium">Farmers & Beneficiaries</span>
                        <h3 class="text-2xl font-black text-emerald-400 mt-1">2,400+</h3>
                        <p class="text-[10px] text-emerald-400 mt-1">Belagavi dryland cluster</p>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-slate-800">
                        <span class="text-slate-400 text-xs font-medium">Student Solvers Assigned</span>
                        <h3 class="text-2xl font-black text-purple-400 mt-1">2 Teams</h3>
                        <p class="text-[10px] text-slate-400 mt-1">IIT Bombay Sensor Lab</p>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-slate-800">
                        <span class="text-slate-400 text-xs font-medium">Escrow Grant Secured</span>
                        <h3 class="text-2xl font-black text-amber-400 mt-1">$25,000</h3>
                        <p class="text-[10px] text-amber-400 mt-1">Tata Sustainability CSR</p>
                    </div>
                </div>

                <!-- Main Content Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <!-- Left Column: My Submitted Challenges -->
                    <div class="lg:col-span-7 space-y-4">
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                                <i data-lucide="inbox" class="w-4 h-4 text-blue-400"></i> My Community Problem Statements & Lab Progress
                            </h3>
                            <button onclick="AppState.switchTab('challenges')" class="text-xs text-blue-400 hover:underline">View All 9 Challenges →</button>
                        </div>

                        <div class="space-y-3">
                            ${displayChallenges.map((c, idx) => `
                                <div class="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col justify-between group">
                                    <div>
                                        <div class="flex items-center justify-between mb-2">
                                            <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                ${c.sdg_tag.replace('_', ' ')}
                                            </span>
                                            <span class="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                                                <i data-lucide="check-circle" class="w-3 h-3"></i> TRL 5 Lab Prototype In Progress
                                            </span>
                                        </div>
                                        <h4 class="text-sm font-bold text-white">${c.title}</h4>
                                        <p class="text-xs text-slate-400 mt-1 line-clamp-2">${c.description}</p>
                                        <div class="mt-3 flex items-center gap-4 text-[11px] text-slate-400">
                                            <span>📍 ${c.location || 'Belagavi, Karnataka'}</span>
                                            <span>👥 ${c.target_community || '2,400 Farmers'}</span>
                                            <span>👍 ${c.upvotes_count || 38} Community Upvotes</span>
                                        </div>
                                    </div>
                                    <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                                        <button onclick="ChallengesUI.viewDetails(${c.id})" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold">
                                            Field Notes & Discussion
                                        </button>
                                        <button onclick="AppState.switchTab('solutions')" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1">
                                            <i data-lucide="eye" class="w-3.5 h-3.5"></i> Inspect Solution Specs
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Right Column: Regional Hotspot Telemetry & Updates -->
                    <div class="lg:col-span-5 space-y-4">
                        <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <i data-lucide="activity" class="w-4 h-4 text-emerald-400"></i> Field Telemetry & Solver Stream
                        </h3>

                        <div class="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
                            <div class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                                <div class="flex justify-between items-center text-xs">
                                    <span class="font-bold text-slate-200">Belagavi Subsurface LoRa Sensor #04</span>
                                    <span class="text-emerald-400 font-mono font-bold">● ONLINE</span>
                                </div>
                                <p class="text-[11px] text-slate-400 mt-1">Dielectric volumetric water content: <strong>14.2%</strong> (Warning: Low moisture threshold)</p>
                                <div class="mt-2 w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                                    <div class="bg-amber-500 h-1.5 rounded-full" style="width: 28%"></div>
                                </div>
                            </div>

                            <div class="space-y-2">
                                <h5 class="text-[11px] font-bold uppercase text-slate-400">Recent Lab Team Notes</h5>
                                ${activities.slice(0, 3).map(a => `
                                    <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                                        <p class="font-semibold text-slate-200">${a.action}</p>
                                        <p class="text-[10px] text-slate-500 mt-0.5">${a.user_name} • ${new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                `).join('')}
                            </div>

                            <button onclick="ChallengesUI.setViewMode('geo'); AppState.switchTab('challenges');" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                                <i data-lucide="map-pin" class="w-3.5 h-3.5 text-emerald-400"></i> Open Full 3D Geo-Explorer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // =========================================================================
    // 2. STUDENT INNOVATOR DASHBOARD
    // =========================================================================
    async renderStudentDashboard() {
        const container = document.getElementById("dashboard-student");
        if (!container) return;
        container.classList.remove("hidden");

        const [solutions, teams, milestones] = await Promise.all([
            API.getSolutions(),
            API.getTeams(),
            API.getMilestones(1)
        ]);

        const myTeam = teams.find(t => t.leader_id === AppState.currentUser.id || t.university?.includes("IIT Bombay")) || teams[0];
        const mySolution = solutions.find(s => s.team_id === myTeam?.id) || solutions[0];

        container.innerHTML = `
            <div class="space-y-6 animate-card-enter">
                <!-- Welcome Banner -->
                <div class="glass-panel p-6 rounded-3xl border border-emerald-900/40 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <img src="${AppState.currentUser.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}" class="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Student Innovator & Lab Workspace
                                </span>
                                <span class="pulse-live-indicator text-[11px] text-emerald-400 font-bold">TRL 5 Active</span>
                            </div>
                            <h2 class="text-xl font-bold text-white mt-1">Welcome, ${AppState.currentUser.name}</h2>
                            <p class="text-xs text-slate-400">${myTeam ? myTeam.name : 'Team HydroMesh'} • ${myTeam ? myTeam.university : 'IIT Bombay'}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <button onclick="SolutionsUI.openProposalModal()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5">
                            <i data-lucide="rocket" class="w-4 h-4"></i> Submit Solution Proposal
                        </button>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-slate-800">
                        <span class="text-slate-400 text-xs font-medium">My Active Prototype</span>
                        <h3 class="text-lg font-black text-white mt-1">TRL 5 / 9</h3>
                        <p class="text-[10px] text-emerald-400 mt-1">Faculty Endorsed Lab Test</p>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-slate-800">
                        <span class="text-slate-400 text-xs font-medium">Escrow Grant Pool</span>
                        <h3 class="text-xl font-black text-emerald-400 mt-1">$15,000</h3>
                        <p class="text-[10px] text-blue-400 mt-1">$6,000 unlocked</p>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-slate-800">
                        <span class="text-slate-400 text-xs font-medium">Faculty Advisor</span>
                        <h3 class="text-sm font-bold text-white mt-1">Prof. Arvind S.</h3>
                        <p class="text-[10px] text-slate-400 mt-1">Centre for Sensors & IoT</p>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-slate-800">
                        <span class="text-slate-400 text-xs font-medium">Next Milestone Phase</span>
                        <h3 class="text-sm font-bold text-amber-400 mt-1">Phase 3: Telemetry</h3>
                        <p class="text-[10px] text-slate-400 mt-1">Due in 12 days</p>
                    </div>
                </div>

                <!-- Main Section: 3D Hardware Digital Twin & Team Pod -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <!-- Left: 3D CAD Prototype Workspace -->
                    <div class="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                                    <i data-lucide="cpu" class="w-3.5 h-3.5"></i> My 3D Hardware Prototype CAD
                                </span>
                                <h3 class="text-base font-extrabold text-white">${mySolution ? mySolution.title : 'HydroMesh LoRa Subsurface Soil Probe'}</h3>
                            </div>
                            <button onclick="SolutionsUI.inspectSpecSheet(${mySolution ? mySolution.id : 1})" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1">
                                <i data-lucide="eye" class="w-3.5 h-3.5 text-blue-400"></i> Open 360° BOM
                            </button>
                        </div>

                        <!-- 3D Viewport Controls -->
                        <div class="flex flex-wrap gap-2 pt-1">
                            <button onclick="ThreeEngine.cad && ThreeEngine.cad.toggleExploded()" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/25">
                                <i data-lucide="layers" class="w-3.5 h-3.5"></i> Exploded BOM View
                            </button>
                            <button onclick="ThreeEngine.cad && ThreeEngine.cad.toggleWireframe()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5">
                                <i data-lucide="eye" class="w-3.5 h-3.5 text-purple-400"></i> Wireframe X-Ray
                            </button>
                            <button onclick="ThreeEngine.cad && ThreeEngine.cad.toggleRotation()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5">
                                <i data-lucide="rotate-3d" class="w-3.5 h-3.5 text-emerald-400"></i> Toggle Spin
                            </button>
                        </div>

                        <!-- 3D Canvas -->
                        <div class="relative rounded-2xl bg-slate-950/70 border border-slate-800 p-2 flex flex-col items-center">
                            <div id="cad3dContainer" class="w-full h-64 md:h-72 cursor-grab"></div>
                            <p class="text-[10px] text-slate-500 mt-1">Orbit 360° • Zoom • Inspect PCB sub-assemblies</p>
                        </div>
                    </div>

                    <!-- Right: Milestone Escrow Deliverables -->
                    <div class="lg:col-span-5 space-y-4">
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                                <i data-lucide="git-merge" class="w-4 h-4 text-emerald-400"></i> Milestone Escrow Delivery Pipeline
                            </h3>
                            <button onclick="AppState.switchTab('milestones')" class="text-xs text-blue-400 hover:underline">Full Pipeline →</button>
                        </div>

                        <div class="space-y-3">
                            ${milestones.map((m, idx) => `
                                <div class="glass-panel p-4 rounded-2xl border ${m.status === 'APPROVED' ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800'} text-xs space-y-2">
                                    <div class="flex items-center justify-between">
                                        <span class="font-bold text-white">Phase ${m.sequence_order || idx + 1}: ${m.title}</span>
                                        <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${m.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : m.status === 'SUBMITTED' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'}">
                                            ${m.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p class="text-[11px] text-slate-400 line-clamp-2">${m.description}</p>
                                    <div class="flex items-center justify-between pt-2 border-t border-slate-800/80">
                                        <span class="font-mono text-emerald-400 font-bold">$${(m.escrow_tranche || 0).toLocaleString()} USD</span>
                                        ${m.status === 'IN_PROGRESS' ? `
                                            <button onclick="MilestonesUI.openSubmitModal(${m.id}, '${m.title}')" class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold">
                                                Submit Deliverable
                                            </button>
                                        ` : m.status === 'APPROVED' ? `
                                            <span class="text-[10px] text-emerald-400 font-bold">✓ Funds Released</span>
                                        ` : `
                                            <span class="text-[10px] text-amber-400 font-bold">Under Faculty Review</span>
                                        `}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            if (window.ThreeEngine) ThreeEngine.initCADViewer();
        }, 150);
    },

    // =========================================================================
    // 3. FACULTY ADVISOR DASHBOARD
    // =========================================================================
    async renderFacultyDashboard() {
        const container = document.getElementById("dashboard-faculty");
        if (!container) return;
        container.classList.remove("hidden");

        const [solutions, teams, milestones] = await Promise.all([
            API.getSolutions(),
            API.getTeams(),
            API.getMilestones(1)
        ]);

        const pendingSolutions = solutions.filter(s => !s.faculty_endorsed);
        const endorsedSolutions = solutions.filter(s => s.faculty_endorsed);

        container.innerHTML = `
            <div class="space-y-6 animate-card-enter">
                <!-- Welcome Banner -->
                <div class="glass-panel p-6 rounded-3xl border border-purple-900/40 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <img src="${AppState.currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" class="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500/50 shadow-lg shadow-purple-500/20">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    Faculty Lab Director Portal
                                </span>
                                <span class="pulse-live-indicator text-[11px] text-emerald-400 font-bold">Academic Review Active</span>
                            </div>
                            <h2 class="text-xl font-bold text-white mt-1">${AppState.currentUser.name}</h2>
                            <p class="text-xs text-slate-400">${AppState.currentUser.organization || 'IIT Bombay'} • Senior Faculty Advisor & Lab Director</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="faculty-stamp text-xs">
                            ✓ AUTHORIZED LAB VERIFIER
                        </span>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-slate-800">
                        <span class="text-slate-400 text-xs font-medium">Supervised Student Teams</span>
                        <h3 class="text-2xl font-black text-white mt-1">${teams.length} Labs</h3>
                        <p class="text-[10px] text-blue-400 mt-1">18 Graduate Fellows</p>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-slate-800">
                        <span class="text-slate-400 text-xs font-medium">Endorsed Prototypes</span>
                        <h3 class="text-2xl font-black text-emerald-400 mt-1">${endorsedSolutions.length} Certified</h3>
                        <p class="text-[10px] text-emerald-400 mt-1">TRL 4 - TRL 6 readiness</p>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-slate-800">
                        <span class="text-slate-400 text-xs font-medium">Pending Review Queue</span>
                        <h3 class="text-2xl font-black text-amber-400 mt-1">${pendingSolutions.length} Proposals</h3>
                        <p class="text-[10px] text-amber-400 mt-1">Awaiting verification stamp</p>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-slate-800">
                        <span class="text-slate-400 text-xs font-medium">Milestone Escrow Supervised</span>
                        <h3 class="text-2xl font-black text-purple-400 mt-1">$45,000</h3>
                        <p class="text-[10px] text-slate-400 mt-1">Grant disbursements</p>
                    </div>
                </div>

                <!-- Section: Pending Endorsement Queue & Lab Verification -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <!-- Left: Solution Endorsement Queue -->
                    <div class="lg:col-span-7 space-y-4">
                        <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i> Student Solution Proposals Requiring Faculty Endorsement
                        </h3>

                        <div class="space-y-3">
                            ${solutions.map(s => `
                                <div class="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col justify-between group">
                                    <div>
                                        <div class="flex items-center justify-between mb-2">
                                            <span class="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                                ${s.team_name} (${s.team_university || 'IIT Bombay'})
                                            </span>
                                            ${s.faculty_endorsed ? `
                                                <span class="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                                    <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Endorsed & Certified
                                                </span>
                                            ` : `
                                                <span class="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                                                    <i data-lucide="clock" class="w-3.5 h-3.5"></i> Endorsement Pending
                                                </span>
                                            `}
                                        </div>

                                        <h4 class="text-base font-bold text-white">${s.title}</h4>
                                        <p class="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">${s.abstract}</p>
                                    </div>

                                    <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                                        <button onclick="SolutionsUI.inspectSpecSheet(${s.id})" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1">
                                            <i data-lucide="eye" class="w-3.5 h-3.5 text-blue-400"></i> Review BOM & Architecture
                                        </button>
                                        ${!s.faculty_endorsed ? `
                                            <button onclick="DashboardsUI.endorseSolution(${s.id})" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30">
                                                <i data-lucide="award" class="w-3.5 h-3.5"></i> Stamp Faculty Endorsement
                                            </button>
                                        ` : `
                                            <span class="text-xs text-emerald-400 font-bold">✓ Signed off</span>
                                        `}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Right: Deliverable Sign-Off Queue -->
                    <div class="lg:col-span-5 space-y-4">
                        <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <i data-lucide="file-check" class="w-4 h-4 text-purple-400"></i> Milestone Deliverable Verification Queue
                        </h3>

                        <div class="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
                            ${milestones.map(m => `
                                <div class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                                    <div class="flex justify-between items-center">
                                        <strong class="text-slate-200">${m.title}</strong>
                                        <span class="text-[10px] font-mono text-emerald-400 font-bold">$${(m.escrow_tranche || 0).toLocaleString()}</span>
                                    </div>
                                    <p class="text-[11px] text-slate-400">${m.description}</p>
                                    <div class="pt-2 flex justify-between items-center">
                                        <span class="text-[10px] text-slate-500">Status: ${m.status}</span>
                                        ${m.status === 'SUBMITTED' ? `
                                            <button onclick="MilestonesUI.openApproveModal(${m.id}, '${m.title}', ${m.escrow_tranche})" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">
                                                Sign-off & Unlock
                                            </button>
                                        ` : `
                                            <span class="text-[10px] text-slate-400">${m.status === 'APPROVED' ? '✓ Verified' : 'Awaiting Student Submission'}</span>
                                        `}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    endorseSolution(solutionId) {
        AppState.showToast("Signed Faculty Endorsement & Lab Validation Stamp!", "success");
        AppState.triggerConfetti();
        setTimeout(() => this.renderFacultyDashboard(), 500);
    },

    // =========================================================================
    // 4. ADMIN / INNOVATION REVIEW BOARD DASHBOARD
    // =========================================================================
    async renderAdminDashboard() {
        const container = document.getElementById("dashboard-admin");
        if (!container) return;
        container.classList.remove("hidden");

        const [kpis, challenges, solutions, grants, activities] = await Promise.all([
            API.getAnalyticsKpis(),
            API.getChallenges(),
            API.getSolutions(),
            API.getGrants(),
            API.getActivityFeed()
        ]);

        const totalPledged = grants.reduce((sum, g) => sum + (g.amount || 0), 0);
        const totalReleased = grants.reduce((sum, g) => sum + (g.amount_released || 0), 0);

        container.innerHTML = `
            <div class="space-y-6 animate-card-enter">
                <!-- Welcome Banner -->
                <div class="glass-panel p-6 rounded-3xl border border-amber-900/40 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 border border-white/20">
                            <i data-lucide="shield-check" class="w-8 h-8"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Platform Admin & Review Board
                                </span>
                                <span class="pulse-live-indicator text-[11px] text-emerald-400 font-bold">100% Escrow Health</span>
                            </div>
                            <h2 class="text-xl font-bold text-white mt-1">ImpactBridge Executive Console</h2>
                            <p class="text-xs text-slate-400">National Open Innovation Mission • Corporate CSR & Academic Governance</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <button onclick="AppState.switchTab('analytics')" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                            <i data-lucide="bar-chart-3" class="w-4 h-4 text-blue-400"></i> Full SDG Analytics
                        </button>
                    </div>
                </div>

                <!-- Executive KPIs with Roll-Up Counters -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-slate-800">
                        <span class="text-slate-400 text-xs font-medium">Total CSR Grants Pledged</span>
                        <h3 id="adminKpiPledged" class="text-2xl font-black text-white mt-1">$${totalPledged.toLocaleString()}</h3>
                        <p class="text-[10px] text-blue-400 mt-1">Smart contract escrow secured</p>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-slate-800">
                        <span class="text-slate-400 text-xs font-medium">Disbursed via Milestone Tranches</span>
                        <h3 id="adminKpiReleased" class="text-2xl font-black text-emerald-400 mt-1">$${totalReleased.toLocaleString()}</h3>
                        <p class="text-[10px] text-emerald-400 mt-1">Verified deliverable sign-offs</p>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-slate-800">
                        <span class="text-slate-400 text-xs font-medium">Participating Universities</span>
                        <h3 class="text-2xl font-black text-purple-400 mt-1">${kpis.participating_universities || 14} Labs</h3>
                        <p class="text-[10px] text-slate-400 mt-1">IIT Bombay, Kharagpur, BITS, VNIT</p>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-slate-800">
                        <span class="text-slate-400 text-xs font-medium">Crowdsourced Ground Needs</span>
                        <h3 class="text-2xl font-black text-amber-400 mt-1">${challenges.length} Problems</h3>
                        <p class="text-[10px] text-slate-400 mt-1">Grassroots citizen submissions</p>
                    </div>
                </div>

                <!-- Admin Management Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <!-- Left: Smart Escrow Release Authorization Matrix -->
                    <div class="lg:col-span-7 space-y-4">
                        <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <i data-lucide="git-merge" class="w-4 h-4 text-emerald-400"></i> Smart Escrow Grant Authorization Matrix
                        </h3>

                        <div class="space-y-3">
                            ${grants.map(g => `
                                <div class="glass-panel p-5 rounded-3xl border border-slate-800 flex items-center justify-between gap-4">
                                    <div>
                                        <span class="text-[10px] font-bold text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                            ${g.sponsor_company}
                                        </span>
                                        <h4 class="text-sm font-bold text-white mt-1">${g.challenge_title || 'Clean Water Initiative'}</h4>
                                        <p class="text-xs text-slate-400">Pledged: <strong>$${g.amount.toLocaleString()}</strong> • Released: <strong class="text-emerald-400">$${(g.amount_released || 0).toLocaleString()}</strong></p>
                                    </div>
                                    <button onclick="AppState.switchTab('milestones')" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0">
                                        <i data-lucide="lock-open" class="w-3.5 h-3.5 text-emerald-400"></i> Authorize Tranche
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Right: Live Platform Audit & User Telemetry Stream -->
                    <div class="lg:col-span-5 space-y-4">
                        <div class="glass-panel p-5 rounded-3xl border border-cyan-500/30 bg-slate-900/90 space-y-3">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <div class="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                                        <i data-lucide="database" class="w-4 h-4"></i>
                                    </div>
                                    <h4 class="text-xs font-bold text-slate-200">Firebase Cloud Firestore</h4>
                                </div>
                                <span id="firebaseStatusBadge" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">Checking...</span>
                            </div>
                            <p class="text-[11px] text-slate-400 leading-relaxed">
                                Real-time synchronization of ground challenges, R&D solutions, and CSR escrow pipelines with Google Cloud Firestore collections.
                            </p>
                            <div class="flex items-center justify-between pt-1">
                                <span class="text-[10px] text-slate-500 font-mono" id="firebaseProjectLabel">Project: loading...</span>
                                <button onclick="DashboardsUI.triggerFirebaseSync()" id="btnFirebaseSync" class="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 active:scale-95 transition">
                                    <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Sync to Firestore
                                </button>
                            </div>
                        </div>

                        <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 pt-2">
                            <i data-lucide="activity" class="w-4 h-4 text-blue-400"></i> Platform Real-Time Audit Telemetry
                        </h3>

                        <div class="glass-panel p-5 rounded-3xl border border-slate-800 space-y-2.5 max-h-72 overflow-y-auto">
                            ${activities.map(a => `
                                <div class="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
                                    <div class="flex justify-between items-center text-slate-400 text-[10px]">
                                        <strong class="text-slate-200">${a.user_name || 'Innovator'}</strong>
                                        <span>${new Date(a.created_at).toLocaleTimeString()}</span>
                                    </div>
                                    <p class="text-slate-300 mt-0.5">${a.action}</p>
                                    ${a.details ? `<p class="text-[10px] text-blue-400 mt-0.5 font-mono">${a.details}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        AppState.animateCounter("adminKpiPledged", totalPledged, "$");
        AppState.animateCounter("adminKpiReleased", totalReleased, "$");
        this.updateFirebaseStatusUI();
    },

    async updateFirebaseStatusUI() {
        try {
            const status = await API.getFirebaseStatus();
            const badge = document.getElementById("firebaseStatusBadge");
            const label = document.getElementById("firebaseProjectLabel");
            if (badge) {
                if (status.connected) {
                    badge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
                    badge.innerText = "ONLINE (CONNECTED)";
                } else {
                    badge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30";
                    badge.innerText = status.status;
                }
            }
            if (label) {
                label.innerText = `Project: ${status.project_id || 'Not Configured'}`;
            }
        } catch (e) {
            console.error("Firebase status error:", e);
        }
    },

    async triggerFirebaseSync() {
        const btn = document.getElementById("btnFirebaseSync");
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Syncing...`;
            if (window.lucide) lucide.createIcons();
        }

        try {
            const res = await API.triggerFirebaseSync();
            AppState.showToast(res.message || "Synced all records to Cloud Firestore!", "success");
            AppState.triggerConfetti();
            this.updateFirebaseStatusUI();
        } catch (err) {
            AppState.showToast(`Firebase Sync: ${err.message}`, "warning");
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Sync to Firestore`;
                if (window.lucide) lucide.createIcons();
            }
        }
    }
};

