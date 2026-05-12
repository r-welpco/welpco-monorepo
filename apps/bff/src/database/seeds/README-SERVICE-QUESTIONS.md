# Service Questions

**Rule:** Questions are attached **only to subcategories** (level 2). Every category has subcategories; welpers select a subcategory for their offering, and the booking flow loads questions for that subcategory.

## Categories and subcategories

- **Level 1** (Care, Pet Care, Education, etc.): grouping only, **no questions**.
- **Level 2** (Babysitter, Dog Walks, Tutoring, Housekeeping, etc.): **all have questions** (either a specific set or the generic set).

See `docs/category-hierarchy.md` for the full tree.

## Question sets in seed

### Specific sets (per subcategory type)

- **Babysitter, Child Care:** Add child, date, time, one-time/recurring, pay/hr, notes  
- **Elderly Care, Special Needs:** Add person, date, time, one-time/recurring, pay/hr, notes  
- **Dog Walks:** How many dogs, size, start date, date, time, one-time/recurring, pay/hr, notes  
- **Pet Grooming:** Type of pet, start date, date, time, one-time/recurring, pay/hr, notes  
- **Meal Preparation:** How many people, ages, days, meals/day, start/end date, pay/hr, notes  
- **Catering, Party-planning, Magician, Clown, Server, Assistant for Party, Bartender:** Event needs, event for, how many attending, date, time, one-time/recurring, pay/hr, notes  

### Generic set (date, time, one-time/recurring, pay, notes)

Used for all other subcategories: Aquarium and Terrarium…, Dog Training, Pet-sitting, Tutoring, Music Lessons, Personal Trainer, Dietician, Nutritionist, Housekeeping, Painting, Organizing, Moving, Installation, Lawn Care, Gardening, Car Washing, Seasonal Maintenance.

## Search demo

The search-demo seed uses **subcategories only** for offerings (e.g. Babysitter, Child Care, Dog Walks, Tutoring, Housekeeping), so every demo booking has questions.

**To apply:** Run the seed. If content already exists, run with `CLEAR_CONTENT=1` to replace and re-link (see `run-seed.ts`).
