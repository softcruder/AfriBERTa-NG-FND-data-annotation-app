# AfriBERTa-NG Annotation System Training Scripts

## Overview of Annotator Types

Our system supports three types of annotators based on their language capabilities:

1. **Regular Annotators** - Work only with non-English content (Hausa/Yoruba source materials)
2. **Single-Language Translators** - Translate English content to either Hausa OR Yoruba
3. **Dual-Language Translators** - Translate English content to BOTH Hausa AND Yoruba

---

## Training Script for Regular Annotators

### **Role Definition**

You are a **Regular Annotator**. Your job is to fact-check and annotate claims that are already in Hausa or Yoruba (not English).

### **What You'll See**

- Claims already written in Hausa or Yoruba
- Source articles in the same language as the claim
- Tasks that don't require any translation work

### **Your Workflow**

1. **Task Selection**
   - Go to your dashboard and click "Start Annotation"
   - You'll see a list of available tasks in your target language
   - Click on any task to begin

2. **Understanding Your Task**
   - **Original Claim**: This is the fact-check claim you need to verify (already in Hausa/Yoruba)
   - **Source Article**: The article where this claim originated
   - **Your Job**: Determine if the claim is True, False, or Misleading

3. **Annotation Process**

   **Step 1: Review the Claim**
   - Read the claim carefully
   - You can edit the claim text if needed for clarity
   - The claim text is required and cannot be empty

   **Step 2: Add Source Links**
   - The original source URL is pre-filled (don't edit this)
   - Add additional source links that help verify or contradict the claim
   - Click "Add Source Link" to add more verification sources

   **Step 3: Article Body (REQUIRED)**
   - You MUST provide the article body content
   - Copy and paste the relevant article text (minimum 50 characters)
   - This helps other reviewers understand the context

   **Step 4: Make Your Verdict**
   - Choose from: **True**, **False**, or **Misleading**
   - This is REQUIRED - you must make a decision
   - Only these three options are accepted for completion

   **Step 5: Task Validity**
   - Mark if the task is valid or invalid
   - If invalid, provide a reason why

4. **Quality Assurance**
   - After you submit, another annotator will review your work (peer review)
   - If approved, it goes to final dataset
   - If questions arise, it goes to admin review
   - You cannot review your own annotations

5. **Important Rules**
   - Article body is REQUIRED (minimum 50 characters)
   - You must select True, False, or Misleading
   - You cannot perform QA on your own work
   - Focus on accuracy and clear reasoning

---

## Training Script for Single-Language Translators

### **Role Definition**

You are a **Single-Language Translator**. You translate English fact-check claims into either Hausa OR Yoruba (based on your language configuration).

### **What You'll See**

- Claims originally written in English
- Tasks that need translation to your assigned language (Hausa OR Yoruba)
- Interface automatically configured for your target language

### **Your Workflow**

1. **Task Selection**
   - Go to your dashboard and click "Start Annotation"
   - You'll only see English tasks that need translation to YOUR language
   - If another annotator already translated to your language, you won't see that task
   - Tasks requiring the OTHER language (that you don't handle) won't appear

2. **Understanding Your Task**
   - **English Claim**: The original claim in English
   - **Your Job**: Translate to your language AND fact-check it
   - **Language Auto-Selected**: Your target language is automatically chosen

3. **Translation & Annotation Process**

   **Step 1: Review English Claim**
   - Read the original English claim carefully
   - You can edit it if needed for clarity

   **Step 2: Translation (REQUIRED)**
   - Your translation language is automatically set (you cannot change it)
   - Translate the claim into your assigned language
   - Translation text is REQUIRED and cannot be empty

   **Step 3: Article Body Translation (REQUIRED)**
   - You MUST provide the article body translation in your language
   - Translate the relevant article content (minimum requirements apply)
   - This field is automatically labeled for your specific language

   **Step 4: Add Source Links**
   - Original source URL is pre-filled
   - Add additional sources in any language that support your translation

   **Step 5: Make Your Verdict**
   - Choose: **True**, **False**, or **Misleading**
   - Base this on your translated content and research

4. **Collaborative Workflow**
   - **Important**: Other single-language translators may work on the SAME task
   - Example: You do Hausa translation, another annotator does Yoruba translation
   - Each language is treated as a separate annotation
   - Both must be completed for the task to be fully done

5. **Quality Assurance**
   - Your translation will be reviewed independently
   - Another annotator will check your translation quality and fact-checking
   - Each language goes through separate QA approval
   - Final dataset will have separate entries for each language

6. **Important Rules**
   - You cannot change your target language (it's preset)
   - Article body translation is REQUIRED for your language
   - Your work doesn't block other language translators
   - You cannot QA your own translations

### **Special Notes for Single-Language Translators**

- **Task Availability**: You only see tasks where YOUR language hasn't been completed yet
- **Independence**: You work independently of other language translators
- **Completion**: A task disappears from everyone's list only when ALL required languages are done

---

## Training Script for Dual-Language Translators

### **Role Definition**

You are a **Dual-Language Translator**. You can translate English claims into BOTH Hausa AND Yoruba in a single annotation session.

### **What You'll See**

- Claims originally written in English
- Tasks requiring translation to both Hausa and Yoruba
- Interface with tabs/sections for both languages

### **Your Workflow**

1. **Task Selection**
   - Go to your dashboard and click "Start Annotation"
   - You'll see English tasks that need translation to either or both languages
   - You can take on tasks that single-language translators haven't completed
   - You can also take completely new tasks

2. **Understanding Your Task**
   - **English Claim**: Original claim to translate
   - **Your Job**: Translate to BOTH languages AND fact-check
   - **Advantage**: You complete both languages in one session

3. **Translation & Annotation Process**

   **Step 1: Review English Claim**
   - Read and edit the original English claim if needed

   **Step 2: Dual Translation (BOTH REQUIRED)**
   - **Hausa Translation**: Provide complete Hausa translation
   - **Yoruba Translation**: Provide complete Yoruba translation
   - BOTH translations are required - you cannot submit with just one

   **Step 3: Article Body Translations (BOTH REQUIRED)**
   - **Hausa Article Body**: Translate article content to Hausa
   - **Yoruba Article Body**: Translate article content to Yoruba
   - Both fields are required and must have content

   **Step 4: Source Links**
   - Add verification sources in any language
   - These apply to all translations

   **Step 5: Verdict**
   - One verdict applies to all language versions
   - Choose: **True**, **False**, or **Misleading**

4. **Efficiency Benefits**
   - You complete what would normally require 2 separate annotators
   - Consistent translation approach across both languages
   - Single QA review for both languages together
   - Faster completion of English source tasks

5. **Quality Assurance**
   - Both your translations are reviewed together
   - QA reviewer sees Hausa and Yoruba side-by-side
   - Single approval decision covers both languages
   - Creates entries for both languages in final dataset

6. **Important Rules**
   - BOTH language translations are required (cannot submit partial)
   - BOTH article body translations are required
   - You cannot do just one language - it's all or nothing
   - Your work completes the task entirely (blocks single-language translators)

---

## General System Information (All Annotators)

### **Navigation & Interface**

- **Dashboard**: Your main work area showing available tasks
- **Task List**: Click "Start Annotation" to see available work
- **Auto-Save**: Your progress is automatically saved as you work
- **Time Tracking**: System tracks how long you spend on each task

### **Quality Assurance Process**

1. **Peer Review**: Other annotators review your work
2. **Admin Review**: If there are concerns, admins make final decisions
3. **Final Dataset**: Only approved annotations make it to the research dataset

### **Payment & Tracking**

- Time spent on each task is automatically tracked
- Payment calculations are based on completed annotations
- Different rates may apply for translation vs. regular annotation

### **Technical Support**

- If you encounter errors, refresh the page first
- Report persistent issues to administrators
- System automatically prevents duplicate work

### **Best Practices**

- **Accuracy First**: Take time to research and verify claims
- **Clear Translations**: Make translations natural and readable
- **Complete Information**: Fill all required fields thoroughly
- **Consistent Quality**: Maintain the same standards across all tasks

---

## Quick Reference by Annotator Type

| Feature                  | Regular Annotator        | Single-Language Translator | Dual-Language Translator  |
| ------------------------ | ------------------------ | -------------------------- | ------------------------- |
| **Source Language**      | Hausa/Yoruba             | English                    | English                   |
| **Target Languages**     | Same as source           | One (Hausa OR Yoruba)      | Both (Hausa AND Yoruba)   |
| **Translation Required** | No                       | Yes (one language)         | Yes (both languages)      |
| **Article Body**         | Required (same language) | Required (your language)   | Required (both languages) |
| **Task Sharing**         | No sharing               | Shares with other language | Takes full task           |
| **QA Scope**             | Full annotation          | Single language            | Both languages            |
| **Completion**           | Individual task          | Partial task completion    | Full task completion      |

This training material should be provided to annotators based on their specific role configuration in the system.
