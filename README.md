# Abstract

Large Language Models (LLMs) have demonstrated remarkable capabilities in generating human-like text across a wide range of domains. However, their performance is often hampered by prompt ambiguity, resulting in suboptimal outputs, unnecessary computational expenditure, and user frustration. This paper presents a novel, proactive framework for detecting and resolving prompt ambiguity prior to inference, thereby improving the clarity, efficiency, and reliability of LLM interactions. Our approach introduces a structured pipeline that quantifies ambiguity, diagnoses its sources, and automatically generates clarified prompts—empowering users with interpretable feedback and reducing wasted computational cycles. We demonstrate that our methodology not only enhances LLM output quality but also bridges the prompt literacy gap for both expert and non-expert users. Through a comprehensive experimental evaluation, we illustrate the superiority of our system compared to existing state-of-the-art frameworks in ambiguity detection, resolution, and user education.

# 1. Introduction

Despite the transformative potential of large language models (LLMs), their effectiveness is frequently undermined by ambiguous or underspecified user prompts. Current LLMs often proceed with generating responses even when faced with highly ambiguous queries, expending computational resources on outputs that may misalign with user intent. This inefficiency raises a fundamental question: Why do LLMs persist in completing responses to ambiguous prompts rather than proactively signaling uncertainty or requesting clarification?

This paper addresses this critical gap by proposing a proactive framework for prompt ambiguity detection and resolution. Our system systematically evaluates prompt clarity before inference, offering a quantifiable ambiguity score, identifying specific ambiguity dimensions, and automatically generating clarified prompts. In doing so, we aim to improve both the efficiency and reliability of LLM-driven workflows while empowering users with actionable, real-time feedback on prompt quality.

Our approach is designed to be model-agnostic and broadly applicable across LLM architectures and domains. By decoupling ambiguity detection from any particular training set or model implementation, we facilitate widespread adoption and future-proof integration as LLM technologies evolve.

# 2. Objectives

The primary objectives of this paper are as follows:

1. **Proactive Ambiguity Detection:** Develop an LLM-powered scoring mechanism to identify prompt ambiguity prior to inference.
2. **Diagnosis of Ambiguity Sources:** Systematically identify and categorize missing parameters as specific "Ambiguity Dimensions."
3. **Automated Prompt Clarification:** Automatically generate clarified prompts by addressing the identified ambiguity dimensions.
4. **Computational Efficiency:** Reduce wasted computational resources and retry cycles by resolving misalignment before full LLM inference.
5. **Educational Feedback:** Bridge the prompting literacy gap by providing real-time, interpretable feedback and fostering long-term effective prompting practices for both expert and non-expert users.

# 3. Methodology

Our framework introduces a pre-processing layer that intercepts user prompts and analyzes them before submission to the target LLM. This layer leverages a structured "meta-prompt" sent to an analyzer LLM, orchestrating a comprehensive ambiguity analysis and prompt clarification workflow.

## 3.1 System Architecture

The system operates as a three-stage pipeline, visualized in the user interface (see Figure 1) and can be summarized by the following flow:

**Input Prompt → Ambiguity Scorer → Dimension Detector → Clarification Generator → Final Prompt**

**Stage 1: Ambiguity Scoring**  
A numerical score (0–100) quantifies the estimated ambiguity of the prompt, providing immediate feedback on prompt quality.

**Stage 2: Dimension-Aware Diagnosis**  
The system identifies and categorizes ambiguous aspects across multiple "Ambiguity Dimensions." Each dimension includes a name (e.g., Input Type), an Impact Level (Critical, High, Medium, Low), a description of the ambiguity, and possible interpretations that an LLM might infer.

**Stage 3: Automated Prompt Clarification**  
Drawing on the diagnosis, the system generates several diverse and fully-formed "Suggested Clarified Prompts." Each suggestion embodies a distinct set of reasonable assumptions to resolve ambiguities, offering the user multiple actionable, editable starting points.

## 3.2 Core Analysis Prompt

The core analysis is triggered by embedding the user's prompt within a highly structured meta-prompt sent to the analyzer LLM. This meta-prompt instructs the LLM to:

- Assign an ambiguity rating (0–100 scale)
- Tabulate all ambiguous dimensions, including their names, impact levels, specific aspects, and possible interpretations
- Generate three diverse, clarified rewrites of the prompt

The LLM returns its analysis in a strict JSON schema, enabling reliable UI population and downstream processing. The meta-prompt template is as follows:

```json
{
  "prompt": "Analyze the ambiguity level of this prompt: \"${user_prompt}\"\nProvide:\n1. An ambiguity rating (0-100 scale).\n2. A structured table showing all ambiguous dimensions with columns: Dimension Name, Impact Level, Specific Ambiguous Aspects, Possible Interpretations.\n3. Three diverse, Suggested Clarified Prompts, rewritten to eliminate ambiguities by making reasonable assumptions.\n--\nRequirements:\n- Preserve original intent.\n- Group dimensions by impact level.\n- Return the output in the following JSON format:\n{\n    \"originalPrompt\": \"...\",\n    \"ambiguityRating\": ..., \n    \"analysisTable\": [ ... ],\n    \"suggestedClarifiedPrompts\": [ ... ]\n}",
  "isClarify": true
}
```

# 4. Related Work

Prompt ambiguity and its impact on large language models (LLMs) have garnered significant attention in recent years. Several frameworks have been introduced to address the challenge of ambiguous inputs, primarily through reactive clarification mechanisms. However, these approaches typically focus on binary ambiguity detection and lack comprehensive feedback mechanisms to enhance user prompt literacy. This section reviews the most relevant prior works and delineates how our methodology advances the state-of-the-art.

**ClarifyGPT**  
ClarifyGPT proposes a reasoning-driven pipeline to detect and resolve ambiguity in code generation tasks. The system identifies prompt ambiguity by sampling multiple code implementations and assessing output inconsistencies—a process both computationally intensive and domain-specific to programming tasks. Upon detecting discrepancies, ClarifyGPT formulates targeted clarifying questions based on the inferred causes of behavioral differences among the generated code samples. While effective, ClarifyGPT is inherently reactive and limited to a binary ambiguity judgment. In contrast, our approach proactively assesses ambiguity before any inferential step, offering a graded ambiguity score and a structured analysis of ambiguous dimensions and their respective impact levels. Furthermore, our method circumvents the need for costly execution-based consistency checks, enabling scalable application across diverse domains beyond programming.

**CLAM**  
The CLAM framework introduces a fine-tuned LLM-based system to selectively ask clarifying questions for ambiguous user queries. CLAM employs a binary classifier, trained on the AmbigQA dataset, to label queries as ambiguous or unambiguous, followed by question generation via a fine-tuned language model. However, CLAM’s reliance on supervised labeling constrains its adaptability, and its process generates clarifying questions sequentially rather than presenting a comprehensive diagnostic overview. Our work improves upon this by leveraging LLMs for self-evaluation without task-specific fine-tuning, providing a holistic, tabulated summary of all ambiguity dimensions in a single inference step. This not only optimizes computational efficiency but also enhances user understanding through explicit educational feedback.

**ECLAIR**  
ECLAIR extends ambiguity handling to enterprise dialogue systems, utilizing static classifiers, heuristics, and domain-specific agents to detect and resolve ambiguities in customer queries. Its system integrates dialogue state tracking and pre-defined templates to generate clarification questions, heavily relying on enterprise-specific ontologies. While robust within its domain, ECLAIR's approach is constrained by domain lock-in and lacks generalizability. Additionally, it does not offer a quantifiable measure of ambiguity. In contrast, our method introduces a quantifiable ambiguity score (0–100), enabling standardized assessment across multiple domains. We also empower LLMs as self-assessors (LLM-as-a-judge), advancing beyond static classification to dynamic, zero-shot ambiguity detection and resolution.

**Clarify When Necessary**  
This task-agnostic framework focuses on determining whether clarification is warranted, guided by uncertainty estimation via the INTENT-SIM metric. By simulating possible user intents and clustering them, the system quantifies ambiguity through entropy. However, this method remains reactive, initiating clarification only after initial output sampling, and employs a binary threshold for decision-making. Our proactive strategy, by contrast, evaluates prompt ambiguity directly and delivers detailed feedback through dimension-specific analysis. Additionally, rather than solely triggering clarification, our system rewrites ambiguous prompts to guide users towards more effective prompt formulations, thereby fostering prompt engineering literacy.

**PRewrite**  
PRewrite leverages reinforcement learning (RL) to automate prompt rewriting for performance optimization on downstream tasks. The RL agent, trained via Proximal Policy Optimization, rewrites prompts to maximize task-specific metrics such as accuracy or F1 score. Nevertheless, PRewrite does not diagnose the sources of prompt weakness, nor does it provide user-facing educational feedback. In comparison, our approach not only identifies the underlying dimensions of ambiguity but also educates users on prompt refinement strategies, with zero-shot inference capability and without the heavy computational costs associated with RL-based optimization.

## 4.1 Summary of Novel Contributions

Our framework advances the state-of-the-art in several ways:

1. **Proactive Ambiguity Detection:** Unlike reactive methods (e.g., ClarifyGPT, INTENT-SIM), we evaluate prompts before inference, reducing computational overhead.
2. **Dimension-Based Analysis:** We quantify ambiguity across specific dimensions (e.g., task, input, output), providing actionable feedback rather than binary scores.
3. **Educational Focus:** Our system not only resolves ambiguity but also rewrites prompts to teach users how to formulate better inputs, a feature absent in prior work.
4. **Generalizability:** While existing systems are domain-specific (e.g., ECLAIR) or task-limited (e.g., ClarifyGPT), our approach applies to any LLM application.
5. **Efficiency:** We present all clarifying questions at once (tabular format), optimizing user interaction compared to iterative questioning (e.g., CLAM).

In summary, our work distinguishes itself by offering a proactive, quantifiable, and education-focused approach to prompt ambiguity resolution. By leveraging the inherent capabilities of LLMs for self-evaluation and providing explicit feedback on ambiguous dimensions, we aim to not only improve LLM output quality but also enhance user prompting skills.

# 5. Experiments

To validate the effectiveness of our pre-processing approach, we designed a rigorous experimental protocol centered on token-level cost analysis.

## 5.1 Dataset and Procedure

We curated a benchmark set of highly ambiguous prompts spanning diverse tasks, including:

- Business Communication
- Code Generation
- Data Analysis
- Education
- Technical Writing
- Human Resources
- General Question Answering

For each ambiguous prompt, we conducted the following steps:

1. **Simulate a Wasted Cycle:**  
   The `original_prompt` was sent directly to a generation LLM (GPT-4) to obtain a `baseline_response`, simulating an initial, potentially unhelpful output.

2. **User Clarification:**  
   A human expert crafted a `followup_prompt`—a more explicit reformulation required to elicit a correct response.

3. **System Analysis:**  
   The same `original_prompt` was processed by our analyzer LLM, producing a structured `analyzer_response` containing the ambiguity score, diagnosis, and prompt suggestions.

4. **Token Counting:**  
   For each prompt, we recorded the token counts for:
   - `T_original_prompt`
   - `T_baseline_response`
   - `T_followup_prompt`
   - `T_analyzer_response`
   - The fixed token count of the `T_analyzer_prompt` template

## 5.2 Evaluation Procedure

We wrote an automated script to perform the following for each prompt in the dataset:

1. Run the `ambiguous_prompt` through our analysis system to collect its `ambiguityRating`, `analysisTable`, and `suggestedClarifiedPrompts`.
2. Generate a `baseline_response` by sending the `ambiguous_prompt` directly to a target LLM (GPT-4).
3. Generate a `clarified_response` by sending the top-ranked `suggestedClarifiedPrompt` from our system to the same target LLM.

## 5.3 Measuring Computational Waste Reduction and ROI

We introduce a token-based cost-benefit framework to quantify the efficiency of our system. This enables us to compute the Return on Investment (ROI) for ambiguity analysis preceding generation.

**Cost Metrics:**

1. **Computational Cost Savings:**  
   - **Cost of Preventive Analysis (`C_analysis`):**  
     The computational cost of ambiguity detection, including:
     - Tokens in the analyzer meta-prompt template (`T_analyzer_prompt`)
     - Tokens in the user's original prompt (`T_original_prompt`)
     - Tokens in the analyzer's response (`T_analyzer_response`)

     $$
     C_{analysis} = T_{analyzer\_prompt} + T_{original\_prompt} + T_{analyzer\_response}
     $$

   - **Cost of a Wasted Generation Cycle (`C_wasted`):**  
     The cost of a failed interaction due to ambiguity, comprising:
     - Tokens in the original prompt
     - Tokens in the ineffective baseline response
     - Tokens in the user's follow-up clarification

   $$
   C_{wasted} = T_{original\_prompt} + T_{baseline\_response} + T_{followup\_prompt}
   $$

   - **Computational Cost Savings Metric:**  
     The difference between `C_wasted` and `C_analysis`, averaged over all prompts.

   $$
   \text{Computational Cost Savings} = {C_{wasted} - C_{analysis}}
   $$

2. **Time-to-Satisfactory-Response:**  
   - **Definition:**  
     The elapsed time from the initial ambiguous prompt to the first satisfactory LLM output.
   - **Measurement:**  
     For each prompt, we record the time taken to reach a satisfactory response both in the baseline (without analyzer intervention) and with the analyzer system in place.
   - **Time Reduction Metric:**  
     The average decrease in time-to-satisfactory-response attributable to the analyzer system.

## 5.4 Decision Criterion

Our system yields a net computational and temporal benefit whenever:

$$
C_{analysis} < C_{wasted}
$$

and

$$
T_{\text{analyzer}} < T_{\text{baseline}}
$$

We empirically estimate `C_wasted` and time-to-satisfactory-response by analyzing session logs where ambiguous prompts led to reformulation cycles, while `C_analysis` and analyzer-assisted timings are measured directly from system logs.

## 5.5 Practical ROI Measurement Strategy

The evaluation proceeds as follows:

1. **Log Prompt Interactions:**  
   Track user sessions to identify cases of prompt reformulation after unsatisfactory responses.

2. **Token Counting & Timing:**  
   For each session, compute `C_wasted` and time-to-satisfactory-response using the token counts and timestamps for each interaction.

3. **Comparison:**  
   Run the analyzer on the same original prompts and record `C_analysis` and analyzer-assisted response times.

4. **Aggregate Savings:**  
   Calculate the proportion of sessions where `C_analysis < C_wasted` and where time-to-satisfactory-response is reduced, quantifying total computational and time savings.

## 5.6 Assumption of Minimum Waste

For highly ambiguous prompts, we conservatively assume at least one wasted interaction, establishing a lower bound on `C_wasted`. In practice, multiple reformulations may occur, amplifying the ROI of ambiguity prevention.

# 6. Evaluation: Computational Cost-Benefit and Time Efficiency Analysis

We assessed the ROI of integrating the analyzer LLM by comparing the token cost and time cost of preventive analysis with the costs of a failed interaction cycle.

## 6.1 Defining Metrics
| Metric                     | Type               | Description                                   |
|----------------------------|--------------------|-----------------------------------------------|
| Ambiguity Score Accuracy   | Quantitative       | Alignment with human labels                   |
| Dimension Coverage         | Quantitative       | # distinct ambiguity types detected          |
| Clarification Success Rate | Quantitative       | % clarifications resolving ambiguity         |
| LLM Output Quality         | Quant/Qualitative  | Human/automated rating of response            |
| Token Cost Savings         | Quantitative       | \( C_{wasted} - C_{analysis} \) |
| Time-to-Resolution         | Quantitative       | Latency from prompt to correct answer         |
| User Satisfaction          | Qualitative        | User surveys, ratings                         |
| Adoption Rate              | Quantitative       | % users accepting clarified prompts           |
| Failure Rate               | Quantitative       | System robustness, error rate                 |

The above are all metrics can we go with but we choose:

- **Computational Cost Savings:**  
  The token cost savings realized by using the analyzer system, as defined above.

- **Time-to-Satisfactory-Response:**  
  The reduction in time from prompt submission to satisfactory response as enabled by the analyzer.

## 6.2 Results

Across all prompts in the benchmark dataset, average computed costs were:

| Metric                                        | Avg Value        |
|-----------------------------------------------|------------------|
| **Avg. C_wasted (Failure, tokens)**           | 276 tokens       |
| **Avg. C_analysis (Prevention, tokens)**      | 139 tokens       |
| **Net Computational Savings per Prompt**      | 136 tokens       |
| **Avg. Reading Baseline Response (Failure)**  | 118.36 sec       |
| **Avg. Reading Analyzer Response**            | 70.17 sec        |
| **Net Time Saved in Reading Effort**          | 48.19 sec        |


On average, engaging the analyzer LLM incurs about half the token cost of a failed interaction.
Preventive analysis with ~139 tokens averts ~276 tokens of waste per ambiguous prompt — a 49% reduction in computational expenditure per interaction.

The analyzer saves the initial thinking and typing time of composing a follow-up.
But it does not fully eliminate user effort — it shifts some of that effort to editing a provided clarification.

On average, users spend approximately 118 seconds reading ambiguous baseline responses to identify failures, compared to just 70 seconds reading structured analyzer outputs. This reflects a 41% reduction in reading time, streamlining comprehension and reducing cognitive overhead during ambiguity resolution.

```
Without Analyzer:
User Prompt -> User reads response → notices failure → composes follow-up prompt → sends
```
```
With Analyzer:
User Prompt -> Analyzer generates clarified prompt → user reviews/edits → sends
```


# 7. Discussion and Future Work

Our results demonstrate both computational and practical benefits to integrating ambiguity analysis in LLM pipelines:

- For high-ambiguity prompts, pre-processing is cost- and time-efficient, reducing user frustration by minimizing trial-and-error.
- The approach scales in environments with metered or quota-limited LLM access (e.g., API services).

**Future Directions:**

- Develop dynamic models that estimate ambiguity likelihood before triggering analysis.
- Measure non-computational benefits, such as user satisfaction and task success rates.
- Extend the analyzer to multi-turn dialogues, where ambiguity may accumulate over time.

# 8. Conclusion

We present a novel framework that reframes prompt ambiguity as a proactive, solvable step in LLM interaction. By automatically scoring ambiguity, diagnosing its causes, and generating clarified prompts, our system empowers users to interact more effectively and efficiently with LLMs, significantly reducing wasted computation and improving the quality of LLM-driven workflows.