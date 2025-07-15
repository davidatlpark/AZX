import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Alert,
  Group,
  Paper,
  Select,
  Table,
  Badge,
  Loader,
  Center,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconArrowRight,
  IconInfoCircle,
} from "@tabler/icons-react";

interface ColumnMapping {
  [csvColumn: string]: string | "ignored";
}

const ADDRESS_FIELDS = [
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
];

// Consolidated mapping suggestions
const MAPPING_SUGGESTIONS: { [key: string]: string } = {
  // ID
  id: "id",
  identifier: "id",
  prop_id: "id",
  property_id: "id",
  asset_id: "id",
  building_id: "id",
  // Name
  name: "name",
  building_name: "name",
  property_name: "name",
  asset_name: "name",
  // Unit
  unit: "unit",
  unit_number: "unit",
  suite: "unit",
  apartment: "unit",
  apt: "unit",
  // House number
  house_number: "house_number",
  "house no": "house_number",
  house_no: "house_number",
  houseno: "house_number",
  number: "house_number",
  building_no: "house_number",
  bldg_no: "house_number",
  "building number": "house_number",
  // Street
  street: "street",
  street_name: "street",
  road: "street",
  rd: "street",
  avenue: "street",
  ave: "street",
  blvd: "street",
  boulevard: "street",
  dr: "street",
  drive: "street",
  lane: "street",
  way: "street",
  // Address line
  address: "address_line",
  address_line: "address_line",
  address_line_1: "address_line",
  "address line 1": "address_line",
  "addr line 1": "address_line",
  addr_line_1: "address_line",
  addr: "address_line",
  street_address: "address_line",
  // Other fields
  neighborhood: "neighborhood",
  neighbourhood: "neighborhood",
  district: "neighborhood",
  area: "neighborhood",
  city: "city",
  town: "city",
  locality: "city",
  municipality: "city",
  county: "county",
  parish: "county",
  state: "state",
  state_code: "state_code",
  province: "state",
  region: "state",
  territory: "state",
  country: "country",
  country_code: "country_code",
  nation: "country",
  postal_code: "postal_code",
  zip: "postal_code",
  zip_code: "postal_code",
  zipcode: "postal_code",
  postcode: "postal_code",
  "postal code": "postal_code",
  "zip code": "postal_code",
  formatted_address: "formatted_address",
  full_address: "formatted_address",
  complete_address: "formatted_address",
  latitude: "latitude",
  lat: "latitude",
  y: "latitude",
  longitude: "longitude",
  lng: "longitude",
  lon: "longitude",
  long: "longitude",
  x: "longitude",
};

export function PortfolioMappingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping>({});
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(true);

  const file = location.state?.file;

  const findBestMatch = (columnName: string): string | null => {
    const cleanColumn = columnName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const originalLower = columnName.toLowerCase();

    // Direct matches
    if (
      MAPPING_SUGGESTIONS[cleanColumn] ||
      MAPPING_SUGGESTIONS[originalLower]
    ) {
      return (
        MAPPING_SUGGESTIONS[cleanColumn] || MAPPING_SUGGESTIONS[originalLower]
      );
    }

    // Fuzzy and partial matches
    const fuzzyMatch = Object.keys(MAPPING_SUGGESTIONS).find((key) => {
      const cleanKey = key.replace(/[^a-z0-9]/g, "");
      return cleanColumn.includes(cleanKey) || cleanKey.includes(cleanColumn);
    });

    if (fuzzyMatch) return MAPPING_SUGGESTIONS[fuzzyMatch];

    const partialMatch = Object.keys(MAPPING_SUGGESTIONS).find((key) => {
      const words = originalLower.split(/\s+/);
      const keyWords = key.split(/\s+/);
      return (
        words.some((word) => keyWords.includes(word)) ||
        keyWords.some((keyWord) => words.includes(keyWord))
      );
    });

    return partialMatch ? MAPPING_SUGGESTIONS[partialMatch] : null;
  };

  const parseCSVHeaders = (text: string): string[] => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line !== "");

    if (lines.length === 0) {
      throw new Error("CSV file appears to be empty");
    }

    if (lines.length < 2) {
      throw new Error(
        "CSV file must contain at least a header row and one data row"
      );
    }

    // Parse CSV header row
    const headerLine = lines[0];
    const headers: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < headerLine.length; i++) {
      const char = headerLine[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        headers.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    headers.push(current.trim());

    const cleanHeaders = headers
      .map((h) => h.replace(/^"|"$/g, "").trim())
      .filter((h) => h.length > 0);

    if (cleanHeaders.length === 0) {
      throw new Error("No valid column headers found in CSV file");
    }

    return cleanHeaders;
  };

  useEffect(() => {
    if (!file) {
      navigate("/portfolio/import");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const headers = parseCSVHeaders(e.target?.result as string);
        setCsvColumns(headers);

        // Initialize mappings with smart suggestions
        const initialMappings: ColumnMapping = {};
        headers.forEach((header) => {
          const bestMatch = findBestMatch(header);
          initialMappings[header] = bestMatch || "ignored";
        });

        setColumnMappings(initialMappings);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error parsing CSV file");
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Error reading file");
      setLoading(false);
    };

    reader.readAsText(file);
  }, [file, navigate]);

  const handleMappingChange = (csvColumn: string, addressField: string) => {
    setColumnMappings((prev) => {
      const newMappings = { ...prev };

      // Clear existing mapping for this address field
      if (addressField !== "ignored") {
        Object.keys(newMappings).forEach((key) => {
          if (key !== csvColumn && newMappings[key] === addressField) {
            newMappings[key] = "ignored";
          }
        });
      }

      newMappings[csvColumn] = addressField;
      return newMappings;
    });
    setError(null);
  };

  const validateMappings = () => {
    const mapped = Object.values(columnMappings).filter((v) => v !== "ignored");
    const hasCountry =
      mapped.includes("country") || mapped.includes("country_code");

    return [
      mapped.includes("formatted_address") && hasCountry,
      mapped.includes("address_line") && mapped.includes("city") && hasCountry,
      (mapped.includes("house_number") || mapped.includes("name")) &&
        mapped.includes("city") &&
        hasCountry,
      mapped.includes("latitude") && mapped.includes("longitude"),
    ].some((combo) => combo);
  };

  useEffect(() => {
    setIsValid(validateMappings());
  }, [columnMappings]);

  const handleNext = () => {
    if (!isValid) {
      setError(
        "Please ensure you have mapped the minimum required fields for geocoding"
      );
      return;
    }
    navigate("/portfolio/import/review", { state: { file, columnMappings } });
  };

  if (!file) return null;

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Center>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>Parsing CSV file...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (error && !csvColumns.length) {
    return (
      <Container size="md" py="xl">
        <Alert color="red" title="Error">
          {error}
        </Alert>
        <Group justify="center" mt="md">
          <Button onClick={() => navigate("/portfolio/import")}>
            Back to Upload
          </Button>
        </Group>
      </Container>
    );
  }

  const mappedCount = Object.values(columnMappings).filter(
    (v) => v !== "ignored"
  ).length;

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1} mb="sm">
            Import Portfolio
          </Title>
          <Text color="dimmed" size="lg">
            Step 2 of 5: Map CSV columns to Address fields
          </Text>
        </div>

        <Paper withBorder p="xl" radius="md">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={3}>Column Mapping</Title>
                <Text size="sm" color="dimmed">
                  Map your CSV columns to the Address model fields. Smart
                  suggestions have been applied.
                </Text>
                <Text size="sm" color="dimmed" mt="xs">
                  {mappedCount} mapped • {csvColumns.length - mappedCount}{" "}
                  ignored • {csvColumns.length} total columns
                </Text>
              </div>
              <Text size="sm" color="dimmed">
                File: {file.name}
              </Text>
            </Group>

            {error && (
              <Alert color="red" title="Validation Error">
                {error}
              </Alert>
            )}

            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>CSV Column</Table.Th>
                  <Table.Th>Map to Address Field</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {csvColumns.map((column) => (
                  <Table.Tr key={column}>
                    <Table.Td>
                      <Text fw={500}>{column}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Select
                        placeholder="Select field or ignore"
                        value={columnMappings[column]}
                        onChange={(value) =>
                          handleMappingChange(column, value || "ignored")
                        }
                        data={[
                          { value: "ignored", label: "Ignore this column" },
                          ...ADDRESS_FIELDS.map((field) => ({
                            value: field,
                            label: field,
                            disabled:
                              Object.values(columnMappings).includes(field) &&
                              columnMappings[column] !== field,
                          })),
                        ]}
                        clearable={false}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          columnMappings[column] === "ignored" ? "gray" : "blue"
                        }
                        variant="light"
                      >
                        {columnMappings[column] === "ignored"
                          ? "Ignored"
                          : "Mapped"}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            <Alert
              icon={<IconInfoCircle size={16} />}
              title="Required Field Combinations"
              color={isValid ? "green" : "orange"}
              variant="light"
            >
              <Text size="sm">
                For successful geocoding, you must map at least one of these
                combinations:
              </Text>
              <Text size="sm" mt="xs">
                • <strong>formatted_address</strong> + <strong>country</strong>{" "}
                (or country_code)
                <br />• <strong>address_line</strong> + <strong>city</strong> +{" "}
                <strong>country</strong> (or country_code)
                <br />• <strong>house_number</strong> (or name) +{" "}
                <strong>city</strong> + <strong>country</strong> (or
                country_code)
                <br />• <strong>latitude</strong> + <strong>longitude</strong>
              </Text>
              {isValid && (
                <Text size="sm" mt="xs" color="green">
                  ✓ Valid mapping combination detected
                </Text>
              )}
            </Alert>
          </Stack>
        </Paper>

        <Group justify="space-between">
          <Button
            onClick={() => navigate("/portfolio/import")}
            variant="outline"
            leftSection={<IconArrowLeft size={16} />}
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isValid}
            leftSection={<IconArrowRight size={16} />}
          >
            Next: Review Data
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
