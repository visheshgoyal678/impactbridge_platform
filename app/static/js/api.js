// API Service Layer for ImpactBridge Platform
const API = {
    baseUrl: '/api',

    async request(endpoint, options = {}) {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };
            if (options.body && typeof options.body === 'object') {
                config.body = JSON.stringify(options.body);
            }

            const response = await fetch(`${this.baseUrl}${endpoint}`, config);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Network request failed' }));
                throw new Error(errorData.detail || `HTTP Error ${response.status}`);
            }
            return await response.json();
        } catch (err) {
            console.error(`API Error on [${endpoint}]:`, err);
            throw err;
        }
    },

    // Challenges
    async getChallenges(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/challenges?${query}`);
    },

    async getChallenge(id) {
        return this.request(`/challenges/${id}`);
    },

    async createChallenge(data) {
        return this.request('/challenges', { method: 'POST', body: data });
    },

    async checkDuplicateChallenge(data) {
        return this.request('/challenges/check-duplicate', { method: 'POST', body: data });
    },

    async voteChallenge(id, userId) {
        return this.request(`/challenges/${id}/vote`, { method: 'POST', body: { user_id: userId } });
    },

    async addComment(id, data) {
        return this.request(`/challenges/${id}/comments`, { method: 'POST', body: data });
    },

    // Solutions & Teams
    async getSolutions(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/solutions?${query}`);
    },

    async getSolution(id) {
        return this.request(`/solutions/${id}`);
    },

    async createSolution(data) {
        return this.request('/solutions', { method: 'POST', body: data });
    },

    async facultyEndorseSolution(solutionId, facultyId) {
        return this.request(`/solutions/${solutionId}/faculty-endorse`, {
            method: 'POST',
            body: { faculty_id: facultyId }
        });
    },

    async getTeams() {
        return this.request('/solutions/teams/all');
    },

    async createTeam(data) {
        return this.request('/solutions/teams/create', { method: 'POST', body: data });
    },

    async addTeamMember(teamId, data) {
        return this.request(`/solutions/teams/${teamId}/members`, { method: 'POST', body: data });
    },

    async getUsers(role = null) {
        return this.request(role ? `/solutions/users/all?role=${role}` : '/solutions/users/all');
    },

    // Industry & CSR Partnerships
    async getGrants(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/partnerships/grants?${query}`);
    },

    async pledgeGrant(data) {
        return this.request('/partnerships/grants/pledge', { method: 'POST', body: data });
    },

    async getMentorships(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/partnerships/mentors?${query}`);
    },

    async assignMentor(data) {
        return this.request('/partnerships/mentors/assign', { method: 'POST', body: data });
    },

    // Milestones & Escrow
    async getMilestones(solutionId) {
        return this.request(`/milestones/solution/${solutionId}`);
    },

    async submitMilestone(milestoneId, data) {
        return this.request(`/milestones/${milestoneId}/submit`, { method: 'POST', body: data });
    },

    async approveMilestone(milestoneId, data) {
        return this.request(`/milestones/${milestoneId}/approve`, { method: 'POST', body: data });
    },

    // AI & Matchmaking
    async getRecommendationsForUser(userId) {
        return this.request(`/matching/challenges-for-user/${userId}`);
    },

    async getMentorRecommendations(solutionId) {
        return this.request(`/matching/mentors-for-solution/${solutionId}`);
    },

    async matchCustomQuery(query) {
        return this.request('/matching/match-custom', { method: 'POST', body: { query } });
    },

    // Analytics
    async getAnalyticsDashboard() {
        return this.request('/analytics/dashboard');
    },

    async getSdgs() {
        return this.request('/analytics/sdgs');
    },

    async getActivityFeed(limit = 15) {
        return this.request(`/analytics/activity?limit=${limit}`);
    },

    // Firebase Cloud Database
    async getFirebaseStatus() {
        return this.request('/firebase/status');
    },

    async triggerFirebaseSync() {
        return this.request('/firebase/sync', { method: 'POST' });
    },

    async updateFirebaseConfig(config) {
        return this.request('/firebase/config', { method: 'POST', body: config });
    },

    async logBotChat(data) {
        return this.request('/firebase/chat-log', { method: 'POST', body: data });
    }
};

