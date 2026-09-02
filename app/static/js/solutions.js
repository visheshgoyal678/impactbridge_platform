// University Solutions & Teams UI Module with Staggered Entrance Animations & 360° Spec Sheet
const SolutionsUI = {
    async load() {
        try {
            const [solutions, teams, challenges] = await Promise.all([
                API.getSolutions(),
                API.getTeams(),
                API.getChallenges()
            ]);

            this.renderTeams(teams);
            this.renderSolutions(solutions);
            this.populateModalSelects(challenges, teams);
        } catch (err) {
            console.error("Failed to load solutions module:", err);
            AppState.showToast("Could not load university solutions", "error");
        }
    },

    renderTeams(teams) {
        const grid = document.getElementById("teamsGrid");
        if (!grid) return;

        grid.innerHTML = teams.map((t, idx) => `
            <div class="glass-panel glass-panel-hover rounded-2xl p-4 border border-slate-800 flex flex-col justify-between animate-card-enter" style="animation-delay: ${idx * 0.05}s;">
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                            ${t.university}
                        </span>
                        <span class="text-[10px] text-slate-400 font-mono">${t.members ? t.members.length : 1} Members</span>
                    </div>
                    <h4 class="text-xs font-bold text-white leading-snug">${t.name}</h4>
                    <p class="text-[11px] text-slate-400 mt-1">${t.department || 'Applied Engineering Lab'}</p>
                </div>

                <div class="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span class="text-slate-500">Leader:</span>
                    <span class="font-semibold text-slate-300">${t.leader_name || 'Lead Researcher'}</span>
                </div>
            </div>
        `).join('');
    },

    renderSolutions(solutions) {
        const listEl = document.getElementById("solutionsList");
        if (!listEl) return;

        if (solutions.length === 0) {
            listEl.innerHTML = `
                <div class="col-span-full text-center py-12 glass-panel rounded-3xl border border-slate-800 animate-card-enter">
                    <i data-lucide="flask-conical" class="w-10 h-10 text-slate-600 mx-auto mb-2"></i>
                    <p class="text-xs text-slate-400">No university solution proposals submitted yet.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        listEl.innerHTML = solutions.map((s, idx) => {
            const trlPercent = Math.min(100, Math.round(((s.trl_level || 3) / 9) * 100));

            return `
                <div class="glass-panel glass-panel-hover rounded-3xl p-6 border border-slate-800 flex flex-col justify-between group relative animate-card-enter" style="animation-delay: ${idx * 0.06}s;">
                    <div>
                        <!-- Solution Top Row -->
                        <div class="flex items-center justify-between gap-2 mb-3">
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <i data-lucide="cpu" class="w-3 h-3"></i> TRL ${s.trl_level || 4}/9 Prototype
                            </span>
                            ${s.faculty_endorsed ? `
                                <span class="text-[10px] font-bold text-emerald-400 flex items-center gap-1" title="Endorsed by Faculty Advisor">
                                    <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Faculty Endorsed
                                </span>
                            ` : `
                                <span class="text-[10px] text-amber-400/80 flex items-center gap-1">
                                    <i data-lucide="clock" class="w-3 h-3"></i> Lab Validation Pending
                                </span>
                            `}
                        </div>

                        <!-- Solution Title & Abstract -->
                        <h3 class="font-heading text-base font-bold text-white group-hover:text-emerald-400 transition leading-snug">
                            ${s.title}
                        </h3>

                        <p class="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                            ${s.abstract}
                        </p>

                        <!-- Team & University Tag -->
                        <div class="mt-4 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
                            <div class="flex justify-between text-slate-400 text-[11px]">
                                <span>University:</span>
                                <strong class="text-slate-200">${s.team_university || 'IIT Bombay'}</strong>
                            </div>
                            <div class="flex justify-between text-slate-400 text-[11px]">
                                <span>Team:</span>
                                <strong class="text-blue-400">${s.team_name || 'Research Lab'}</strong>
                            </div>
                        </div>

                        <!-- TRL Progress Meter with Fluid Animation -->
                        <div class="mt-4 space-y-1">
                            <div class="flex justify-between text-[10px] text-slate-400 font-mono">
                                <span>Technology Readiness: TRL ${s.trl_level || 3}</span>
                                <span>${trlPercent}%</span>
                            </div>
                            <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                                <div class="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full fluid-progress-bar transition-all duration-500" style="width: ${trlPercent}%"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Bottom Action Buttons -->
                    <div class="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <button onclick="SolutionsUI.inspectSpecSheet(${s.id})" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5">
                            <i data-lucide="eye" class="w-3.5 h-3.5 text-blue-400"></i> 360° Spec
                        </button>

                        <button onclick="SolutionsUI.openMilestonesForSolution(${s.id})" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-md shadow-emerald-600/20">
                            <i data-lucide="git-merge" class="w-3.5 h-3.5"></i> Escrow Pipeline
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();
    },

    async inspectSpecSheet(solutionId) {
        try {
            const modalContent = document.getElementById("solutionSpecModalContent");
            if (!modalContent) return;

            modalContent.innerHTML = `<div class="py-8 text-center"><i data-lucide="loader-2" class="w-6 h-6 animate-spin text-blue-500 mx-auto"></i></div>`;
            AppState.openModal("solutionSpecModal");

            const s = await API.getSolution(solutionId);
            const BOM = [
                { item: "ESP32-S3 Microcontroller Core", cost: "$4.50", source: "Local Lab Stock" },
                { item: "SX1262 LoRa Telemetry Transceiver (868MHz)", cost: "$6.20", source: "Campus Fabrication" },
                { item: "TDR Dielectric Stainless Steel Prongs (3x)", cost: "$3.80", source: "Precision Workshop" },
                { item: "IP68 UV-Stabilized Polycarbonate Enclosure", cost: "$2.90", source: "3D Printed Prototype" },
                { item: "Monocrystalline Solar Trickle Cell (5V 150mA)", cost: "$3.50", source: "CleanTech Lab" }
            ];

            modalContent.innerHTML = `
                <div class="space-y-6">
                    <div class="flex items-start justify-between">
                        <div>
                            <span class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                Prototype Spec Sheet #IB-SOL-${s.id}
                            </span>
                            <h2 class="text-xl font-extrabold text-white mt-1">${s.title}</h2>
                            <p class="text-xs text-blue-400 font-semibold mt-0.5">${s.team_name} • ${s.team_university || 'IIT Bombay'}</p>
                        </div>
                        <div class="faculty-stamp">
                            ✓ FACULTY CERTIFIED LAB TEST
                        </div>
                    </div>

                    <!-- Abstract -->
                    <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                        <strong class="text-white block mb-1">Architecture & Technical Methodology:</strong>
                        ${s.abstract}
                    </div>

                    <!-- Bill of Materials (BOM) Breakdown -->
                    <div>
                        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                            <i data-lucide="cpu" class="w-4 h-4 text-emerald-400"></i> Open-Source Bill of Materials (BOM)
                        </h4>
                        <div class="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden text-xs">
                            <table class="w-full text-left">
                                <thead class="bg-slate-800/80 text-slate-400 font-mono text-[10px] uppercase">
                                    <tr>
                                        <th class="p-3">Component / Sub-Assembly</th>
                                        <th class="p-3">Unit Cost</th>
                                        <th class="p-3">Fabrication Source</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-800">
                                    ${BOM.map(b => `
                                        <tr>
                                            <td class="p-3 text-slate-200 font-medium">${b.item}</td>
                                            <td class="p-3 text-emerald-400 font-mono font-bold">${b.cost}</td>
                                            <td class="p-3 text-slate-400">${b.source}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                        <button onclick="AppState.closeModal('solutionSpecModal')" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold">
                            Close
                        </button>
                        <button onclick="SolutionsUI.openMilestonesForSolution(${s.id}); AppState.closeModal('solutionSpecModal');" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5">
                            <i data-lucide="git-merge" class="w-4 h-4"></i> View Milestone Escrow
                        </button>
                    </div>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        } catch (err) {
            console.error("Failed to inspect spec sheet:", err);
            AppState.showToast("Failed to load spec sheet", "error");
        }
    },

    openMilestonesForSolution(solutionId) {
        AppState.switchTab('milestones');
        setTimeout(() => {
            const selector = document.getElementById("milestoneSolutionSelector");
            if (selector) {
                selector.value = solutionId;
                MilestonesUI.loadSolution(solutionId);
            }
        }, 150);
    },

    populateModalSelects(challenges, teams) {
        const chSelect = document.getElementById("proposalChallengeSelect");
        const teamSelect = document.getElementById("proposalTeamSelect");

        if (chSelect) {
            chSelect.innerHTML = challenges.map(c => `<option value="${c.id}">${c.title} (${c.location || 'India'})</option>`).join('');
        }
        if (teamSelect) {
            teamSelect.innerHTML = teams.map(t => `<option value="${t.id}">${t.name} (${t.university})</option>`).join('');
        }
    },

    openProposalModal() {
        AppState.openModal("proposeSolutionModal");
    },

    openCreateTeamModal() {
        AppState.openModal("createTeamModal");
        this.populateTeamMembersList();
    },

    populateTeamMembersList() {
        const leaderSelect = document.getElementById("teamLeaderSelect");
        const advisorSelect = document.getElementById("teamAdvisorSelect");
        const membersContainer = document.getElementById("teamMembersSelectContainer");

        if (leaderSelect) {
            leaderSelect.innerHTML = AppState.users.filter(u => u.role === 'STUDENT').map(u => `<option value="${u.id}">${u.name} (${u.organization || 'Student'})</option>`).join('');
        }
        if (advisorSelect) {
            advisorSelect.innerHTML = `<option value="">-- No Advisor Assigned --</option>` + AppState.users.filter(u => u.role === 'FACULTY').map(u => `<option value="${u.id}">${u.name} (${u.organization || 'Faculty'})</option>`).join('');
        }
        if (membersContainer) {
            membersContainer.innerHTML = AppState.users.filter(u => u.role === 'STUDENT').map(u => `
                <label class="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 cursor-pointer hover:bg-slate-800">
                    <input type="checkbox" name="teamMember" value="${u.id}" class="rounded bg-slate-800 border-slate-700 text-blue-600">
                    <span>${u.name} (${u.organization || 'Student'})</span>
                </label>
            `).join('');
        }
    },

    async handleProposalSubmit(event) {
        event.preventDefault();
        const challengeId = parseInt(document.getElementById("proposalChallengeSelect").value);
        const teamId = parseInt(document.getElementById("proposalTeamSelect").value);
        const title = document.getElementById("proposalTitle").value.trim();
        const abstract = document.getElementById("proposalAbstract").value.trim();
        const techStack = document.getElementById("proposalTechStack").value.trim();
        const repoUrl = document.getElementById("proposalRepo").value.trim();
        const demoUrl = document.getElementById("proposalDemo").value.trim();

        try {
            await API.createSolution({
                challenge_id: challengeId,
                team_id: teamId,
                title,
                abstract,
                tech_stack: techStack,
                repo_url: repoUrl,
                demo_url: demoUrl,
                trl_level: 3
            });

            AppState.closeModal("proposeSolutionModal");
            document.getElementById("proposeSolutionForm").reset();
            AppState.showToast("University Solution Proposal Submitted!", "success");
            AppState.triggerConfetti();
            this.load();
        } catch (err) {
            console.error("Failed to submit proposal:", err);
            AppState.showToast(err.message || "Failed to submit solution", "error");
        }
    },

    async handleCreateTeamSubmit(event) {
        event.preventDefault();
        const name = document.getElementById("newTeamName").value.trim();
        const uni = document.getElementById("newTeamUni").value.trim();
        const dept = document.getElementById("newTeamDept").value.trim();
        const leaderId = parseInt(document.getElementById("teamLeaderSelect").value);
        const advisorVal = document.getElementById("teamAdvisorSelect").value;
        const advisorId = advisorVal ? parseInt(advisorVal) : null;

        const memberCheckboxes = document.querySelectorAll('input[name="teamMember"]:checked');
        const memberIds = Array.from(memberCheckboxes).map(cb => parseInt(cb.value));
        if (!memberIds.includes(leaderId)) memberIds.push(leaderId);

        try {
            await API.createTeam({
                name,
                university: uni,
                department: dept,
                leader_id: leaderId,
                advisor_id: advisorId,
                member_ids: memberIds
            });

            AppState.closeModal("createTeamModal");
            document.getElementById("createTeamForm").reset();
            AppState.showToast("Multidisciplinary Team Formed Successfully!", "success");
            this.load();
        } catch (err) {
            console.error("Failed to create team:", err);
            AppState.showToast(err.message || "Failed to create team", "error");
        }
    }
};
