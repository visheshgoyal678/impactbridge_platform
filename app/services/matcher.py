import re
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.models.database_models import Challenge, User, Team, Solution

def clean_text(text: str) -> str:
    if not text:
        return ""
    return re.sub(r"[^\w\s]", " ", text.lower()).strip()

class SemanticMatcher:
    @staticmethod
    def calculate_similarity(text1: str, text2: str) -> float:
        """Calculates combined semantic and keyword overlap similarity between two text strings."""
        t1, t2 = clean_text(text1), clean_text(text2)
        if not t1 or not t2:
            return 0.0

        # 1. Jaccard Keyword Overlap
        words1 = set(t1.split())
        words2 = set(t2.split())
        # Filter common stopwords
        stopwords = {"the", "a", "an", "and", "or", "in", "on", "at", "for", "to", "of", "with", "is", "we", "need", "are"}
        w1 = words1 - stopwords
        w2 = words2 - stopwords
        jaccard = len(w1 & w2) / max(1, len(w1 | w2)) if (w1 and w2) else 0.0

        # 2. TF-IDF Cosine Similarity
        tfidf_sim = 0.0
        try:
            vectorizer = TfidfVectorizer(stop_words='english', min_df=1)
            tfidf_matrix = vectorizer.fit_transform([t1, t2])
            sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            tfidf_sim = float(sim)
        except Exception:
            tfidf_sim = 0.0

        # Weighted blend (gives strong signal for shared domain terms)
        return float(max(tfidf_sim, (0.65 * jaccard + 0.35 * tfidf_sim)))

    @classmethod
    def check_duplicate_challenges(
        cls,
        title: str,
        description: str,
        existing_challenges: List[Challenge],
        threshold: float = 0.40
    ) -> Dict[str, Any]:
        """Checks if a new challenge is semantically duplicate or closely related to existing ones."""
        query_text = f"{title} {description}"
        similar_list = []
        highest_sim = 0.0

        for ch in existing_challenges:
            ch_text = f"{ch.title} {ch.description} {ch.category} {ch.sdg_tag}"
            sim = cls.calculate_similarity(query_text, ch_text)
            if sim > 0.15: # Relevant overlap threshold
                similar_list.append({
                    "id": ch.id,
                    "title": ch.title,
                    "category": ch.category,
                    "sdg_tag": ch.sdg_tag,
                    "similarity_score": round(sim * 100, 1)
                })
            if sim > highest_sim:
                highest_sim = sim

        similar_list.sort(key=lambda x: x["similarity_score"], reverse=True)
        return {
            "is_duplicate": highest_sim >= threshold,
            "highest_similarity": round(highest_sim * 100, 1),
            "similar_challenges": similar_list[:5]
        }

    @classmethod
    def match_challenges_for_user(
        cls,
        user: User,
        open_challenges: List[Challenge],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Recommends open societal challenges for a student, researcher, or faculty member based on their skills & org."""
        user_skills = user.skills or ""
        user_dept = user.department or ""
        user_org = user.organization or ""
        user_profile_text = f"{user_skills} {user_dept} {user_org} {user.bio or ''}"

        recommendations = []

        for ch in open_challenges:
            ch_corpus = f"{ch.title} {ch.description} {ch.category} {ch.sdg_tag} {ch.target_community or ''}"
            sim = cls.calculate_similarity(user_profile_text, ch_corpus)

            # Check keyword overlaps for explicit matching reasons
            reasons = []
            if user.skills:
                skills_list = [s.strip().lower() for s in user.skills.split(",") if s.strip()]
                matched_skills = [s for s in skills_list if s in ch_corpus.lower()]
                if matched_skills:
                    reasons.append(f"Matches your skills: {', '.join(matched_skills[:3])}")
            
            if user.department and user.department.lower() in ch_corpus.lower():
                reasons.append(f"Aligned with your department: {user.department}")

            if ch.urgency_level in ["CRITICAL", "HIGH"]:
                reasons.append(f"High community urgency: {ch.urgency_level}")

            if not reasons:
                reasons.append("Aligned with your academic profile and focus areas")

            # Final normalized score
            score = max(sim, 0.35 if reasons else 0.15)
            # Boost if high urgency or high upvotes
            if ch.urgency_level == "CRITICAL":
                score = min(1.0, score + 0.15)
            elif ch.urgency_level == "HIGH":
                score = min(1.0, score + 0.08)

            recommendations.append({
                "entity_id": ch.id,
                "title": ch.title,
                "category": ch.category,
                "sdg_tag": ch.sdg_tag,
                "urgency_level": ch.urgency_level,
                "location": ch.location,
                "match_score": round(score * 100, 1),
                "match_reasons": reasons,
                "metadata": {
                    "budget_needed": ch.budget_needed,
                    "upvotes": ch.upvotes_count,
                    "status": ch.status
                }
            })

        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        return recommendations[:top_k]

    @classmethod
    def match_mentors_for_solution(
        cls,
        solution: Solution,
        mentor_users: List[User],
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """Recommends industry domain mentors for an active student solution."""
        sol_text = f"{solution.title} {solution.abstract} {solution.tech_stack or ''}"
        if solution.challenge:
            sol_text += f" {solution.challenge.category} {solution.challenge.sdg_tag}"

        matches = []
        for mentor in mentor_users:
            mentor_text = f"{mentor.skills or ''} {mentor.department or ''} {mentor.organization or ''} {mentor.bio or ''}"
            sim = cls.calculate_similarity(sol_text, mentor_text)

            reasons = []
            if mentor.skills:
                m_skills = [s.strip().lower() for s in mentor.skills.split(",") if s.strip()]
                matched = [s for s in m_skills if s in sol_text.lower()]
                if matched:
                    reasons.append(f"Domain expertise in: {', '.join(matched[:3])}")
            if mentor.organization:
                reasons.append(f"Industry leader at {mentor.organization}")

            score = max(sim, 0.40 if reasons else 0.20)

            matches.append({
                "entity_id": mentor.id,
                "title": mentor.name,
                "category": mentor.organization or "Industry Expert",
                "match_score": round(score * 100, 1),
                "match_reasons": reasons,
                "metadata": {
                    "department": mentor.department,
                    "skills": mentor.skills,
                    "avatar_url": mentor.avatar_url
                }
            })

        matches.sort(key=lambda x: x["match_score"], reverse=True)
        return matches[:top_k]
