# Client `cd_*` localStorage keys

Used for curriculum navigation and class context. Changing behavior may require a one-time migration or user messaging.

| Key | Purpose |
|-----|---------|
| `cd_student_sidebar_class` | Selected class UUID for the student **Overview** (`/home`) sidebar and for default class-scoped routes (e.g. mode CTAs); same key as `SELECTED_CLASS_STORAGE_KEY` in code. |
| `cd_last_unit_{classId}` | Last visited unit per class (`lastUnitStorageKey`); used when resolving default unit for CTAs. |

Related helpers: [`src/lib/studentNavigation.ts`](../src/lib/studentNavigation.ts).
