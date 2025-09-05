# Quick Training Guide - AfriBERTa-NG Annotation System

## 📋 Overview: Three Types of Annotators

### 🔹 Regular Annotator

- **Source**: Hausa/Yoruba content
- **Task**: Fact-check claims (no translation)
- **Requirements**: Article body + verdict

### 🔸 Single-Language Translator

- **Source**: English content
- **Task**: Translate to Hausa OR Yoruba + fact-check
- **Requirements**: Translation + article body translation + verdict

### 🔶 Dual-Language Translator

- **Source**: English content
- **Task**: Translate to BOTH Hausa AND Yoruba + fact-check
- **Requirements**: Both translations + both article bodies + verdict

---

## 🎯 Training Script Template

### Opening (5 minutes)

**"Welcome to the AfriBERTa-NG annotation system. Based on your language skills, you are configured as a [ANNOTATOR TYPE]. Let me explain what this means for your daily work."**

### Role-Specific Explanation (10 minutes)

#### For Regular Annotators:

- "You work with content already in Hausa or Yoruba"
- "No translation needed - focus on fact-checking accuracy"
- "Must provide article body (minimum 50 characters)"
- "Choose verdict: True, False, or Misleading"

#### For Single-Language Translators:

- "You see English claims that need translation to [YOUR LANGUAGE]"
- "System auto-selects your language - you cannot change it"
- "Other translators may work on the same task for different languages"
- "Required: Translation text + article body translation + verdict"
- "Task disappears only when ALL languages are completed"

#### For Dual-Language Translators:

- "You handle both Hausa AND Yoruba in one session"
- "All translation fields are required - cannot submit partial work"
- "You complete entire tasks (blocks single-language translators)"
- "More efficient but higher responsibility"

### Hands-On Demo (15 minutes)

#### Step 1: Dashboard Navigation

- "Click 'Start Annotation' to see your task list"
- "Tasks are filtered based on your role automatically"
- Show task selection

#### Step 2: Form Walkthrough

**For All Types:**

- "Review the claim text (editable)"
- "Check source URL (pre-filled, don't change)"
- "Add additional source links for verification"

**Role-Specific Fields:**

- Regular: "Fill article body field"
- Single-Language: "Complete translation + article body translation"
- Dual-Language: "Complete both Hausa and Yoruba sections"

#### Step 3: Completion

- "Select verdict (required): True, False, or Misleading"
- "Mark task validity"
- "Submit for peer review"

### Quality Assurance Process (5 minutes)

- "Your work goes to peer review (another annotator)"
- "Cannot review your own work"
- "If approved → final dataset"
- "If issues → admin review"

### Important Rules (5 minutes)

- **Article body is ALWAYS required**
- **Must select True/False/Misleading verdict**
- **Auto-save protects your progress**
- **Time tracking is automatic**

---

## 🗣️ Key Talking Points by Role

### Regular Annotators

- "Focus on accuracy - you're the fact-checking expert"
- "Article body helps reviewers understand context"
- "No translation pressure - concentrate on verification"

### Single-Language Translators

- "You're part of a team - others handle the other language"
- "Your language is preset based on your skills"
- "Quality translations help the research community"

### Dual-Language Translators

- "You have special access to complete entire tasks"
- "Higher efficiency but must complete both languages"
- "Consistency across languages is important"

---

## ❓ Common Questions & Answers

**Q: "Can I change my language assignment?"**

- Single-Language: "No, it's preset based on your capabilities"
- Dual-Language: "You must do both languages - cannot pick one"

**Q: "What if I make a mistake?"**

- "Auto-save protects your work, you can edit before submitting"
- "Peer review catches errors before final dataset"

**Q: "Why don't I see certain tasks?"**

- Regular: "You only see non-English content"
- Single-Language: "You only see tasks needing your language"
- Dual-Language: "You see tasks needing either/both languages"

**Q: "How is my work reviewed?"**

- "Peer review by other annotators"
- "You cannot review your own work"
- "Admin review for disputed cases"

---

## 📝 Quick Checklist for Trainers

### Before Starting:

- [ ] Confirm annotator's language capabilities
- [ ] Verify their role assignment in system
- [ ] Have test tasks ready for demo

### During Training:

- [ ] Explain their specific annotator type
- [ ] Show actual interface for their role
- [ ] Walk through complete workflow
- [ ] Demonstrate form validation
- [ ] Explain QA process

### Before They Start Working:

- [ ] Have them complete practice task
- [ ] Verify they understand required fields
- [ ] Confirm they know how to access tasks
- [ ] Provide contact info for support

---

## 🔧 Technical Tips for Trainers

### Common Issues:

- **"I don't see any tasks"**: Check role configuration and task availability
- **"Form won't submit"**: Usually missing required fields (article body, verdict)
- **"Language options disabled"**: Expected for single-language users
- **"Can't change verdict"**: Must select True/False/Misleading only

### Demo Preparation:

- Use test spreadsheet data
- Have examples of each annotation type ready
- Show both successful and error states
- Demonstrate auto-save functionality

This guide provides a structured approach for training different types of annotators while addressing their specific needs and workflows.
