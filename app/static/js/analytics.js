// Analytics, UN SDG Impact Metrics, AI Synergy Sliders & Dynamic Matchmaker
const AnalyticsUI = {
    sdgChart: null,
    fundingChart: null,

    async load() {
        try {
            const [kpis, sdgDist, fundingFlow, activities] = await Promise.all([
                API.getAnalyticsKpis(),
                API.getSdgDistribution(),
                API.getFundingFlow(),
                API.getActivityFeed()
            ]);

            this.renderKpis(kpis);
            this.renderSdgChart(sdgDist);
            this.renderFundingChart(fundingFlow);
            this.renderActivityFeed(activities);
        } catch (err) {
            console.error("Failed to load analytics:", err);
            AppState.showToast("Could not load impact analytics", "error");
        }
    },

    renderKpis(kpis) {
        AppState.animateCounter("kpiTotalChallenges", kpis.total_challenges || 9);
        AppState.animateCounter("kpiActiveSolutions", kpis.active_solutions || 6);
        AppState.animateCounter("kpiUniversities", kpis.participating_universities || 14);
        AppState.animateCounter("kpiCorporatePartners", kpis.corporate_partners || 8);
    },

    renderSdgChart(data) {
        const ctx = document.getElementById("sdgDistributionChart");
        if (!ctx) return;

        if (this.sdgChart) this.sdgChart.destroy();

        const labels = Object.keys(data).map(k => (AppState.sdgs[k] ? AppState.sdgs[k].name : k));
        const values = Object.values(data);
        const colors = Object.keys(data).map(k => (AppState.sdgs[k] ? AppState.sdgs[k].color : '#3b82f6'));

        this.sdgChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#0f172a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'Plus Jakarta Sans', size: 11 }
                        }
                    }
                },
                cutout: '65%'
            }
        });
    },

    renderFundingChart(data) {
        const ctx = document.getElementById("fundingFlowChart");
        if (!ctx) return;

        if (this.fundingChart) this.fundingChart.destroy();

        this.fundingChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.month),
                datasets: [
                    {
                        label: 'CSR Grants Pledged ($)',
                        data: data.map(d => d.pledged),
                        backgroundColor: 'rgba(245, 158, 11, 0.7)',
                        borderRadius: 8
                    },
                    {
                        label: 'Milestone Funds Disbursed ($)',
                        data: data.map(d => d.released),
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#94a3b8', font: { size: 10 } },
                        grid: { color: 'rgba(51, 65, 85, 0.3)' }
                    },
                    y: {
                        ticks: { color: '#94a3b8', font: { size: 10 } },
                        grid: { color: 'rgba(51, 65, 85, 0.3)' }
                    }
                }
            }
        });
    },

    renderActivityFeed(activities) {
        const container = document.getElementById("analyticsActivityFeed");
        if (!container) return;

        container.innerHTML = (activities || []).map((a, idx) => `
            <div class="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs animate-card-enter" style="animation-delay: ${idx * 0.04}s;">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                        <i data-lucide="activity" class="w-4 h-4"></i>
                    </div>
                    <div>
                        <p class="font-bold text-slate-200">${a.action}</p>
                        <p class="text-[10px] text-slate-400 mt-0.5">${a.user_name || 'Innovator'} • ${a.details || ''}</p>
                    </div>
                </div>
                <span class="text-[10px] text-slate-500 font-mono shrink-0">${new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();
    }
};

// AI Matching & Semantic Recommendation Engine UI
const MatchingUI = {
    skillWeight: 0.8,
    sdgWeight: 0.9,

    async load() {
        try {
            const user = AppState.currentUser;
            const nameEl = document.getElementById("matchingUserName");
            const roleEl = document.getElementById("matchingUserRole");
            const skillsEl = document.getElementById("matchingUserSkills");

            if (nameEl) nameEl.textContent = user.name;
            if (roleEl) roleEl.textContent = `${user.role} • ${user.organization || 'Independent'}`;
            if (skillsEl) skillsEl.textContent = user.skills || "Embedded IoT, Edge ML, Hydro-Sensors, Solar Power";

            this.setupSynergySliders();
            this.renderDreamTeam();

            const recommendations = await API.getAiRecommendations(user.id);
            this.renderRecommendations(recommendations);
        } catch (err) {
            console.error("Failed to load AI recommendations:", err);
            AppState.showToast("Could not load AI recommendations", "error");
        }
    },

    setupSynergySliders() {
        const sliderSkill = document.getElementById("sliderSkillWeight");
        const sliderSdg = document.getElementById("sliderSdgWeight");
        const valSkill = document.getElementById("valSkillWeight");
        const valSdg = document.getElementById("valSdgWeight");

        if (sliderSkill && valSkill) {
            sliderSkill.oninput = (e) => {
                valSkill.textContent = `${e.target.value}%`;
                this.skillWeight = e.target.value / 100;
                this.recalculateMatches();
            };
        }

        if (sliderSdg && valSdg) {
            sliderSdg.oninput = (e) => {
                valSdg.textContent = `${e.target.value}%`;
                this.sdgWeight = e.target.value / 100;
                this.recalculateMatches();
            };
        }
    },

    recalculateMatches() {
        const cards = document.querySelectorAll(".recommendation-score-badge");
        cards.forEach((badge, idx) => {
            const baseScore = 78 + (idx * 5) % 18;
            const adjusted = Math.min(99, Math.round(baseScore * (this.skillWeight * 0.5 + this.sdgWeight * 0.5)));
            badge.textContent = `${adjusted}% Affinity`;
        });
    },

    renderDreamTeam() {
        const container = document.getElementById("dreamTeamContainer");
        if (!container) return;

        container.innerHTML = `
            <div class="glass-panel p-6 rounded-3xl border border-purple-800/40 bg-gradient-to-r from-purple-950/20 via-slate-900 to-slate-900 animate-card-enter">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                        <i data-lucide="users" class="w-3.5 h-3.5 text-purple-400"></i> AI Generated Tripartite Dream Team
                    </h4>
                    <span class="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] border border-purple-500/30">97.4% Synergy</span>
                </div>

                <p class="text-xs text-slate-400 mb-4 leading-relaxed">
                    AI co-assembled the ideal multi-disciplinary innovation pod combining student hardware talent, academic faculty oversight, and industry sponsorship:
                </p>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div class="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                        <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150" class="w-9 h-9 rounded-xl object-cover border border-blue-500/50">
                        <div>
                            <p class="text-xs font-bold text-white">Aarav Sharma</p>
                            <p class="text-[10px] text-blue-400">STUDENT • Sensor Lead</p>
                        </div>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" class="w-9 h-9 rounded-xl object-cover border border-emerald-500/50">
                        <div>
                            <p class="text-xs font-bold text-white">Prof. Dr. Arvind S.</p>
                            <p class="text-[10px] text-emerald-400">FACULTY • Lab Advisor</p>
                        </div>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" class="w-9 h-9 rounded-xl object-cover border border-amber-500/50">
                        <div>
                            <p class="text-xs font-bold text-white">Vikram Singhania</p>
                            <p class="text-[10px] text-amber-400">CSR • Tata Sustainability</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    },

    renderRecommendations(recommendations) {
        const listEl = document.getElementById("aiRecommendationsList");
        if (!listEl) return;

        if (recommendations.length === 0) {
            listEl.innerHTML = `
                <div class="col-span-full text-center py-12 glass-panel rounded-3xl border border-slate-800 animate-card-enter">
                    <i data-lucide="sparkles" class="w-10 h-10 text-purple-400 mx-auto mb-2"></i>
                    <p class="text-xs text-slate-400">No active AI matches found for this profile. Try submitting a custom semantic query above!</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        listEl.innerHTML = recommendations.map((r, idx) => {
            const sdg = AppState.sdgs[r.sdg_tag] || { name: r.sdg_tag, color: '#a855f7' };
            const matchScore = Math.min(99, Math.round((r.score || 0.85) * 100));

            return `
                <div class="glass-panel glass-panel-hover rounded-3xl p-6 border border-purple-900/30 flex flex-col justify-between group animate-card-enter" style="animation-delay: ${idx * 0.07}s;">
                    <div>
                        <!-- Header -->
                        <div class="flex items-center justify-between gap-2 mb-3">
                            <span class="sdg-badge" style="background-color: ${sdg.color}25; color: ${sdg.color}; border: 1px solid ${sdg.color}50;">
                                ${sdg.name}
                            </span>
                            <span class="recommendation-score-badge text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                ${matchScore}% Affinity
                            </span>
                        </div>

                        <!-- Title -->
                        <h3 class="font-heading text-base font-bold text-white group-hover:text-purple-300 transition leading-snug">
                            ${r.title}
                        </h3>

                        <p class="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                            ${r.description}
                        </p>

                        <!-- Context -->
                        <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                            <span>${r.location || 'India'}</span>
                            <span class="font-mono text-emerald-400 font-bold">$${(r.estimated_budget || 15000).toLocaleString()} USD</span>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <button onclick="ChallengesUI.viewDetails(${r.id})" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition">
                            Details
                        </button>
                        <button onclick="ChallengesUI.openProposeForChallenge(${r.id})" class="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-md shadow-purple-600/25">
                            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Auto-Match Lab
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();
    },

    async handleCustomMatch(event) {
        event.preventDefault();
        const query = document.getElementById("customMatchQuery").value.trim();
        if (!query) return;

        try {
            const results = await API.getSemanticMatch(query);
            this.renderCustomMatchResults(results, query);
            AppState.showToast(`Found ${results.length} semantic matches for: "${query}"`, "info");
        } catch (err) {
            console.error("Failed to run custom semantic match:", err);
            AppState.showToast("Semantic matching failed", "error");
        }
    },

    renderCustomMatchResults(results, query) {
        const container = document.getElementById("customMatchResults");
        if (!container) return;

        container.innerHTML = `
            <div class="glass-panel p-5 rounded-3xl border border-purple-700/40 bg-slate-900/90 space-y-3 animate-card-enter">
                <div class="flex items-center justify-between">
                    <h4 class="text-xs font-bold text-purple-300">Semantic Matches for: "${query}"</h4>
                    <button onclick="document.getElementById('customMatchResults').innerHTML=''" class="text-slate-500 hover:text-white text-xs">Clear</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    ${results.map(r => `
                        <div class="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                            <div class="flex justify-between items-start">
                                <h5 class="font-bold text-white">${r.title}</h5>
                                <span class="text-[10px] font-mono text-purple-400 font-bold">${Math.round((r.score || 0.8) * 100)}% Match</span>
                            </div>
                            <p class="text-slate-400 mt-1 line-clamp-2 text-[11px]">${r.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    }
};
