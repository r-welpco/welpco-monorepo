# Search demo seed

After running `pnpm seed`, the database contains **3 searchable welpers** with complete public profiles and service offerings.

## Seeded welpers

| Name        | Email                  | Categories              | Example search terms      |
|------------|------------------------|-------------------------|---------------------------|
| Alex Rivera | welper@welpco.com     | Babysitter, Care        | babysit, childcare, care, Alex |
| Jane Doe   | e2e-welper@welpco.com | Pet Care                | pet, dog, walking, Jane   |
| Sam Chen   | search-demo@welpco.com| Education, In-Home Maintenance | tutor, math, education, Sam |

## Example searches

Use these in the **Search Welper** dashboard tab or at `GET /api/search/services?q=...`:

- **Text (q)**
  - `babysit` or `babysitting` → Alex Rivera
  - `pet` or `dog` → Jane Doe
  - `tutor` or `math` or `education` → Sam Chen
  - `care` → Alex Rivera, Sam Chen (care / in-home)
  - `Alex`, `Jane`, `Sam` → by first name

- **Category (categoryId)**
  - Use category IDs from `GET /api/search/categories` (e.g. Care, Pet Care, Education) and call:
  - `GET /api/search/services?categoryId=<uuid>`

- **Sort**
  - `?sort=price` — lowest hourly rate first
  - `?sort=relevance` — default

## Run seed

```bash
cd apps/bff
pnpm seed
```

If content (categories) is missing, run once with `CLEAR_CONTENT=1` to reseed categories, then run `pnpm seed` again.
