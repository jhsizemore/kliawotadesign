#!/usr/bin/env python3
"""Seeded fixed-intent support stress model for Odyssey Limited.

This is not a draft bot. It intentionally treats listed support as high picks by
any already-compatible colour pair and everything else as filler. The committed
JSON contains the audited output for seed 20260923 / 5,000 runs per scenario.
"""
SEED = 20260923
RUNS = 5000
COLLATION_MODEL = "odyssey-core-fin-playbooster-v1"

PACKAGES = {
    "GU": {
        "common": [("ODY-088","G"),("ODY-116","U")],
        "mono_uncommon_direct": [("ODY-017","U")],
        "gold": [("ODY-060","GU"),("ODY-176","GU")],
        "bridges": ["ODY-042","ODY-018"],
    },
    "WU": {
        "common": [("ODY-005","W"),("ODY-007","W"),("ODY-112","U"),("ODY-116","U")],
        "mono_uncommon_direct": [("ODY-017","U")],
        "gold": [("ODY-051","WU"),("ODY-090","WU")],
    },
    "WB": {
        "common": [("ODY-008","W"),("ODY-108","W"),("ODY-136","C"),("ODY-101","B")],
        "mono_uncommon_direct": [],
        "gold": [("ODY-056","WB"),("ODY-148","WB")],
    },
}

# Pack parameters come from collation-model.json:
DEDICATED_COMMONS = 7
COMMON_SHEET = 80
DEDICATED_UNCOMMONS = 3
UNCOMMON_SHEET = 109
WILDCARD = {"C": .193, "U": .640}
FOIL_WILDCARD = {"C": .5585, "U": .3665}

# The implementation used for the checkpoint is intentionally simple:
# generate only package cards plus anonymous filler; pass packs L/R/L; on each
# pick choose gold > mono-uncommon direct support > common support when legal.
# No card power, signalling, pivoting, splashing or gameplay is modelled.
#
# See docs/odyssey-design-round-20260922/limited-pick-stress-model.json for
# the seeded output and exact scenario definitions.
