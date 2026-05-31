"""
Asset Processing Script for Top-Down Shooter
==============================================
Downloads from OpenGameArt (CC0/CC-BY) and organizes into Cocos Creator project.

Sources:
  1. Topdown Shooter (CC0) - https://opengameart.org/content/topdown-shooter
  2. Sci-Fi Facility Asset Pack (CC0) - https://opengameart.org/content/sci-fi-facility-asset-pack
  3. Pixel Art Wasteland (CC0) - https://opengameart.org/content/pixel-art-wasteland
  4. Characters, Zombies, Weapons (CC0) - https://opengameart.org/content/characters-zombies-and-weapons-oh-my
  5. Animated Top Down Survivor (CC-BY 3.0) - https://opengameart.org/content/animated-top-down-survivor-player
  6. Animated Top Down Zombie (CC0) - https://opengameart.org/content/animated-top-down-zombie
  7. Space Ship Shooter (CC0) - https://opengameart.org/content/space-ship-shooter-pixel-art-assets
"""

import os
import shutil
from PIL import Image

# ── Paths ──────────────────────────────────────────────────────────
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(BASE, "raw_assets")
OUT = os.path.join(BASE, "assets", "textures")

# Output categories
TILES_DIR = os.path.join(OUT, "tiles")
CHAR_DIR = os.path.join(OUT, "characters")
WEAP_DIR = os.path.join(OUT, "weapons_and_items")
FX_DIR = os.path.join(OUT, "fx")

for d in [TILES_DIR, CHAR_DIR, WEAP_DIR, FX_DIR]:
    os.makedirs(d, exist_ok=True)


def split_spritesheet(path, sprite_w, sprite_h, out_dir, prefix="spr"):
    """Split a spritesheet into individual sprites and return count."""
    if not os.path.exists(path):
        print(f"  SKIP (not found): {path}")
        return 0
    img = Image.open(path)
    w, h = img.size
    cols = w // sprite_w
    rows = h // sprite_h
    count = 0
    for r in range(rows):
        for c in range(cols):
            box = (c * sprite_w, r * sprite_h, (c + 1) * sprite_w, (r + 1) * sprite_h)
            sprite = img.crop(box)
            # Skip fully transparent sprites
            if sprite.getextrema()[3][1] == 0:
                continue
            fname = f"{prefix}_{count:04d}.png"
            sprite.save(os.path.join(out_dir, fname))
            count += 1
    print(f"  Split {os.path.basename(path)} ({w}x{h}) -> {count} sprites ({sprite_w}x{sprite_h})")
    return count


def copy_individual(src_dir, out_dir, prefix="spr"):
    """Copy individual PNG files, renaming with prefix."""
    if not os.path.isdir(src_dir):
        return 0
    count = 0
    for f in sorted(os.listdir(src_dir)):
        if f.lower().endswith(".png"):
            src = os.path.join(src_dir, f)
            dst = os.path.join(out_dir, f"{prefix}_{count:04d}.png")
            shutil.copy2(src, dst)
            count += 1
    print(f"  Copied {count} files from {os.path.basename(src_dir)}")
    return count


def copy_file(src, dst):
    """Copy a single file."""
    if os.path.exists(src):
        shutil.copy2(src, dst)
        return True
    return False


# ══════════════════════════════════════════════════════════════════
# 1. TILES - Map tiles from multiple sources
# ══════════════════════════════════════════════════════════════════
print("\n=== Processing TILES ===")

# 1a. Topdown-shooter tilesheet (48x48 tiles) -> split into individual
tilesheet = os.path.join(RAW, "topdown-shooter", "Tilesheet", "tilesheet_complete.png")
split_spritesheet(tilesheet, 48, 48, TILES_DIR, "tds_tile")

# 1b. Wasteland tileset (16x16 tiles) -> split
wasteland_ts = os.path.join(RAW, "wasteland", "Assets", "tileset.png")
split_spritesheet(wasteland_ts, 16, 16, TILES_DIR, "waste_tile")

# 1c. Wasteland tileset8sorted (16x16 tiles) -> split
wasteland_ts8 = os.path.join(RAW, "wasteland", "Assets", "tileset8sorted.png")
split_spritesheet(wasteland_ts8, 16, 16, TILES_DIR, "waste8_tile")

# 1d. Wasteland individual wall/floor tiles -> copy
waste_tiles = os.path.join(RAW, "wasteland", "Tilesets")
if os.path.isdir(waste_tiles):
    copy_individual(waste_tiles, TILES_DIR, "waste_raw")

# 1e. Sci-fi facility tileset (16x16 tiles) -> split
scifi_ts = os.path.join(RAW, "sci-fi-facility", "sci-fi-facility-asset-pack", "tileset.png")
split_spritesheet(scifi_ts, 16, 16, TILES_DIR, "scifi_tile")

# 1f. Sci-fi crates (16x16 tiles) -> split -> tiles (crates are cover objects)
scifi_crates = os.path.join(RAW, "sci-fi-facility", "sci-fi-facility-asset-pack", "crates_spritesheet.png")
split_spritesheet(scifi_crates, 16, 16, TILES_DIR, "scifi_crate")

# 1g. Sci-fi buttons/doodads -> tiles (environmental objects)
for spr_name, prefix in [
    ("button_large_spritesheet.png", "scifi_btn_lg"),
    ("button_medium_spritesheet.png", "scifi_btn_md"),
    ("button_small_spritesheet.png", "scifi_btn_sm"),
    ("doodads_spritesheet.png", "scifi_doodad"),
    ("computer_spritesheet.png", "scifi_computer"),
    ("keyboard_indicators_spritesheet.png", "scifi_keyboard"),
    ("noisemaker_large_spritesheet.png", "scifi_noise_lg"),
    ("noisemaker_small_spritesheet.png", "scifi_noise_sm"),
    ("portal_spritesheet.png", "scifi_portal"),
]:
    p = os.path.join(RAW, "sci-fi-facility", "sci-fi-facility-asset-pack", spr_name)
    # Detect sprite size: most are 16x16, buttons vary
    if "button_large" in spr_name:
        split_spritesheet(p, 48, 16, TILES_DIR, prefix)
    elif "button_medium" in spr_name:
        split_spritesheet(p, 32, 16, TILES_DIR, prefix)
    elif "button_small" in spr_name:
        split_spritesheet(p, 16, 16, TILES_DIR, prefix)
    elif "computer" in spr_name:
        split_spritesheet(p, 32, 32, TILES_DIR, prefix)
    else:
        split_spritesheet(p, 16, 16, TILES_DIR, prefix)

# ══════════════════════════════════════════════════════════════════
# 2. CHARACTERS - Player and enemy sprites
# ══════════════════════════════════════════════════════════════════
print("\n=== Processing CHARACTERS ===")

# 2a. Topdown-shooter characters spritesheet (64x64 per frame)
tds_chars = os.path.join(RAW, "topdown-shooter", "Spritesheet", "spritesheet_characters.png")
split_spritesheet(tds_chars, 64, 64, CHAR_DIR, "tds_char")

# 2b. Topdown-shooter individual character PNGs (already cut, ~49x43)
char_subdirs = {
    "Hitman 1": "hitman",
    "Man Blue": "man_blue",
    "Man Brown": "man_brown",
    "Man Old": "man_old",
    "Robot 1": "robot",
    "Soldier 1": "soldier",
    "Survivor 1": "survivor",
    "Woman Green": "woman_green",
    "Zombie 1": "zombie_tds",
}
for dirname, prefix in char_subdirs.items():
    d = os.path.join(RAW, "topdown-shooter", "PNG", dirname)
    copy_individual(d, CHAR_DIR, prefix)

# 2c. Survivor animations (already cut individual PNGs)
survivor_dir = os.path.join(RAW, "survivor", "Top_Down_Survivor")
if os.path.isdir(survivor_dir):
    count = 0
    for weapon_type in os.listdir(survivor_dir):
        weapon_path = os.path.join(survivor_dir, weapon_type)
        if os.path.isdir(weapon_path):
            for action in os.listdir(weapon_path):
                action_path = os.path.join(weapon_path, action)
                if os.path.isdir(action_path):
                    for f in sorted(os.listdir(action_path)):
                        if f.lower().endswith(".png"):
                            src = os.path.join(action_path, f)
                            dst = os.path.join(CHAR_DIR, f"surv_{weapon_type}_{action}_{count:04d}.png")
                            shutil.copy2(src, dst)
                            count += 1
    print(f"  Copied {count} survivor animation frames")

# 2d. Zombie/skeleton animations (already cut)
zombie_dir = os.path.join(RAW, "zombie", "export")
copy_individual(zombie_dir, CHAR_DIR, "skeleton")

# 2e. Sci-fi facility characters -> split spritesheets
scifi_chars = {
    "guard_orange_spritesheet.png": ("guard_orange", 16, 16),
    "guard_white_spritesheet.png": ("guard_white", 16, 16),
    "guard_yellow_spritesheet.png": ("guard_yellow", 16, 16),
    "inmate_1_spritesheet.png": ("inmate_1", 16, 16),
    "inmate_2_spritesheet.png": ("inmate_2", 16, 16),
    "inmate_3_spritesheet.png": ("inmate_3", 16, 16),
    "inspector_spritesheet.png": ("inspector", 16, 16),
    "the_kid_spritesheet.png": ("the_kid", 16, 16),
}
for spr_name, (prefix, sw, sh) in scifi_chars.items():
    p = os.path.join(RAW, "sci-fi-facility", "sci-fi-facility-asset-pack", spr_name)
    split_spritesheet(p, sw, sh, CHAR_DIR, f"scifi_{prefix}")

# 2f. Sci-fi guard notice icon
guard_notice = os.path.join(RAW, "sci-fi-facility", "sci-fi-facility-asset-pack", "guard_notice.png")
copy_file(guard_notice, os.path.join(CHAR_DIR, "scifi_guard_notice.png"))

# ══════════════════════════════════════════════════════════════════
# 3. WEAPONS & ITEMS
# ══════════════════════════════════════════════════════════════════
print("\n=== Processing WEAPONS & ITEMS ===")

# 3a. Space shooter ship sprites (16x16 per frame? actually 80x48 total -> 5 frames of 16x48)
space_ship = os.path.join(RAW, "space-shooter", "space_shooter_pack", "spritesheets", "ship.png")
split_spritesheet(space_ship, 16, 48, WEAP_DIR, "ship")

# 3b. Space shooter power-ups (16x16 per frame)
space_powerup = os.path.join(RAW, "space-shooter", "space_shooter_pack", "spritesheets", "power-up.png")
split_spritesheet(space_powerup, 16, 16, WEAP_DIR, "powerup")

# 3c. Sci-fi blowdart (weapon, 16x16 per frame)
scifi_blowdart = os.path.join(RAW, "sci-fi-facility", "sci-fi-facility-asset-pack", "blowdart_spritesheet.png")
split_spritesheet(scifi_blowdart, 16, 16, WEAP_DIR, "scifi_blowdart")

# 3d. Sci-fi dash bar (item/ability indicator)
scifi_dash = os.path.join(RAW, "sci-fi-facility", "sci-fi-facility-asset-pack", "dash_bar_spritesheet.png")
split_spritesheet(scifi_dash, 16, 16, WEAP_DIR, "scifi_dash")

# 3e. Sci-fi orb (item)
scifi_orb = os.path.join(RAW, "sci-fi-facility", "sci-fi-facility-asset-pack", "orb_spritesheet.png")
split_spritesheet(scifi_orb, 16, 16, WEAP_DIR, "scifi_orb")

# 3f. Mouse/keyboard UI indicators (for item pickup UI)
for spr_name, prefix in [
    ("mouse_button_indicators_spritesheet.png", "scifi_mouse_ui"),
    ("computer_popup_spritesheet.png", "scifi_popup"),
]:
    p = os.path.join(RAW, "sci-fi-facility", "sci-fi-facility-asset-pack", spr_name)
    split_spritesheet(p, 16, 16, WEAP_DIR, prefix)

# 3g. Shadow
shadow = os.path.join(RAW, "sci-fi-facility", "sci-fi-facility-asset-pack", "shadow.png")
copy_file(shadow, os.path.join(WEAP_DIR, "scifi_shadow.png"))

# ══════════════════════════════════════════════════════════════════
# 4. FX (Effects) - Bullets, muzzle flash, particles
# ══════════════════════════════════════════════════════════════════
print("\n=== Processing FX ===")

# 4a. Space shooter laser bolts (16x16 per frame)
space_laser = os.path.join(RAW, "space-shooter", "space_shooter_pack", "spritesheets", "laser-bolts.png")
split_spritesheet(space_laser, 16, 16, FX_DIR, "laser_bolt")

# 4b. Sci-fi smoke icon (16x16)
scifi_smoke = os.path.join(RAW, "sci-fi-facility", "sci-fi-facility-asset-pack", "smoke_icon_spritesheet.png")
split_spritesheet(scifi_smoke, 16, 16, FX_DIR, "smoke")

# 4c. Sci-fi orb particles (16x16 per frame)
scifi_orb_parts = os.path.join(RAW, "sci-fi-facility", "sci-fi-facility-asset-pack", "orb_particles_spritesheet.png")
split_spritesheet(scifi_orb_parts, 16, 16, FX_DIR, "orb_particle")

# 4d. Sci-fi lasers (16x16 per frame)
scifi_lasers = os.path.join(RAW, "sci-fi-facility", "sci-fi-facility-asset-pack", "lasers_spritesheet.png")
split_spritesheet(scifi_lasers, 16, 16, FX_DIR, "laser")

# 4e. Sci-fi giblet variations (blood/hit effects)
scifi_giblets = os.path.join(RAW, "sci-fi-facility", "sci-fi-facility-asset-pack", "giblet_variations.png")
if os.path.exists(scifi_giblets):
    img = Image.open(scifi_giblets)
    # Auto-detect: try 16x16 first
    split_spritesheet(scifi_giblets, 16, 16, FX_DIR, "giblet")

# ══════════════════════════════════════════════════════════════════
# 5. SUMMARY
# ══════════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("ASSET PROCESSING COMPLETE")
print("=" * 60)
for category, path in [("tiles", TILES_DIR), ("characters", CHAR_DIR),
                        ("weapons_and_items", WEAP_DIR), ("fx", FX_DIR)]:
    count = len([f for f in os.listdir(path) if f.endswith(".png")])
    print(f"  {category}: {count} sprites")

total = sum(len([f for f in os.listdir(p) if f.endswith(".png")])
            for p in [TILES_DIR, CHAR_DIR, WEAP_DIR, FX_DIR])
print(f"\n  TOTAL: {total} sprites")

# Check a sample tile size
sample = os.path.join(TILES_DIR, "tds_tile_0000.png")
if os.path.exists(sample):
    img = Image.open(sample)
    print(f"\n  Sample tile size: {img.size[0]}x{img.size[1]} pixels")
    print(f"  (Original Kenney tiles were 16x16)")
