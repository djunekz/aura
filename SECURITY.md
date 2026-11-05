# Security policy

## Supported versions

Security fixes are released for the latest published version of `aura-terminal`. Please upgrade before reporting an issue.

## Reporting a vulnerability

Do not open a public issue for security problems.

Use GitHub private vulnerability reporting: open the [Security tab](https://github.com/djunekz/aura/security/advisories/new) of the repository and choose **Report a vulnerability**. Include:

- the affected version (`aura --version`) and platform
- a description of the impact
- steps or a proof of concept to reproduce it

You can expect an acknowledgement within a few days. Fixes are released as soon as they are verified, and the report is credited unless you prefer otherwise.

## Scope and trust model

In scope:

- command, argument or path injection in the AURA shell
- unsafe handling of files in `AURA_HOME` or the working folder
- vulnerabilities in the plugin installer, such as path traversal or bypassing the `https` and size restrictions
- malicious or vulnerable plugins listed in the official marketplace

Out of scope:

- code that a plugin you chose to install executes. Plugins are not sandboxed and run with the permissions of the user. Review plugin source before installing it
- the `run` command executing what you type. It deliberately runs commands through your shell
- issues that require an attacker to already control your account or your `AURA_HOME` directory
