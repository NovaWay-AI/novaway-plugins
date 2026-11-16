---
name: marketplace-smoke
description: Verify that an installed official marketplace Skill is discoverable and consumable.
---

# Marketplace Smoke Skill

This Skill proves that an official GitHub marketplace package reached the real NovaWay Skill consumer.

When invoked, report:

1. The Skill body was loaded from the installed plugin.
2. The plugin ID is `marketplace-smoke`.
3. No code permission is required by this plugin.

Do not access the network or the filesystem for this verification.
