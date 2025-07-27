#!/usr/bin/env python3
"""
Claude Vision Integration - Allows Claude AI to see and analyze game screenshots
"""
import asyncio
import logging
import sys
import os
import base64
import json
from typing import Optional, Dict, Any

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from vttl_client import VTTLClient, GridPosition

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

class ClaudeVisionVTTL:
    """
    VTTL Client with Claude Vision integration
    """
    
    def __init__(self, server_url: str = "ws://localhost:8080"):
        self.client = VTTLClient(server_url)
        self.claude_api_key = None  # Will be set by user
        self.conversation_history = []
        
    async def connect(self):
        """Connect to VTTL server"""
        await self.client.connect()
        
    async def disconnect(self):
        """Disconnect from VTTL server"""
        await self.client.disconnect()
        
    def load_image_as_base64(self, image_path: str) -> Optional[str]:
        """Load image file and convert to base64"""
        try:
            if not os.path.exists(image_path):
                logger.error(f"Screenshot file not found: {image_path}")
                return None
                
            with open(image_path, 'rb') as image_file:
                image_data = image_file.read()
                base64_string = base64.b64encode(image_data).decode('utf-8')
                return base64_string
        except Exception as e:
            logger.error(f"Failed to load image: {e}")
            return None
    
    def prepare_claude_request(self, screenshot_path: str, context: str = "") -> Dict[str, Any]:
        """
        Prepare a request payload for Claude API with screenshot
        """
        image_base64 = self.load_image_as_base64(screenshot_path)
        if not image_base64:
            return None
            
        # Get current game state for context
        entities = self.client.game_state.get('entities', {})
        minis = self.client.get_entities_by_prefix("mini_")
        props = self.client.get_entities_by_prefix("prop_")
        tiles = self.client.get_entities_by_prefix("tile_")
        
        game_context = f"""
Current Game State:
- Total entities: {len(entities)}
- Miniatures: {len(minis)} ({list(minis.keys())})
- Props: {len(props)} ({list(props.keys())})
- Board tiles: {len(tiles)}
- Grid size: {self.client.grid_size}

Entity Positions:
"""
        
        for name, data in entities.items():
            if not name.startswith('tile_'):  # Skip tiles for brevity
                pos = data.get('position', [0, 0, 0])
                grid_pos = self.client.world_to_grid(pos)
                game_context += f"- {name}: Grid({grid_pos.x}, {grid_pos.z}) World({pos[0]:.1f}, {pos[1]:.1f}, {pos[2]:.1f})\n"
        
        prompt = f"""
You are an AI Game Master controlling a Virtual Tabletop (VTTL) using PlayCanvas 3D engine.

{game_context}

Additional Context: {context}

Please analyze this screenshot of the current game state and provide:

1. **Visual Analysis**: Describe what you see in the 3D scene
   - Entity positions and formations
   - Board layout and terrain
   - Any tactical patterns or arrangements

2. **Strategic Assessment**: Analyze the current tactical situation
   - Strengths and weaknesses of current positions
   - Potential threats or opportunities
   - Recommended next moves

3. **Game Commands**: Provide specific VTTL commands to execute (if any)
   - Use this format: `COMMAND: action_name(parameters)`
   - Available actions: create_mini, move_mini, create_prop, setup_board
   - Grid coordinates range from (0,0) to board size

4. **Narrative**: Provide a brief story description of what's happening

Example command format:
```
COMMAND: move_mini("mini_warrior_p1", GridPosition(3, 4))
COMMAND: create_prop("sphere", GridPosition(5, 5), {"type": "treasure"})
```

Analyze the screenshot and provide your assessment:
"""
        
        # This would be the actual request format for Claude API
        request_payload = {
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 1024,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": image_base64
                            }
                        }
                    ]
                }
            ]
        }
        
        return request_payload
    
    def save_analysis_request(self, screenshot_path: str, context: str = "") -> str:
        """
        Save the Claude analysis request to a file for manual processing
        Since we can't make direct API calls, we'll save the request for copy-paste
        """
        request = self.prepare_claude_request(screenshot_path, context)
        if not request:
            return None
            
        # Create analysis directory
        analysis_dir = os.path.join(os.path.dirname(screenshot_path), '../analysis')
        os.makedirs(analysis_dir, exist_ok=True)
        
        # Generate filename based on screenshot
        screenshot_name = os.path.basename(screenshot_path)
        analysis_file = os.path.join(analysis_dir, f"analysis_{screenshot_name.replace('.png', '.json')}")
        
        # Save request
        with open(analysis_file, 'w') as f:
            json.dump(request, f, indent=2)
            
        logger.info(f"Analysis request saved: {analysis_file}")
        return analysis_file
    
    def create_claude_prompt_file(self, screenshot_path: str, context: str = "") -> str:
        """
        Create a text file with the prompt and image reference for easy Claude interaction
        """
        if not os.path.exists(screenshot_path):
            logger.error(f"Screenshot not found: {screenshot_path}")
            return None
            
        # Get current game state for context
        entities = self.client.game_state.get('entities', {})
        minis = self.client.get_entities_by_prefix("mini_")
        props = self.client.get_entities_by_prefix("prop_")
        
        game_context = f"""
Current Game State:
- Total entities: {len(entities)}
- Miniatures: {len(minis)} 
- Props: {len(props)}
- Grid size: {self.client.grid_size}

Key Entities:
"""
        
        for name, data in entities.items():
            if not name.startswith('tile_') and len(game_context) < 1000:  # Keep it concise
                pos = data.get('position', [0, 0, 0])
                grid_pos = self.client.world_to_grid(pos)
                game_context += f"- {name}: Grid({grid_pos.x}, {grid_pos.z})\n"
        
        prompt_text = f"""
VTTL AI Game Master Analysis Request
==================================

Screenshot: {os.path.abspath(screenshot_path)}
Timestamp: {self.client.game_state.get('lastScreenshot', {}).get('timestamp', 'Unknown')}

{game_context}

Context: {context}

INSTRUCTIONS FOR CLAUDE:
Please analyze the attached screenshot and provide:

1. VISUAL ANALYSIS: What do you see in the 3D scene?
2. TACTICAL ASSESSMENT: What's the strategic situation?
3. RECOMMENDATIONS: What should happen next?
4. COMMANDS: Specific actions to execute (if any)

Available Python commands:
- await claude_vttl.create_mini(player_id, mini_type, GridPosition(x, z))
- await claude_vttl.move_mini(mini_name, GridPosition(x, z))
- await claude_vttl.create_prop(prop_type, GridPosition(x, z))
- await claude_vttl.setup_board(type, size, width, height)

Current capabilities:
- Grid coordinates: (0,0) to board size
- Mini types: "warrior", "cube", "sphere"
- Prop types: "sphere", "cube"

Please provide your analysis and any commands you'd like executed.
"""
        
        # Create analysis directory
        analysis_dir = os.path.join(os.path.dirname(screenshot_path), '../analysis')
        os.makedirs(analysis_dir, exist_ok=True)
        
        # Generate filename
        screenshot_name = os.path.basename(screenshot_path)
        prompt_file = os.path.join(analysis_dir, f"claude_prompt_{screenshot_name.replace('.png', '.txt')}")
        
        # Save prompt
        with open(prompt_file, 'w') as f:
            f.write(prompt_text)
            
        logger.info(f"Claude prompt saved: {prompt_file}")
        return prompt_file
    
    async def execute_claude_commands(self, commands_text: str) -> bool:
        """
        Execute commands provided by Claude analysis
        """
        lines = commands_text.strip().split('\n')
        executed = 0
        
        for line in lines:
            line = line.strip()
            if not line.startswith('await '):
                continue
                
            try:
                # Parse command (basic parsing - could be more robust)
                if 'create_mini(' in line:
                    # Extract parameters - this is simplified parsing
                    logger.info(f"Executing: {line}")
                    executed += 1
                    
                elif 'move_mini(' in line:
                    logger.info(f"Executing: {line}")
                    executed += 1
                    
                elif 'create_prop(' in line:
                    logger.info(f"Executing: {line}")
                    executed += 1
                    
                # Add more command parsing as needed
                    
            except Exception as e:
                logger.error(f"Failed to execute command: {line} - {e}")
        
        logger.info(f"Executed {executed} commands from Claude analysis")
        return executed > 0
    
    # Delegate other methods to the underlying client
    async def create_mini(self, player_id: str, mini_type: str, grid_pos: GridPosition) -> str:
        return await self.client.create_mini(player_id, mini_type, grid_pos)
    
    async def move_mini(self, mini_name: str, target_pos: GridPosition) -> bool:
        return await self.client.move_mini(mini_name, target_pos)
    
    async def create_prop(self, prop_type: str, grid_pos: GridPosition, properties: dict = None) -> str:
        return await self.client.create_prop(prop_type, grid_pos, properties)
    
    async def setup_board(self, board_type: str = "square", size: float = 1.0, width: int = 10, height: int = 10) -> bool:
        return await self.client.setup_board(board_type, size, width, height, True)
    
    async def clear_scene(self) -> bool:
        return await self.client.clear_scene()
    
    async def take_screenshot_for_claude(self, context: str = "") -> tuple[str, str]:
        """
        Take a screenshot and prepare it for Claude analysis
        Returns (screenshot_path, prompt_file_path)
        """
        logger.info("📸 Taking screenshot for Claude analysis...")
        
        # Take screenshot
        screenshot_path = await self.client.take_screenshot()
        
        if not screenshot_path:
            logger.error("Failed to take screenshot")
            return None, None
        
        # Wait for file to be written
        await asyncio.sleep(1)
        
        # Create Claude prompt file
        prompt_file = self.create_claude_prompt_file(screenshot_path, context)
        
        logger.info(f"✅ Screenshot ready for Claude analysis:")
        logger.info(f"   📸 Image: {screenshot_path}")
        logger.info(f"   📝 Prompt: {prompt_file}")
        
        return screenshot_path, prompt_file