# Innovation Shield — Access & Page Blueprint

## Roles
- `innovator` (مبتكر)
- `evaluator` (مقيّم)
- `committee` (لجنة الابتكار)
- `manager` (مدير الابتكار)
- `support_entity` (جهة داعمة)
- `executive_entity` (جهة تنفيذية)

## Permission Layers
- **Page Permissions**: تتحكم في الوصول للشاشات.
- **Action Permissions**: تتحكم في الأزرار والإجراءات داخل الشاشة.

## Page Permissions
- `page.workspace.view`
- `page.initiatives.view`
- `page.governance.view`
- `page.admin.overview.view`
- `page.admin.access.view`
- `page.admin.initiatives.view`
- `page.admin.audit.view`
- `page.admin.judging.view`

## Action Permissions
- `initiative.create`
- `initiative.status.update`
- `initiative.evaluate`
- `initiative.approve`
- `initiative.reject`
- `initiative.read.all`
- `team.manage`
- `governance.approve`
- `governance.manage`
- `reward.manage`
- `judging.lock`
- `audit.read`

## Role Distribution
- **Employee**:
- **Innovator (مبتكر)**:
  - Pages: Workspace, Initiatives, Governance
  - Actions: Create Initiative, Governance Approve
- **Evaluator (مقيّم)**:
  - Pages: Initiatives, Admin Judging
  - Actions: Read All Initiatives, Evaluate, Read Audit
- **Committee (لجنة الابتكار)**:
  - Pages: Initiatives, Admin Initiatives, Admin Judging
  - Actions: Read/Evaluate/Approve/Reject, Judging Lock, Read Audit
- **Manager (مدير الابتكار)**:
  - Pages: Workspace, Initiatives, Governance, Admin Overview, Admin Access, Admin Initiatives, Admin Audit, Admin Judging
  - Actions: Create/Read/Update/Approve/Reject, Governance Manage, Reward Manage, Judging Lock, Read Audit
- **Support Entity (جهة داعمة)**:
  - Pages: Workspace, Initiatives
  - Actions: Read All, Update Status, Team Manage, Governance Approve
- **Executive Entity (جهة تنفيذية)**:
  - Full access (`*`)

## Linked Pages
- `/index.html`
- `/teams.html`
- `/initiatives.html`
- `/policies.html`
- `/admin/index.html`
- `/admin/access.html`
- `/admin/initiatives.html`
- `/admin/audit.html`
- `/admin/judging.html`

## Implementation Notes
- Role matrix source: `core/role-matrix.js`
- Page/action constants: `core/constants.js`
- Nav linking by permission: `ui/shared-nav.js`
- Subnav linking by permission: `ui/subnav-access.js`
- Admin page guard: `ui/admin-guard.js`
