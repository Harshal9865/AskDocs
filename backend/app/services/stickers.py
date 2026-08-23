"""Default avatar stickers available to all users."""

STICKER_IDS = [
    "male-1", "male-2", "male-3", "male-4",
    "female-1", "female-2", "female-3", "female-4",
    "cute-1", "cute-2", "cute-3", "cute-4",
]

VALID_KINDS = {"initials", "sticker", "upload"}


def is_valid_sticker(sticker_id: str) -> bool:
    return sticker_id in STICKER_IDS
