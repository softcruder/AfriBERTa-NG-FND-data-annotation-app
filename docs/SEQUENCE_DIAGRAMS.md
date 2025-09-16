# Sequence Diagrams: Annotation & QA Lifecycle

This document aggregates the system's sequence diagrams (Mermaid + PlantUML) for quick reference and maintenance.

## Index
1. High-Level Lifecycle (Mermaid)
2. Translation Path (Mermaid)
3. Admin Finalization (Mermaid)
4. PlantUML Master Diagram
5. Status Transition Table
6. Maintenance & Update Procedure

---
## 1. High-Level Lifecycle (Mermaid)
See: `annotation-flow.md`

## 2. Translation Path (Mermaid)
See: `annotation-flow.md`

## 3. Admin Finalization (Mermaid)
See: `annotation-flow.md`

## 4. PlantUML Master Diagram
File: `annotation-flow.puml`

Render locally (if PlantUML extension installed):
```
@startuml
!include annotation-flow.puml
@enduml
```

## 5. Status Transition Table
| From | Trigger | Actor | Endpoint | To | Notes |
|------|---------|-------|----------|----|-------|
| not-started | User begins work | Annotator | (client only) | in-progress | Local only |
| in-progress | Submit annotation | Annotator | POST /api/annotations/* | completed | Logged to sheet |
| completed | Peer approves | PeerQA | POST /api/qa/verify | qa-approved | QA mark applied |
| completed | Peer escalates | PeerQA | POST /api/qa/verify | admin-review | Escalated for admin |
| qa-approved | Admin finalizes | Admin | POST /api/qa/verify { adminFinalize:true } | verified | Triggers dataset append |
| admin-review | Admin finalizes | Admin | POST /api/qa/verify { adminFinalize:true } | verified | Handles escalated item |
| any pre-final | Admin rejects | Admin | (admin verify route) | invalid | Hidden |
| any pre-final | Admin requests changes | Admin | (admin verify route) | needs-revision | Original annotator only |
| needs-revision | Resubmitted | Annotator | POST /api/annotations/* | completed | Returns to QA cycle |

## 6. Maintenance & Update Procedure
1. When adding a new status:
   - Update type definitions in `lib/data-store.ts` and related mapper logic.
   - Adjust filtering in `app/api/tasks/route.ts`.
   - Update QA logic in `app/api/qa/verify/route.ts` (and `admin/verify` if needed).
   - Extend diagrams (`annotation-flow.md` + `annotation-flow.puml`).
2. If dataset finalization logic changes, update: `qa/verify` route & docs.
3. Re-render diagrams if exporting to images.
4. Commit changes with message: `docs: update sequence diagrams`.

## 7. Rendering Tools
- Mermaid: VS Code Markdown preview (with Mermaid support) or `@mermaid-js/mermaid-cli`.
- PlantUML: VS Code PlantUML extension (`jebbs.plantuml`) or CLI with Graphviz.

## 8. Related Source Files
- `app/api/tasks/route.ts`
- `app/api/annotations/*`
- `app/api/qa/verify/route.ts`
- `app/api/admin/verify/route.ts`
- `lib/google-apis.ts`
- `lib/annotation-mapper.ts`
- `lib/data-store.ts`

---
Generated: 2025-09-16
