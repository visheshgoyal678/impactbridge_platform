// Challenges UI Module with Staggered Entrance Animations & Geo-Explorer
const ChallengesUI = {
    currentSdgs: [],
    selectedSdg: null,
    selectedUrgency: null,
    viewMode: 'grid', // 'grid' or 'geo'
    selectedRegionKey: 'belagavi',

    regionalHotspots: {
        'belagavi': {
            name: "Belagavi & Northern Karnataka",
            state: "Karnataka, India",
            coordinates: "15.8497° N, 74.4977° E",
            primaryCrisis: "Groundwater depletion & soil moisture deficit for dryland cotton/sugarcane.",
            sdgs: ["SDG_6", "SDG_2"],
            activeChallengesCount: 2,
            beneficiaries: "2,400 dryland farmers",
            academicPartner: "IIT Bombay Sensor Lab"
        },
        'sundarbans': {
            name: "Sundarbans Delta Coastal Zone",
            state: "West Bengal, India",
            coordinates: "21.9497° N, 89.1833° E",
            primaryCrisis: "Cyclonic storm surge & acute drinking water salinity ingress.",
            sdgs: ["SDG_6", "SDG_13", "SDG_14"],
            activeChallengesCount: 1,
            beneficiaries: "14,000 islanders",
            academicPartner: "IIT Kharagpur Water Lab"
        },
        'thar': {
            name: "Thar Desert Arid Corridor",
            state: "Rajasthan, India",
            coordinates: "26.9157° N, 70.9083° E",
            primaryCrisis: "Extreme solar heat load & cold-chain spoilage of agricultural produce.",
            sdgs: ["SDG_7", "SDG_2", "SDG_9"],
            activeChallengesCount: 2,
            beneficiaries: "8,500 pastoralists",
            academicPartner: "BITS Pilani Clean Energy Lab"
        },
        'vidarbha': {
            name: "Vidarbha Semi-Arid Cotton Belt",
            state: "Maharashtra, India",
            coordinates: "20.7453° N, 78.6022° E",
            primaryCrisis: "Rainfall deficit, crop pest outbreaks, and ground debt vulnerability.",
            sdgs: ["SDG_2", "SDG_3"],
            activeChallengesCount: 1,
            beneficiaries: "5,200 cotton growers",
            academicPartner: "VNIT Nagpur Agri-Robotics"
        }
    },

    async load() {
        try {
            const listEl = document.getElementById("challengesList");
            if (listEl) {
                listEl.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center py-16 text-slate-500">
                        <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-500 mb-3"></i>
                        <p class="text-xs font-semibold">Loading verified societal challenges...</p>
                    </div>
                `;
                if (window.lucide) lucide.createIcons();
            }

            const challenges = await API.getChallenges(this.selectedSdg, this.selectedUrgency);
            this.renderSdgFilterChips();
            this.render(challenges);

            if (this.viewMode === 'geo') {
                this.renderGeoExplorer();
            }
        } catch (err) {
            console.error("Failed to load challenges:", err);
            AppState.showToast("Could not load challenges", "error");
        }
    },

    setViewMode(mode) {
        this.viewMode = mode;
        const gridBtn = document.getElementById("viewToggleGrid");
        const geoBtn = document.getElementById("viewToggleGeo");
        const gridContainer = document.getElementById("challengesList");
        const geoContainer = document.getElementById("challengesGeoContainer");

        if (mode === 'grid') {
            if (gridBtn) {
                gridBtn.className = "px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5";
            }
            if (geoBtn) {
                geoBtn.className = "px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold flex items-center gap-1.5";
            }
            if (gridContainer) gridContainer.classList.remove("hidden");
            if (geoContainer) geoContainer.classList.add("hidden");
        } else {
            if (gridBtn) {
                gridBtn.className = "px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold flex items-center gap-1.5";
            }
            if (geoBtn) {
                geoBtn.className = "px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5";
            }
            if (gridContainer) gridContainer.classList.add("hidden");
            if (geoContainer) geoContainer.classList.remove("hidden");
            this.renderGeoExplorer();
        }
        if (window.lucide) lucide.createIcons();
    },

    selectRegion(regionKey) {
        this.selectedRegionKey = regionKey;
        this.renderGeoExplorer();
        if (window.ThreeEngine && ThreeEngine.globe) {
            ThreeEngine.globe.focusRegion(regionKey);
        }
    },

    renderGeoExplorer() {
        const container = document.getElementById("challengesGeoContainer");
        if (!container) return;

        const current = this.regionalHotspots[this.selectedRegionKey] || this.regionalHotspots['belagavi'];

        container.innerHTML = `
            <div class="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6 animate-card-enter">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="pulse-live-indicator text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                                Live Regional Telemetry Matrix
                            </span>
                        </div>
                        <h3 class="text-xl font-bold text-white flex items-center gap-2">
                            <i data-lucide="map-pin" class="w-5 h-5 text-emerald-400"></i> ${current.name}
                        </h3>
                        <p class="text-xs text-slate-400 font-mono mt-0.5">${current.state} • Coordinates: ${current.coordinates}</p>
                    </div>

                    <!-- Region Selector Buttons -->
                    <div class="flex items-center gap-2 flex-wrap">
                        ${Object.keys(this.regionalHotspots).map(key => `
                            <button onclick="ChallengesUI.selectRegion('${key}')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition border ${this.selectedRegionKey === key ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30' : 'bg-slate-900/90 text-slate-400 hover:text-white border-slate-700'}">
                                ${this.regionalHotspots[key].name.split(' ')[0]}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Hotspot Deep-Dive Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                        <span class="text-[10px] font-bold uppercase text-slate-400">Ground Crisis Focus</span>
                        <p class="text-xs font-semibold text-rose-400 mt-1">${current.primaryCrisis}</p>
                    </div>
                    <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                        <span class="text-[10px] font-bold uppercase text-slate-400">Direct Beneficiaries</span>
                        <h4 class="text-lg font-black text-emerald-400 mt-1">${current.beneficiaries}</h4>
                    </div>
                    <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                        <span class="text-[10px] font-bold uppercase text-slate-400">Active R&D Partner</span>
                        <h4 class="text-sm font-bold text-blue-400 mt-1">${current.academicPartner}</h4>
                    </div>
                    <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                        <span class="text-[10px] font-bold uppercase text-slate-400">UN SDGs Addressed</span>
                        <div class="flex items-center gap-1 mt-2 flex-wrap">
                            ${current.sdgs.map(sdg => `<span class="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono text-[10px] border border-blue-500/30">${sdg.replace('_', ' ')}</span>`).join('')}
                        </div>
                    </div>
                </div>

                <!-- Action CTA -->
                <div class="flex items-center justify-between pt-2">
                    <p class="text-xs text-slate-400">Looking for regional field challenges in this sector?</p>
                    <button onclick="ChallengesUI.filterBySearch('${current.name.split(' ')[0]}')" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/30">
                        <i data-lucide="filter" class="w-4 h-4"></i> View Filtered Problem Cards
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) lucide.createIcons();
    },

    filterBySearch(query) {
        const input = document.getElementById("challengeSearchInput");
        if (input) {
            input.value = query;
            this.setViewMode('grid');
            this.load();
        }
    },

    renderSdgFilterChips() {
        const container = document.getElementById("sdgFilterChips");
        if (!container || !AppState.sdgs) return;

        const sdgEntries = Object.entries(AppState.sdgs);
        container.innerHTML = `
            <button onclick="ChallengesUI.filterBySdg(null)" class="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition ${!this.selectedSdg ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'}">
                All SDGs (${sdgEntries.length})
            </button>
            ${sdgEntries.map(([key, info]) => `
                <button onclick="ChallengesUI.filterBySdg('${key}')" class="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition border ${this.selectedSdg === key ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30' : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border-slate-800'}" style="${this.selectedSdg === key ? `border-color: ${info.color}` : ''}">
                    <span class="w-2 h-2 rounded-full inline-block mr-1.5" style="background-color: ${info.color}"></span>
                    ${info.name}
                </button>
            `).join('')}
        `;
    },

    filterBySdg(sdgKey) {
        this.selectedSdg = sdgKey;
        this.load();
    },

    filterByUrgency(urgency) {
        this.selectedUrgency = urgency || null;
        this.load();
    },

    render(challenges) {
        const listEl = document.getElementById("challengesList");
        if (!listEl) return;

        // Apply search filter if query exists
        const searchInput = document.getElementById("challengeSearchInput");
        const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

        let filtered = challenges;
        if (query) {
            filtered = challenges.filter(c => 
                c.title.toLowerCase().includes(query) ||
                c.description.toLowerCase().includes(query) ||
                (c.location && c.location.toLowerCase().includes(query)) ||
                (c.target_community && c.target_community.toLowerCase().includes(query)) ||
                c.category.toLowerCase().includes(query)
            );
        }

        if (filtered.length === 0) {
            listEl.innerHTML = `
                <div class="col-span-full text-center py-16 glass-panel rounded-3xl border border-slate-800 animate-card-enter">
                    <i data-lucide="inbox" class="w-12 h-12 text-slate-600 mx-auto mb-3"></i>
                    <h4 class="text-sm font-bold text-slate-300">No Societal Challenges Found</h4>
                    <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Try clearing search filters or be the first to post a new community challenge!</p>
                    <button onclick="AppState.openModal('createChallengeModal')" class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold">
                        Post New Challenge
                    </button>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        listEl.innerHTML = filtered.map((c, idx) => {
            const sdg = AppState.sdgs[c.sdg_tag] || { name: c.sdg_tag, color: '#3b82f6' };
            const urgencyColors = {
                CRITICAL: "bg-rose-500/20 text-rose-300 border-rose-500/40",
                HIGH: "bg-amber-500/20 text-amber-300 border-amber-500/40",
                MEDIUM: "bg-blue-500/20 text-blue-300 border-blue-500/40",
                LOW: "bg-slate-500/20 text-slate-300 border-slate-500/40"
            };

            return `
                <div class="glass-panel glass-panel-hover rounded-3xl p-6 border border-slate-800/90 flex flex-col justify-between relative group animate-card-enter" style="animation-delay: ${idx * 0.05}s;">
                    <!-- Top Bar: SDG Badge & Urgency Pill -->
                    <div>
                        <div class="flex items-center justify-between gap-2 mb-3">
                            <span class="sdg-badge" style="background-color: ${sdg.color}25; color: ${sdg.color}; border: 1px solid ${sdg.color}50;">
                                <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${sdg.color}"></span>
                                ${sdg.name}
                            </span>
                            <span class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${urgencyColors[c.urgency] || urgencyColors.MEDIUM}">
                                ${c.urgency}
                            </span>
                        </div>

                        <!-- Title & Problem Excerpt -->
                        <h3 class="font-heading text-base font-bold text-white group-hover:text-blue-400 transition leading-snug line-clamp-2">
                            ${c.title}
                        </h3>

                        <p class="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                            ${c.description}
                        </p>

                        <!-- Context Metadata (Location, Target Community) -->
                        <div class="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                            ${c.location ? `
                                <div class="flex items-center gap-1.5">
                                    <i data-lucide="map-pin" class="w-3.5 h-3.5 text-emerald-400 shrink-0"></i>
                                    <span class="truncate">${c.location}</span>
                                </div>
                            ` : ''}
                            ${c.target_community ? `
                                <div class="flex items-center gap-1.5">
                                    <i data-lucide="users" class="w-3.5 h-3.5 text-purple-400 shrink-0"></i>
                                    <span class="truncate">${c.target_community}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Bottom Bar: Upvote Button, R&D Budget, Actions -->
                    <div class="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <!-- Upvote Button with Animated Particle Trigger -->
                        <button onclick="ChallengesUI.handleUpvote(event, ${c.id})" class="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition text-xs font-semibold group/btn" title="Upvote Community Priority">
                            <i data-lucide="thumbs-up" class="w-3.5 h-3.5 text-blue-400 group-hover/btn:scale-110 transition"></i>
                            <span id="voteCount-${c.id}">${c.upvotes_count || 0}</span>
                        </button>

                        <div class="flex items-center gap-2">
                            <button onclick="ChallengesUI.viewDetails(${c.id})" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition">
                                Details
                            </button>
                            <button onclick="ChallengesUI.openProposeForChallenge(${c.id})" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-md shadow-blue-600/25">
                                <i data-lucide="rocket" class="w-3.5 h-3.5"></i> Solve
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) {
            lucide.createIcons();
        }
    },

    async handleUpvote(event, challengeId) {
        try {
            // Visual floating +1 particle
            const btn = event.currentTarget;
            const particle = document.createElement("span");
            particle.className = "vote-plus-one";
            particle.textContent = "+1";
            particle.style.left = `${event.clientX - btn.getBoundingClientRect().left}px`;
            particle.style.top = `0px`;
            btn.appendChild(particle);
            setTimeout(() => particle.remove(), 800);

            const updated = await API.upvoteChallenge(challengeId);
            const countEl = document.getElementById(`voteCount-${challengeId}`);
            if (countEl) {
                countEl.textContent = updated.upvotes_count;
            }
            AppState.showToast("Upvoted societal problem!", "success");
        } catch (err) {
            console.error("Failed to upvote:", err);
            AppState.showToast("Failed to upvote challenge", "error");
        }
    },

    async viewDetails(challengeId) {
        try {
            const modalContent = document.getElementById("challengeDetailContent");
            if (!modalContent) return;

            modalContent.innerHTML = `<div class="py-8 text-center"><i data-lucide="loader-2" class="w-6 h-6 animate-spin text-blue-500 mx-auto"></i></div>`;
            AppState.openModal("challengeDetailModal");

            const challenge = await API.getChallenge(challengeId);
            const comments = await API.getChallengeComments(challengeId);
            const sdg = AppState.sdgs[challenge.sdg_tag] || { name: challenge.sdg_tag, color: '#3b82f6' };

            modalContent.innerHTML = `
                <div class="space-y-4">
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <span class="sdg-badge" style="background-color: ${sdg.color}25; color: ${sdg.color}; border: 1px solid ${sdg.color}50;">
                                ${sdg.name}
                            </span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                ${challenge.urgency} Urgency
                            </span>
                        </div>
                        <h2 class="text-xl font-bold text-white">${challenge.title}</h2>
                        <p class="text-xs text-slate-400 mt-1">Submitted by <strong>${challenge.creator_name || 'Grassroots Member'}</strong> • ${challenge.location || 'India'}</p>
                    </div>

                    <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                        ${challenge.description}
                    </div>

                    <div class="grid grid-cols-2 gap-3 text-xs">
                        <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                            <span class="text-slate-500 text-[10px] uppercase font-bold">Target Community:</span>
                            <p class="font-semibold text-slate-200 mt-0.5">${challenge.target_community || 'Local Farmers & Residents'}</p>
                        </div>
                        <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                            <span class="text-slate-500 text-[10px] uppercase font-bold">Estimated R&D Budget:</span>
                            <p class="font-semibold text-emerald-400 mt-0.5">$${(challenge.estimated_budget || 15000).toLocaleString()}</p>
                        </div>
                    </div>

                    <!-- Community Discussion Thread -->
                    <div class="border-t border-slate-800 pt-4">
                        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                            <i data-lucide="message-square" class="w-4 h-4 text-blue-400"></i> Field Discussion & Observations (${comments.length})
                        </h4>

                        <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
                            ${comments.map(c => `
                                <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs">
                                    <div class="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                                        <span class="font-bold text-slate-200">${c.user_name || 'Community Member'}</span>
                                        <span>${new Date(c.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p class="text-slate-300">${c.content}</p>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Add Comment Box -->
                        <form onsubmit="ChallengesUI.handleAddComment(event, ${challenge.id})" class="mt-3 flex gap-2">
                            <input type="text" id="newCommentInput" required placeholder="Add technical note, validation observation, or grassroots query..." class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
                            <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold">
                                Post
                            </button>
                        </form>
                    </div>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        } catch (err) {
            console.error("Failed to view details:", err);
            AppState.showToast("Failed to load details", "error");
        }
    },

    async handleAddComment(event, challengeId) {
        event.preventDefault();
        const input = document.getElementById("newCommentInput");
        if (!input || !input.value.trim()) return;

        try {
            await API.addChallengeComment(challengeId, {
                user_id: AppState.currentUser.id,
                content: input.value.trim()
            });
            input.value = "";
            this.viewDetails(challengeId);
            AppState.showToast("Note posted to discussion", "success");
        } catch (err) {
            console.error("Failed to add comment:", err);
            AppState.showToast("Failed to post note", "error");
        }
    },

    openProposeForChallenge(challengeId) {
        AppState.openModal("proposeSolutionModal");
        const select = document.getElementById("proposalChallengeSelect");
        if (select) {
            select.value = challengeId;
        }
    },

    async handleCreateChallengeSubmit(event) {
        event.preventDefault();
        const title = document.getElementById("createChTitle").value.trim();
        const sdg = document.getElementById("createChSdg").value;
        const category = document.getElementById("createChCategory").value.trim();
        const description = document.getElementById("createChDesc").value.trim();
        const location = document.getElementById("createChLocation").value.trim();
        const community = document.getElementById("createChCommunity").value.trim();
        const urgency = document.getElementById("createChUrgency").value;
        const budget = parseFloat(document.getElementById("createChBudget").value) || 15000;

        try {
            const newChallenge = await API.createChallenge({
                title,
                description,
                category,
                sdg_tag: sdg,
                urgency,
                location,
                target_community: community,
                estimated_budget: budget,
                creator_id: AppState.currentUser.id
            });

            AppState.closeModal("createChallengeModal");
            document.getElementById("createChallengeForm").reset();
            AppState.showToast("Societal Challenge Crowdsourced & Published!", "success");
            AppState.triggerConfetti();
            this.load();
        } catch (err) {
            console.error("Failed to create challenge:", err);
            AppState.showToast(err.message || "Failed to post challenge", "error");
        }
    }
};
