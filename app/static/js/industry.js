// Industry & CSR Partnerships UI Module with ROI Simulator & Animated Counters
const IndustryUI = {
    async load() {
        try {
            const [grants, challenges, mentors] = await Promise.all([
                API.getGrants(),
                API.getChallenges(),
                API.getIndustryMentors()
            ]);

            this.renderStats(grants, mentors);
            this.renderGrants(grants);
            this.renderMentors(mentors);
            this.populatePledgeSelects(challenges);
            this.setupRoiSimulator();
        } catch (err) {
            console.error("Failed to load industry module:", err);
            AppState.showToast("Could not load CSR partnerships", "error");
        }
    },

    setupRoiSimulator() {
        const slider = document.getElementById("csrRoiSlider");
        if (!slider) return;

        slider.addEventListener("input", (e) => {
            const amount = parseFloat(e.target.value);
            this.updateRoiCalculations(amount);
        });

        this.updateRoiCalculations(parseFloat(slider.value));
    },

    updateRoiCalculations(grantAmount) {
        const amountDisplay = document.getElementById("csrRoiAmountDisplay");
        const benDisplay = document.getElementById("roiBeneficiaries");
        const protoDisplay = document.getElementById("roiPrototypes");
        const stuDisplay = document.getElementById("roiStudents");
        const co2Display = document.getElementById("roiCarbon");

        if (amountDisplay) amountDisplay.textContent = `$${grantAmount.toLocaleString()}`;

        // Dynamic multi-factor projections
        const beneficiaries = Math.round(grantAmount * 0.28);
        const prototypes = Math.max(1, Math.round(grantAmount / 12000));
        const fellowships = Math.max(1, Math.round(grantAmount / 5000));
        const carbonOffset = (grantAmount * 0.0018).toFixed(1);

        if (benDisplay) benDisplay.textContent = `${beneficiaries.toLocaleString()} People`;
        if (protoDisplay) protoDisplay.textContent = `${prototypes} Full Field Pilots`;
        if (stuDisplay) stuDisplay.textContent = `${fellowships} Student Fellows`;
        if (co2Display) co2Display.textContent = `${carbonOffset} Metric Tons`;
    },

    previewCsrCertificate() {
        const amount = document.getElementById("csrRoiAmountDisplay") ? document.getElementById("csrRoiAmountDisplay").textContent : "$25,000";
        AppState.showToast(`Previewing verified CSR ESG Tax & Impact Certificate for ${amount}`, "info");
        AppState.triggerConfetti();
    },

    renderStats(grants, mentors) {
        const totalPledged = grants.reduce((sum, g) => sum + (g.amount || 0), 0);
        const totalReleased = grants.reduce((sum, g) => sum + (g.amount_released || 0), 0);

        // Smooth Animated Roll-Up
        AppState.animateCounter("csrTotalPledged", totalPledged, "$");
        AppState.animateCounter("csrTotalReleased", totalReleased, "$");
        AppState.animateCounter("csrActiveMentorsCount", mentors ? mentors.length : 4, "");
    },

    renderGrants(grants) {
        const listEl = document.getElementById("grantsList");
        if (!listEl) return;

        if (grants.length === 0) {
            listEl.innerHTML = `
                <div class="col-span-full text-center py-12 glass-panel rounded-3xl border border-slate-800 animate-card-enter">
                    <i data-lucide="briefcase" class="w-10 h-10 text-slate-600 mx-auto mb-2"></i>
                    <p class="text-xs text-slate-400">No corporate CSR sponsorships active yet.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        listEl.innerHTML = grants.map((g, idx) => {
            const percentReleased = g.amount > 0 ? Math.round(((g.amount_released || 0) / g.amount) * 100) : 0;

            return `
                <div class="glass-panel glass-panel-hover rounded-3xl p-6 border border-slate-800 flex flex-col justify-between group animate-card-enter" style="animation-delay: ${idx * 0.06}s;">
                    <div>
                        <!-- Header -->
                        <div class="flex items-center justify-between gap-2 mb-3">
                            <span class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Corporate CSR Grant
                            </span>
                            <span class="text-xs font-black text-amber-400 font-mono">
                                $${g.amount.toLocaleString()} USD
                            </span>
                        </div>

                        <!-- Sponsor & Challenge -->
                        <h3 class="font-heading text-base font-bold text-white group-hover:text-amber-400 transition leading-snug">
                            ${g.sponsor_company || 'Corporate CSR Foundation'}
                        </h3>

                        <p class="text-xs text-slate-400 mt-2 line-clamp-2">
                            Pledged for: <strong>${g.challenge_title || 'Clean Water & Energy Initiative'}</strong>
                        </p>

                        <!-- Escrow Release Flow Meter -->
                        <div class="mt-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                            <div class="flex justify-between text-xs">
                                <span class="text-slate-400">Escrow Released:</span>
                                <strong class="text-emerald-400">$${(g.amount_released || 0).toLocaleString()} (${percentReleased}%)</strong>
                            </div>
                            <div class="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                                <div class="bg-gradient-to-r from-amber-500 to-emerald-500 h-2 rounded-full fluid-progress-bar transition-all duration-500" style="width: ${percentReleased}%"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span class="text-slate-500 text-[11px]">ESG Tax Compliant</span>
                        <button onclick="AppState.switchTab('milestones')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1">
                            <i data-lucide="git-merge" class="w-3.5 h-3.5 text-blue-400"></i> Escrow Vault
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();
    },

    renderMentors(mentors) {
        const listEl = document.getElementById("mentorsList");
        if (!listEl) return;

        listEl.innerHTML = (mentors || []).map((m, idx) => `
            <div class="glass-panel glass-panel-hover rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-4 animate-card-enter" style="animation-delay: ${idx * 0.05}s;">
                <div class="flex items-center gap-3">
                    <img src="${m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=7c3aed&color=fff`}" class="w-10 h-10 rounded-xl object-cover border border-purple-500/40 shrink-0">
                    <div>
                        <h4 class="text-xs font-bold text-white">${m.name}</h4>
                        <p class="text-[11px] text-purple-400 font-semibold">${m.organization || 'Corporate Tech Lead'}</p>
                        <p class="text-[10px] text-slate-400 mt-0.5">${m.skills || 'Hardware Architecture • Systems Design'}</p>
                    </div>
                </div>

                <button onclick="AppState.showToast('Mentorship office hours inquiry sent to ${m.name}!', 'success')" class="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 rounded-xl text-xs font-semibold transition shrink-0">
                    Request Sync
                </button>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();
    },

    populatePledgeSelects(challenges) {
        const select = document.getElementById("pledgeChallengeSelect");
        if (select) {
            select.innerHTML = challenges.map(c => `<option value="${c.id}">${c.title} (Est. $${(c.estimated_budget || 15000).toLocaleString()})</option>`).join('');
        }
    },

    openPledgeModal() {
        AppState.openModal("pledgeGrantModal");
    },

    async handlePledgeSubmit(event) {
        event.preventDefault();
        const challengeId = parseInt(document.getElementById("pledgeChallengeSelect").value);
        const amount = parseFloat(document.getElementById("pledgeAmount").value);
        const focusArea = document.getElementById("pledgeFocusArea").value.trim();

        try {
            await API.pledgeGrant({
                challenge_id: challengeId,
                sponsor_id: AppState.currentUser.id,
                amount: amount,
                notes: focusArea
            });

            AppState.closeModal("pledgeGrantModal");
            document.getElementById("pledgeGrantForm").reset();
            AppState.showToast("CSR Grant Pledged & Secured in Escrow!", "success");
            AppState.triggerConfetti();
            this.load();
        } catch (err) {
            console.error("Failed to pledge grant:", err);
            AppState.showToast(err.message || "Failed to pledge grant", "error");
        }
    }
};
