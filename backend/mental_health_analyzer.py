class MentalHealthAnalyzer:
    def analyze(self, phq9_answers, gad7_answers):
        phq9_score = sum(phq9_answers)
        gad7_score = sum(gad7_answers)

        if phq9_score <= 4:
            depression_level = "Minimal"
        elif phq9_score <= 9:
            depression_level = "Mild"
        elif phq9_score <= 14:
            depression_level = "Moderate"
        elif phq9_score <= 19:
            depression_level = "Moderately Severe"
        else:
            depression_level = "Severe"

        if gad7_score <= 4:
            anxiety_level = "Minimal"
        elif gad7_score <= 9:
            anxiety_level = "Mild"
        elif gad7_score <= 14:
            anxiety_level = "Moderate"
        else:
            anxiety_level = "Severe"

        max_possible = 27 + 21
        combined_score = phq9_score + gad7_score
        mental_health_score = round((combined_score / max_possible) * 100)

        tips = self._generate_tips(
            depression_level, anxiety_level,
            phq9_answers, gad7_answers
        )

        return {
            "phq9_score": phq9_score,
            "gad7_score": gad7_score,
            "depression_level": depression_level,
            "anxiety_level": anxiety_level,
            "mental_health_score": mental_health_score,
            "tips": tips,
            "seek_help": phq9_score >= 10 or gad7_score >= 10
        }

    def _generate_tips(self, dep_level, anx_level, phq9, gad7):
        tips = []

        if phq9[2] >= 2:
            tips.append("Try maintaining a consistent sleep schedule — sleep at the same time every night")
            tips.append("Avoid screens 1 hour before bed to improve sleep quality")

        if phq9[3] >= 2:
            tips.append("Take short 10-minute walks daily — even mild exercise significantly improves mood")
            tips.append("Break large tasks into small steps to avoid feeling overwhelmed")

        if gad7[0] >= 2:
            tips.append("Try the 4-7-8 breathing technique: inhale 4s, hold 7s, exhale 8s")
            tips.append("Limit caffeine intake — it can worsen anxiety symptoms")

        if gad7[1] >= 2:
            tips.append("Write down your worries in a journal — it helps externalize anxious thoughts")
            tips.append("Practice mindfulness meditation for 10 minutes daily using free apps like Headspace")

        if phq9[7] >= 2:
            tips.append("Reach out to one friend or family member today — social connection improves mood")

        if dep_level in ["Moderate", "Moderately Severe", "Severe"]:
            tips.append("Consider speaking with a mental health professional — therapy is highly effective")
            tips.append("The iCall helpline (9152987821) provides free counseling support in India")

        if anx_level in ["Moderate", "Severe"]:
            tips.append("Progressive muscle relaxation before bed can significantly reduce anxiety")

        if len(tips) < 3:
            tips.extend([
                "Exercise 30 minutes a day — it releases endorphins that naturally boost mood",
                "Maintain a gratitude journal — write 3 good things that happened each day",
                "Stay connected with supportive people in your life"
            ])

        return tips[:6]