from urllib.parse import urlparse
from neo4j import GraphDatabase, AsyncGraphDatabase


def get_driver(connection_string: str):
    """Create a Neo4j driver instance from the connection string."""

    if not connection_string:
        raise ValueError("Connection string is required.")

    parsed_url = urlparse(connection_string)

    uri = f"{parsed_url.scheme}://{parsed_url.hostname}"
    if parsed_url.port:
        uri += f":{parsed_url.port}"

    auth = (
        (parsed_url.username, parsed_url.password)
        if parsed_url.username and parsed_url.password
        else None
    )

    database = parsed_url.path.lstrip("/") if parsed_url.path else None

    return GraphDatabase.driver(uri, database=database, auth=auth)



def get_async_driver(connection_string: str):
    """Create an asynchronous Neo4j driver instance from the connection string."""

    if not connection_string:
        raise ValueError("Connection string is required.")

    parsed_url = urlparse(connection_string)

    uri = f"{parsed_url.scheme}://{parsed_url.hostname}"
    if parsed_url.port:
        uri += f":{parsed_url.port}"

    auth = (
        (parsed_url.username, parsed_url.password)
        if parsed_url.username and parsed_url.password
        else None
    )

    database = parsed_url.path.lstrip("/") if parsed_url.path else None

    return AsyncGraphDatabase.driver(uri, database=database, auth=auth)
