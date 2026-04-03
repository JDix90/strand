# Admin QA: viewing the student curriculum shell

**Supported approach (recommended):** Use a real **student account** that is a member of at least one class with `class_curriculum` rows. The student sidebar and `/class/:classId` routes depend on `class_memberships` and RLS; impersonation that only changes UI role without membership will not show class-scoped curriculum data.

**Alternatives (pick one product-wide):**

1. **Demo class** — Create a test class, enroll a dedicated QA student user, seed curriculum. Admins log in as that student for full fidelity.
2. **Future: read-only class preview** — A dedicated admin tool that calls server-side preview RPCs would avoid duplicating membership rules; not implemented in the client-only path.

Avoid relying on “View as Student” from the admin bar unless the underlying `profile` is actually a student with `class_memberships`, or QA results will not match production students.
