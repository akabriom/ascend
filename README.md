# Remix of Gym Memory

Core Philosophy

This app is not a fitness coach, workout generator, social network, calorie tracker, or analytics platform.

Its only purpose is to act as a second brain for gym training.

The user should be able to open the app and immediately know:

What muscle groups to train today

What exercises were done previously

What weights and reps were used last time

What personal records have been achieved

What muscle groups have not been trained recently

The app should minimize thinking and data entry.

The user should only need to tap and enter numbers.

Everything else should be automated.

Design Language

Full dark theme

Minimal UI

Modern liquid glass aesthetic

Clean black, white, and gray palette

Subtle haptics

Fast interactions

No visual clutter

Mobile-first

The interface should feel premium and calm rather than flashy.

Home Screen

Hero Card

Display today's scheduled workout automatically.

Example:

Monday

Chest • Triceps • Abs

The schedule should be configurable by the user.

The displayed workout should change automatically based on the current day.

Today's Muscle Groups

Below the hero card show cards for today's muscle groups.

Example:

Chest

Triceps

Abs

Tapping a card opens that muscle group.

Weekly Schedule System

User can define muscle groups for each day.

Example:

Monday → Chest, Triceps, Abs

Tuesday → Back, Biceps

Wednesday → Legs

The app automatically updates the home screen according to the day.

Muscle Groups Screen

Displays all muscle groups.

Examples:

Chest

Back

Shoulders

Biceps

Triceps

Forearms

Abs

Quads

Hamstrings

Calves

Selecting a muscle group opens its exercise list.

Smart Exercise Rotation

The user should not manually manage exercise rotation.

The app should automatically prioritize exercises that have not been used recently.

Example:

If today's chest workout includes:

Incline Bench

Flat Bench

Chest Fly

Pushups

Then on the next chest day these exercises move lower in the list and less recently used chest exercises move higher.

The goal is to surface forgotten variations naturally.

No settings or configuration should be required.

Exercise Screen

When an exercise is opened, display workout history first.

Example:

23 Aug

20kg × 10

20kg × 8

22.5kg × 6

18 Aug

20kg × 8

20kg × 8

20kg × 7

14 Aug

17.5kg × 10

17.5kg × 8

15kg × 10

The user should immediately see previous performance before logging a new session.

Workout Logging

Fastest possible workflow.

User enters:

Weight

Reps

Everything else is automated.

The app automatically:

Saves workouts

Updates exercise history

Updates muscle group history

Calculates personal records

Tracks last trained dates

No unnecessary forms.

Timeline Screen

Chronological history of training sessions.

Example:

Today

Chest • Triceps • Abs

Exercises and sets

Yesterday

Legs

Exercises and sets

3 Days Ago

Back • Biceps

Exercises and sets

This screen acts as a complete training memory.

Personal Records Screen

Automatically generated.

Examples:

Bench Press

Best Weight

Best Reps

Date achieved

Lat Pulldown

Best Weight

Best Reps

Date achieved

PRs are detected automatically.

No manual management.

Recovery Memory

For each muscle group display:

Last trained X days ago

This is informational only.

No recovery calculations or recommendations.

Non Goals

Do NOT build:

Social features

Community feeds

AI coaching

Calorie tracking

Diet planning

Subscription systems

Complex analytics dashboards

Workout generation

Keep the app focused on being a gym memory system.

Primary Goal

The user should be able to answer these questions in under 5 seconds:

What am I training today?

What did I do last time?

What should I beat today?

When did I last train this muscle?

What are my current PRs?

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5a867a7b-ba09-4f34-ad34-085e6a30523a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Deploying to Vercel

This app is a TanStack Start (SSR) project. It builds for Cloudflare Workers by
default (Lovable hosting) and switches to Nitro's `vercel` preset automatically
when `VERCEL=1` is set — which Vercel does in its own build environment.

1. Import the GitHub repo in Vercel.
2. Leave the defaults: `vercel.json` sets install (`npm install`) and build (`npm run build`).
3. Add any environment variables (e.g. `VITE_*`) in Vercel project settings.
4. Deploy — output is emitted to `.vercel/output` (Build Output API v3).

To reproduce a Vercel build locally: `DEPLOY_TARGET=vercel npm run build`.
