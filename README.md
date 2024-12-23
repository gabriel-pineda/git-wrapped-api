# Git Wrapped API

Git Wrapped is the API that powers [git-wrapped.com](https://git-wrapped.com) (Github Wrapped), a service that generates beautiful visualizations of your GitHub activity.

![Git Wrapped Example](https://git-wrapped.com/images/git-wrapped-gabriel-pineda.png)

## 🚀 Quick Start

### Prerequisites

1. Node.js and npm/yarn
2. GitHub Personal Access Token (Classic)
   - [How to create a GitHub Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic)
   - Required permissions: `public_repo`, `read:user`, `repo:status` (if you need to include private repo commit status)

### Environment Setup

Create a `.env.local` file in the root directory with:

```bash
GITHUB_TOKEN=ghp_<your_token_here>
```

### Installation

```bash
# Using yarn
yarn install

# Using npm
npm install
```

### Development

Run the development server:

```bash
# Using yarn
yarn dev

# Using npm
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 🛠 Technical Stack

- Next.js 13
- TypeScript
- Main API file: `api/stats.ts`

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

1. **Open an Issue**

   - Found a bug? Have a feature request? Open an issue describing what you'd like to change.

2. **Submit a Pull Request**
   - Fork the repository
   - Create a new branch for your feature
   - Make your changes
   - Submit a PR with:
     - Clear description of the changes
     - Link to the related issue
     - Sample result/screenshot if applicable
   - Wait for review

## 📝 License

The code in this repository is licensed under the MIT License.

---

<details>
<summary>Additional Next.js Resources</summary>

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub Repository](https://github.com/vercel/next.js/)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)

</details>
