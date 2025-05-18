import re

PUNCTUATION_PATTERN = re.compile(r"[,;:\-\\'\".]")


def replace_punctuation(name: str) -> str:
    return PUNCTUATION_PATTERN.sub("", name)


def replace_whitespace(name: str) -> str:
    return re.sub(r"\s+", " ", name)


STREET_PATTERNS = {
    re.compile(r"\bALY\b"): "ALLEY",
    re.compile(r"\bANX\b"): "ANNEX",
    re.compile(r"\bARC\b"): "ARCADE",
    re.compile(r"\bAVE\b"): "AVENUE",
    re.compile(r"\bBCH\b"): "BEACH",
    re.compile(r"\bBLVD\b"): "BOULEVARD",
    re.compile(r"\bBND\b"): "BEND",
    re.compile(r"\bBYP\b"): "BYPASS",
    re.compile(r"\bCIR\b"): "CIRCLE",
    re.compile(r"\bCL\b"): "CLOSE",
    re.compile(r"\bCLB\b"): "CLUB",
    re.compile(r"\bCLS\b"): "CLOSE",
    re.compile(r"\bCMN\b"): "COMMON",
    re.compile(r"\bCNY\b"): "CANYON",
    re.compile(r"\bCOR\b"): "CORNER",
    re.compile(r"\bCR\b"): "CREEK",
    re.compile(r"\bCRES\b"): "CRESCENT",
    re.compile(r"\bCRK\b"): "CREEK",
    re.compile(r"\bCRS\b"): "CROSSING",
    re.compile(r"\bCRT\b"): "COURT",
    re.compile(r"\bCT\b"): "COURT",
    re.compile(r"\bCTR\b"): "CENTER",
    re.compile(r"\bCTY\b"): "COUNTY",
    re.compile(r"\bCV\b"): "COVE",
    re.compile(r"\bDIV\b"): "DIVERSION",
    re.compile(r"\bDL\b"): "DALE",
    re.compile(r"\bDR\b"): "DRIVE",
    re.compile(r"\bDRV\b"): "DRIVE",
    re.compile(r"\bE\b"): "EAST",
    re.compile(r"\bEST\b"): "ESTATE",
    re.compile(r"\bEXPY\b"): "EXPRESSWAY",
    re.compile(r"\bEXT\b"): "EXTENSION",
    re.compile(r"\bFD\b"): "FORD",
    re.compile(r"\bFQ\b"): "FIRE QUARTER",
    re.compile(r"\bFRD\b"): "FORD",
    re.compile(r"\bFRNT\b"): "FRONT",
    re.compile(r"\bFRST\b"): "FOREST",
    re.compile(r"\bFT\b"): "FORT",
    re.compile(r"\bGDNS\b"): "GARDENS",
    re.compile(r"\bGRN\b"): "GREEN",
    re.compile(r"\bHBR\b"): "HARBOR",
    re.compile(r"\bHL\b"): "HILL",
    re.compile(r"\bHLS\b"): "HILLS",
    re.compile(r"\bHTS\b"): "HEIGHTS",
    re.compile(r"\bHVN\b"): "HAVEN",
    re.compile(r"\bHWY\b"): "HIGHWAY",
    re.compile(r"\bISL\b"): "ISLAND",
    re.compile(r"\bJCT\b"): "JUNCTION",
    re.compile(r"\bJNCTN\b"): "JUNCTION",
    re.compile(r"\bLN\b"): "LANE",
    re.compile(r"\bLNDG\b"): "LANDING",
    re.compile(r"\bLNDNG\b"): "LANDING",
    re.compile(r"\bMDW\b"): "MEADOW",
    re.compile(r"\bMEWS\b"): "MEWS",
    re.compile(r"\bML\b"): "MALL",
    re.compile(r"\bMNR\b"): "MINOR",
    re.compile(r"\bMNT\b"): "MOUNT",
    re.compile(r"\bMT\b"): "MOUNT",
    re.compile(r"\bMTN\b"): "MOUNTAIN",
    re.compile(r"\bN\b"): "NORTH",
    re.compile(r"\bNE\b"): "NORTHEAST",
    re.compile(r"\bNW\b"): "NORTHWEST",
    re.compile(r"\bPARK\b"): "PARK",
    re.compile(r"\bPK\b"): "PARK",
    re.compile(r"\bPKWY\b"): "PARKWAY",
    re.compile(r"\bPL\b"): "PLACE",
    re.compile(r"\bPLZ\b"): "PLAZA",
    re.compile(r"\bPO\b"): "POCKET",
    re.compile(r"\bPR\b"): "PARK",
    re.compile(r"\bPRK\b"): "PARK",
    re.compile(r"\bPRKWAY\b"): "PARKWAY",
    re.compile(r"\bPRKWY\b"): "PARKWAY",
    re.compile(r"\bPROM\b"): "PROMENADE",
    re.compile(r"\bPT\b"): "POINT",
    re.compile(r"\bRD\b"): "ROAD",
    re.compile(r"\bRDS\b"): "ROADS",
    re.compile(r"\bRNCH\b"): "RANCH",
    re.compile(r"\bRTE\b"): "ROUTE",
    re.compile(r"\bS\b"): "SOUTH",
    re.compile(r"\bSE\b"): "SOUTHEAST",
    re.compile(r"\bSHR\b"): "SHORE",
    re.compile(r"\bSQ\b"): "SQUARE",
    re.compile(r"\bSQR\b"): "SQUARE",
    re.compile(r"\bST\b"): "STREET",
    re.compile(r"\bSTN\b"): "STATION",
    re.compile(r"\bSTR\b"): "STREET",
    re.compile(r"\bSW\b"): "SOUTHWEST",
    re.compile(r"\bTER\b"): "TERRACE",
    re.compile(r"\bTNL\b"): "TUNNEL",
    re.compile(r"\bTPK\b"): "TURNPIKE",
    re.compile(r"\bTPKE\b"): "TURNPIKE",
    re.compile(r"\bTRL\b"): "TRAIL",
    re.compile(r"\bTUNL\b"): "TUNNEL",
    re.compile(r"\bVLY\b"): "VALLEY",
    re.compile(r"\bW\b"): "WEST",
    re.compile(r"\bWD\b"): "WOOD",
    re.compile(r"\bWDS\b"): "WOODS",
    re.compile(r"\bWLK\b"): "WALK",
    re.compile(r"\bWY\b"): "WAY",
}


def normalize(name: str) -> str:
    return replace_punctuation(name).upper().strip()


def normalize_street_name(name: str) -> str:
    normalized = normalize(name)
    for pattern, replacement in STREET_PATTERNS.items():
        normalized = pattern.sub(replacement, normalized)
    return normalized.strip()


NEIGHBORHOOD_PATTERNS = {
    re.compile(r"^DOWNTOWN .*"): "DOWNTOWN",
    re.compile(r"^MIDTOWN .*"): "MIDTOWN",
    re.compile(r"^UPTOWN .*"): "UPTOWN",
    re.compile(r"^CENTRAL .*"): "CENTRAL",
    re.compile(r"CBD"): "CENTRAL",
    re.compile(r"BUSINESS DISTRICT"): "CENTRAL",
    re.compile(r"CENTRAL BUSINESS DISTRICT"): "CENTRAL",
    re.compile(r"FINANCIAL DISTRICT"): "FINANCIAL DISTRICT",
    re.compile(r"THE FINANCIAL DISTRICT"): "FINANCIAL DISTRICT",
}


def normalize_neighborhood_name(name: str) -> str:
    normalized = normalize(name)
    for pattern, replacement in NEIGHBORHOOD_PATTERNS.items():
        normalized = pattern.sub(replacement, normalized)
    return normalized.strip()


BOROUGH_PATTERNS = {
    re.compile(r"^(THE )?.*?BOROUGH OF "): "",
    re.compile(r", (THE )?.*BOROUGH OF$"): "",
    re.compile(r"\bBORO\b"): "BOROUGH",
    re.compile(r"\bBRO\b"): "BOROUGH",
}


def normalize_borough_name(name: str) -> str:
    normalized = normalize(name)
    for pattern, replacement in BOROUGH_PATTERNS.items():
        normalized = pattern.sub(replacement, normalized)
    return normalized.strip()


CITY_PATTERNS = {
    re.compile(r"^(THE )?(CITY|TOWN|VILLAGE|MUNICIPALITY|DISTRICT) OF "): "",
    re.compile(r", (THE )?(CITY|TOWN|VILLAGE|MUNICIPALITY|DISTRICT) OF$"): "",
    re.compile(r"\bCITY$"): "",
    re.compile(r"\bST\b"): "SAINT",
    re.compile(r"\bMT\b"): "MOUNT",
    re.compile(r"\bFT\b"): "FORT",
}


def normalize_city_name(name: str) -> str:
    normalized = normalize(name)
    for pattern, replacement in CITY_PATTERNS.items():
        normalized = pattern.sub(replacement, normalized)

    return normalized.strip()


COUNTY_PATTERNS = {
    re.compile(r"^(THE )?(COUNTY OF )"): "",
    re.compile(r", (THE )?(COUNTY OF )$"): "",
    re.compile(r"\bCOUNTY\b"): "",
    re.compile(r"\bCO\b"): "",
    re.compile(r"\bCTY\b"): "",
}


def normalize_county_name(name: str) -> str:
    normalized = normalize(name)
    for pattern, replacement in COUNTY_PATTERNS.items():
        normalized = pattern.sub(replacement, normalized)
    return normalized.strip()


STATE_PATTERNS = {
    re.compile(r"^(THE )?(STATE|COMMONWEALTH) OF"): "",
    re.compile(r", (THE )?(STATE|COMMONWEALTH) OF$"): "",
    re.compile(r"\bSTATE\b"): "",
    re.compile(r"\bST\b"): "",
}


def normalize_state_name(name: str) -> str:
    normalized = normalize(name)
    for pattern, replacement in STATE_PATTERNS.items():
        normalized = pattern.sub(replacement, normalized)
    return normalized.strip()


def normalize_postal_code(name: str) -> str:
    normalized = normalize(replace_whitespace(name))
    return normalized.strip()
