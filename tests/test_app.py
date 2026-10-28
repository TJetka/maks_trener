"""Pytest entry points for the dependency-free JavaScript app.

All checks run locally with deterministic seeds. No browser, server or network is
needed; Node's native runner owns the behavioral assertions.
"""

from pathlib import Path
import subprocess


ROOT = Path(__file__).resolve().parents[1]


def run_node(*arguments: str) -> None:
    """Run a bounded local Node check and surface diagnostics on failure."""
    result = subprocess.run(
        ["node", *arguments],
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=120,
        check=False,
    )
    assert result.returncode == 0, result.stdout + result.stderr


def test_engine_and_persistence() -> None:
    run_node("--test", "tests/scoring.test.js", "tests/engine.test.js")


def test_seeded_generators() -> None:
    run_node("--test", "tests/generators.test.js")


def test_difficulty_tiers() -> None:
    run_node("--test", "tests/difficulty.test.js")


def test_static_modules() -> None:
    run_node("scripts/check.js")
