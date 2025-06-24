# GitHub Repository Setup Instructions

## After creating the repository on GitHub, run these commands

Add GitHub as remote origin (replace YOUR_USERNAME with your actual GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/vh-banquets.git
```

Push your local repository to GitHub:

```bash
git branch -M main
git push -u origin main
```

## Alternative if you encounter issues

If you get authentication errors, you might need to use a personal access token.
Go to GitHub Settings > Developer settings > Personal access tokens.
Create a token and use it as your password when prompted.

## Once pushed successfully, your repository will be at

<https://github.com/YOUR_USERNAME/vh-banquets>

## Quick verification

```bash
git remote -v  # Should show your GitHub repository URL
```
