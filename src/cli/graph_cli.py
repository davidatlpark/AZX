from pathlib import Path
from typing import Optional
import click

from pfman.utils.neo4j import get_driver


@click.group()
def cli():
    """Command line interface for graph operations."""
    pass


@cli.command("install-constraints")
@click.option(
    "--schema-file",
    type=click.Path(
        exists=True, dir_okay=False, file_okay=True, resolve_path=True, readable=True
    ),
    help="Path to the schema file.",
)
@click.option("--connection-string", help="Neo4j connection string.")
def install_constraints(schema_file: Optional[str], connection_string: Optional[str]):
    """
    Install constraints and indexes defined in the schema file into the Neo4j database.

    Parameters:
    schema_file (str): Path to the schema file. If not provided, it will use the default schema file.
    connection_string (str): Neo4j connection string. If not provided, it will use the one from the configuration.

    Returns:
    None: This function does not return anything. It prints a success message upon completion.
    """
    from neomodel import db, install_all_labels
    from neomodel.scripts.utils import load_python_module_or_file

    from pfman.Env import config

    driver = get_driver(connection_string or config.NEO4J_CONNECTION_STRING)

    db.set_connection(driver=driver)

    if not schema_file:
        schema_file = str(Path(__file__).parent.parent / "pfman/graph/Schema.py")

    click.echo(f"Installing constraints from {schema_file}...")

    load_python_module_or_file(schema_file)

    install_all_labels()

    driver.close()

    click.echo("Constraints installed successfully.")


@cli.command("drop-constraints")
@click.option("--connection-string", help="Neo4j connection string.")
def drop_constraints(connection_string: Optional[str]):
    """
    Drop all constraints and indexes from the Neo4j database.

    Parameters:
    connection_string (str): Neo4j connection string. If not provided, it will use the one from the configuration.

    Returns:
    None: This function does not return anything. It prints a success message upon completion.
    """
    from pfman.Env import config

    driver = get_driver(connection_string or config.NEO4J_CONNECTION_STRING)

    click.confirm(
        "This will drop all constraints and indexes in the Neo4j database. Are you sure?",
        abort=True,
    )

    with driver.session() as session:
        session.run("CALL apoc.schema.assert({}, {})").consume()

    driver.close()

    click.echo("Constraints and indexes dropped successfully.")


@cli.command("reset")
@click.option("--connection-string", help="Neo4j connection string.")
def reset(connection_string: Optional[str]):
    """
    Reset the Neo4j database by deleting all nodes and relationships, and then dropping all constraints and indexes.

    Parameters:
    connection_string (str): Neo4j connection string. If not provided, it will use the one from the configuration.

    Returns:
    None: This function does not return anything. It prints a success message upon completion.
    """

    from pfman.Env import config

    driver = get_driver(connection_string or config.NEO4J_CONNECTION_STRING)

    click.confirm(
        "This will delete all data in the Neo4j database. Are you sure?",
        abort=True,
    )

    with driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n").consume()
        session.run("CALL apoc.schema.assert({}, {})").consume()

    driver.close()

    click.echo("Database reset successfully.")

if __name__ == "__main__":
    cli()