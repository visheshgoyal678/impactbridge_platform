// Milestones & Escrow Release UI Module with Staggered Animations & Tranche Confetti
const MilestonesUI = {
    currentSolution: null,
    milestones: [],

    async load() {
        try {
            const solutions = await API.getSolutions();
            const selector = document.getElementById("milestoneSolutionSelector");

            if (selector && solutions.length > 0) {
                selector.innerHTML = solutions.map(s => `
                    <option value="${s.id}">${s.title} (${s.team_university || 'IIT Bombay'})</option>
                `).join('');

                const activeSolutionId = solutions[0].id;
                selector.value = activeSolutionId;
                await this.loadSolution(activeSolutionId);
            }
        } catch (err) {
            console.error("Failed to load milestones module:", err);
            AppState.showToast("Could not load project milestone data", "error");
        }
    },

    async loadSolution(solutionId) {
        try {
            const [solution, milestones] = await Promise.all([
                API.getSolution(solutionId),
                API.getMilestones(solutionId)
            ]);

            this.currentSolution = solution;
            this.milestones = milestones;

            // Render Header & Escrow Pool Stats with Animated Counter Roll-Up
            const titleEl = document.getElementById("msProjectTitle");
            const teamEl = document.getElementById("msProjectTeam");

            if (titleEl) titleEl.textContent = solution.title;
            if (teamEl) teamEl.textContent = `By ${solution.team_name} (${solution.team_university || 'IIT Bombay'}) • Target Challenge: ${solution.challenge_title || 'Societal Problem'}`;

            const totalPool = milestones.reduce((sum, m) => sum + (m.escrow_tranche || 0), 0);
            const unlocked = milestones.filter(m => m.status === 'APPROVED').reduce((sum, m) => sum + (m.escrow_tranche || 0), 0);
            const locked = totalPool - unlocked;

            AppState.animateCounter("msEscrowTotalPool", totalPool, "$");
            AppState.animateCounter("msEscrowUnlocked", unlocked, "$");
            AppState.animateCounter("msEscrowLocked", locked, "$");

            this.renderMilestonePipeline(milestones);
        } catch (err) {
            console.error("Failed to load solution milestones:", err);
            AppState.showToast("Failed to load project milestones", "error");
        }
    },

    renderMilestonePipeline(milestones) {
        const container = document.getElementById("milestonesPipelineContainer");
        if (!container) return;

        const stageIcons = {
            1: "file-code",
            2: "cpu",
            3: "activity",
            4: "check-circle"
        };

        const statusBadges = {
            LOCKED: "bg-slate-800/90 text-slate-400 border-slate-700",
            IN_PROGRESS: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            SUBMITTED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
            APPROVED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
        };

        container.innerHTML = milestones.map((m, idx) => `
            <div class="glass-panel glass-panel-hover rounded-3xl p-6 border ${m.status === 'APPROVED' ? 'border-emerald-600/40' : 'border-slate-800'} flex flex-col justify-between group relative overflow-hidden animate-card-enter" style="animation-delay: ${idx * 0.08}s;">
                <div>
                    <!-- Top Bar: Phase Number & Status -->
                    <div class="flex items-center justify-between gap-2 mb-3">
                        <div class="flex items-center gap-2">
                            <span class="w-7 h-7 rounded-xl bg-blue-600/20 text-blue-400 font-black text-xs flex items-center justify-center border border-blue-500/30">
                                ${m.sequence_order || idx + 1}
                            </span>
                            <span class="text-xs font-bold text-slate-200">Phase ${m.sequence_order || idx + 1}</span>
                        </div>

                        <span class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${statusBadges[m.status] || statusBadges.LOCKED}">
                            ${m.status.replace('_', ' ')}
                        </span>
                    </div>

                    <!-- Milestone Title -->
                    <h3 class="font-heading text-base font-bold text-white group-hover:text-blue-400 transition leading-snug">
                        ${m.title}
                    </h3>

                    <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                        ${m.description}
                    </p>

                    <!-- Escrow Tranche Value -->
                    <div class="mt-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                        <span class="text-slate-400">Escrow Tranche Payout:</span>
                        <strong class="text-emerald-400 text-sm font-mono">$${(m.escrow_tranche || 0).toLocaleString()} USD</strong>
                    </div>

                    <!-- Deliverable submission link if available -->
                    ${m.deliverable_url ? `
                        <div class="mt-3 text-xs flex items-center gap-2 p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-blue-300">
                            <i data-lucide="link" class="w-3.5 h-3.5 shrink-0"></i>
                            <a href="${m.deliverable_url}" target="_blank" class="truncate hover:underline font-mono text-[11px]">${m.deliverable_url}</a>
                        </div>
                    ` : ''}

                    ${m.verification_notes ? `
                        <div class="mt-2 text-[11px] p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                            <span class="font-bold text-emerald-400">Sign-off Feedback:</span> ${m.verification_notes}
                        </div>
                    ` : ''}
                </div>

                <!-- Action Button depending on current status -->
                <div class="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                    ${m.status === 'IN_PROGRESS' ? `
                        <button onclick="MilestonesUI.openSubmitModal(${m.id}, '${m.title}')" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/30">
                            <i data-lucide="upload" class="w-3.5 h-3.5"></i> Submit Phase Deliverable
                        </button>
                    ` : ''}

                    ${m.status === 'SUBMITTED' ? `
                        <button onclick="MilestonesUI.openApproveModal(${m.id}, '${m.title}', ${m.escrow_tranche})" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30">
                            <i data-lucide="check-circle-2" class="w-4 h-4"></i> Validate & Unlock Escrow
                        </button>
                    ` : ''}

                    ${m.status === 'APPROVED' ? `
                        <span class="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <i data-lucide="lock-open" class="w-4 h-4 text-emerald-400"></i> Escrow Funds Disbursed ($${(m.escrow_tranche || 0).toLocaleString()})
                        </span>
                    ` : ''}
                </div>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();
    },

    openSubmitModal(milestoneId, title) {
        document.getElementById("submitMilestoneId").value = milestoneId;
        document.getElementById("submitMilestoneTitleDisplay").textContent = title;
        AppState.openModal("submitMilestoneModal");
    },

    openApproveModal(milestoneId, title, tranche) {
        document.getElementById("approveMilestoneId").value = milestoneId;
        document.getElementById("approveMilestoneTitle").textContent = title;
        document.getElementById("approveTrancheAmount").textContent = `$${(tranche || 0).toLocaleString()} USD`;
        AppState.openModal("approveMilestoneModal");
    },

    async handleSubmitMilestoneForm(event) {
        event.preventDefault();
        const milestoneId = parseInt(document.getElementById("submitMilestoneId").value);
        const url = document.getElementById("milestoneDeliverableUrl").value.trim();
        const notes = document.getElementById("milestoneNotes").value.trim();

        try {
            await API.submitMilestone(milestoneId, {
                deliverable_url: url,
                notes: notes
            });

            AppState.closeModal("submitMilestoneModal");
            document.getElementById("submitMilestoneForm").reset();
            AppState.showToast("Milestone Deliverable Submitted for Validation!", "success");
            if (this.currentSolution) this.loadSolution(this.currentSolution.id);
        } catch (err) {
            console.error("Failed to submit milestone deliverable:", err);
            AppState.showToast(err.message || "Submission failed", "error");
        }
    },

    async handleApproveMilestoneForm(event) {
        event.preventDefault();
        const milestoneId = parseInt(document.getElementById("approveMilestoneId").value);
        const feedback = document.getElementById("approveFeedback").value.trim();

        try {
            await API.approveMilestone(milestoneId, {
                verifier_id: AppState.currentUser.id,
                feedback: feedback
            });

            AppState.closeModal("approveMilestoneModal");
            document.getElementById("approveMilestoneForm").reset();
            AppState.showToast("Milestone Approved & Grant Escrow Released!", "success");
            AppState.triggerConfetti();
            if (this.currentSolution) this.loadSolution(this.currentSolution.id);
        } catch (err) {
            console.error("Failed to approve milestone:", err);
            AppState.showToast(err.message || "Approval failed", "error");
        }
    }
};
