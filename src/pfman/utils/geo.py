from typing import Optional
from pfman.utils.string import is_int
from loguru import logger
from pycountry import countries, subdivisions
from pydantic import BaseModel, Field, computed_field, field_validator


class Country(BaseModel):
    name: str = Field(..., description="The common use name of the country.")
    official_name: Optional[str] = Field(
        default=None, description="The official name of the country."
    )
    alpha_2: str = Field(..., description="The ISO 3166-1 alpha-2 code of the country.")
    alpha_3: str = Field(..., description="The ISO 3166-1 alpha-3 code of the country.")
    alpha_numeric: int = Field(
        ..., alias="numeric", description="The ISO 3166-1 numeric code of the country."
    )
    flag: Optional[str] = Field(
        default=None, description="The code of the country's flag."
    )

    @field_validator("alpha_numeric")
    def validate_alpha_numeric(cls, v: str | int) -> int:
        if isinstance(v, int):
            return v

        if isinstance(v, str) and is_int(v):
            return int(v)

        raise ValueError("The alpha numeric code must be an integer.")


class Subdivision(BaseModel):
    name: str = Field(..., description="The common use name of the state.")
    type: str = Field(..., description="The type of subdivision.")
    code: str = Field(..., description="The ISO 3166-2 code of the state.")
    country_code: str = Field(
        ..., description="The ISO 3166-1 alpha-2 code of the country."
    )
    parent_code: Optional[str] = Field(
        default=None,
        description="The ISO 3166-1 alpha-2 code of the parent subdivision.",
    )

    @computed_field
    def state_code(self) -> str:
        return self.code.split("-")[-1]


def get_country(
    q: Optional[str] = None,
    name: Optional[str] = None,
    code: Optional[str] = None,
    numeric: Optional[int] = None,
) -> Optional[Country]:
    if not any([q, name, code, numeric]):
        raise ValueError("At least one of the parameters must be provided.")

    country = next(
        (
            country
            for country in countries
            if any(
                [
                    q and q.lower() == country.name.lower(),  # type: ignore
                    (
                        q
                        and hasattr(country, "official_name")
                        and country.official_name  # type: ignore
                        and q.lower() == country.official_name.lower()  # type: ignore
                    ),
                    q and q.lower() == country.alpha_2.lower(),  # type: ignore
                    q and q.lower() == country.alpha_2.lower(),  # type: ignore
                    q and q.lower() == country.alpha_3.lower(),  # type: ignore
                    q and is_int(q) and q == country.numeric,  # type: ignore
                    name and name.lower() == country.name.lower(),  # type: ignore
                    (
                        name
                        and hasattr(country, "official_name")
                        and country.official_name  # type: ignore
                        and name.lower() == country.official_name.lower()  # type: ignore
                    ),
                    code and code.lower() == country.alpha_2.lower(),  # type: ignore
                    code and code.lower() == country.alpha_3.lower(),  # type: ignore
                    code and is_int(code) and code == country.numeric,  # type: ignore
                    numeric and str(numeric) == country.numeric,  # type: ignore
                ]
            )
        ),
        None,
    )

    if not country:
        return None

    return Country(**dict(country))  # type: ignore


def get_state(
    q: Optional[str] = None,
    name: Optional[str] = None,
    code: Optional[str] = None,
    country_code: Optional[str] = None,
) -> Optional[Subdivision]:
    if not any([q, name, code]):
        raise ValueError("At least one of the parameters must be provided.")

    return get_subdivision(
        q=q,
        name=name,
        code=code,
        country_code=country_code,
        level=1,
    )


def _get_level(code: str) -> int:
    Subdivision = subdivisions.get(code=code)
    if Subdivision is None:
        raise ValueError(f"Subdivision with code {code} not found.")

    if Subdivision.parent_code is None:  # type: ignore
        return 1
    return 1 + _get_level(Subdivision.parent_code)  # type: ignore


def get_subdivisions(
    q: Optional[str] = None,
    name: Optional[str] = None,
    code: Optional[str] = None,
    parent_code: Optional[str] = None,
    country_code: Optional[str] = None,
    level: Optional[int] = None,
) -> list[Subdivision]:
    if not any([q, name, code, parent_code, country_code, level]):
        raise ValueError("At least one of the parameters must be provided.")

    matches = [
        Subdivision(**dict(subdivision))  # type: ignore
        for subdivision in subdivisions
        if any(
            [
                not q and not name and not code,
                q and q.lower() == subdivision.name.lower(),  # type: ignore
                q and q.lower() == subdivision.code.lower(),  # type: ignore
                q and subdivision.code.lower().endswith(f"-{q.lower()}"),  # type: ignore
                name and name.lower() == subdivision.name.lower(),  # type: ignore
                code and code.lower() == subdivision.code.lower(),  # type: ignore
                code and subdivision.code.lower().endswith(f"-{code.lower()}"),  # type: ignore
            ]
        )
        and (
            not parent_code
            or (
                subdivision.parent_code  # type: ignore
                and (
                    (parent_code and subdivision.parent_code.lower() == parent_code.lower())  # type: ignore
                    or (
                        parent_code
                        and country_code
                        and subdivision.parent_code.lower() == f"{country_code.lower()}-{parent_code.lower()}"  # type: ignore
                    )
                )
            )
        )
        and (
            not country_code
            or (country_code and subdivision.country_code.lower() == country_code.lower())  # type: ignore
        )
    ]

    if level is not None:
        matches = [
            subdivision
            for subdivision in matches
            if _get_level(subdivision.code) == level
        ]

    return matches


def get_subdivision(
    q: Optional[str] = None,
    name: Optional[str] = None,
    code: Optional[str] = None,
    parent_code: Optional[str] = None,
    country_code: Optional[str] = None,
    level: Optional[int] = None,
) -> Optional[Subdivision]:
    if not any([q, name, code]):
        raise ValueError("At least one of the parameters must be provided.")

    matches = get_subdivisions(
        q=q,
        name=name,
        code=code,
        parent_code=parent_code,
        country_code=country_code,
        level=level,
    )

    if not matches:
        return None

    if len(matches) > 1:
        logger.warning(
            f"Multiple matches found for subdivision search {q}, {name}, {code}, {parent_code}, {country_code}: {matches}"
        )
        return None

    return Subdivision(**dict(matches[0]))  # type: ignore
