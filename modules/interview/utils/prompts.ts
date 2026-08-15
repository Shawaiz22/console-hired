import { type InterviewQuestion } from "../schemas/interview.schema";

export function rubricPrompt(question: InterviewQuestion, answerText: string): string {
  return `Grade this candidate's response to an interview question using the rubric below.

Question (${question.type}): "${question.question}"
Target Skill: "${question.targetSkill}"
Why Asked: "${question.whyAsked}"
Candidate's Answer: "${answerText}"

Rubric Anchors (rate each dimension from 1 to 5):
1. clarity (1-5):
   1: Rambling, incoherent, or missing structure.
   3: Understandable but meandering or disorganized.
   5: Direct, clear, well-structured, easy to follow.

2. relevance (1-5):
   1: Completely off-topic or avoids the question.
   3: Addresses the question partially but strays.
   5: Directly and thoroughly addresses core prompt.

3. completeness (1-5):
   1: Misses major core aspects of the scenario/question.
   3: Answers basic surface question with moderate gaps.
   5: Comprehensive coverage of technical architecture or STAR context.

4. specificity (1-5):
   1: Generic vague filler statements.
   3: Mentions general tools/concepts without details.
   5: Names concrete metrics, code libraries, metrics, architectural trade-offs.

Special Instructions:
- You MUST output a complete JSON object containing ALL 7 keys: "clarity", "relevance", "completeness", "specificity", "star", "strengths", and "improvements".
- ${
    question.type === "behavioral"
      ? "This is a behavioral question. Perform STAR framework extraction. Fill star object with situation, task, action, result strings."
      : "This is a technical question. Set star explicitly to null."
  }
- "strengths": Array containing 2 specific strengths.
- "improvements": Array containing 1-2 constructive improvements. NEVER omit the "improvements" key.`;
}
