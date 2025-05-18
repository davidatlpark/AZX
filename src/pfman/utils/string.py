import re
from typing import Literal, Optional, Union
from urllib3.util import parse_url, url


def is_int(maybe_int: str) -> bool:
    """
    Check if the given string is a valid integer.

    Args:
       maybe_int (str): The string to check.

    Returns:
        bool: True if the string is a valid integer, False otherwise.
    """
    try:
        int(maybe_int)
        return True
    except ValueError:
        return False


def is_url(maybe_url: str) -> bool:
    """
    Check if the given string is a valid URL.

    Args:
       maybe_url (str): The string to check.

    Returns:
        bool: True if the string is a valid URL, False otherwise.
    """
    try:
        parse_url(maybe_url)
        return True
    except Exception:
        return False


def to_base_url(maybe_url: str) -> Optional[str]:
    """
    Convert the given string to a base URL.

    Args:
       maybe_url (str): The string to convert.

    Returns:
       Optional[str]: The base URL if the string is a valid URL, None otherwise.
    """
    url = parse_url(maybe_url)

    if url is None:
        return None

    return f"{url.scheme}://{url.host}{url.path}"


def to_url(maybe_url: str) -> Optional[url.Url]:
    """
    Parse the given string to a URL object.

    Args:
      maybe_url (str): The string to parse.

    Returns:
      Optional[url.Url]: The URL object if the string is a valid URL, None otherwise.
    """
    if not is_url(maybe_url):
        return None

    return parse_url(maybe_url)


RangeParseType = Literal["lower", "upper"]


def parse_float(maybe_float: str | float) -> Optional[float]:
    """
    Parse the given string to a float.

    Args:
      maybe_float (str): The string to parse.

    Returns:
      Optional[float]: The float if the string is a valid float, None otherwise.
    """

    if isinstance(maybe_float, float):
        return maybe_float

    if isinstance(maybe_float, int):
        return float(maybe_float)

    if not maybe_float:
        return None

    maybe_float = maybe_float.strip()

    try:
        return float(maybe_float)
    except ValueError:
        return None


def parse_percentage(
    maybe_float: str | float, range_parse_type: RangeParseType = "lower"
) -> Optional[float]:
    """
    Parse the given string to a percentage.

    Args:
      maybe_float (str): The string to parse.
      range_parse_type (RangeParseType): The type of range to parse. If "lower", then the lower bound of the range is parsed. If "upper", then the upper bound of the range is parsed. Defaults to "lower".

    Returns:
      Optional[float]: The percentage if the string is a valid percentage, None otherwise. If the string contains a percentage range, then the lower bound is the percentage parsed
    """
    if isinstance(maybe_float, float):
        return maybe_float / 100.0

    if isinstance(maybe_float, int):
        return float(maybe_float) / 100.0

    if not maybe_float:
        return None

    maybe_float = maybe_float.strip()

    if not maybe_float:
        return None

    match = re.search(r"(\d+(\.\d+)?)%?\s*-\s*(\d+(\.\d+)?)%", maybe_float)
    if match:
        return (float(match.group(1 if range_parse_type == "lower" else 3))) / 100.0

    if "%" in maybe_float:
        try:
            return float(maybe_float.strip("%")) / 100.0
        except:
            return None

    return None


PadType = Literal["left", "right", "center"]


def pad_string(
    string: Optional[str],
    length: int,
    fillchar: str = " ",
    type: PadType = "left",
    truncate: bool = False,
) -> str:
    """
    Pad the given string to the specified length.

    Args:
      string (str): The string to pad.
      length (int): The length to pad the string to.
      fillchar (str): The character to pad the string with. Defaults to " ".
      type (PadType): The type of padding to use. Can be "left", "right", or "center". Defaults to "left". If "left", then the string is padded with the fill character on the left. If "right", then the string is padded with the fill character on the right. If "center", then the string is padded with the fill character on both sides.
      truncate (bool): Whether to truncate the string if it is longer than the specified length. Defaults to False.

    Returns:
      str: The padded string.
    """
    if not string:
        return fillchar * length
    if len(string) >= length:
        if truncate:
            return string[:length] if type == "left" else string[-length:]

        return string
    if type == "left":
        return string.rjust(length, fillchar)
    elif type == "right":
        return string.ljust(length, fillchar)
    elif type == "center":
        return string.center(length, fillchar)
    else:
        raise ValueError(f"Invalid type: {type}")


def line_indent(string: Optional[str], indent: Union[int, str] = 4) -> str:
    """
    Indent the given string by the specified number of characters.
    Args:
      string (str): The string to indent.
      indent (Union[int, str]): The indentation for the string. Defaults to 4 spaces. If an integer is provided, then the string is indented by that number of spaces. If a string is provided, then the string is indented by that string.
    Returns:
      str: The indented string.
    """
    if not indent:
        return string or ""

    if isinstance(indent, int):
        indent = " " * indent

    if not string:
        return indent

    return indent + string


def block_indent(string: Optional[str], indent: Union[int, str] = 4) -> str:
    """
    Indent the given string by the specified number of characters.

    Args:
      string (str): The string to indent.
      indent (Union[int, str]): The indentation for the string. Defaults to 4 spaces. If an integer is provided, then the string is indented by that number of spaces. If a string is provided, then the string is indented by that string.

    Returns:
      str: The indented string.
    """
    if not indent:
        return string or ""

    if isinstance(indent, int):
        indent = " " * indent

    if not string:
        return indent

    if not "\n" in string:
        return indent + string

    return "\n".join([line_indent(line, indent) for line in string.split("\n")])

def snake_to_camel(snake_str: str) -> str:
    """
    Convert a snake_case string to camelCase.

    Args:
      snake_str (str): The snake_case string to convert.

    Returns:
      str: The camelCase string.
    """
    components = snake_str.split("_")
    return components[0] + "".join(x.title() for x in components[1:])

def camel_to_snake(camel_str: str) -> str:
    """
    Convert a camelCase string to snake_case.

    Args:
      camel_str (str): The camelCase string to convert.

    Returns:
      str: The snake_case string.
    """
    return re.sub("([a-z0-9])([A-Z])", r"\1_\2", camel_str).lower()

def regex_escape(string: Optional[str]) -> str:
    """
    Escape the given string for use in a regular expression.
    Args:
      string (str): The string to escape.
    Returns:
      str: The escaped string.
    """
    if not string:
        return ""
    return re.escape(string)