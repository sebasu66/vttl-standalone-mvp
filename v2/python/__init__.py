"""
VTTL v2.0 Python API

A clean, SOLID-compliant Python API for controlling virtual tabletop scenes.

Key Features:
- JSON-first architecture
- Modular class design (each <500 lines)
- AI integration ready
- Efficient diff-based updates
- Automatic screenshot capture

Usage:
    from main_controller import SceneController
    
    async with SceneController() as scene:
        await scene.create_cube("test_cube", position=[0, 0.5, 0])
        await scene.sync()
"""

__version__ = "2.0.0"
__author__ = "VTTL Team"

# Core exports
from .main_controller import SceneController

__all__ = ["SceneController"]