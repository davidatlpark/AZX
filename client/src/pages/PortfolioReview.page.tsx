import { useState, useEffect, useMemo } from "react";
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
  Table,
  Badge,
  Loader,
  Center,
  Switch,
  TextInput,
  Modal,
  ActionIcon,
  Tooltip,
  NumberInput,
  Pagination,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconArrowRight,
  IconInfoCircle,
  IconEdit,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";

interface MappedRow {
  [key: string]: string | number | boolean | string[];
  _originalIndex: number;
  _isEdited: boolean;
  _isValid: boolean;
  _errors: string[];
}

interface EditModalData {
  rowIndex: number;
  field: string;
  value: string;
  label: string;
}

const ROWS_PER_PAGE = 50;

export function PortfolioReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mappedData, setMappedData] = useState<MappedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvalidOnly, setShowInvalidOnly] = useState(false);
  const [showEditedOnly, setShowEditedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalData, setEditModalData] = useState<EditModalData | null>(
    null
  );
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false);

  const { file, columnMappings } = location.state || {};

  // Simple CSV parsing
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  // Check if row has meaningful data
  const isRowMeaningful = (values: string[]): boolean => {
    if (values.every((value) => !value || value.trim() === "")) return false;

    const nonEmptyValues = values.filter((v) => v && v.trim() !== "");
    // Row is meaningful if it has at least 2 non-empty values or 1 substantial value
    if (nonEmptyValues.length >= 2) return true;
    if (nonEmptyValues.length === 1) {
      return nonEmptyValues[0].trim().length > 2;
    }
    return false;
  };

  // Validate a single row
  const validateRow = (
    row: MappedRow
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const getValue = (key: string): string => {
      const value = row[key];
      return typeof value === "string" ? value.trim() : "";
    };

    // Check for meaningful data
    const mappedValues = Object.keys(row)
      .filter((key) => !key.startsWith("_"))
      .map((key) => getValue(key))
      .filter((val) => val.length > 0);

    if (mappedValues.length === 0) {
      errors.push("Row contains no meaningful data");
      return { isValid: false, errors };
    }

    // Check required field combinations for geocoding
    const hasFormattedAddress =
      getValue("formatted_address") &&
      (getValue("country") || getValue("country_code"));
    const hasAddressLine =
      getValue("address_line") &&
      getValue("city") &&
      (getValue("country") || getValue("country_code"));
    const hasBuildingAddress =
      (getValue("house_number") || getValue("name")) &&
      getValue("city") &&
      (getValue("country") || getValue("country_code"));
    const hasCoordinates = getValue("latitude") && getValue("longitude");

    if (
      !hasFormattedAddress &&
      !hasAddressLine &&
      !hasBuildingAddress &&
      !hasCoordinates
    ) {
      errors.push("Missing required address information for geocoding");
    }

    // Validate coordinates
    const latitude = getValue("latitude");
    const longitude = getValue("longitude");

    if (latitude) {
      const latNum = parseFloat(latitude);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        errors.push("Invalid latitude (must be between -90 and 90)");
      }
    }

    if (longitude) {
      const lngNum = parseFloat(longitude);
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        errors.push("Invalid longitude (must be between -180 and 180)");
      }
    }

    // Validate other fields
    const postalCode = getValue("postal_code");
    if (postalCode && postalCode.length > 20) {
      errors.push("Postal code is too long");
    }

    const countryCode = getValue("country_code");
    if (countryCode && countryCode.length !== 2) {
      errors.push("Country code must be 2 characters");
    }

    const stateCode = getValue("state_code");
    if (stateCode && stateCode.length > 3) {
      errors.push("State code is too long");
    }

    return { isValid: errors.length === 0, errors };
  };

  // Process CSV data
  const parseAndMapData = async () => {
    if (!file || !columnMappings) {
      setError("Missing file or column mappings");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const lines: string[] = text
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);

      if (lines.length <= 1) {
        setError("CSV file appears to be empty or contains only headers");
        setLoading(false);
        return;
      }

      const headers = parseCSVLine(lines[0]);
      const dataLines = lines.slice(1);

      // Filter meaningful rows
      const meaningfulRows = dataLines.filter((line) => {
        const values = parseCSVLine(line);
        return isRowMeaningful(values);
      });

      if (meaningfulRows.length === 0) {
        setError("No meaningful data found in CSV file");
        setLoading(false);
        return;
      }

      // Check for valid mappings
      const hasValidMappings = headers.some(
        (header) =>
          columnMappings[header] && columnMappings[header] !== "ignored"
      );

      if (!hasValidMappings) {
        setError(
          "No valid column mappings found. Please go back and map your columns."
        );
        setLoading(false);
        return;
      }

      // Map data
      const mapped: MappedRow[] = meaningfulRows.map((row, index) => {
        const values = parseCSVLine(row);
        const mappedRow: MappedRow = {
          _originalIndex: index,
          _isEdited: false,
          _isValid: true,
          _errors: [],
        };

        // Apply column mappings
        headers.forEach((header, headerIndex) => {
          const mapping = columnMappings[header];
          if (mapping && mapping !== "ignored") {
            mappedRow[mapping] = (values[headerIndex] || "").trim();
          }
        });

        // Validate row
        const validation = validateRow(mappedRow);
        mappedRow._isValid = validation.isValid;
        mappedRow._errors = validation.errors;

        return mappedRow;
      });

      setMappedData(mapped);
      setLoading(false);
    } catch (err) {
      console.error("Error processing CSV:", err);
      setError("Failed to parse CSV file. Please check the file format.");
      setLoading(false);
    }
  };

  // Memoized calculations
  const filteredData = useMemo(() => {
    let filtered = mappedData;
    if (showInvalidOnly) filtered = filtered.filter((row) => !row._isValid);
    if (showEditedOnly) filtered = filtered.filter((row) => row._isEdited);
    return filtered;
  }, [mappedData, showInvalidOnly, showEditedOnly]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredData.slice(start, start + ROWS_PER_PAGE);
  }, [filteredData, currentPage]);

  const stats = useMemo(
    () => ({
      validCount: mappedData.filter((row) => row._isValid).length,
      invalidCount: mappedData.filter((row) => !row._isValid).length,
      editedCount: mappedData.filter((row) => row._isEdited).length,
    }),
    [mappedData]
  );

  const mappedFields = useMemo(
    () =>
      Object.values(columnMappings).filter((v) => v !== "ignored") as string[],
    [columnMappings]
  );

  useEffect(() => {
    if (!file || !columnMappings) {
      if (!file) {
        navigate("/portfolio/import");
      } else if (!columnMappings) {
        navigate("/portfolio/import/mapping", { state: { file } });
      }
      return;
    }
    parseAndMapData();
  }, [file, columnMappings, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [showInvalidOnly, showEditedOnly]);

  // Event handlers
  const handleEditClick = (rowIndex: number, field: string, value: string) => {
    setEditModalData({
      rowIndex,
      field,
      value,
      label: field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    });
    openEditModal();
  };

  const handleEditSave = (newValue: string) => {
    if (!editModalData) return;

    const updatedData = [...mappedData];
    const row = updatedData[editModalData.rowIndex];

    row[editModalData.field] = newValue;
    row._isEdited = true;

    const validation = validateRow(row);
    row._isValid = validation.isValid;
    row._errors = validation.errors;

    setMappedData(updatedData);
    closeEditModal();
  };

  const handleNext = () => {
    navigate("/portfolio/import/details", {
      state: { file, columnMappings, mappedData, step: 4 },
    });
  };

  const handleBack = () => {
    navigate("/portfolio/import/mapping", {
      state: { file, columnMappings },
    });
  };

  const getFieldValue = (row: MappedRow, field: string): string => {
    const value = row[field];
    return typeof value === "string" ? value : String(value || "");
  };

  const isFieldEditable = (field: string): boolean =>
    !["_originalIndex", "_isEdited", "_isValid", "_errors"].includes(field);

  // Render loading state
  if (loading) {
    return (
      <Container size="md" py="xl">
        <Center>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>Processing mapped data...</Text>
            <Text size="sm" color="dimmed">
              Filtering out empty rows and validating data...
            </Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container size="md" py="xl">
        <Alert color="red" title="Error">
          {error}
        </Alert>
        <Group justify="center" mt="md">
          <Button onClick={handleBack} variant="outline">
            Go Back
          </Button>
        </Group>
      </Container>
    );
  }

  if (!file || !columnMappings) return null;

  const { validCount, invalidCount, editedCount } = stats;
  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1} mb="sm">
            Import Portfolio
          </Title>
          <Text color="dimmed" size="lg">
            Step 3 of 5: Review and Edit Data
          </Text>
        </div>

        <Paper withBorder p="xl" radius="md">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={3}>Data Review</Title>
                <Text size="sm" color="dimmed">
                  Review the mapped data and fix any validation errors
                </Text>
              </div>
              <Group gap="md">
                <Badge color="green" variant="light">
                  Valid: {validCount}
                </Badge>
                <Badge color="red" variant="light">
                  Invalid: {invalidCount}
                </Badge>
                <Badge color="blue" variant="light">
                  Edited: {editedCount}
                </Badge>
              </Group>
            </Group>

            <Group gap="md">
              <Switch
                label="Show invalid rows only"
                checked={showInvalidOnly}
                onChange={(e) => setShowInvalidOnly(e.currentTarget.checked)}
              />
              <Switch
                label="Show edited rows only"
                checked={showEditedOnly}
                onChange={(e) => setShowEditedOnly(e.currentTarget.checked)}
              />
            </Group>

            <div style={{ overflowX: "auto" }}>
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Row</Table.Th>
                    <Table.Th>Status</Table.Th>
                    {mappedFields.map((field) => (
                      <Table.Th key={field}>
                        {field
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Table.Th>
                    ))}
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedData.map((row) => (
                    <Table.Tr key={row._originalIndex}>
                      <Table.Td>{(row._originalIndex as number) + 1}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Badge
                            color={row._isValid ? "green" : "red"}
                            variant="light"
                          >
                            {row._isValid ? "Valid" : "Invalid"}
                          </Badge>
                          {row._isEdited && (
                            <Badge color="blue" variant="light">
                              Edited
                            </Badge>
                          )}
                        </Group>
                        {(row._errors as string[]).length > 0 && (
                          <div style={{ marginTop: "4px" }}>
                            {(row._errors as string[])
                              .slice(0, 3)
                              .map((error, i) => (
                                <Text key={i} size="xs" color="red">
                                  • {error}
                                </Text>
                              ))}
                            {(row._errors as string[]).length > 3 && (
                              <Text size="xs" color="dimmed">
                                ... and {(row._errors as string[]).length - 3}{" "}
                                more
                              </Text>
                            )}
                          </div>
                        )}
                      </Table.Td>
                      {mappedFields.map((field) => (
                        <Table.Td key={field}>
                          <Group gap="xs">
                            <Text
                              size="sm"
                              style={{ maxWidth: "200px" }}
                              truncate
                            >
                              {getFieldValue(row, field) || "-"}
                            </Text>
                            {isFieldEditable(field) && (
                              <Tooltip label="Edit field">
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  onClick={() =>
                                    handleEditClick(
                                      row._originalIndex as number,
                                      field,
                                      getFieldValue(row, field)
                                    )
                                  }
                                >
                                  <IconEdit size={12} />
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </Group>
                        </Table.Td>
                      ))}
                      <Table.Td>
                        <Tooltip
                          label={row._isValid ? "Valid row" : "Invalid row"}
                        >
                          {row._isValid ? (
                            <IconCheck size={16} color="green" />
                          ) : (
                            <IconX size={16} color="red" />
                          )}
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            {totalPages > 1 && (
              <Group justify="center">
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                  size="sm"
                />
                <Text size="sm" color="dimmed">
                  Showing {(currentPage - 1) * ROWS_PER_PAGE + 1} to{" "}
                  {Math.min(currentPage * ROWS_PER_PAGE, filteredData.length)}{" "}
                  of {filteredData.length} rows
                </Text>
              </Group>
            )}

            {filteredData.length === 0 && (
              <Center py="xl">
                <Text color="dimmed">
                  {showInvalidOnly || showEditedOnly
                    ? "No data matches the current filters"
                    : "No data to display"}
                </Text>
              </Center>
            )}

            <Alert
              icon={<IconInfoCircle size={16} />}
              title="Data Summary"
              color="blue"
              variant="light"
            >
              <Text size="sm">
                Total rows: {mappedData.length} | Valid: {validCount} | Invalid:{" "}
                {invalidCount} | Edited: {editedCount}
              </Text>
              {invalidCount > 0 && (
                <Text size="sm" color="orange" mt="xs">
                  ⚠️ {invalidCount} rows have validation errors that should be
                  fixed before proceeding
                </Text>
              )}
            </Alert>
          </Stack>
        </Paper>

        <Group justify="space-between">
          <Button
            onClick={handleBack}
            variant="outline"
            leftSection={<IconArrowLeft size={16} />}
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            leftSection={<IconArrowRight size={16} />}
          >
            Next: Portfolio Details
          </Button>
        </Group>
      </Stack>

      {/* Edit Modal */}
      <Modal
        opened={editModalOpened}
        onClose={closeEditModal}
        title={`Edit ${editModalData?.label}`}
        size="md"
      >
        {editModalData && (
          <EditFieldModal
            data={editModalData}
            onSave={handleEditSave}
            onCancel={closeEditModal}
          />
        )}
      </Modal>
    </Container>
  );
}

// Edit modal component
function EditFieldModal({
  data,
  onSave,
  onCancel,
}: {
  data: EditModalData;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(data.value);

  const isNumericField =
    data.field === "latitude" || data.field === "longitude";

  return (
    <Stack gap="md">
      <Text size="sm" color="dimmed">
        Row {data.rowIndex + 1} - {data.label}
      </Text>

      {isNumericField ? (
        <NumberInput
          label={data.label}
          value={value}
          onChange={(val) => setValue(val?.toString() || "")}
          placeholder={`Enter ${data.label.toLowerCase()}`}
          decimalScale={6}
          step={0.000001}
        />
      ) : (
        <TextInput
          label={data.label}
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          placeholder={`Enter ${data.label.toLowerCase()}`}
        />
      )}

      <Group justify="flex-end" gap="md">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(value)}>Save</Button>
      </Group>
    </Stack>
  );
}
