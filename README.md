# ChoreChum

[![Deploy with V"Vercel"](https://vercel.com/button)](https://vercel.com)

A modern, mobile-first web app for managing household chores. Stop arguing, start organising.

Built with Next.js, Supabase, and Tailwind CSS, ChoreChum is a sleek and simple planner designed for households. It allows users to create an account, join a shared household, and manage tasks collectively with real-time updates.

![TODO: Add a screenshot of the app dashboard here](https://via.placeholder.com/800x450.png?text=ChoreChum+App+Dashboard)

---

## 🚀 Core Features

* **Full User Authentication:** Secure sign-up, login, and password resets (via Supabase Auth).
* **Household Management:** Users can create their own household or join an existing one using a unique 6-character invite code.
* **Real-time Chore Dashboard:** The chore list updates live for all housemates. When one person completes a chore, everyone sees it instantly without a refresh (via Supabase Realtime).
* **Chore Management:** Full CRUD (Create, Read, Update, Delete) functionality for all chores.
* **Task Assignment:** Assign chores to specific household members or leave them unassigned ("Anyone").
* **Room Management:** A dedicated page to create, manage, and delete rooms (e.g., "Kitchen", "Living Room").
* **Recurring Chores:** Set chores to repeat "Daily," "Weekly," or "Monthly."
* **Multi-Instance Chores:** For tasks like "Load the dishwasher," you can set multiple instances (e.g., "3") and track progress (1/3, 2/3, 3/3).
* **Colour-Coded Status:** Chores are automatically colour-coded to show what's **complete** (green) or **overdue** (red).
* **Completion Animations:** A fun "confetti" animation fires on task completion.
* **Sleek & Mobile-First:** Built with a "bold minimalist" design that is clean, intuitive, and works perfectly on your phone.

---

## 🛠 Tech Stack

* **Framework:** Next.js 14 (App Router)
* **Backend & Database:** Supabase (Auth, Postgres DB, Realtime)
* **Styling:** Tailwind CSS
* **UI Components:** Headless UI (for modals and menus)
* **Date & Recurrence:** `rrule`
* **Animations:** `canvas-confetti`
* **Icons:** `lucide-react`

---

## 🏁 Getting Started

To run this project locally, you'll need to set up your own Supabase project.

### 1. Clone the Repository

```bash
git clone [https://github.com/YOUR_USERNAME/chore-chum.git](https://github.com/YOUR_USERNAME/chore-chum.git)
cd chore-chum