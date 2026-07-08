# Vine CRM

A modern, client-ready CRM experience built with HTML5, CSS3, and Vanilla JavaScript. Designed for sales teams and service operations with secure authentication and a polished opportunity pipeline.

## Features

- 🔐 **Secure Authentication** — Login with role-based access control
- 📊 **Opportunity Pipeline** — Visual Kanban-style stages for deal tracking
- 👥 **Contact & Company Management** — Organize your customer base
- ✅ **Task Management** — Track follow-ups and deadlines
- 🎨 **Modern UI/UX** — Premium, client-ready presentation
- 📱 **Responsive Design** — Works on desktop and mobile

## Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/[your-username]/vine-crm.git
cd vine-crm

# Start a local server
python3 -m http.server 8000
```

Open http://127.0.0.1:8000/index.html in your browser.

### Demo Credentials

- **Email:** admin@vinecrm.com
- **Password:** demo123

## Tech Stack

**Current (Demo):**
- HTML5, CSS3, Vanilla JavaScript
- LocalStorage for data persistence

**Production Stack (Recommended):**
- Next.js + TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Clerk or NextAuth for authentication
- Vercel for hosting

## Project Structure

```
.
├── index.html                     # Main HTML entry point
├── styles.css                     # Global styles and design system
├── app.js                         # Application logic and state management
├── plan-customCrm.prompt.md       # Product planning & requirements
├── vercel.json                    # Vercel deployment config
├── .gitignore                     # Git ignore rules
└── README.md                      # This file
```

## Modules

### Dashboard
Overview of key metrics, workflow highlights, and recent activity. Shows open opportunities, contacts, upcoming tasks, and activity feed.

### Contacts
Manage your customer contacts with name, title, email, phone, and company association. Full CRUD operations with local persistence.

### Companies
Track companies by industry, website, and owner. Organize your customer base and build relationships.

### Opportunities
Pipeline-based opportunity management with stages:
- New → Qualified → Proposal → Negotiation → Won

Track opportunity value, close dates, owners, and related contacts.

### Tasks
Create and track tasks with priority levels (High, Medium, Low) and due dates. Mark tasks complete and associate them with companies or opportunities.

### Users
View team members and their roles (Admin, Sales Rep, Support Lead). Demonstrates role-based access control.

## Authentication & Security

The demo uses a simple authentication system with localStorage. 

**For production, implement:**
- OAuth integration (Clerk, Auth0, or NextAuth)
- PostgreSQL for persistent user storage
- JWT tokens for secure session management
- Role-based access control (RBAC)
- End-to-end encryption for sensitive data
- Rate limiting and DDoS protection

## Data Model

### Users
- id, name, email, role, status

### Contacts
- id, firstName, lastName, title, email, phone, companyId

### Companies
- id, name, industry, website, owner

### Opportunities (Deals)
- id, title, companyId, contactId, stage, value, closeDate, ownerId

### Tasks
- id, title, dueDate, priority, status, relatedTo

### Activities
- id, description, createdAt

## Deployment

### Vercel

This project is deployed on Vercel. Connect your GitHub repository for automatic deployments:

1. Push code to GitHub
2. Import repository in Vercel dashboard
3. Vercel automatically deploys on every push to main

### GitHub Actions (Optional)

Add CI/CD pipelines for testing and deployment validation.

## Future Enhancements

- [ ] Backend API (Node.js/Express or Next.js)
- [ ] Real database (PostgreSQL with Prisma)
- [ ] Email notifications (Resend, SendGrid)
- [ ] Advanced reporting and analytics
- [ ] Drag-and-drop pipeline UI
- [ ] Calendar and scheduling features
- [ ] Bulk import/export (CSV, Excel)
- [ ] Mobile app (React Native or Flutter)
- [ ] Dark mode toggle
- [ ] Custom field builder
- [ ] Activity webhooks

## Development

### Local Server

```bash
python3 -m http.server 8000
```

### Code Quality

The code follows these principles:
- Clean, readable JavaScript
- Mobile-first responsive design
- Semantic HTML
- WCAG 2.1 accessibility guidelines
- Progressive enhancement

## License

MIT License — use freely for client presentations and commercial implementations.

## Support

For questions or issues:
1. Check the [planning document](./plan-customCrm.prompt.md)
2. Review the codebase comments
3. Open a GitHub issue

---

**Built for modern sales operations. Ready for production implementation.**
