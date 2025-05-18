import re
from typing import Optional, Self
from pfman.utils.string import is_int
from .GeocodingAttributes import GEOCODING_ATTRIBUTE
from pfman.utils.geocoding import (
    normalize,
    normalize_city_name,
    normalize_county_name,
    normalize_postal_code,
    normalize_state_name,
    normalize_street_name,
)
from pfman.utils.geo import get_country, get_state, Country, Subdivision
import h3
from pydantic import BaseModel, Field, computed_field, field_validator, model_validator

HOUSE_NUMBER_PATTERN = r"^\d+[-\w]*?$"
ADDRESS_LINE_PATTERN = r"^(\d+[-\w]*?)\s+(.*)$"


class Address(BaseModel):
    id: Optional[str] = Field(
        default=None, description="The unique identifier for the address"
    )
    name: Optional[str] = Field(default=None, description="Name of the address")
    unit: Optional[str] = Field(default=None, description="Unit number of the address")
    house_number: Optional[str | int] = Field(
        default=None, description="House number of the address"
    )
    street: Optional[str] = Field(
        default=None, description="Street name of the address"
    )
    address_line: Optional[str] = Field(
        default=None,
        description="Address line of the address including street name and number",
    )
    neighborhood: Optional[str] = Field(
        default=None, description="Neighborhood of the address"
    )
    city: Optional[str] = Field(default=None, description="City of the address")
    county: Optional[str] = Field(default=None, description="County of the address")
    state: Optional[str] = Field(default=None, description="State of the address")
    state_code: Optional[str] = Field(
        default=None, description="State code of the address"
    )
    country: Optional[str] = Field(default=None, description="Country of the address")
    country_code: Optional[str] = Field(
        default=None, description="Country code of the address"
    )
    postal_code: Optional[str] = Field(
        default=None, description="Postal code of the address"
    )

    formatted_address: Optional[str] = Field(
        default=None, description="Formatted address of the address"
    )

    latitude: Optional[str | float] = Field(
        default=None, description="Latitude of the address"
    )
    longitude: Optional[str | float] = Field(
        default=None, description="Longitude of the address"
    )

    @computed_field
    def normalized_name(self) -> Optional[str]:
        return normalize(self.name) if self.name else None

    @computed_field
    def normalized_house_number(self) -> Optional[str]:
        if self.house_number is None:
            return None
        if isinstance(self.house_number, int):
            return str(self.house_number)
        if isinstance(self.house_number, str):
            return normalize(self.house_number)

        return None

    @computed_field
    def normalized_street(self) -> Optional[str]:
        return normalize_street_name(self.street) if self.street else None

    @computed_field
    def normalized_neighborhood(self) -> Optional[str]:
        return normalize(self.neighborhood) if self.neighborhood else None

    @computed_field
    def normalized_city(self) -> Optional[str]:
        return normalize_city_name(self.city) if self.city else None

    @computed_field
    def normalized_county(self) -> Optional[str]:
        return normalize_county_name(self.county) if self.county else None

    @computed_field
    def normalized_state(self) -> Optional[str]:
        return normalize_state_name(self.state) if self.state else None

    @computed_field
    def normalized_state_code(self) -> Optional[str]:
        return normalize(self.state_code) if self.state_code else None

    @computed_field
    def normalized_country(self) -> Optional[str]:
        return normalize(self.country) if self.country else None

    @computed_field
    def normalized_country_code(self) -> Optional[str]:
        return normalize(self.country_code) if self.country_code else None

    @computed_field
    def normalized_postal_code(self) -> Optional[str]:
        return normalize_postal_code(self.postal_code) if self.postal_code else None

    @computed_field
    def h3_cell(self) -> Optional[str]:
        """Returns the H3 cell ID for the address"""
        if not self.latitude or not self.longitude:
            return None

        return h3.latlng_to_cell(self.latitude, self.longitude, 15)

    @field_validator("house_number", mode="before")
    def validate_house_number(cls, v) -> Optional[str | int]:
        if v is None:
            return None

        if isinstance(v, int):
            return v
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return None
            elif is_int(v):
                return int(v)
            elif re.match(HOUSE_NUMBER_PATTERN, v):
                return v

            raise ValueError("House number must be a valid number")
        else:
            raise ValueError("House number must be a string or an integer")

    @field_validator("latitude", mode="before")
    def validate_latitude(cls, v) -> Optional[float]:
        if v is None:
            return None

        if isinstance(v, float):
            vfloat = v
        elif isinstance(v, str):
            if not v.strip():
                return None
            try:
                vfloat = float(v.strip())
            except ValueError:
                raise ValueError("Latitude must be a number")
        else:
            raise ValueError("Latitude must be a number")

        if not (-90 <= vfloat <= 90):
            raise ValueError("Latitude must be between -90 and 90")

        return vfloat

    @field_validator("longitude", mode="before")
    def validate_longitude(cls, v) -> Optional[float]:
        if v is None:
            return None

        if isinstance(v, float):
            vfloat = v
        elif isinstance(v, str):
            if not v.strip():
                return None
            try:
                vfloat = float(v.strip())
            except ValueError:
                raise ValueError("Longitude must be a number")
        else:
            raise ValueError("Longitude must be a number")

        if not (-180 <= vfloat <= 180):
            raise ValueError("Longitude must be between -180 and 180")

        return vfloat

    @model_validator(mode="after")
    def validate_address_model(self) -> Self:
        if self.address_line:
            match = re.match(ADDRESS_LINE_PATTERN, self.address_line.strip())
            if match:
                self.house_number = self.house_number or match.group(1)
                self.street = self.street or match.group(2)

        country: Optional[Country] = None

        if self.country_code and not country:
            country = get_country(q=self.country_code)
            if country:
                self.country = country.official_name or country.name
                self.country_code = country.alpha_2

        if self.country and not country:
            country = get_country(q=self.country)
            if country:
                self.country = country.official_name or country.name
                self.country_code = country.alpha_2

        state: Optional[Subdivision] = None

        if self.state_code and not state:
            state = get_state(
                q=self.state_code, country_code=country.alpha_2 if country else None
            )
            if state:
                self.state = state.name
                self.state_code = state.state_code  # type: ignore

        if self.state and not state:
            state = get_state(
                q=self.state, country_code=country.alpha_2 if country else None
            )
            if state:
                self.state = state.name
                self.state_code = state.state_code  # type: ignore

        return self

    def is_valid_property_address(self) -> bool:
        if self.latitude and self.longitude:
            return True

        if self.formatted_address:
            return True

        if self.address_line and self.country:
            return True

        if (self.name or self.house_number) and self.street and self.country:
            return True

        return False

    def pick_subset(self, attributes: list[GEOCODING_ATTRIBUTE]) -> "Address":
        """Returns a subset of the address object with only the specified attributes"""
        return Address(
            **{
                attr: getattr(self, attr)
                for attr in attributes
                if hasattr(self, attr) and getattr(self, attr) is not None
            }
        )
