"""
GitHub repository crawler — fetches project data for resume tailoring.

If no token is provided, the public unauthenticated GitHub API is used.
Rate limit: 60 requests/hour (unauthenticated) vs 5,000/hour (with token).
"""

import base64
from github import Github, GithubException, RateLimitExceededException
from github import Auth


def fetch_projects(token: str, username: str) -> list[dict]:
    """
    Fetch all non-forked repositories for a GitHub user.

    Returns a list of dicts with: name, description, languages (top 5),
    stars, topics, readme_snippet (first 800 chars).
    """
    # Use Auth.Token for authenticated access, plain Github() for unauthenticated
    if token:
        g = Github(auth=Auth.Token(token), retry=0)
    else:
        g = Github(retry=0)
    user = g.get_user(username)
    projects = []

    try:
        repos = user.get_repos(type="owner", sort="updated")
        # Evaluate the iterator slightly to trigger any immediate rate limit errors
        repos = list(repos)
    except RateLimitExceededException:
        raise RuntimeError("GitHub API rate limit exceeded. Please add a GitHub token in .env or wait an hour.")

    for repo in repos:
        # Skip forks
        if repo.fork:
            continue

        # Collect top 5 languages by bytes
        try:
            lang_data = repo.get_languages()
            top_languages = list(lang_data.keys())[:5]
        except GithubException:
            top_languages = []

        # Collect topics
        try:
            topics = repo.get_topics()
        except GithubException:
            topics = []

        # Collect README snippet (first 800 chars)
        readme_snippet = ""
        try:
            readme = repo.get_readme()
            content = base64.b64decode(readme.content).decode("utf-8", errors="replace")
            readme_snippet = content[:800]
        except GithubException:
            readme_snippet = ""

        projects.append({
            "name": repo.name,
            "description": repo.description or "",
            "languages": top_languages,
            "stars": repo.stargazers_count,
            "topics": topics,
            "readme_snippet": readme_snippet,
        })

    return projects
