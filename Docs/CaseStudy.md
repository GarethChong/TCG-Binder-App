# Case Study — TCG Binder App

## The Problem

As a Pokémon card collector, I found myself struggling to plan and visualise binder layouts — figuring out which cards would look good together, how to organise them aesthetically, and what it would cost to complete a page. Beyond the practical problem, I had a bigger motivation: the Pokémon card hobby has shifted in recent years from a space of creativity and community to one driven by investment and speculation. I wanted to build something that encouraged collectors to return to the art of binder collecting — to appreciate the hobby for what it is, rather than what cards are worth.

That said, price checking still matters to collectors, so I built that in too. And given the rise of AI, I felt it would be a missed opportunity not to incorporate it as a creative tool for layout suggestions.

---

## The Hardest Decisions

**1. Implementing lateral image support (michi style)**

The most technically complex feature was supporting 2×1 decorative images for the michi collection style. The difficulty wasn't the concept — it was the edge cases. Every operation had to account for the image spanning two slots: checking that both slots were vacant and within the grid before placing, handling swaps between a 2×1 image and a standard 1×1 card or image, and preventing shifts that would push the image outside the grid boundary. On the frontend, I also had to adjust the rendering logic to span the image across two grid cells cleanly. It required significantly more code than any other single feature, and working through the logic systematically was one of the most rewarding parts of the build.

**2. Removing aggregate pricing**

I had fully implemented a total pricing feature — calculating the cumulative value of all cards on a page and displaying it on the grid. It worked, but it looked cluttered and introduced an uncomfortable ambiguity: many cards have multiple variants (reverse holo, alternate art) each with different prices, making a single total figure misleading. After spending significant time on the implementation, I made the decision to remove it entirely and show prices individually on card selection instead. It was a difficult call to scrap working code, but the result is a cleaner, more honest user experience.

---

## What I Learned

**Technically**, this project introduced me to the full stack development workflow end-to-end — from modelling relational data in PostgreSQL with SQLAlchemy, to building a REST API with Flask, to bridging the frontend and backend across domains with CORS and session-based authentication. On the frontend, I learned to build reactive, component-based UIs in React, styled with Tailwind CSS and shadcn/ui. I also learned how to integrate third-party APIs, secure user accounts with bcrypt and Flask-Login, and deploy a production application across Vercel and Render — none of which is covered in a typical university curriculum.

**Personally**, the most valuable lesson came from how I worked with AI during this build. I made a deliberate choice early on to ask AI for logic and direction rather than complete answers, which forced me to write and understand every line of code myself. But there were moments — particularly during long, draining sessions — where I lost that discipline. I drifted from my original vision, forgot features I had planned (the michi image support, the two-way AI input), and had to go back and rewrite significant portions of the app. It taught me something I think is increasingly relevant in today's development environment: AI is a powerful mentor and accelerator, but the moment you let it take the lead, you risk losing ownership of your own product. The thinking, the decisions, and the vision have to remain yours.