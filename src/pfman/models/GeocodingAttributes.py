from typing import List, Literal


GEOCODING_ATTRIBUTE = Literal[
    "id",
    "name",
    "unit",
    "house_number",
    "street",
    "address_line",
    "neighborhood",
    "city",
    "county",
    "state",
    "state_code",
    "country",
    "country_code",
    "postal_code",
    "formatted_address",
    "latitude",
    "longitude",
]

COUNTRY_ATTRIBUTES: List[GEOCODING_ATTRIBUTE] = [
    "country",
    "country_code",
]

STATE_ATTRIBUTES: List[GEOCODING_ATTRIBUTE] = [
    "state",
    "state_code",
    *COUNTRY_ATTRIBUTES,
]

COUNTY_ATTRIBUTES: List[GEOCODING_ATTRIBUTE] = [
    "county",
    *STATE_ATTRIBUTES,
]

CITY_ATTRIBUTES: List[GEOCODING_ATTRIBUTE] = [
    "city",
    *COUNTY_ATTRIBUTES,
]

NEIGHBORHOOD_ATTRIBUTES: List[GEOCODING_ATTRIBUTE] = [
    "neighborhood",
    *CITY_ATTRIBUTES,
]

STREET_ATTRIBUTES: List[GEOCODING_ATTRIBUTE] = [
    "street",
    *NEIGHBORHOOD_ATTRIBUTES,
]

PROPERTY_ATTRIBUTES: List[GEOCODING_ATTRIBUTE] = [
    "name",
    "house_number",
    "street",
    "address_line",
    "postal_code",
    "formatted_address",
    "latitude",
    "longitude",
    *STREET_ATTRIBUTES,
]

UNIT_ATTRIBUTES: List[GEOCODING_ATTRIBUTE] = [
    "unit",
    *PROPERTY_ATTRIBUTES,
]
