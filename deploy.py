#!/usr/bin/env python3
"""Deprecated compatibility wrapper; use scripts/deploy_dist.py for all deployments."""

from __future__ import annotations

import os
import sys
from pathlib import Path


if __name__ == "__main__":
    script = Path(__file__).resolve().parent / "scripts" / "deploy_dist.py"
    print("deploy.py is deprecated; forwarding to scripts/deploy_dist.py.")
    os.execv(sys.executable, [sys.executable, str(script), *sys.argv[1:]])
