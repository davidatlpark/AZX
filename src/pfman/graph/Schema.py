from neomodel import (
    StructuredNode,
    StructuredRel,
    StringProperty,
    IntegerProperty,
    FloatProperty,
    BooleanProperty,
    RelationshipTo,
    RelationshipFrom,
)

class Property(StructuredNode):
    property_id = StringProperty(unique_index=True)
