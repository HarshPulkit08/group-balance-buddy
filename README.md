# SplitEase (formerly Group Balance Buddy)

SplitEase is a premium, multi-group expense management platform designed to make splitting bills and tracking shared costs effortless and beautiful. Built with modern web technologies and a focus on premium user experience, it allows users to manage multiple trips, upload receipts, and view detailed financial insights.

![SplitEase Dashboard](https://group-balance-buddy-hp7.web.app/og-image.png)

## 🚀 Premium Features

- **Multiple Trips/Groups**: Create and manage separate journeys or groups for different occasions.
- **Unified Dashboard**: Global visibility into your monthly spending across all active trips.
- **Smart Settlements**: Optimized algorithm to minimize transactions and "settle up" with simple, clear steps.
- **Receipt Management**: Securely upload receipt images to Firebase Storage and view them in a premium, zoomable lightbox.
- **Visual Analytics**: Dynamic charts (via Recharts) for monthly spending trends and individual split breakdowns.
- **Glassmorphic UI**: A state-of-the-art design featuring backdrop blurs, soft gradients, and smooth micro-animations.
- **Firebase Core**: Real-time data synchronization with Firestore and secure Authentication.

## 🛠️ Tech Stack

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Backend**: [Firebase](https://firebase.google.com/) (Auth, Firestore, Storage, Hosting)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Animations**: Framer Motion & CSS Keyframes

## 🏁 Getting Started

### Prerequisites

- Node.js (v18+)
- A Firebase Project (for Authentication, Firestore, and Storage)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/HarshPulkit08/group-balance-buddy.git
   cd group-balance-buddy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   Create a `.env` or update `src/lib/firebase.ts` with your Firebase project credentials.

### Running Locally

To start the development server:
```bash
npm run dev
```

### Building for Production

To create a production build and deploy to Firebase:
```bash
npm run build
firebase deploy
```

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---
*Created with ❤️ by Harsh Pulkit*
